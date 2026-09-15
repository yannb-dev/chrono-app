# Revue pédagogique — Chrono App (2026-09-14)

Revue ciblée, à la demande, sur deux axes uniquement : **Testing Library** (React Native Testing Library côté frontend) et **gestion d'erreur** (backend Next.js + frontend). Portée : le diff non commité actuel (tests ajoutés sur `login`/`register`/`list`/`result`/`run`/`BtnAndList`/`form`, `services/api.ts` réécrit avec `NetworkError`/`HttpError`, routes backend modifiées).

---

## 0. Suivi de `revue3.md`

| Point relevé en `revue3.md` | État au 2026-09-14 |
| --- | --- |
| 4.1 — Absence totale de tests | **Traité en profondeur** — 7 fichiers de test créés (`login`, `register`, `list`, `result`, `run`, `BtnAndList`, `form`), tous avec mocks de `@/services/api` et assertions sur `HttpError`/`NetworkError`. Bond en avant réel. |
| 4.2 — `apiFetch` indifférencié | **Traité** — `lib/errors.ts` distingue maintenant `NetworkError`/`HttpError`, timeout via `AbortController`, et un `401` déclenche déconnexion + redirection. Exactement le pattern suggéré. |
| 4.3 — Rate limiting | Toujours non traité (hors périmètre de cette revue, volontairement). |

Le travail sur les tests est réel et suit la bonne méthode (mock du service, pas du `fetch` brut). Mais **la vitesse d'écriture a créé une nouvelle classe de bugs** : des tests qui copient-collent un fichier voisin sans réadapter les valeurs attendues, et un bug fonctionnel bien réel qu'aucun de ces tests ne peut voir à cause de la façon dont le mock est posé. C'est le sujet de cette revue.

---

## 1. Bug le plus important — indépendant des tests, trouvé *parce que* les tests ne le voient pas

**`postRegister` et `postLogin` appellent tous les deux `/api/seance`, pas `/api/auth/register` ni `/api/auth/login`.**

```ts
// services/api.ts
export function postRegister(data: RegisterSchema) {
  return apiFetch<UserRegister>("/api/seance", {   // ❌ devrait être /api/auth/register
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function postLogin(data: LoginSchema) {
  return apiFetch<UserLogin>("/api/seance", {      // ❌ devrait être /api/auth/login
    method: "POST",
    body: JSON.stringify(data),
  });
}
```

C'est une erreur de copier-coller depuis `postSeance` (juste en dessous) : l'URL n'a pas été changée. Concrètement, en l'état actuel du code, **l'inscription et la connexion sont cassées en conditions réelles** : la route `/api/seance` attend `{ totalRunner, colorRunner }` (`SeanceSchema`), donc un appel avec `{ email, password }` échoue la validation Zod et renvoie un `400`. `register.tsx`/`login.tsx` afficheraient alors "Erreur de soumission" au lieu de créer un compte ou de se connecter.

**Pourquoi les 6 tests `Register.test.tsx`/`Login.test.tsx` ne l'ont pas vu** : les deux fichiers font

```ts
jest.mock("@/services/api", () => ({
  postRegister: jest.fn(),
}));
```

Le mock remplace entièrement `postRegister` par une fonction bidon — son implémentation réelle (donc l'URL en dur) n'est jamais exécutée. C'est normal et voulu pour un test de composant (on veut isoler l'UI du réseau), mais ça veut dire que **rien, dans la suite de tests actuelle, ne vérifie que `postRegister` appelle la bonne route**. C'est un angle mort structurel des tests de composants avec mock de service : ils prouvent que le composant réagit bien à un succès/échec, jamais que le service appelle la bonne URL avec le bon payload.

**Comment un test l'aurait quand même attrapé** : un test du fichier `services/api.ts` lui-même, sans mock du module (seulement de `fetch` global), du type :

```ts
// services/api.test.ts
global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({}) });

it("postRegister appelle /api/auth/register", async () => {
  await postRegister({ email: "a@a.com", password: "Password1!", confirmPassword: "Password1!" });
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/api/auth/register"),
    expect.anything(),
  );
});
```

C'est précisément le niveau 2 de la priorisation proposée dans `revue3.md` (« fonctions pures d'abord, routes API ensuite ») — sauf qu'ici il s'agit du client HTTP frontend, pas des routes backend. Le principe est identique : un mock de module masque tout bug interne à ce module. Retenir la règle : **le fichier qui contient l'URL en dur doit avoir son propre test, jamais seulement être mocké par les autres.**

