# Revue pédagogique — Backend (API Next.js 16 + Prisma 6 + PostgreSQL)

> Périmètre : `backend/chronoapp/` (12 routes API, `lib/`, schéma Prisma, pages web `/reset`, `/delete-user`, `/privacy`) · Date : 2026-10-27 · Contexte : 2ᵉ revue, avant publication Play Store. Revue précédente : [`archive/2026-10-04/reviewBackend.md`](archive/2026-10-04/reviewBackend.md).

## Vue d'ensemble

| Domaine | Note | Commentaire court |
| --- | --- | --- |
| Codes HTTP (201/204/404/409) | 🟢 | Corrigé depuis la revue précédente : vrais 201/204, `count === 0` → 404 |
| Gestion d'erreurs (`try`, Prisma) | 🟠 | Bon partout **sauf** `DELETE /api/user` (body et Upstash hors `try`) |
| Atomicité | 🔴 | `POST /timerrunner` est transactionnel ✅, mais le reset de séance ne l'est toujours pas, et il est **cassé** depuis le passage au 404 |
| Confiance au client (dates) | 🟠 | Borne basse posée ; **aucune borne haute** → durées négatives encore possibles |
| Règles métier | 🟠 | `POST /timerrunner` complet ✅ ; `POST /timerpause` et `PATCH /seance` encore permissifs |
| Modèle de données | 🟠 | `@@unique([seanceId, numberRunner])` ✅ ; index et relations `userId` toujours absents (BACK-08) |
| Tests backend | 🟢 | 105 tests Vitest, tous verts — énorme progrès (0 il y a 3 semaines) |

---

## ✅ Ce qui est bien fait

1. **`POST /api/timerrunner` en transaction interactive** (`app/api/timerrunner/route.ts:71-124`) : lecture de la séance, contrôles métier, agrégat des pauses et `create` dans le même `$transaction`. Les erreurs métier passent par un `HttpError` levé dans la transaction puis converti en réponse dans le `catch` : c'est le bon patron (le `throw` fait aussi le rollback).
2. **Règles métier différenciées** (`timerrunner/route.ts:80-100`) : 404 si séance absente, 409 si terminée, 409 si chrono non actif ou en pause, 409 sur `P2002` (coureur déjà enregistré). C'est exactement la grille 404 / 409 / 500 travaillée en V-03.
3. **Contrainte d'unicité en base** (`schema.prisma:66`, migration `20261006…`) : le doublon de coureur est désormais impossible même avec deux requêtes simultanées — la base est la dernière ligne de défense, pas le client.
4. **Vrais codes 201 / 204** partout (`new NextResponse(null, { status: 204 })`, `NextResponse.json(x, { status: 201 })`) : le piège `json({ status })` a disparu.
5. **Rate limit fail-closed** sur toutes les routes d'écriture (sauf une, voir 1.2) : `try { limit } catch { 503 }` (`seance/route.ts:50-67`). Le service tiers en panne ne laisse plus passer les requêtes.
6. **Reset password robuste** (`passwordresettoken/route.ts:156-171`) : `updateMany` conditionnel (`usedAt: null`, `expiresAt > now`) + `count === 0` → rejet, puis `tokenVersion: { increment: 1 }` dans la même transaction. C'est une protection contre la double utilisation du lien en concurrence, niveau professionnel.
7. **Suppression de compte avec ré-authentification** (`user/route.ts`) : mot de passe exigé côté mobile, email + mot de passe côté web.
8. **Ownership partout** : chaque `where` contient `userId` (y compris `findUnique({ where: { id, userId } })`).
9. **`lib/env.ts`** : validation Zod des variables d'environnement, avec messages clairs.

---

## 🔴 Priorité 1 — Bugs réels

### 1.1 Le reset d'une séance échoue dès qu'il n'y a pas de pause (régression)

```ts
// app/api/timerpause/[id]/route.ts:117-126
const { count } = await prisma.timerPause.deleteMany({
  where: { seanceId: id, userId: userId },
});
if (count === 0) {
  return NextResponse.json({ message: "Pauses introuvables" }, { status: 404 });
}
// même logique dans app/api/timerrunner/byseance/[id]/route.ts:25-30
```

```ts
// frontend/chronoapp/app/run/[id].tsx:213-215 — enchaîné par le client
await deleteTimerPause(seanceGet.id);      // 404 si aucune pause
await deleteAllTimerRunner(seanceGet.id);  // 404 si aucun coureur
await patchSeance(safePatch.data, seanceGet.id);
```

**Mécanisme** : en corrigeant BACK-07 (« 404 manquants »), `count === 0` est devenu un 404. Or pour ces deux routes, « rien à supprimer » est un cas **normal** du reset. `apiFetch` lève un `HttpError` sur tout statut non-2xx.

