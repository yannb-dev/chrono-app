# Revue pédagogique — Backend (Next.js API + Prisma)

> Périmètre : `backend/chronoapp/` — 12 route handlers, `lib/`, schéma Prisma, config Next.
> Date : 2026-10-03 · Contexte : pré-déploiement (Play Store côté mobile, API sur Vercel/Railway).

---

## Vue d'ensemble

| Domaine | Note | Commentaire court |
| --- | --- | --- |
| Structure / découpage | 🟢 | `lib/` (auth, prisma, rateLimit, schema) bien séparé des routes |
| Validation (Zod) | 🟢 | `safeParse` partout, `req.json().catch(() => null)` systématique |
| Ownership (IDOR) | 🟢 | `userId` dans **chaque** `where` — c'est le point le plus important et il est acquis |
| Codes HTTP | 🔴 | `NextResponse.json({ status: 204 })` → renvoie en réalité un **200** |
| Gestion d'erreurs | 🟠 | Bonne détection P2025, mais requêtes Prisma hors `try` dans 2 routes |
| Logique métier | 🟠 | Reset de séance non atomique (3 requêtes côté client), timestamps fournis par le client |
| Modèle de données | 🟠 | `userId` sans relation sur `TimerRunner`/`TimerPause`, pas d'index, pas de contrainte d'unicité |
| Tests | 🔴 | Aucun test backend |

---

## ✅ Ce qui est bien fait (à garder comme référence)

1. **Pattern de route homogène** : auth → params → validation → `try { prisma } catch { P2025 → 404, sinon 500 }`. Toutes les routes se lisent pareil, c'est exactement ce qu'on attend en entreprise.
2. **Ownership dans la requête elle-même** (`where: { id, userId }`) plutôt qu'un `findUnique` puis un `if (seance.userId !== userId)`. Une seule requête, impossible d'oublier le contrôle.
3. **`lib/auth.ts`** : vérification JWT + `tokenVersion` en base → les tokens sont révocables (changement de mot de passe = déconnexion de tous les appareils). C'est un niveau au-dessus de la plupart des projets junior.
4. **Reset password** (`passwordresettoken/route.ts`) : token aléatoire 32 octets, **seul le hash SHA-256 est stocké**, expiration 30 min, `updateMany` conditionnel dans une `$transaction` pour éviter la double utilisation (race condition). Envoi du mail dans `after()` pour ne pas bloquer la réponse. Très propre.
5. **Login** : hash factice quand l'utilisateur n'existe pas (`login/route.ts:46`) → temps de réponse identique, pas d'énumération par timing.
6. **Singleton Prisma** (`lib/prisma.ts`) pour éviter l'épuisement de connexions en dev avec le hot-reload.

---

## 🔴 Priorité 1 — Bugs réels

### 1.1 Les réponses « 201 » et « 204 » sont en réalité des 200

```ts
// seance/route.ts:82, timerpause/[id]/route.ts:114, timerrunner/[id]/route.ts:53,
// timerrunner/byseance/[id]/route.ts:26, user/route.ts:18
return NextResponse.json({ status: 204 });

// register/route.ts:57
if (user) return NextResponse.json({ status: 201 });
```

`NextResponse.json(body, init)` : le **premier** argument est le corps, le **second** les options. Ici `{ status: 204 }` est envoyé comme **body JSON** avec un code HTTP **200**.

```ts
// ✅ 204 = "No Content" → pas de corps du tout
return new NextResponse(null, { status: 204 });

// ✅ 201 avec corps
return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
```

> ⚠️ **Effet de bord côté mobile** : `apiFetch` fait `return response.json()` sans condition. Aujourd'hui ça « marche » *par accident* parce que le backend renvoie un JSON. Si tu corriges le backend seul, `response.json()` plantera sur un 204 vide. → Corriger les **deux** dans la même PR (voir `reviewFrontend.md` §1.1).

Bonus : dans `register/route.ts:57`, si `user` était falsy la fonction retournerait `undefined` → Next renvoie une erreur 500 générique. Un `create` Prisma retourne toujours l'objet ou throw, donc le `if` est inutile.

### 1.2 Requêtes Prisma en dehors du `try`

```ts
// timerpause/[id]/route.ts:55  et  timerrunner/route.ts:25-53
const searchPausedAt = await prisma.timerPause.findUnique(...) // ← hors try
try { ... }
```

Si la base est indisponible, l'exception remonte sans passer par ton `catch` → réponse 500 HTML de Next, pas ton `{ message: "Erreur serveur" }`, et pas de log contextualisé. **Règle** : tout `await prisma.*` doit être dans le `try`.

### 1.3 `GET /api/timerrunner/[id]` renvoie `null` en 200

```ts
// timerrunner/[id]/route.ts:26
return NextResponse.json(timerSessionSearch, { status: 200 }); // peut être null
```