---

## 2. Testing Library — assertion qui ne peut jamais échouer

**`app/run/[id].test.tsx`, test 3 :**

```tsx
fireEvent.press(await screen.findByText("Réessayer"));
expect(screen.queryByText("Oups une erreur !")).toBeNull();
```

Le composant réellement testé ici est `run/[id].tsx`, qui affiche :

```tsx
// run/[id].tsx:281
<Text style={styles.text}>Oups, une erreur !</Text>   // avec une virgule
```

Le test cherche `"Oups une erreur !"` **sans virgule**. `queryByText` fait une correspondance exacte par défaut : cette chaîne ne matchera jamais, que le bandeau d'erreur soit affiché ou non. `expect(...).toBeNull()` sera donc **toujours vrai**, même si `setError(false)` n'est jamais appelé et que le bandeau reste affiché. Le test est vert, mais il ne teste rien : c'est un faux positif silencieux.

Origine probable : ce fichier de test vient d'un copier-coller de `app/result/[id].test.tsx`, où le composant `Result` affiche lui `"Oups une erreur !"` **sans virgule** (`app/result/[id].tsx:71`) — là, la même assertion est correcte par coïncidence. En collant le test dans le dossier `run/`, le texte n'a pas été resynchronisé avec celui du composant `run/[id].tsx`.

**Le réflexe à prendre** : après un copier-coller de fichier de test, rechercher le texte affiché *dans le composant réellement testé* (pas se fier à la mémoire du fichier d'origine) — ou, mieux, centraliser ce genre de libellé dans une constante partagée (`ERROR_TITLE = "Oups, une erreur !"`) importée à la fois par le composant et par le test, pour qu'une divergence devienne une erreur TypeScript plutôt qu'un test silencieusement inutile. Au passage : ce même texte existe en 3 variantes dans le code (`"Oups, une erreur !"` avec virgule dans `login.tsx`/`register.tsx`/`run/[id].tsx`/`BtnAndList.tsx`, `"Oups une erreur !"` sans virgule dans `list.tsx`/`result/[id].tsx`/`form.tsx`) — l'incohérence elle-même est un signal qu'il manque une constante unique.

---

## 3. Testing Library — mock de module incomplet (fragile, pas encore un bug actif)

`app/run/[id].test.tsx` et `app/result/[id].test.tsx` importent 6 fonctions du service API mais n'en mockent que 2 :

```ts
import { getSeanceId } from "@/services/api";
import { patchSeance } from "@/services/api";
import { patchTimerPause } from "@/services/api";   // importé, jamais mocké
import { deleteTimerPause } from "@/services/api";  // importé, jamais mocké
import { postTimerPause } from "@/services/api";    // importé, jamais mocké
import { deleteAllTimerRunner } from "@/services/api"; // importé, jamais mocké

jest.mock("@/services/api", () => ({
  getSeanceId: jest.fn(),
  patchSeance: jest.fn(),
  // patchTimerPause, deleteTimerPause, postTimerPause, deleteAllTimerRunner : absents
}));
```

`jest.mock` avec une factory **remplace tout le module** : toute exportation non listée devient `undefined`. Aujourd'hui ça ne casse rien parce que les 3 tests de chaque fichier ne déclenchent que le chargement initial (`getSeanceId`) et la fermeture du bandeau d'erreur — jamais `handlePlay`/`handlePause`/`handleReset`, qui sont les seuls chemins de code appelant les 4 fonctions non mockées. Le jour où un test pressera le bouton Pause dans `run/[id].test.tsx`, `postTimerPause(...)` lèvera `TypeError: postTimerPause is not a function`, sans rapport apparent avec le vrai bug testé — un signal confus à déboguer pour ton futur toi.

Deux options pour éviter ce piège récurrent (utile pour les prochains fichiers de test, pas seulement ceux-ci) :
1. **Mocker uniquement ce qui est utilisé dans le test**, et supprimer les imports inutilisés — ici, les tests ne portent que sur `getSeanceId`, donc les 4 imports inutilisés sont du code mort (item 10 de `docs/review.md`) qu'il vaut mieux retirer.
2. Si le composant a vraiment besoin des 6 fonctions dans plusieurs tests futurs, partir d'un mock complet dès le départ avec `jest.requireActual` pour ne remplacer que ce qui est nécessaire :
   ```ts
   jest.mock("@/services/api", () => ({
     ...jest.requireActual("@/services/api"),
     getSeanceId: jest.fn(),
     patchSeance: jest.fn(),
     postTimerPause: jest.fn(),
     // ...
   }));
   ```

---

## 4. Testing Library — structure de fichier : `describe` dupliqué et titre trompeur

`app/result/[id].test.tsx` a un `describe` imbriqué identique à celui qui l'englobe :

```ts
describe("Result - affichage des erreurs", () => {
  afterEach(async () => { await cleanup(); });
  beforeEach(() => { jest.clearAllMocks(); });

  describe("Result - affichage des erreurs", () => {   // doublon exact du describe parent
    afterEach(async () => { await cleanup(); });
    beforeEach(() => { jest.clearAllMocks(); });
    // ... les 3 it() sont ici, dans le describe imbriqué
  });
});
```

Ça ne casse pas l'exécution (Jest exécute les `beforeEach`/`afterEach` en cascade, donc `cleanup()` et `clearAllMocks()` tournent juste deux fois pour rien), mais c'est un résidu de copier-coller qui rend le fichier plus dur à lire — à supprimer, un seul `describe` suffit.

Autre point dans le même fichier, test 3 : le titre dit *« affiche le chronomètre si onPress sur Play »*, mais le corps du test ne presse jamais de bouton "Play" et ne vérifie aucun affichage de chronomètre — il presse "Réessayer" et vérifie la disparition du bandeau d'erreur (variante du point 2 ci-dessus, mais correcte ici puisque `Result` affiche bien le texte sans virgule). C'est le même écueil que `docs/review.md` signale déjà pour `it.each` (item 11) : un titre de test qui ne correspond pas à ce qui est réellement vérifié perd toute sa valeur de documentation la prochaine fois qu'un test échoue et qu'il faut comprendre vite ce qui casse.

---

## 5. Backend — la lacune « 404 vs 500 » identifiée dans le profil se retrouve partout, telle quelle

Ton propre suivi de compétences la note déjà comme gap ouvert (« distinguer 404 (Prisma P2025) vs 500 »). Elle est maintenant visible concrètement sur plusieurs routes :

**a) Un `findUnique` qui ne trouve rien renvoie `200` avec un corps `null` — pas `404` :**