**Scénario concret** : l'utilisateur lance le chrono, ne fait aucune pause, appuie sur reset → écran « Oups… Pauses introuvables ». Le chrono local est déjà arrêté (`clearInterval` ligne 196), mais la séance reste `InProgress` en base avec son `startedAt`. Même chose s'il a fait une pause mais n'a enregistré aucun coureur (2ᵉ appel en 404). Le test backend `renvoie 404 - Aucun timerPause` fige ce comportement, et le test front du reset ne peut pas le voir (voir `reviewTestingLibrary.md` §1.1).

**Correction** — c'est le moment de faire **BACK-04** (#81), qui règle le bug ET l'atomicité :

```ts
// app/api/seance/[id]/reset/route.ts
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  try {
    const seance = await prisma.$transaction(async (tx) => {
      const found = await tx.seance.findUnique({ where: { id, userId }, select: { state: true } });
      if (!found) throw new HttpError(404, "Séance introuvable");
      if (found.state === "Finish") throw new HttpError(409, "Séance terminée");

      await tx.timerPause.deleteMany({ where: { seanceId: id, userId } });   // 0 ligne = OK
      await tx.timerRunner.deleteMany({ where: { seanceId: id, userId } });  // 0 ligne = OK
      return tx.seance.update({ where: { id, userId }, data: { startedAt: null, state: "NoStart" } });
    });
    return NextResponse.json(seance, { status: 200 });
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ message: err.message }, { status: err.status });
    console.error("Erreur POST API/SEANCE/RESET", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
```

Côté client, `handleReset` n'appelle plus qu'**un** endpoint (même PR — changement de contrat). Les deux `DELETE` « en masse » peuvent alors être supprimés ou, s'ils restent, renvoyer **204 même quand `count === 0`** (un `DELETE` est idempotent : supprimer « tout » quand il n'y a rien n'est pas une erreur).

> 🎓 **Concept** : un 404 signifie « la **ressource** visée n'existe pas ». Sur une route qui vise une **collection** (« toutes les pauses de la séance X »), la bonne question est « la séance X existe-t-elle et m'appartient-elle ? », pas « y avait-il des lignes à supprimer ? ». Et : **une action utilisateur = une requête = une transaction** (V-02). Trois appels enchaînés par le client, c'est trois occasions de laisser la base à moitié modifiée.

### 1.2 `DELETE /api/user` : body et rate limit hors `try` → 500 brut

```ts
// app/api/user/route.ts:21
const body = await req.json();            // pas de .catch()
// :42 et :113-114
const IpCheck = await userRateLimitIpMobil.limit(ip);   // pas de try/catch
```

**Vérifié par un test temporaire** (écrit puis supprimé) : un body non-JSON et un Upstash indisponible font tous deux **rejeter** le handler. Next répond alors une 500 générique, sans message JSON, et le cas n'est pas journalisé proprement.

C'est la seule route qui a échappé à SEC-06 (fail-closed) et au patron `req.json().catch(() => null)` que tu appliques partout ailleurs.

```ts
const body = await req.json().catch(() => null);
// …
try {
  const ipCheck = await userRateLimitIpMobil.limit(ip);
  if (!ipCheck.success) return NextResponse.json({ message: "Trop de tentatives…" }, { status: 429 });
} catch {
  return NextResponse.json({ message: "Service temporairement indisponible" }, { status: 503 });
}
```

### 1.3 `DELETE /api/user` : un token expiré tombe dans la branche « web »

```ts
// app/api/user/route.ts:19-23 et :94-95
const userId = await getUserIdFromRequest(req);
if (userId) { /* branche mobile : { password } */ }
else { const safeValue = DeleteControlUserEmailPasswordSchema.safeParse(body); /* exige email */ }
```

**Scénario** : l'utilisateur mobile a un token expiré (7 jours) ou révoqué (reset password ailleurs), il veut supprimer son compte → le serveur ne voit pas de `userId`, passe en mode web, ne trouve pas d'`email` → **400 « Format non conforme »**. Le client ne reçoit pas de 401, donc pas de déconnexion automatique : message incompréhensible.

**Correction** : décider du mode selon la **présence** du header, pas selon sa validité.

```ts
const hasBearer = req.headers.get("authorization")?.startsWith("Bearer ");
if (hasBearer) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  // … branche mobile
} else {
  // … branche web
}
```

Mieux encore : deux handlers séparés (`DELETE /api/user` authentifié, `POST /api/account/delete` pour la page web). Deux contrats différents = deux routes. L'énumération de comptes dans la branche web est traitée dans `reviewSecurity.md` §1.1.

---

## 🟠 Priorité 2 — Logique métier et modèle

### 2.1 BACK-05 fermée mais critère non atteint : durées négatives encore possibles