Ajoute le même `if (!x) return 404` que dans `seance/[id]`. (C'est exactement le gap « 404 vs 500 » noté dans ton profil — tu le fais bien ailleurs, il manque ici.)

### 1.4 Code mort : `P2025` sur `deleteMany`

`deleteMany` ne lève **jamais** P2025 : il renvoie `{ count: 0 }`. Les blocs `if (err.code === "P2025")` dans `seance/route.ts:84`, `timerpause/[id]/route.ts:116`, `timerrunner/byseance/[id]/route.ts:28` ne s'exécutent jamais. Si tu veux un 404 :

```ts
const { count } = await prisma.timerPause.deleteMany({ where: { seanceId: id, userId } });
if (count === 0) return NextResponse.json({ message: "Aucune pause" }, { status: 404 });
```

(P2025 n'existe que pour `update`, `delete`, `findUniqueOrThrow`… les opérations sur **un** enregistrement.)

---

## 🟠 Priorité 2 — Logique métier et modèle

### 2.1 Le reset d'une séance n'est pas atomique

Côté mobile (`run/[id].tsx:226-228`) tu enchaînes 3 appels : `DELETE timerpause` → `DELETE timerrunner/byseance` → `PATCH seance`. Si le 2ᵉ échoue (réseau), la séance est dans un état incohérent (pauses supprimées, coureurs toujours là, chrono toujours « InProgress »).

**C'est un cas d'école pour `$transaction`**, que tu maîtrises déjà :

```ts
// app/api/seance/[id]/reset/route.ts
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  try {
    const seance = await prisma.$transaction(async (tx) => {
      await tx.timerPause.deleteMany({ where: { seanceId: id, userId } });
      await tx.timerRunner.deleteMany({ where: { seanceId: id, userId } });
      return tx.seance.update({
        where: { id, userId },
        data: { startedAt: null, state: "NoStart" },
      });
    });
    return NextResponse.json(seance);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ message: "Séance introuvable" }, { status: 404 });
    }
    console.error("Erreur POST API/SEANCE/RESET", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
```

> 🎓 **Concept** : une action utilisateur = un endpoint = une transaction. Le client ne doit pas orchestrer la cohérence de la base.

### 2.2 Le serveur fait confiance aux dates du client

`startedAt`, `pausedAt`, `endedAt` viennent du téléphone (`z.coerce.date()`). Conséquences possibles :
- horloge du téléphone décalée → durées fausses ;
- `endedAt < pausedAt` → `pauseDurationMs` **négatif** (`timerpause/[id]/route.ts:68`) ;
- `PATCH` d'une pause déjà terminée → elle est recalculée.

Deux options pédagogiques :
- **Simple** : le serveur pose lui-même `new Date()` (le client envoie juste l'intention « pause » / « reprise »). Le chrono devient la vérité serveur.
- **Garde-fous** si tu gardes l'heure client : `.refine(d => Math.abs(d.getTime() - Date.now()) < 60_000)` + vérifier `endedAt > pausedAt` + `where: { id, userId, endedAt: null }` dans le PATCH.

### 2.3 `POST /api/timerrunner` — règles manquantes

```ts
// timerrunner/route.ts
```
- `numberRunner` n'est pas borné côté serveur (`z.number().int()`) : on peut enregistrer le coureur n°999 sur une séance de 10.
- Rien n'empêche d'enregistrer **deux fois le même coureur** (double tap sur le bouton → 2 POST). Ajoute une contrainte en base :
  ```prisma
  model TimerRunner {
    // ...
    @@unique([seanceId, numberRunner])
  }
  ```
  puis gère `P2002` (violation d'unicité) → `409 Conflict`.
- Une séance `Finish` accepte encore des coureurs.
- « Le chronomètre n'est pas actif » renvoie **404**, alors que la ressource existe. Le bon code est **409 Conflict** (état incompatible) ou **422**.

### 2.4 Modèle Prisma

```prisma
model TimerRunner {
  userId String          // ← simple String, pas de relation
  seance Seance @relation(...)
}
```
- `userId` n'est pas une clé étrangère : la base n'empêche pas une valeur incohérente. Soit tu ajoutes la relation `user User @relation(...)`, soit tu considères que l'ownership passe par `seance.userId` et tu supprimes la colonne (dénormalisation à justifier).
- **Index** : toutes tes requêtes filtrent par `userId` et/ou `seanceId`. Postgres n'indexe pas automatiquement les FK :
  ```prisma
  @@index([userId])          // Seance
  @@index([seanceId])        // TimerRunner, TimerPause
  ```
- Mélange de conventions : `timerRunners` vs `timerpauses`, `colorRunner` vs `pauseDurationMs`. Choisis camelCase partout (`timerPauses`). Un `prisma format` réindente aussi les modèles `Seance`/`TimerRunner`.
- Les `PasswordResetToken` expirés ne sont jamais purgés (voir `../security/securityPlus.md` §14).

### 2.5 Incohérence REST sur `/api/timerpause/[id]`

| Méthode | `[id]` désigne… |
| --- | --- |
| `GET` | l'id de la **séance** |
| `PATCH` | l'id de la **pause** |
| `DELETE` | l'id de la **séance** |

Même URL, deux sens différents → source de bugs. Tu as déjà le bon modèle avec `/timerrunner/byseance/[id]` : fais pareil (`/timerpause/byseance/[id]`) ou mieux, imbrique : `/api/seance/[id]/pauses`.

### 2.6 Cohérence front/back des limites

`SeanceSchema.totalRunner` : `max(40)` côté back, `max(20)` côté front. Pas grave (le back est plus permissif), mais une seule source de vérité serait mieux. Piste d'apprentissage : un dossier `shared/schema` importé par les deux projets.

---

## 🟡 Priorité 3 — Qualité de code

| Fichier | Point | Correction |
| --- | --- | --- |
| `seance/route.ts:23,63,92` etc. | `console.error({ err }, { status: 500 })` — le 2ᵉ argument n'a pas de sens ici | `console.error("Erreur GET API/SEANCE", err)` |
| `timerpause/[id]/route.ts:27,125` | Message « Erreur du POST » dans un GET/DELETE | Copier-coller : renomme |
| `seance/[id]/route.ts:90` | Schéma `patchSchema` recréé à chaque requête | Le déclarer dans `lib/schema/seanceSchema.ts` |
| `seance/[id]/route.ts:92` | « Au moins un cham » | typo |
| `seance/[id]/route.ts:64` & co | Mélange `Response.json` / `NextResponse.json` | Un seul des deux (`NextResponse`) |
| `user/route.ts:14`, `timerpause/[id]/route.ts:110` | Variables `userDelete`, `timerPause` non utilisées | Supprimer (ESLint te le signale) |
| `login/route.ts:28` | `.trim().toLowerCase()` déjà fait par Zod | Redondant |
| `passwordresettoken/route.ts:132` | `new Date(searchPasswordResetToken?.expiresAt)` — c'est déjà une `Date`, et le `?.` est inutile après le `if` | `if (searchPasswordResetToken.expiresAt < new Date())` |
| `passwordresettoken/route.ts:117-139` | 3 `if` qui renvoient le même message | Fusionner en un seul `if (!t \|\| t.usedAt \|\| t.expiresAt < now)` |
| `app/error.tsx:7` | `error: React.ReactNode` | `error: Error & { digest?: string }` |
| `app/page.tsx:34` | `height={1800}` | `180` |
| `app/page.tsx:7` | `type token` en minuscule | Convention : `type Token` |
| `package.json` | `eslint-config-next` 16.2.12 vs `next` ^16.3.5 | Aligner (Dependabot les groupe maintenant) |

### Refactor suggéré : un helper pour l'auth

Les 4 lignes `getUserIdFromRequest` + `if (!userId) return 401` sont répétées **15 fois**. Un petit wrapper :

```ts
// lib/withAuth.ts
type Handler<P> = (req: Request, ctx: { params: Promise<P> }, userId: string) => Promise<Response>;

export function withAuth<P>(handler: Handler<P>) {
  return async (req: Request, ctx: { params: Promise<P> }) => {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    return handler(req, ctx, userId);
  };
}

// usage
export const GET = withAuth<{ id: string }>(async (req, { params }, userId) => { ... });
```

> 🎓 **Concept** : fonction d'ordre supérieur (HOF) — même idée qu'un middleware Express.

---

## 🧪 Tests backend (absents)

Le frontend a 9 fichiers de tests, le backend **zéro**, alors que c'est lui qui porte les règles critiques (ownership, calcul des durées, reset password). Proposition (cohérente avec ta préférence TDD) :

1. **Vitest** + mock de `@/lib/prisma` (ou une base Postgres de test via Docker).
2. Appeler directement les handlers : `const res = await POST(new Request("http://x/api/seance", { method: "POST", headers: { authorization: "Bearer ..." }, body: JSON.stringify({...}) }))`.
3. Cas prioritaires :
   - sans token → 401 ;
   - séance d'un autre user → 404 (test d'IDOR) ;
   - `DELETE` → **204 sans body** (ce test aurait attrapé le bug §1.1) ;
   - `POST timerrunner` : durée = `endedAt - startedAt - Σpauses` ;
   - reset password : token expiré / déjà utilisé → 400.

---

## 📋 Plan d'action backend

1. [ ] Corriger 204/201 (**+ `apiFetch` côté mobile dans la même PR**)
2. [ ] Rentrer tous les `await prisma` dans les `try`
3. [ ] Endpoint `POST /api/seance/[id]/reset` en `$transaction`
4. [ ] `@@unique([seanceId, numberRunner])` + gestion P2002
5. [ ] `@@index` sur `userId` / `seanceId`
6. [ ] Validation des dates (ou heure serveur)
7. [ ] Harmoniser les routes `/timerpause`
8. [ ] Premiers tests Vitest sur les handlers
