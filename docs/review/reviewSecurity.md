# Revue pédagogique — Sécurité

> Périmètre : backend `backend/chronoapp/` + app mobile `frontend/chronoapp/` + chaîne de dépendances.
> Date : 2026-10-03 · Contexte : mise en production (API publique + publication Play Store).
> Complète `../security/security.md` (checklist) et `../security/securityPlus.md` (approfondissements) : ici on confronte **le code réel** à ces checklists.

---

## Synthèse

| Sévérité | Nb | Exemples |
| --- | --- | --- |
| 🔴 Critique / à corriger avant prod | 3 | CVE critique Next.js, rate limit contournable sur le reset, suppression de compte sans ré-authentification |
| 🟠 Important | 6 | JWT (algo, durée, logout), en-têtes HTTP, dates client, fail-open Upstash, énumération à l'inscription |
| 🟡 Défense en profondeur | 6 | Rate limit métier, purge des tokens, Sentry, dépendance Upstash côté mobile… |
| 📱 Conformité Play Store | 4 | Suppression de compte **via le web**, politique de confidentialité, Data safety |

---

## ✅ Ce qui est déjà au niveau

C'est un socle solide, rare chez un junior — à mettre en avant en entretien :

| Contrôle | Où | Pourquoi c'est bien |
| --- | --- | --- |
| bcrypt (coût 10) + limite **72 octets** | `registerSchema.ts:9` | bcrypt tronque silencieusement après 72 octets ; tu le valides en **octets** (`Buffer.byteLength`), pas en caractères |
| Hash factice si l'email n'existe pas | `login/route.ts:46` | Temps de réponse constant → pas d'énumération par timing |
| Message unique « Identifications invalides » | `login/route.ts:55` | Ne révèle pas si c'est l'email ou le mot de passe |
| Rate limit IP **et** email (sliding window) | `lib/rateLimit.ts` | Bloque le brute-force et le credential stuffing distribué |
| `tokenVersion` vérifié à chaque requête | `lib/auth.ts:25` | JWT révocables (le point faible classique des JWT) |
| Token de reset : 256 bits, hashé SHA-256, 30 min, usage unique atomique | `passwordresettoken/route.ts` | Une fuite de la base ne donne pas de liens valides ; pas de double usage concurrent |
| Token dans le **fragment** `#token=` + `history.replaceState` | `lib/mail.ts:7`, `app/page.tsx:21` | Le fragment n'est jamais envoyé au serveur → absent des logs et du `Referer` |
| Réponse identique que le compte existe ou non (reset) | `passwordresettoken/route.ts:83` | Anti-énumération |
| Ownership dans tous les `where` | toutes les routes | Pas d'IDOR |
| Prisma (requêtes paramétrées) | partout | Pas d'injection SQL |
| Messages 500 génériques | partout | Pas de fuite de stack trace |
| JWT dans **SecureStore** | `context/AuthContext.tsx` | Keystore Android chiffré, pas AsyncStorage en clair |
| `.env*` ignoré par git | `.gitignore` | Secrets hors du dépôt |

---

## 🔴 Critique — à traiter avant la mise en production

### S1. Vulnérabilité critique dans la version de Next.js installée

`npm audit` (backend) :

```
next      critical  Remote Code Execution in next/og ImageResponse   (16.3.5 installé, 16.3.8 dispo)
prisma    high      via @prisma/config → deepmerge-ts (stack exhaustion)
```

Tu n'utilises pas `next/og`, donc l'exploitation est peu probable — mais un scanner ne fait pas la différence, et la correction est un **patch** :

```bash
cd backend/chronoapp && npm install next@latest eslint-config-next@latest
```