```ts
// lib/schema/seanceSchema.ts:13-16
startedAt: z.coerce.date().refine((d) => d.getTime() >= Date.now() - ONE_HOUR_MS).nullable(),
// lib/schema/timerPauseSchema.ts:14-16
export const TimerPauseSchemaUpdate = z.object({ endedAt: z.coerce.date() });   // aucune borne
```

Seule la borne **basse** existe. Deux scénarios donnent encore une `duration` négative (critère de fin de #82) :

- `PATCH /seance/:id` avec `startedAt` = demain → tout coureur enregistré aujourd'hui a `endedAt - startedAt < 0` ;
- `PATCH /timerpause/:id` avec `endedAt` = dans 10 h → `pauseDurationMs` énorme → `chrono - somPauses < 0` au coureur suivant.

`POST /timerrunner` ne vérifie pas non plus `endedAt >= startedAt`.

```ts
// lib/schema/dates.ts — une seule définition réutilisée partout
const ONE_HOUR_MS = 60 * 60 * 1000;
const CLOCK_SKEW_MS = 60 * 1000;
export const recentDate = z.coerce.date().refine(
  (d) => d.getTime() >= Date.now() - ONE_HOUR_MS && d.getTime() <= Date.now() + CLOCK_SKEW_MS,
  { message: "Date hors de la fenêtre autorisée" },
);
```

et dans `timerrunner/route.ts`, avant le `create` : `if (result < 0) throw new HttpError(409, "Durée incohérente")`.

> 🎓 **Concept** (V-05) : une borne de validation a **deux côtés**. Se demander systématiquement « quelle est la valeur minimale ? **et** maximale ? » — pour un nombre, une date, une longueur de chaîne. L'alternative la plus sûre reste que le serveur pose `new Date()` lui-même.

### 2.2 `POST /api/timerpause` : règles manquantes et mauvais codes

```ts
// app/api/timerpause/route.ts:61-89
const controleSeance = await prisma.seance.findUnique({ where: { id, userId } });
if (controleSeance?.startedAt) { /* … create */ }
else { return NextResponse.json({ message: "Le chronomètre n'est pas lancé…" }, { status: 403 }); }
```

| Cas | Comportement actuel | Attendu |
| --- | --- | --- |
| Séance inexistante / d'un autre utilisateur | 403 « chrono pas lancé » | **404** |
| Chrono non lancé | 403 | **409** (403 = « tu n'as pas le droit », pas « état incompatible ») |
| Séance `Finish` | pause créée | **409** |
| Une pause déjà ouverte (`endedAt: null`) | 2ᵉ pause créée | **409** |

Le cas « deux pauses ouvertes » arrive vraiment avec un double tap sur pause (voir `reviewFrontend.md` §1.2) et fausse ensuite le calcul. Reprends la structure de `POST /timerrunner` : transaction + `HttpError` + `tx.timerPause.findFirst({ where: { seanceId, endedAt: null } })`.

### 2.3 `PATCH /api/seance/[id]` : aucune transition d'état contrôlée

`SeanceUpdateSchema.partial()` accepte n'importe quel passage : `Finish → NoStart`, `InProgress` avec `startedAt: null`, ou un nouveau `startedAt` alors que des coureurs sont déjà enregistrés (leurs durées deviennent fausses). Le double tap sur « play » envoie justement deux `PATCH` avec deux `startedAt` différents (`reviewFrontend.md` §1.2).

Minimum : refuser toute modification d'une séance `Finish` (409) et refuser un `startedAt` si la séance est déjà `InProgress`. Idéalement, remplacer le `PATCH` générique par des actions explicites : `POST /seance/:id/start`, `/reset` (1.1), `/finish`.

> 🎓 **Concept** : un `PATCH` « libre » sur un champ `state` transforme le client en machine à états. La machine à états appartient au serveur : il connaît les transitions autorisées.

### 2.4 BACK-09 fermée mais pagination absente

```ts
// app/api/seance/route.ts:22-25
const response = await prisma.seance.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
```

Le tri est là, la borne (`take`) non — critère « liste triée **et bornée** » de #86. Ajoute `take: 50` (ou une pagination par curseur `?cursor=`), et un `select` qui ne renvoie que ce que la liste affiche.

### 2.5 Modèle Prisma (BACK-08, #85, toujours ouverte)

`TimerRunner.userId` et `TimerPause.userId` sont des `String` sans relation ni index, alors que toutes les requêtes filtrent dessus. Rien à ajouter au détail de la revue précédente ([archive §2.4](archive/2026-10-04/reviewBackend.md)).

### 2.6 `lib/env.ts` n'est chargé que par `lib/auth.ts` (SEC-05 partielle)

```ts
// app/api/auth/login/route.ts:76      process.env.JWT_SECRET!
// lib/mail.ts:4 et :7                 process.env.RESEND_TOKEN, process.env.APP_URL
```

`login`, `register` et `passwordresettoken` n'importent pas `lib/auth.ts` → la validation ne s'exécute pas sur ces routes. Une variable manquante donne toujours une erreur obscure, ce que SEC-05 voulait éviter. Remplace chaque `process.env.X` par `env.X` (le simple import déclenche la validation), et passe `APP_URL` en `z.string().url()`.

---

## 🟡 Priorité 3 — Qualité

| Fichier | Point | Correction |
| --- | --- | --- |
| `timerrunner/route.ts:14-21` vs `lib/errors.ts` | Deux classes `HttpError` différentes dans le backend | Une seule `lib/httpError.ts` côté serveur ; `lib/errors.ts` (copie du front) sert aux formulaires web |
| `seance/route.ts:29,97,125`, `seance/[id]/route.ts:71`, `timerrunner/[id]/route.ts:67`, `timerrunner/byseance/[id]/route.ts:34` | `console.error({ err }, { status: 500 })` (6 occurrences) | `console.error("Erreur GET API/SEANCE", err)` |
| `timerrunner/[id]/route.ts:62` | Message « Séance introuvable » pour un coureur | « Coureur introuvable » |
| `timerpause/[id]/route.ts:26,130` | Logs « POST » dans un GET / DELETE | Corriger le libellé |
| `timerpause/[id]/route.ts:91-97` | P2025 (pause déjà terminée) → 404 | 409 « Pause déjà terminée » |
| `seance/route.ts:116-121` | `DELETE /seance` → 404 si l'historique est vide | 204 (idempotent) — l'utilisateur voit « Séances introuvables » en vidant une liste vide |
| `register/route.ts:55-69` | `findUnique` puis `create` : deux inscriptions simultanées → `P2002` → 500 | Attraper `P2002` → 409 (et hacher **après** le contrôle d'existence) |
| `login/route.ts:37` | Rate limit sur `value.email.trim().toLowerCase()` (donnée brute) | `safeValue.data.email` (déjà normalisé par Zod) |
| `lib/schema/deleteSchema.ts` / `deleteUserSchema.ts` | Deux schémas quasi identiques | Garder `DeleteControlUserEmailPasswordSchema`, le réutiliser dans le formulaire web |
| `app/error.tsx:10-13` | « Impossible de charger la page de connexion » sur toutes les pages ; `error: React.ReactNode` | Message générique ; `error: Error & { digest?: string }` |
| `app/component/paswwordReset.tsx` | Faute dans le nom ; `setState` synchrone dans l'effet (erreur ESLint) | `useSyncExternalStore` ou lecture du hash dans un état initial paresseux `useState(() => …)` côté client |
| `app/privacy/page.tsx` | 23 erreurs ESLint `react/no-unescaped-entities` | `&apos;` / `’` typographique |
| `backend/chronoapp/.expo/`, `/.expo/`, `frontend/.expo/` | Dossiers Expo suivis par git (et `.expo/cache/` non suivi dans le backend) | Les retirer (`git rm -r --cached`) et ajouter `.expo/` au `.gitignore` racine |

`npx eslint .` : **27 erreurs, 8 warnings** (23 dans `privacy/page.tsx`, 1 dans `paswwordReset.tsx`, 3 `any` dans les tests). `tsc --noEmit` : 0 erreur.

---

## 📋 Plan d'action backend

1. [ ] **Endpoint `POST /seance/:id/reset` transactionnel** (BACK-04) + appel unique côté client — **même PR** que `run/[id].tsx` (règle 1.1)
2. [ ] `DELETE /api/user` : `req.json().catch`, rate limit dans `try`, 401 si Bearer invalide (1.2, 1.3) + réponse uniforme web (`reviewSecurity.md` §1.1)
3. [ ] Bornes hautes sur toutes les dates + refus d'une `duration < 0` (2.1) — rouvrir #82 ou nouvelle issue
4. [ ] Règles de `POST /timerpause` (404/409, pause ouverte unique) en transaction (2.2)
5. [ ] Transitions d'état de séance contrôlées côté serveur (2.3)
6. [ ] `take` sur `GET /seance` (2.4), `env.X` partout (2.6)
7. [ ] BACK-08 (index + relations), puis la passe qualité (tableau 🟡)

> 💡 Exercice TDD aligné sur ton niveau : écris d'abord dans `test/_route_seanceReset.test.ts` le test « 200 quand la séance n'a ni pause ni coureur » (rouge : la route n'existe pas), puis « 409 si `Finish` », puis implémente. Tu as déjà tout l'outillage (`prismaMock`, `$transaction.mockImplementation`).
