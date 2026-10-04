# Sécurité — Checklist pour projets avec BDD + auth email/password

_Stack de référence : Next.js (API Routes) + Prisma + PostgreSQL + Zod — les principes s'appliquent à n'importe quel backend._

**Légende priorité**

| Niveau | Signification                                                    | Quand                                |
| ------ | ---------------------------------------------------------------- | ------------------------------------ |
| 🔴 P0  | Faille directe : vol de compte, fuite de données, accès à autrui | Avant la première mise en ligne      |
| 🟠 P1  | Contournement des protections, abus, fuite indirecte             | Avant d'avoir des vrais utilisateurs |
| 🟡 P2  | Défense en profondeur, robustesse                                | Dans le premier mois                 |
| ⚪ P3  | Hygiène, confort, conformité                                     | En continu                           |

---

## 🔴 P0 — Indispensable

### 1. Hachage des mots de passe

- [ ] **Jamais** de mot de passe en clair, ni chiffré de façon réversible, ni haché avec MD5/SHA-x.
- [ ] Utiliser **argon2id** (recommandé) ou **bcrypt coût ≥ 12**.
- [ ] bcrypt tronque à **72 octets** (pas caractères) → valider la longueur en octets.
- [ ] Pas de contrainte `@unique` sur le hash (inutile et conceptuellement faux).

```ts
// Zod : borne en octets pour bcrypt
password: z.string().min(12).refine(
  (p) => new TextEncoder().encode(p).length <= 72,
  "Mot de passe trop long",
),
```

### 2. Ownership / contrôle d'accès sur chaque requête (IDOR)

- [ ] Toute requête métier filtre par l'utilisateur authentifié : `where: { id, userId }`.
- [ ] Le `userId` vient **du token/session**, jamais du body ou de l'URL.
- [ ] Une ressource d'un autre utilisateur → **404** (pas 403, qui confirme son existence).

```ts
const userId = await getUserIdFromRequest(req);
if (!userId)
  return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
const seance = await prisma.seance.findFirst({ where: { id, userId } });
if (!seance)
  return NextResponse.json({ message: "Introuvable" }, { status: 404 });
```

### 3. Validation stricte des entrées (côté serveur)

- [ ] Valider **chaque** body / query / params avec Zod **côté serveur** (la validation client n'est que de l'UX).
- [ ] Zod supprime les champs inconnus par défaut → pas de mass assignment (`role: "admin"`). Ne jamais passer `req.body` brut à Prisma.
- [ ] Bornes partout : `.max()` sur les strings, `.int().min().max()` sur les nombres, bornes de dates.
- [ ] Body non-JSON → 400, pas 500 : `const body = await req.json().catch(() => null);`

### 4. Injection SQL

- [ ] Utiliser l'ORM ou les requêtes paramétrées (`$1`, `prisma.$queryRaw\`...${x}\``).
- [ ] **Jamais** `$queryRawUnsafe` / concaténation de chaînes avec une entrée utilisateur.
- [ ] Pour un `ORDER BY` / nom de colonne dynamique : **liste blanche**.

### 5. Secrets

