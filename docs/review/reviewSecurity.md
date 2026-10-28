# Revue pédagogique — Sécurité et conformité (API Next.js + app Expo)

> Périmètre : authentification, routes API, pages web publiques, secrets, dépendances, conformité Play Store / RGPD · Date : 2026-10-27 · Contexte : 2ᵉ revue, juste avant publication. Revue précédente : [`archive/2026-10-04/reviewSecurity.md`](archive/2026-10-04/reviewSecurity.md) · Checklists de référence : [`../security/security.md`](../security/security.md), [`../security/securityPlus.md`](../security/securityPlus.md).

## Synthèse

| Sévérité | # | Point | Statut |
| --- | --- | --- | --- |
| 🔴 | 1.1 | Énumération de comptes sur la page web de suppression | Nouveau |
| 🔴 | 1.2 | Clé Resend exposée (hors dépôt, signalée dans #164) | À régénérer |
| 🟠 | 2.1 | `DELETE /api/user` : Upstash hors `try` (fail-open → 500) | Rechute SEC-06 |
| 🟠 | 2.2 | Dates client sans borne haute (intégrité des durées) | SEC/BACK-05 partielle |
| 🟠 | 2.3 | `env.ts` non chargé sur les routes d'auth | SEC-05 partielle |
| 🟠 | 2.4 | Politique de confidentialité incomplète (Upstash, Resend) | Nouveau |
| 🟠 | 2.5 | HSTS à `max-age=300` | Valeur de test |
| 🟡 | 3.x | Énumération à l'inscription, logout global, purge des tokens, dépendances | Ouvert (SEC-07, SEC-08, BACK-13) |

`npm audit --omit=dev` : **backend 7 high**, **frontend 7 (4 high, 3 moderate)** — toutes **transitives**, détail §4.

---

## ✅ Ce qui est déjà au niveau

1. **Next.js à jour** (16.4.2) : la CVE critique de la revue précédente est close (SEC-01).
2. **IP fiable pour le rate limit** (`lib/getClientIp.ts`) : `ipAddress()` de `@vercel/functions` d'abord (header posé par Vercel, non falsifiable par le client), `x-forwarded-for` seulement en repli hors Vercel, et refus explicite (`400`) quand l'IP est inconnue. Le contournement de SEC-02 est fermé.
3. **Fail-closed** sur les limiteurs de login, register, reset et des routes métier : Upstash en panne → 503, pas de passe-droit.
4. **JWT** : `algorithms: ["HS256"]` figé, payload validé par Zod, révocation par `tokenVersion` (incrémenté au reset password).
5. **Ré-authentification** pour supprimer le compte (SEC-03), côté mobile et web.
6. **Login résistant au timing** : `bcrypt.compare` avec un hash factice quand l'utilisateur n'existe pas (`login/route.ts:61-66`), même message pour « inconnu » et « mauvais mot de passe ».
7. **Reset password** : token aléatoire 32 octets, stocké **haché** (SHA-256), 30 min, usage unique garanti par `updateMany` conditionnel, lien en fragment `#token=` (jamais envoyé au serveur ni dans les logs), `history.replaceState` pour l'effacer de la barre d'adresse.
8. **En-têtes** sur toutes les routes (`next.config.ts`) + **CSP à nonce** via `proxy.ts` sur les pages sensibles, `Cache-Control: no-store` et `Referrer-Policy: no-referrer` sur `/reset` et `/delete-user`.
9. **Sentry** sans PII, avec masquage des tokens (voir `reviewFrontend.md` §✅5).
10. **Dependabot** opérationnel (8 commits `chore(deps…)` fusionnés depuis le 2026-10-04).

---

## 🔴 Critique — à traiter avant la mise en production

### 1.1 La page web de suppression permet de tester si un email a un compte

```ts
// app/api/user/route.ts:126-146 — branche web (sans token)
const user = await prisma.user.findUnique({ where: { email } });
if (!user) return NextResponse.json({ message: "Utilisateur introuvable" }, { status: 404 });
const control = await bcrypt.compare(password, user.password);
if (!control) return NextResponse.json({ message: "Mot de passe incorrect" }, { status: 403 });
```

**Mécanisme** : la réponse dit « ce compte n'existe pas » (404) ou « ce compte existe, mauvais mot de passe » (403). Le formulaire affiche le message tel quel (`formDeleteUser.tsx:48`). En plus, quand l'utilisateur n'existe pas, `bcrypt.compare` n'est pas appelé : la réponse est ~100 ms plus rapide, donc l'énumération reste possible même si tu unifies le message.

**Scénario** : la page `/delete-user` est publique (exigée par Google, référencée dans la fiche store). Quelqu'un qui a une liste d'emails peut savoir lesquels sont inscrits, à 5 essais/min/IP et 5/min/email : lent, mais pas bloqué. C'est exactement ce que tu as soigneusement évité sur le login et le reset — cette route est passée à travers.

**Correction** : reprends le patron du login.

```ts
const DUMMY_HASH = "$2b$10$VUj4JXqrv6THyQGneEsax.HzWPKLVwA3JxHMM9hzEJVCktvJxVYKi"; // à partager dans lib/
const user = await prisma.user.findUnique({ where: { email }, select: { id: true, password: true } });
const ok = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
if (!user || !ok) {
  return NextResponse.json({ message: "Identifiants invalides" }, { status: 401 });
}
await prisma.user.delete({ where: { id: user.id } });
```

Mets à jour les tests `404 - utilisateur introuvable` et `403 - mot de passe incorrect` de la branche web : ils figent aujourd'hui le comportement vulnérable (voir `reviewTestingLibrary.md` §2.2).

> 🎓 **Concept** : l'anti-énumération est une propriété de **l'application entière**, pas d'une route. Chaque endpoint qui accepte un email sans être authentifié (login, register, reset, suppression web, et plus tard vérification d'email) doit répondre de façon indiscernable — même message, même code, même durée. Fais-en une checklist dans `docs/security/security.md`.

