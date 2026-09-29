# Audit de sécurité — ChronoApp

_Date : 2026-09-23 — Périmètre : `backend/chronoapp` (Next.js API + page de reset) et `frontend/chronoapp` (Expo), historique git inclus._

> **Mise à jour 2026-09-28 :** contre-audit après les corrections (#2 → #35). Voir la section [Contre-audit](#contre-audit--2026-09-28) en fin de fichier pour les points restants.

Classement du plus grave au plus mineur. Chaque point indique **où**, **le scénario d'attaque** et **la correction**.

**Bilan rapide :** l'ownership (filtre `userId`) est correct sur **toutes** les routes métier (`seance`, `timerpause`, `timerrunner`), Zod supprime les champs inconnus (pas de mass assignment), le token de reset est aléatoire (256 bits), stocké hashé, expirant et à usage unique, le JWT est stocké en `SecureStore`, et aucun secret backend n'a été commité. Les failles ci-dessous portent surtout sur **l'authentification et le cycle de vie des sessions**.

---

## 🔴 Élevé

### 1. Les sessions JWT ne sont jamais révoquées, même après un changement de mot de passe

- **Où :** `app/api/auth/login/route.ts:55` (`expiresIn: "7d"`), `app/api/auth/passwordresettoken/route.ts:132-142`, `lib/auth.ts`
- **Scénario :** un attaquant récupère le JWT d'un utilisateur (téléphone volé, fuite de log…). La victime s'en rend compte et réinitialise son mot de passe → **l'attaquant garde l'accès pendant 7 jours**, car le JWT reste valide tant qu'il n'est pas expiré. Le « logout » côté app (`AuthContext.tsx:30`) ne fait que supprimer le token localement : côté serveur rien n'est invalidé.
- **Correction :**
  - Ajouter un champ `tokenVersion Int @default(0)` (ou `passwordChangedAt DateTime?`) sur `User`.
  - Le mettre dans le payload JWT au login, l'incrémenter dans la transaction de reset.
  - Dans `getUserIdFromRequest`, comparer la version du token à celle en base (1 requête, ou cache Redis).
  - Réduire la durée de vie (ex : 1 h) avec un refresh token si besoin.

### 2. Rate limiting contournable : clé `IP + email` et en-tête `x-forwarded-for` brut

- **Où :** `app/api/auth/login/route.ts:14-17`, `app/api/auth/passwordresettoken/route.ts:17-21`
- **Scénario :**
  - **Credential stuffing :** la clé contient l'email, donc depuis une seule IP un attaquant peut tester 5 mots de passe/min sur **chaque** email d'une liste (des milliers de comptes en parallèle, sans jamais être bloqué).
  - **Brute force distribué :** sur un seul compte, chaque nouvelle IP obtient un nouveau quota.
  - **Spoofing :** `x-forwarded-for` est lu tel quel. Sur Vercel l'en-tête est réécrit par la plateforme, mais sur un autre hébergeur (Railway, VPS…) le client peut mettre n'importe quelle valeur → quota infini. De plus l'en-tête peut contenir une liste (`client, proxy1`).
  - `value.email` est lu **avant** la validation Zod et sans normalisation : `"a@x.fr"`, `"A@x.fr"` ou un objet donnent des clés différentes (et `value` à `null` fait planter la route en 500).
- **Correction :** deux limiteurs séparés — un par **IP** (ex : 20/min, toutes cibles confondues) et un par **email normalisé** (`trim().toLowerCase()`, ex : 10/heure). Valider avec Zod **avant** de construire la clé. Prendre uniquement la première IP de `x-forwarded-for` (ou `x-real-ip` / l'IP fournie par la plateforme).

### 3. Énumération des comptes (register + timing du login et du reset)

- **Où :** `app/api/auth/register/route.ts:24-29`, `app/api/auth/login/route.ts:45-53`, `app/api/auth/passwordresettoken/route.ts:57-70`
- **Scénario :**
  - `POST /api/auth/register` répond **409 « Cet email est déjà utilisé »** → n'importe qui peut savoir si un email a un compte. Cela annule l'effort fait sur le reset (message générique « Si un compte existe… »).
  - `/register` n'a **aucun rate limit** → énumération massive et création de comptes en masse.
  - **Timing :** au login, si l'email n'existe pas, `bcrypt.compare` n'est pas exécuté → réponse ~100 ms plus rapide. Au reset, l'envoi de l'email (`await sendVerificationEmail`) n'a lieu que si le compte existe → réponse nettement plus lente. Les deux permettent de distinguer « compte existe / n'existe pas ».
- **Correction :** rate limit sur `/register` ; au login, exécuter un `bcrypt.compare` contre un hash factice quand l'utilisateur n'existe pas ; au reset, ne pas `await` l'envoi du mail (le lancer en tâche de fond, ex : `after()` de Next.js) pour répondre en temps constant. Pour le register, l'approche stricte est de toujours répondre « Vérifiez vos emails » (nécessite une vérification d'email).

---

## 🟠 Moyen

### 4. Bombardement d'emails via la demande de reset + tokens multiples valides

- **Où :** `app/api/auth/passwordresettoken/route.ts:57-66`
- **Scénario :** chaque requête crée un **nouveau** token sans invalider les précédents et envoie un mail. Avec la faiblesse du point 2 (quota par IP), un attaquant peut inonder la boîte d'une victime et **épuiser le quota Resend** (déni de service sur les resets légitimes). Plusieurs liens valides coexistent pendant 30 min, ce qui élargit la surface si une boîte mail est lue par un tiers.
- **Correction :** avant d'en créer un, supprimer/invalider les tokens non utilisés de l'utilisateur (`deleteMany({ where: { userId, usedAt: null } })`) ; limiter à N demandes/heure **par email** ; au changement de mot de passe, invalider tous les tokens restants.

### 5. Condition de course sur l'utilisation du token de reset

- **Où :** `app/api/auth/passwordresettoken/route.ts:113-142`
- **Scénario :** la vérification `usedAt` est faite **hors** transaction, puis l'update ne la revérifie pas. Deux requêtes simultanées avec le même token passent toutes les deux la vérification → le token est utilisé deux fois (le dernier mot de passe écrit gagne). Impact limité (il faut posséder le token), mais « usage unique » n'est pas garanti.
- **Correction :** consommer le token de façon atomique **dans** la transaction :
  ```ts
  const { count } = await tx.passwordResetToken.updateMany({
    where: { tokenHash: hashedToken, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (count === 0) throw new Error("TOKEN_INVALID"); // → 400
  await tx.user.update({ ... });
  ```

### 6. Données personnelles et informations sensibles dans les logs

- **Où :**
  - `login/route.ts:18` et `passwordresettoken/route.ts:22` : `console.log("RATE LIMIT DEBUG:", { identifier, … })` → **email + IP** de chaque tentative loggués en production.
  - `lib/mail.ts:24` : log de la réponse Resend (contient l'adresse du destinataire).
  - `register/route.ts:14`, `passwordresettoken/route.ts:45,87` : erreurs Zod complètes loggées.
- **Risque :** les logs Vercel deviennent un fichier de données personnelles (RGPD) et une liste d'emails/IP exploitable en cas d'accès aux logs.
- **Correction :** supprimer les logs de debug ; ne logger que des codes d'erreur / identifiants techniques, jamais d'email ni d'IP en clair.

### 7. Token de reset transmis en query string

- **Où :** `lib/mail.ts:7` (`/?token=…`), `app/page.tsx:11`
- **Risque :** l'URL complète (avec le token) est conservée dans l'historique du navigateur, les logs d'accès (Vercel, proxies) et peut fuiter via l'en-tête `Referer`. Atténué par l'expiration (30 min) et l'usage unique.
- **Correction :** utiliser un fragment (`/#token=…`, jamais envoyé au serveur) lu côté client, ou retirer le token de l'URL dès le chargement (`history.replaceState`) ; ajouter `Referrer-Policy: no-referrer` sur cette page.

---

## 🟡 Faible

### 8. Aucun en-tête de sécurité HTTP sur la page web

- **Où :** `next.config.ts`
- **Risque :** la page de reset peut être intégrée dans une `<iframe>` (clickjacking) ; pas de CSP, pas de `Referrer-Policy`.
- **Correction :** ajouter `headers()` dans `next.config.ts` avec `X-Frame-Options: DENY` (ou `frame-ancestors 'none'`), `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, et une CSP simple.

### 9. Validation d'entrées trop permissive (bornes manquantes)

- **Où :** `lib/schema/loginSchema.ts:5`, `seanceSchema.ts:4-5`, `timerrunnerSchema.ts:4`, `timerPauseSchema.ts`
- **Risque :**
  - `password: z.string()` sans `max` au login → on peut envoyer un mot de passe de plusieurs Mo, haché par bcrypt à chaque tentative (coût CPU).
  - `totalRunner`, `numberRunner` : entiers négatifs ou énormes acceptés ; `colorRunner` : chaîne illimitée → remplissage de la base.
  - Dates `pausedAt`/`endedAt` arbitraires (1970, 2100…) → durées négatives ou absurdes. Aucun rate limit sur les routes métier.
  - Le `max(72)` compte des **caractères** alors que bcrypt tronque à 72 **octets** : un mot de passe avec des accents/emoji peut être silencieusement tronqué.
- **Correction :** `.max(128)` sur le password du login, `.int().min(1).max(…)` sur les compteurs, `.max(20)` sur `colorRunner`, bornes de dates raisonnables ; vérifier la longueur en octets (`new TextEncoder().encode(pwd).length <= 72`).

### 10. `req.json()` non protégé

- **Où :** toutes les routes (`const x = await req.json()` hors `try`)
- **Risque :** un body non-JSON (ou `null`) fait lever une exception → 500 avec une trace dans les logs. Au login, `value.email` sur `null` → `TypeError`. Pas d'exploitation directe, mais bruit dans les logs et comportement non maîtrisé.
- **Correction :** `const body = await req.json().catch(() => null)` puis laisser Zod rejeter proprement (400).

### 11. Les deux rate limiters partagent le même préfixe Redis

- **Où :** `lib/rateLimit.ts:10` et `:16` (`prefix: "ratelimit:login"` pour les deux)
- **Risque :** les compteurs login et reset se mélangent (même clé `IP:email`) : 3 demandes de reset bloquent le login de l'utilisateur, et inversement les quotas ne sont pas ceux prévus.
- **Correction :** `prefix: "ratelimit:reset"` pour le second.

### 12. Dépendances vulnérables

- **Backend :** `npm audit --omit=dev` → 4 « high » via `deepmerge-ts` (dépendance de `@prisma/config` / CLI Prisma : exploitable uniquement à la configuration, pas via l'API). Surveiller une mise à jour de Prisma plutôt que `audit fix --force` (qui rétrograderait Prisma en 2.x).
- **Frontend :** 16 « moderate » (`decode-uri-component`, `uuid`…), essentiellement dans l'outillage Expo/Metro.
- **Correction :** `npm update` régulier, activer Dependabot sur le repo GitHub.

### 13. Emails non normalisés

- **Où :** `registerSchema.ts:5`, `loginSchema.ts:4`, `resetPasswordSchema.ts:4`
- **Risque :** `Jean@x.fr` et `jean@x.fr` peuvent créer deux comptes distincts (la recherche Postgres est sensible à la casse) → confusion, usurpation visuelle, contournement du 409.
- **Correction :** `z.string().trim().toLowerCase().email()` partout (Zod v4 : `z.email()` + `.transform`).

---

## ⚪ Informatif / hygiène

- **`password String @unique`** (`prisma/schema.prisma:19`) : contrainte d'unicité sur le hash du mot de passe. Inutile (les hashs bcrypt sont salés) et conceptuellement faux : à retirer.
- **`PasswordResetToken` sans `onDelete: Cascade`** (`schema.prisma:31`) : la suppression d'un utilisateur ayant des tokens échouera ; pas de purge des tokens expirés.
- **Coût bcrypt = 10** : acceptable, 12 est la recommandation actuelle.
- **Historique git :** `frontend/chronoapp/.env` et `.env.production` ont été commités (supprimés en `618f817`). Ils ne contiennent que `EXPO_PUBLIC_API_URL` (URL publique et IP locales) : pas de secret, mais rappel que les variables `EXPO_PUBLIC_*` sont de toute façon **embarquées dans l'app** et ne doivent jamais contenir de secret.
- **DSN Sentry en dur** (`frontend/chronoapp/app/_layout.tsx:10`) : public par conception, OK. `sendDefaultPii` est bien désactivé — le garder ainsi.
- **Backend `.env`** : correctement ignoré par git, `JWT_SECRET` de longueur suffisante (87 caractères).

---

## Ordre de correction suggéré

1. Rate limiter : préfixe distinct (#11, 1 ligne) + clés IP / email séparées (#2)
2. Supprimer les logs de debug (#6)
3. Consommation atomique + invalidation des tokens de reset (#4, #5)
4. Révocation des JWT via `tokenVersion` (#1)
5. Anti-énumération : rate limit register, bcrypt factice, envoi du mail non bloquant (#3)
6. Bornes Zod, normalisation des emails, `req.json().catch()` (#9, #10, #13)
7. En-têtes HTTP et token hors query string (#7, #8)

---

## Contre-audit — 2026-09-28

_Vérification du code sur `main` (`d3755b7`) après les PR de correction._

### État des points de l'audit initial

| #   | Faille                          | État                                                                                              |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | Révocation JWT                  | ✅ `tokenVersion` vérifié dans `lib/auth.ts`, incrémenté au reset                                  |
| 2   | Rate limit contournable         | 🟠 Partiel — limiteurs IP / email séparés, mais extraction de l'IP incorrecte (voir **C**)         |
| 3   | Énumération des comptes         | 🔴 Non corrigé — voir **B**                                                                        |
| 4   | Tokens multiples                | ✅ `deleteMany` + `create` dans une transaction                                                    |
| 5   | Race condition token            | 🔴 Non corrigé — voir **D**                                                                        |
| 6   | Logs de données personnelles    | ✅ Logs de debug supprimés                                                                         |
| 7   | Token en query string           | ✅ Fragment `#token` + `history.replaceState` + `Referrer-Policy`                                  |
| 8   | En-têtes HTTP                   | ✅ Sur `/` (seule page web) — `X-Content-Type-Options: nosniff` reste à ajouter                    |
| 9   | Bornes Zod                      | 🟠 Partiel — voir **F**                                                                            |
| 10  | `req.json()` non protégé        | ✅                                                                                                 |
| 11  | Préfixe Redis partagé           | 🔴 Réintroduit — voir **E**                                                                        |
| 12  | Dépendances                     | ⚪ Non vérifié (pas de `.github/dependabot.yml` dans le repo)                                      |
| 13  | Emails non normalisés           | ✅ `trim().toLowerCase()` dans tous les schémas                                                    |
| —   | `password @unique` / `Cascade`  | ✅                                                                                                 |

### Points restants à corriger

#### 🔴 A. Envoi du mail de reset non garanti (régression introduite par la correction #3)

- **Où :** `app/api/auth/passwordresettoken/route.ts:72`
- **Problème :** `sendVerificationEmail(...)` est appelé sans `await` pour répondre en temps constant. Sur Vercel (serverless), la fonction peut être gelée dès que la réponse est renvoyée → **le mail peut ne jamais partir**. De plus, le `try/catch` englobant ne capture pas une promesse non attendue : un échec Resend devient une _unhandled rejection_.
- **Correction :**
  ```ts
  import { after } from "next/server";

  after(() =>
    sendVerificationEmail(existingUser.email, rawToken).catch((e) =>
      console.error("Échec envoi mail reset", e),
    ),
  );
  ```

#### 🔴 B. Énumération des comptes toujours possible

- **Où :** `app/api/auth/register/route.ts:46-51`, `app/api/auth/login/route.ts:47-52`
- **Problème :**
  - Au register, le message est devenu générique mais le **code HTTP** trahit l'existence du compte : `409` si l'email existe, `201` sinon.
  - Au login, pas de `bcrypt.compare` quand l'utilisateur n'existe pas → réponse mesurablement plus rapide.
- **Correction :**
  - Register : même statut et même corps de réponse dans les deux cas (ex : `202 { message: "Si l'adresse est valide, vérifiez vos emails" }`). Ne plus renvoyer `{ id, email }`.
  - Login :
    ```ts
    const DUMMY_HASH = "$2a$10$..."; // hash bcrypt quelconque généré une fois
    const verif = await bcrypt.compare(
      safeValue.data.password,
      userSearch?.password ?? DUMMY_HASH,
    );
    if (!userSearch || !verif) return 401;
    ```

#### 🟠 C. Extraction de l'IP incorrecte

- **Où :** `login/route.ts:23-26`, `register/route.ts:23-26`, `passwordresettoken/route.ts:33-36`
- **Problème :**
  - Faute de frappe : `"x-rel-ip"` au lieu de `"x-real-ip"` → le fallback ne fonctionne jamais.
  - `x-forwarded-for` peut contenir une liste (`client, proxy1`) → la clé varie selon le chemin réseau.
  - Code dupliqué dans 3 routes.
- **Correction :** une fonction unique `lib/getClientIp.ts` :
  ```ts
  export function getClientIp(req: Request) {
    return (
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown"
    );
  }
  ```

#### 🟠 D. Race condition sur l'utilisation du token (point #5 initial)

- **Où :** `app/api/auth/passwordresettoken/route.ts:106-148`
- **Problème :** inchangé — `usedAt` et `expiresAt` sont vérifiés hors transaction, l'`update` ne les revérifie pas.
- **Correction :** voir le code du point #5 ci-dessus (`updateMany` conditionnel + `count === 0` dans la transaction, avant l'update du user).

#### 🟠 E. Préfixe Redis réutilisé trois fois (régression du point #11)

- **Où :** `lib/rateLimit.ts:16, 28, 34`
- **Problème :** `loginRateLimitEmail`, `registerRateLimitEmail` et `registerRateLimitIp` partagent `prefix: "ratelimit:loginEMAIL"`. Les clés ne se mélangent pas aujourd'hui uniquement parce que les fenêtres diffèrent (60 s / 10 min) — un changement de durée suffit à faire partager les compteurs. Même remarque pour `resetPasswordRateLimitIpEmail`, utilisé pour l'IP **et** l'email sous un préfixe `loginPassword` trompeur.
- **Correction :** un préfixe unique et explicite par limiteur : `ratelimit:login:ip`, `ratelimit:login:email`, `ratelimit:register:ip`, `ratelimit:register:email`, `ratelimit:reset:ip`, `ratelimit:reset:email`.
- **Remarque :** `registerRateLimitIp` à 1 requête / 10 min bloque tout un réseau partagé (école, entreprise, 4G CGNAT). 5 / heure par IP est plus réaliste.

#### 🟡 F. Bornes Zod incomplètes

- **Où :**
  - `lib/schema/timerrunnerSchema.ts:4` : `numberRunner: z.number().int()` sans bornes → `.min(1).max(40)` (cohérent avec `totalRunner`).
  - `lib/schema/newPasswordSchema.ts:26` : `.max(72)` compte des **caractères** → reprendre le `refine` en octets de `registerSchema.ts` (sinon un mot de passe accentué accepté au reset peut être tronqué par bcrypt).
  - `newPasswordSchema.ts:31` : `token: z.string()` → `.length(64)` (token hex de 32 octets).
  - Dates `pausedAt` / `endedAt` toujours sans bornes.

#### ⚪ G. Hygiène

- `passwordresettoken/route.ts:1` : commentaire d'en-tête `// app/api/auth/register/route.ts` erroné ; message d'erreur `"Erreur POST API/REGISTER"` ligne 82 → trompeur dans les logs.
- `passwordresettoken/route.ts:44, 78` : `Response.json` et clé `error` au lieu de `NextResponse.json` et `message` → incohérent avec les autres routes et avec `extractErrorMessage` côté front.
- `passwordresettoken/route.ts:19-23` : token généré avant la validation Zod → à déplacer dans le `if (existingUser)`.
- `register/route.ts:42` : `findUnique` hors du `try` → une erreur Prisma donne un 500 non maîtrisé.
- Ajouter `.github/dependabot.yml` (point #12).

### Ordre de correction suggéré

1. **A** — `after()` pour l'envoi du mail (bug fonctionnel en prod)
2. **E + C** — préfixes Redis + `getClientIp()` (rapide, 1 fichier + 3 imports)
3. **D** — consommation atomique du token
4. **B** — anti-énumération register + login
5. **F + G** — bornes Zod et hygiène