- [ ] `.env` dans `.gitignore` **dès le premier commit**. Fournir un `.env.example` sans valeurs.
- [ ] `JWT_SECRET` / `AUTH_SECRET` aléatoire ≥ 32 octets : `openssl rand -base64 48`.
- [ ] Rien de secret dans les variables publiques (`NEXT_PUBLIC_*`, `EXPO_PUBLIC_*`, `VITE_*`) : elles sont **embarquées dans le bundle**.
- [ ] Un secret commité = secret compromis → le **régénérer** (le supprimer de l'historique ne suffit pas).

### 6. Sessions / JWT révocables

- [ ] Durée de vie courte (access token 15 min – 1 h) + refresh token si besoin, ou session en base.
- [ ] Mécanisme de **révocation** : champ `tokenVersion` sur `User`, mis dans le payload, comparé à chaque requête, **incrémenté** au changement/reset de mot de passe et au « déconnecter partout ».
- [ ] Logout = invalidation **côté serveur**, pas seulement suppression locale du token.
- [ ] Figer l'algorithme à la vérification : `jwt.verify(token, secret, { algorithms: ["HS256"] })`.

### 7. Stockage du token côté client

- [ ] **Web :** cookie `HttpOnly; Secure; SameSite=Lax` (jamais `localStorage` → lisible par tout XSS).
- [ ] **Mobile :** `expo-secure-store` / Keychain / Keystore (jamais `AsyncStorage`).

### 8. Réinitialisation du mot de passe

- [ ] Token aléatoire cryptographique ≥ 32 octets (`crypto.randomBytes(32).toString("hex")`).
- [ ] Stocké **haché** (SHA-256 suffit) en base, avec `expiresAt` court (15–30 min).
- [ ] **Usage unique garanti atomiquement** (sinon race condition) :

```ts
await prisma.$transaction(async (tx) => {
  const { count } = await tx.passwordResetToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (count === 0) throw new Error("TOKEN_INVALID"); // → 400
  await tx.user.update({
    where: { id: userId },
    data: { password: newHash, tokenVersion: { increment: 1 } }, // révoque les sessions
  });
});
```

- [ ] À chaque nouvelle demande : supprimer les tokens non utilisés de l'utilisateur (`deleteMany`) avant d'en créer un.
- [ ] Token dans le **fragment** de l'URL (`/reset#token=…`, jamais envoyé au serveur) + `history.replaceState` + `Referrer-Policy: no-referrer`.

### 9. HTTPS partout

- [ ] Aucune API en HTTP en production (Vercel/Railway le font par défaut — vérifier l'URL côté app mobile).
- [ ] En-tête `Strict-Transport-Security: max-age=63072000; includeSubDomains`.

---

## 🟠 P1 — Avant les vrais utilisateurs

### 10. Rate limiting correctement conçu

- [ ] Sur **toutes** les routes d'auth : login, register, demande de reset, validation de reset, vérif email.
- [ ] **Deux limiteurs séparés** par route :
  - par **IP** (ex : 20/min) → bloque le credential stuffing (1 IP, beaucoup d'emails) ;
  - par **email normalisé** (ex : 10/h) → bloque le brute force distribué (beaucoup d'IP, 1 email).
- [ ] Construire la clé **après** la validation Zod et la normalisation de l'email.
- [ ] Un **préfixe Redis unique et explicite** par limiteur : `ratelimit:login:ip`, `ratelimit:login:email`, `ratelimit:register:ip`…
- [ ] Extraction de l'IP centralisée (une seule fonction) :

```ts
// lib/getClientIp.ts
export function getClientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
```

> ⚠️ `x-forwarded-for` n'est fiable que si l'hébergeur le réécrit (Vercel oui). Sur un VPS derrière ton propre proxy, configurer le proxy pour l'écraser.
> ⚠️ Limites réalistes : 1 req / 10 min par IP bloque un réseau entier (école, 4G CGNAT).

- [ ] Préférer le rate limiting au **verrouillage de compte** (un lockout permet à un attaquant de bloquer n'importe quelle victime).

### 11. Anti-énumération des comptes

Un attaquant ne doit pas pouvoir savoir si un email a un compte — ni par le **message**, ni par le **code HTTP**, ni par le **temps de réponse**.

- [ ] **Login :** même message et même statut (`401 "Identifiants invalides"`) si email inconnu ou mauvais mot de passe.
- [ ] **Login :** exécuter `bcrypt.compare` même si l'utilisateur n'existe pas :

```ts
const DUMMY_HASH = "$2b$12$..."; // généré une fois avec bcrypt.hash("dummy", 12)
const ok = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
if (!user || !ok)
  return NextResponse.json(
    { message: "Identifiants invalides" },
    { status: 401 },
  );
```

- [ ] **Reset :** toujours `200 "Si un compte existe, un email a été envoyé"`.
- [ ] **Reset :** envoi du mail **non bloquant mais garanti** (pas de simple promesse non attendue en serverless) :

```ts
import { after } from "next/server";
after(() =>
  sendResetEmail(user.email, rawToken).catch((e) =>
    console.error("MAIL_RESET_FAILED", e),
  ),
);
```

- [ ] **Register :** même statut et même corps que le compte existe ou non (ex : `202 "Vérifiez vos emails"`) → nécessite la vérification d'email (point 12). Si l'email existe déjà, envoyer un mail « quelqu'un a tenté de créer un compte avec votre adresse ».

### 12. Vérification de l'adresse email

- [ ] Compte créé avec `emailVerifiedAt: null` ; lien de vérification (même mécanique que le token de reset : aléatoire, haché, expirant, usage unique).
- [ ] Fonctionnalités sensibles bloquées tant que l'email n'est pas vérifié.
- [ ] Empêche la création de comptes au nom d'autrui et rend possible l'anti-énumération au register.

### 13. Normalisation des emails

- [ ] `trim().toLowerCase()` dans **tous** les schémas (register, login, reset…) → sinon `Jean@x.fr` et `jean@x.fr` = 2 comptes.
- [ ] Alternative Postgres : colonne `citext` ou index unique sur `lower(email)`.

```ts
email: z.string().trim().toLowerCase().pipe(z.email()),
```

### 14. Politique de mot de passe (NIST 800-63B)

- [ ] Longueur minimale **≥ 8** (12 recommandé), max ~64–128 (et 72 octets pour bcrypt).
- [ ] **Pas** de règles de composition imposées (majuscule + chiffre + symbole) ni d'expiration périodique : elles poussent à des mots de passe prévisibles.
- [ ] Refuser les mots de passe **connus comme compromis** (API HaveIBeenPwned k-anonymity) ou une liste des plus courants.
- [ ] Borne `.max()` aussi sur le **login** (sinon envoi de mots de passe de plusieurs Mo hachés à chaque tentative = DoS CPU).

### 15. Opérations sensibles = ré-authentification

- [ ] Changer de mot de passe → demander l'**ancien** mot de passe.
- [ ] Changer d'email → mot de passe + vérification de la **nouvelle** adresse + notification à l'**ancienne**.
- [ ] Supprimer le compte → mot de passe.
- [ ] Après changement de mot de passe : incrémenter `tokenVersion`, supprimer les tokens de reset, envoyer un mail de notification.

### 16. Logs sans données personnelles

- [ ] Pas de `console.log` de debug en production (email, IP, body, token, erreurs Zod complètes).
- [ ] Logger des **codes d'erreur** et identifiants techniques (`userId`, `requestId`), jamais d'email/IP en clair, jamais de mot de passe ou token.
- [ ] Monitoring (Sentry…) avec `sendDefaultPii: false`.

### 17. Messages d'erreur maîtrisés

- [ ] Jamais de stack trace, de message Prisma ou SQL renvoyé au client.
- [ ] Différencier les codes : 400 (validation), 401 (non authentifié), 404 (introuvable / pas à toi, ex. Prisma `P2025`), 409, 429, 500 générique.
- [ ] Toute la logique (y compris `findUnique`) **dans** le `try/catch`.

---

## 🟡 P2 — Défense en profondeur

### 18. En-têtes HTTP de sécurité (pages web)

```ts
// next.config.ts
async headers() {
  return [{
    source: "/(.*)",
    headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, // no-referrer sur les pages à token
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
      { key: "Content-Security-Policy", value: "default-src 'self'; frame-ancestors 'none'" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ],
  }];
}
```

- [ ] Vérifier le résultat sur [securityheaders.com](https://securityheaders.com).

### 19. CSRF et CORS

- [ ] Auth par **cookie** → protection CSRF : `SameSite=Lax` minimum + vérifier l'en-tête `Origin` sur les requêtes mutantes (NextAuth et les Server Actions le gèrent).
- [ ] Auth par **header `Authorization: Bearer`** → pas de CSRF, mais ne jamais mettre le token dans un cookie lisible.
- [ ] CORS : liste blanche d'origines, **jamais** `Access-Control-Allow-Origin: *` avec `credentials`.

### 20. XSS

- [ ] React échappe par défaut → **éviter `dangerouslySetInnerHTML`** (sinon sanitizer type DOMPurify).
- [ ] Ne pas construire de `href` à partir d'une entrée utilisateur sans vérifier le protocole (`javascript:`).
- [ ] Échapper les données utilisateur dans les **emails HTML** envoyés.

### 21. Comparaisons en temps constant

- [ ] Comparer secrets/tokens/signatures avec `crypto.timingSafeEqual` (pas `===`) quand la comparaison n'est pas faite par la BDD sur un hash.

### 22. Base de données

- [ ] Utilisateur Postgres applicatif avec **droits minimaux** (pas le superuser) ; un utilisateur séparé pour les migrations si possible.
- [ ] BDD **non exposée publiquement** (réseau privé ou IP allowlist), connexion SSL (`?sslmode=require`).
- [ ] Relations avec `onDelete: Cascade` pour les données liées à l'utilisateur (tokens, sessions…).
- [ ] Purge périodique des tokens expirés (cron).
- [ ] **Sauvegardes** automatiques + test de restauration au moins une fois.

### 23. Rate limit sur les routes métier

- [ ] Limite globale par utilisateur/IP sur les routes d'écriture (anti-spam, remplissage de la base).
- [ ] Limiter la taille des payloads et la pagination (`take` max côté serveur).

### 24. Upload de fichiers (si applicable)

- [ ] Vérifier type MIME **et** contenu (magic bytes), taille max, renommer le fichier (UUID).
- [ ] Stocker hors du serveur applicatif (S3/R2/Cloudinary), jamais exécutable.

---

## ⚪ P3 — Hygiène et conformité

### 25. Dépendances

- [ ] `.github/dependabot.yml` activé dès la création du repo.
- [ ] `npm audit --omit=dev` régulier ; ne pas lancer `audit fix --force` sans lire (rétrogradations possibles).
- [ ] Lockfile commité, `npm ci` en CI.

### 26. 2FA (optionnel mais apprécié)

- [ ] TOTP (appli d'authentification) ou passkeys (WebAuthn) pour les comptes sensibles / admin.
- [ ] Codes de secours à usage unique, stockés hachés.

### 27. RGPD

- [ ] Ne collecter que le nécessaire ; politique de confidentialité.
- [ ] Permettre l'**export** et la **suppression** du compte et de toutes ses données.
- [ ] Durée de conservation des logs définie.

### 28. Code

- [ ] Une seule fonction pour chaque préoccupation sécurité (`getUserIdFromRequest`, `getClientIp`, `hashToken`) → pas de copie divergente dans chaque route.
- [ ] Réponses API cohérentes (`NextResponse.json({ message })` partout).
- [ ] Générer les tokens **après** la validation, uniquement si nécessaires.
- [ ] Tests automatisés sur les cas d'auth : mauvais mot de passe, token expiré, token réutilisé, accès à la ressource d'un autre utilisateur.

---

## Récapitulatif express (à cocher avant chaque mise en prod)

| Priorité | Point                                                              |
| -------- | ------------------------------------------------------------------ |
| 🔴       | Mots de passe argon2id / bcrypt ≥ 12, borne 72 octets              |
| 🔴       | Filtre `userId` (issu du token) sur toutes les requêtes            |
| 🔴       | Zod côté serveur sur toutes les entrées, avec bornes               |
| 🔴       | Pas de SQL brut concaténé                                          |
| 🔴       | Secrets hors git, rien de secret en `*_PUBLIC_*`                   |
| 🔴       | JWT courts + révocation (`tokenVersion`)                           |
| 🔴       | Token en cookie HttpOnly (web) / SecureStore (mobile)              |
| 🔴       | Token de reset : aléatoire, haché, expirant, usage unique atomique |
| 🔴       | HTTPS partout                                                      |
| 🟠       | Rate limit IP **et** email, préfixes distincts, IP fiable          |
| 🟠       | Anti-énumération : message, statut **et** timing identiques        |
| 🟠       | Vérification d'email                                               |
| 🟠       | Emails normalisés (`trim().toLowerCase()`)                         |
| 🟠       | Mot de passe ≥ 12, pas de règles de composition, liste noire       |
| 🟠       | Ré-authentification pour les opérations sensibles                  |
| 🟠       | Aucun email/IP/token dans les logs                                 |
| 🟠       | Erreurs génériques, pas de stack trace au client                   |
| 🟡       | En-têtes HTTP (CSP, HSTS, X-Frame-Options, nosniff)                |
| 🟡       | CSRF / CORS selon le mode d'auth                                   |
| 🟡       | Utilisateur BDD à droits minimaux, BDD privée, backups             |
| ⚪       | Dependabot, RGPD (export/suppression), tests d'auth                |