```ts
// app/api/seance/[id]/route.ts — GET
const seance = await prisma.seance.findUnique({
  where: { id: id, userId: userId },
  include: { timerRunners: true, timerpauses: true },
});

return NextResponse.json(seance, { status: 200 }); // même si seance === null
```

Si l'`id` n'existe pas, ou appartient à un autre utilisateur, `seance` vaut `null` et la réponse est quand même un `200 OK` avec le corps `null`. Côté client, `getSeanceId` (dans `services/api.ts`) ne lève alors **aucune erreur** (`response.ok` est vrai) — `result/[id].tsx`/`run/[id].tsx` reçoivent `data === null` et doivent le détecter eux-mêmes (`run/[id].tsx` le fait via `if (!data) { setError(true); return; }`, mais avec le message générique "Une erreur inattendue est survenue", pas "Séance introuvable"). Le bon réflexe :

```ts
if (!seance) {
  return NextResponse.json({ message: "Séance introuvable" }, { status: 404 });
}
return NextResponse.json(seance, { status: 200 });
```

**b) Un `delete`/`update` sur un id inexistant lève `P2025`, capturé par le `catch` générique en `500` :**

```ts
// app/api/seance/[id]/route.ts — DELETE
try {
  const deleteSeance = await prisma.seance.delete({
    where: { id: id, userId: userId },
  });
  return NextResponse.json(deleteSeance, { status: 200 });
} catch (err) {
  console.error({ err }, { status: 500 });
  return NextResponse.json({ message: "Erreur serveur" }, { status: 500 }); // ❌ P2025 devrait être 404
}
```

Même schéma dans `seance/[id]` PATCH et `timerpause/[id]` PATCH (`prisma.xxx.update`). Un `id` déjà supprimé, ou appartenant à un autre utilisateur, ressort actuellement comme "Erreur serveur" (500) — un message qui, côté frontend, laisse penser à un bug applicatif plutôt qu'à une ressource absente. Le correctif est mécanique et identique partout où Prisma peut lever ce code :

```ts
import { Prisma } from "@prisma/client";

catch (err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
    return NextResponse.json({ message: "Ressource introuvable" }, { status: 404 });
  }
  console.error("Erreur API", err);
  return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
}
```

C'est un seul pattern à répéter dans les `catch` de `seance/[id]` (DELETE, PATCH) et `timerpause/[id]` (PATCH) — bon candidat pour une petite fonction utilitaire partagée (`handlePrismaError(err)`) plutôt que dupliquée 3 fois, une fois le pattern compris.