Pour Prisma, `npm audit` propose un *downgrade* vers 6.12 (`isSemVerMajor: true`) : **ne lance pas `npm audit fix --force`**. Attends un correctif amont (Dependabot te l'apportera).

Côté mobile, 60 alertes, mais **toutes** proviennent de l'outillage de build (`brace-expansion`, `node-forge`, `uuid`… dans la CLI Expo/Metro), pas du code embarqué dans l'APK. Là encore `audit fix --force` proposerait `expo@44` — un retour de 13 versions qui casserait tout.

> 🎓 **Leçon** : lire une alerte = se demander *« ce code s'exécute-t-il en production, avec des entrées contrôlées par un attaquant ? »*. Le Dependabot configuré (`.github/dependabot.yml`) fera le suivi ; voir la section dédiée en fin de document.

### S2. Le rate limit du reset password est contournable

```ts
// passwordresettoken/route.ts:28-31
const ip =
  req.headers.get("x-forwarded-for") ||   // ← chaîne brute "1.2.3.4, 5.6.7.8"
  req.headers.get("x-rel-ip") ||          // ← typo : x-real-ip
  "unknown";
```

Trois problèmes :
1. `x-forwarded-for` est **fourni par le client**. Ici tu prends la chaîne complète : un attaquant envoie `X-Forwarded-For: <aléatoire>` à chaque requête → nouvelle clé de rate limit à chaque fois → limite IP inopérante. (Les autres routes utilisent `getClientIp()` qui prend le 1ᵉʳ élément ; c'est mieux mais il faut savoir **quel proxy** l'écrit — sur Vercel, utilise `x-real-ip` ou `ipAddress()` de `@vercel/functions`, qui sont posés par la plateforme.)
2. Même limiteur pour l'IP et l'email avec le même préfixe `ratelimit:IpEmail` → les deux types de clés partagent le même espace.
3. Conséquence : quelqu'un peut **inonder la boîte mail d'une victime** (limité à 3/h par email, ça va) et surtout **consommer ton quota Resend** en variant les emails.

```ts
const ip = getClientIp(req);   // réutilise le helper existant, corrigé pour ta plateforme
const ipCheck = await resetPasswordRateLimitIp.limit(ip);
const emailCheck = await resetPasswordRateLimitEmail.limit(safeData.data.email);
```

Et ce même handler renvoie `safeData.error.message` (`:23`) : c'est le détail brut de Zod. Renvoie un message fixe comme dans les autres routes.

### S3. Suppression de compte sans ré-authentification

`DELETE /api/user` ne demande que le JWT. Un token volé (téléphone déverrouillé prêté, malware) = compte et données supprimés définitivement. Le mot « chronoapp » à taper protège contre l'erreur de manipulation, pas contre un attaquant.

```ts
// body: { password }
const user = await prisma.user.findUnique({ where: { id: userId } });
if (!user || !(await bcrypt.compare(password, user.password))) {
  return NextResponse.json({ message: "Mot de passe incorrect" }, { status: 403 });
}
```

Détail complet : `../security/securityPlus.md` §7.

---

## 🟠 Important

### S4. JWT : figer l'algorithme, raccourcir, permettre le logout

```ts
// lib/auth.ts:13
jwt.verify(token, process.env.JWT_SECRET!)
```

- **Algorithme non figé** → `jwt.verify(token, secret, { algorithms: ["HS256"] })`. (jsonwebtoken v9 bloque déjà `none`, mais l'explicite protège des confusions d'algorithme ; cf. `../security/securityPlus.md` §2.)
- **`JWT_SECRET!`** : si la variable manque en prod, `jwt.sign` throw à chaque login → 500 sans explication. Vérifie les variables **au démarrage** (un `lib/env.ts` avec un schéma Zod sur `process.env` est un excellent exercice).
- **Durée 7 jours, sans refresh** : acceptable pour une app mobile perso. Mais le **logout** côté app supprime seulement le token local ; le JWT reste valide 7 jours. Tu as déjà l'outil : un `POST /api/auth/logout` qui fait `tokenVersion: { increment: 1 }` (= « déconnecter tous mes appareils »).
- Le secret doit faire **≥ 32 octets aléatoires** : `openssl rand -base64 48`.

### S5. En-têtes de sécurité appliqués à `/` seulement

```ts
// next.config.ts:8
source: "/",
```

`source: "/"` ne matche **que** la racine. Les routes `/api/*` et les assets n'ont rien. La page `/` (reset password) est la seule page HTML, donc c'est la plus importante, mais complète :

```ts
source: "/(.*)",
headers: [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "default-src 'self'; frame-ancestors 'none'; form-action 'self'" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
],
```

(Teste la CSP en local : Next en dev a besoin de `'unsafe-eval'` — tu peux la conditionner à `NODE_ENV`.)

### S6. Intégrité des données : dates fournies par le client

`startedAt`, `pausedAt`, `endedAt` sont acceptés tels quels (`z.coerce.date()`). Un client modifié peut écrire des durées négatives ou des dates en l'an 3000. Ce n'est pas une faille de confidentialité, mais c'est une **faille d'intégrité** : la règle « ne jamais faire confiance au client » s'applique aussi aux données métier. Détails et correctifs : `reviewBackend.md` §2.2.

### S7. Upstash indisponible = 500 non maîtrisé

`await loginRateLimitIP.limit(ip)` est **hors du `try`** dans login / register / reset. Si Redis ne répond pas, la route plante. Décide consciemment :
- **fail-closed** (refuser le login si le rate limit est indisponible) → plus sûr, moins disponible ;
- **fail-open** (laisser passer en loguant) → plus disponible.

Pour une auth, fail-closed avec un 503 explicite est le choix classique. L'important est que ce soit **un choix**, pas un accident.

### S8. Énumération des comptes à l'inscription

`register/route.ts:48` renvoie `409 "Un compte existe pour cette adresse mail"`, alors que le reset password est soigneusement anti-énumération. Les deux politiques se contredisent : un attaquant utilise simplement `/register` pour tester une liste d'emails (limité à 5/h/IP, ce qui freine sans empêcher avec des IP tournantes).

Options : accepter ce compromis (très courant, UX meilleure) **en le documentant**, ou passer à une inscription avec vérification d'email où la réponse est toujours « Vérifiez votre boîte mail » (`../security/securityPlus.md` §5). Note : sans vérification d'email, n'importe qui peut créer un compte avec l'adresse d'un tiers.

Petit plus : dans `register`, `bcrypt.hash` est calculé **avant** le `findUnique` → du CPU dépensé pour rien sur chaque doublon.

### S9. Pas de vérification de l'adresse email

Conséquence directe de S8 : `test@exemple.com` peut être « volée » par le premier venu. Le flux reset password suppose que l'email appartient bien à l'utilisateur. Pour une V1 c'est acceptable ; à inscrire dans la roadmap.

---

## 🟡 Défense en profondeur

| # | Point | Où | Action |
| --- | --- | --- | --- |
| S10 | Pas de rate limit sur les routes métier | `POST /seance`, `/timerrunner`, `/timerpause` | Un compte peut créer des millions de séances → remplir la base. `Ratelimit.slidingWindow(60, "1 m")` par `userId` |
| S11 | Pas de pagination sur `GET /seance` | `seance/route.ts:16` | `take: 50` + `orderBy: { createdAt: "desc" }`, sinon la réponse grossit sans limite (et inclut toutes les pauses/coureurs) |
| S12 | Tokens de reset jamais purgés | `PasswordResetToken` | Cron de purge (`../security/securityPlus.md` §14) |
| S13 | `@upstash/redis` dans l'app mobile | `frontend/package.json:28` | Inutilisé. Danger : la seule façon de l'utiliser côté mobile serait d'embarquer le token Upstash dans l'APK (`EXPO_PUBLIC_*` = **public**, extractible en 2 min). Supprime-le |
| S14 | Sentry | `app/_layout.tsx` | `sendDefaultPii` est bien commenté 👍. Ajoute un `beforeSend` qui retire l'en-tête `Authorization` des breadcrumbs `fetch`, et baisse `tracesSampleRate` |
| S15 | Logs | `register/route.ts:17` etc. | `console.error(safeData.error)` : vérifie que Zod ne logue pas l'`input` (mot de passe). En Zod 4, `reportInput` est `false` par défaut → OK, mais ne l'active jamais sur les schémas d'auth |

### Côté mobile : ce qu'il faut savoir

- **Tout ce qui est dans l'APK est public** : URL d'API, DSN Sentry, toute variable `EXPO_PUBLIC_*`. Aucun secret ne doit y être. Aujourd'hui c'est respecté ✔.
- **HTTPS uniquement** : Android bloque le HTTP en clair par défaut (`usesCleartextTraffic=false`) depuis l'API 28. Ne l'active pas pour la prod ; vérifie que `EXPO_PUBLIC_API_URL` de l'environnement EAS `production` est bien en `https://`.
- **Certificate pinning** : pas nécessaire pour ce niveau de risque.
- **Keystore de signature** : laisse EAS le gérer (`eas credentials`) et **télécharge une sauvegarde**. Perdre la clé d'upload = procédure de reset auprès de Google.

---

## 📱 Conformité Google Play (sécurité / vie privée)

Ces points ne sont pas des failles, mais **ils bloquent la publication** :

1. **Suppression de compte accessible hors de l'app** : depuis 2024, toute app permettant de créer un compte doit fournir *dans l'app* **et via une URL web** un moyen de demander la suppression du compte. Tu as le premier (`account.tsx`) ; il te manque une page web — ton backend Next sert déjà une page, une route `/delete-account` (formulaire email + mot de passe → suppression) ferait l'affaire.
2. **Politique de confidentialité** : URL publique obligatoire (données collectées : email, mot de passe hashé, données de séance ; sous-traitants : Vercel/Railway, Upstash, Resend, Sentry). Elle peut être servie par ton backend Next.
3. **Formulaire Data safety** dans la Play Console : déclarer email (collecté, obligatoire, pour la gestion de compte), données de diagnostic (Sentry), chiffrement en transit (oui, HTTPS), suppression possible (oui).
4. **RGPD** : export des données et suppression — voir `../security/securityPlus.md` §18.

---

## 🤖 Dependabot — ce qui a été configuré

Fichier créé : `.github/dependabot.yml`.

| Écosystème | Dossier | Fréquence | Stratégie |
| --- | --- | --- | --- |
| npm | `/backend/chronoapp` | hebdo (lundi 7h) | Groupes `next` (+ eslint-config-next), `prisma` (+ @prisma/client, **toujours à la même version**), reste minor/patch groupé |
| npm | `/frontend/chronoapp` | hebdo (lundi 7h) | Groupe `expo-sdk` ; `react`, `react-native`, `react-native-*`, `typescript` **ignorés** |
| github-actions | `/` | mensuel | Prêt pour quand tu ajouteras une CI |

**Pourquoi ignorer `react-native` & co côté mobile ?** Chaque SDK Expo fixe une version précise de React Native, Reanimated, Screens, etc. Les monter individuellement casse le build EAS. On les met à jour **uniquement** lors d'une montée de SDK, avec :

```bash
npx expo install expo@^58 && npx expo install --fix && npx expo-doctor
```

**Pourquoi ignorer les majeures ?** Une majeure = breaking changes à lire. Dependabot t'ouvrirait une PR qui ne compile pas. Tu les fais à la main, volontairement.

### À activer dans GitHub (le fichier seul ne suffit pas)

`Settings → Code security` du dépôt `yannb-dev/chrono-app` :
- [ ] **Dependency graph** : activé
- [ ] **Dependabot alerts** : activé → alertes de vulnérabilités (indépendantes du fichier YAML)
- [ ] **Dependabot security updates** : activé → PR automatiques de correctifs de sécurité
- [ ] **Secret scanning** + **Push protection** : bloque un push contenant une clé (Resend, Upstash, JWT…)
- [ ] Créer les labels `backend`, `frontend`, `ci` (`dependencies` est créé automatiquement) — sinon Dependabot ignore les labels manquants

### Workflow pour traiter une PR Dependabot

1. Lire le changelog lié dans la PR.
2. `gh pr checkout <n>` → `npm ci` → `npm test` / `npm run build` / `npx expo-doctor`.
3. Merger. **Sans CI, Dependabot ne teste rien à ta place** : la prochaine étape logique est un workflow GitHub Actions qui lance `npm run lint`, `tsc --noEmit` et `jest --ci` sur chaque PR (voir `reviewTestingLibrary.md`).

---

## 📋 Checklist avant mise en production

- [ ] S1 — `next` ≥ 16.3.8
- [ ] S2 — `getClientIp` corrigé pour Vercel + limiteurs séparés sur le reset
- [ ] S3 — mot de passe exigé pour supprimer le compte
- [ ] S4 — `algorithms: ["HS256"]`, validation des variables d'env au démarrage, endpoint logout
- [ ] S5 — en-têtes sur `/(.*)` + HSTS
- [ ] S7 — `limit()` dans le `try`, choix fail-open/closed explicite
- [ ] S13 — retirer `@upstash/redis` du mobile
- [ ] Play Store — page web de suppression de compte + politique de confidentialité + Data safety
- [ ] GitHub — alerts, security updates, secret scanning activés