### 1.2 Clé Resend exposée — à régénérer

L'issue #164 indique qu'une vraie clé `re_…` figurait en clair dans un document d'architecture (hors dépôt). Elle a été retirée, mais **retirer un secret ne le révoque pas** : il a pu être copié, synchronisé, mis en cache.

J'ai vérifié le dépôt (`git grep` sur les motifs de clés) : aucune clé n'est commitée. Il reste donc une action **hors code** :

1. Resend → API Keys → révoquer l'ancienne clé, en créer une nouvelle (droit « Sending access » seulement, restreinte au domaine `chronoappsport.fr`) ;
2. Vercel → variable `RESEND_TOKEN` (Production **et** Preview) → redéployer ;
3. Même réflexe pour le mot de passe du compte testeur Google mentionné dans #164 : il est dans un fichier `.env.local` d'un outil de documentation, pas dans le dépôt, mais change-le avant de le donner à la Play Console.

> 🎓 **Concept** : un secret qui a été visible **une fois** est compromis. La seule correction est la rotation, puis la recherche de l'endroit où il a fuité pour que ça ne recommence pas.

---

## 🟠 Important

### 2.1 `DELETE /api/user` : rate limit hors `try`

C'est la seule route où `limit()` n'est pas protégé : si Upstash ne répond pas, le handler rejette → 500 non maîtrisée (vérifié par un test temporaire). Le résultat reste « bloquant » (pas de suppression), mais sans message, et la route échappe à la règle fail-closed que tu as posée partout. Détail et correction : `reviewBackend.md` §1.2.

### 2.2 Intégrité des données : borne haute manquante sur les dates

Un client modifié peut envoyer `startedAt` dans le futur ou un `endedAt` de pause dans 10 h, et obtenir des durées négatives ou absurdes. Ce n'est pas une fuite de données, mais c'est l'intégrité de **la seule donnée métier** de l'app. Détail : `reviewBackend.md` §2.1.

### 2.3 `lib/env.ts` n'est pas chargé par `login`, `register`, `passwordresettoken`

Ces routes lisent `process.env.JWT_SECRET!`, `process.env.RESEND_TOKEN`, `process.env.APP_URL` directement. Le cas le plus grave : si `JWT_SECRET` manque sur un environnement Preview, `jwt.sign(…, undefined)` lève une erreur → 500 sur le login, sans message clair. Correction : `env.X` partout (`reviewBackend.md` §2.6). `APP_URL` doit être un `z.string().url()` : il construit le lien du mail de reset.

### 2.4 Politique de confidentialité : deux sous-traitants manquants

`app/privacy/page.tsx:116-129` liste Vercel, Neon, Expo/Google, Sentry. Or :

- **Upstash** reçoit l'**adresse IP** et l'**email** (clés des limiteurs `ratelimit:loginEMAIL:<email>`, etc.) ;
- **Resend** reçoit l'**email** pour l'envoi du lien de reset.

Le RGPD (art. 13) impose de nommer les destinataires des données ; Google compare aussi la politique avec le formulaire **Data safety**. Ajoute les deux, précise la finalité (« protection contre les abus », « envoi des emails de réinitialisation ») et la durée (les clés Upstash expirent avec la fenêtre : 1 min à 1 h). Vérifie que le formulaire Data safety déclare bien « Adresse email » et « Identifiants de l'appareil ou autres » (IP) comme **collectés**, finalité « Sécurité / prévention de la fraude ».

### 2.5 HSTS à `max-age=300`