---

## 6. Backend — `401` utilisé à la place de `400` pour des erreurs de validation Zod

Sur plusieurs routes, un échec `safeParse` (donc une erreur de **forme des données envoyées**, rien à voir avec l'authentification) renvoie `401` au lieu de `400` :

```ts
// app/api/timerrunner/route.ts — POST
if (!safeTimerRunner.success) {
  return NextResponse.json({ message: "Erreur de soumission" }, { status: 401 }); // ❌ 400 attendu
}
```

Même chose dans `seance/[id]` PATCH (`{ message: "Erreur de soumission" }, { status: 401 }`) et `timerpause/[id]` PATCH (`{ message: "Erreur de soumissions" }, { status: 401 }`). À comparer avec `seance/route.ts` POST et `auth/register/route.ts`, qui font ça correctement en `400`. C'est donc une incohérence *entre* routes, pas une règle mal comprise partout.

Pourquoi c'est plus qu'un détail cosmétique : le frontend distingue déjà `401` comme cas spécial dans `apiFetch` — **un `401` déclenche une déconnexion automatique** :

```ts
// services/api.ts
if (response.status === 401) {
  await SecureStore.deleteItemAsync("token");
  router.replace("/(auth)/login");
  throw new HttpError(401, { message: "Session expirée" });
}
```

Résultat concret : si un jour un payload malformé est envoyé vers `POST /api/timerrunner` (bug frontend, ou payload corrompu), l'utilisateur sera **déconnecté et renvoyé à l'écran de login**, alors que son token était parfaitement valide — un comportement très déroutant à déboguer, puisque rien dans les logs ne pointera vers "session expirée". Règle à fixer une fois pour toutes : `401` = "je ne sais pas qui tu es / ton token est invalide", `400` = "je sais qui tu es, mais ce que tu m'envoies est mal formé". Une erreur Zod n'est jamais un problème d'identité.

---

## 7. Frontend — timeout de `apiFetch` probablement trop court pour un usage réel

```ts
// services/api.ts
const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 seconde
```

`revue3.md` recommandait 8-10 secondes pour un usage mobile (réseau instable). Ici le timeout est de **1000 ms**, soit 1 seconde — probablement une valeur de test/debug oubliée plutôt qu'un choix définitif (aucun test actuel ne dépend de cette valeur précise, donc rien ne l'a signalé). Sur un réseau 4G moyen, une requête `POST /api/auth/login` qui met 1,2s à répondre serait annulée et traitée comme une coupure réseau, ce qui donnerait un message "Pas de connexion réseau" à un utilisateur pourtant bien connecté. À remonter à 8000-10000ms.

---

## Niveau évalué

Le travail sur les tests est un vrai step-up : la méthode (mock du service, pas de `fetch`), la couverture des cas `HttpError`/`NetworkError`, et le réflexe `waitFor`/`findByText` pour l'asynchrone sont acquis. Le point à travailler maintenant n'est pas "écrire des tests" mais **faire confiance au texte réellement affiché plutôt qu'au souvenir du fichier copié** — les points 2 et 4 de cette revue en sont la preuve directe, et le bug du point 1 (route `/api/seance` au lieu de `/api/auth/*`) montre la limite structurelle du mock de module : il isole si bien le composant qu'aucun test de composant ne peut jamais vérifier l'URL appelée par le service qu'il mocke. Côté backend, la gestion d'erreur est disciplinée dans sa forme (`try/catch` systématique, `safeParse` partout) mais pas encore différenciée dans le fond : `404` vs `500` (point 5) et `400` vs `401` (point 6) sont deux distinctions sémantiques déjà identifiées comme gap dans ton suivi de compétences, et cette revue montre qu'elles ne sont pas encore un réflexe automatique — contrairement à l'ownership, qui l'est déjà depuis `revue2.md`.

**Priorité concrète pour la prochaine session**, dans cet ordre :
1. Corriger `postRegister`/`postLogin` (`/api/seance` → `/api/auth/register` / `/api/auth/login`) — bug fonctionnel actif.
2. Corriger l'assertion cassée de `run/[id].test.tsx` (texte sans virgule) — sinon ce test ne protège rien.
3. Ajouter le mapping `P2025 → 404` (un seul helper, réutilisé sur 3 routes) et corriger les `401` de validation en `400` (3 routes).
4. Remonter le timeout à 8-10s.