`next.config.ts:5` : 5 minutes, c'est une valeur de test (prudente au début, à raison). Vercel sert déjà tout en HTTPS : passe à `max-age=63072000; includeSubDomains` (2 ans) une fois que tu as vérifié que tous les sous-domaines sont en HTTPS. N'ajoute `preload` que si tu comptes t'inscrire sur hstspreload.org (difficile à annuler).

---

## 🟡 Défense en profondeur (issues ouvertes, inchangé)

| Point | Issue | Commentaire |
| --- | --- | --- |
| Énumération à l'inscription (409 « Un compte existe ») | SEC-08 #106 | Acceptable pour une petite app si c'est **documenté** comme choix ; la vraie solution est la vérification d'email |
| Déconnexion de tous les appareils | SEC-07 #105 | `tokenVersion: { increment: 1 }` existe déjà : il ne manque qu'un endpoint |
| Purge des tokens de reset expirés | BACK-13 #104 | Cron Vercel quotidien `deleteMany({ where: { expiresAt: { lt: new Date() } } })` |
| JWT 7 jours sans refresh | — | Acceptable avec la révocation ; à revoir si l'app grandit |
| Pas de rate limit par `userId` sur la suppression mobile | — | Seulement par IP ; ajouter `userId` est trivial |

---

## 4. Dépendances (`npm audit --omit=dev`, exécuté le 2026-10-27)

### Backend — 7 high, toutes transitives

| Paquet vulnérable | Amené par | Runtime ? | Correctif proposé | Verdict |
| --- | --- | --- | --- | --- |
| `deepmerge-ts < 8` | `prisma` (CLI) → `@prisma/config` | Non (build/migrations) | `prisma@7` (**majeure**) | Attendre une 6.x corrigée ou planifier la migration Prisma 7 ; risque faible |
| `zod < 4.6.6` (copie interne) | `@vercel/functions` → `@vercel/oidc` → `@vercel/cli-config` | Oui, mais seul `ipAddress()` est utilisé | `@vercel/functions@3.6.1` = **rétrogradation** | ❌ Ne pas appliquer `--force` ; attendre la mise à jour de `@vercel/cli-config` |

### Frontend — 4 high, 3 moderate

| Paquet | Amené par | Runtime dans l'app ? | Verdict |
| --- | --- | --- | --- |
| `node-forge ≤ 1.4.0` | `@expo/cli` (signature de code) | Non (outil de build) | `npm audit fix` (non cassant) suffit |
| `zod < 4.6.6` | `@expo/cli` (copie zod 3) | Non | Attendre Expo ; `--force` installerait **expo@54** (rétrogradation de 3 SDK) ❌ |
| `zod` direct | ton `package.json` | Oui | Faux positif local : le lockfile verrouille `4.6.6`, mais ton `node_modules` est resté en `4.6.5` → `npm ci` |
| `decode-uri-component ≤ 0.4.2` | `expo-router` → `query-string@7` | Oui (parsing d'URL) | Moderate ; suivre les mises à jour `expo-router` via Dependabot |

> ⚠️ **Faux remède** : `npm audit fix --force` proposerait ici `expo@54.0.38` et `@vercel/functions@3.6.1` — deux **rétrogradations**. Lis toujours la ligne « Will install … » avant d'accepter.

---

## 📱 Conformité Google Play

| Exigence | État |
| --- | --- |
| Suppression de compte **dans l'app** | ✅ `account.tsx` |
| Suppression de compte **via le web**, sans installer l'app | ✅ `/delete-user` (corriger l'énumération §1.1) |
| Politique de confidentialité publique, liée dans l'app | ✅ `/privacy` + lien dans `account.tsx` — **compléter** §2.4 |
| Data safety cohérent avec la politique | ⚠️ À revérifier après §2.4 |
| Pas d'identifiant publicitaire | ✅ `blockedPermissions: AD_ID` |
| Compte de test pour la revue Google | ⚠️ Changer le mot de passe exposé (§1.2) |

---

## 📋 Checklist avant mise en production

- [ ] Rotation de la clé Resend et du mot de passe testeur (§1.2)
- [ ] Réponse uniforme + hash factice sur la suppression web (§1.1)
- [ ] `DELETE /api/user` : rate limit dans `try`, body `catch`, 401 si Bearer invalide (§2.1)
- [ ] Bornes hautes des dates (§2.2)
- [ ] `env.X` dans toutes les routes (§2.3)
- [ ] Upstash + Resend dans la politique de confidentialité, Data safety relu (§2.4)
- [ ] HSTS 2 ans (§2.5)
- [ ] `npm ci` dans le frontend, `npm audit fix` (non forcé) pour `node-forge`
- [ ] CI qui lance tests + lint sur chaque PR (CI-02, #100) — c'est elle qui empêchera la prochaine régression du type « 404 sur le reset »
