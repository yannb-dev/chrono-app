# Revue pédagogique — Tests (Jest + React Native Testing Library)

> Périmètre : `frontend/chronoapp/tests/` (9 fichiers, 39 tests), `jest.setup.js`, config Jest. Backend : aucun test.
> Date : 2026-10-03 · Outils : `jest-expo` 57, `@testing-library/react-native` 14.

---

## État constaté

```
$ npx jest --ci
Test Suites: 9 passed, 9 total
Tests:       39 passed, 39 total
A worker process has failed to exit gracefully ... tests leaking due to improper teardown.
```

Tout est vert ✅ — mais « vert » ne veut pas dire « protégé » : **4 tests passent quoi qu'il arrive** (voir §1), et la sortie contient des `console.error` attendus + une fuite de timers.

| Domaine | Note | Commentaire |
| --- | --- | --- |
| Couverture des écrans | 🟢 | 9 écrans/composants testés, cas d'erreur HTTP / réseau / succès systématiques |
| Requêtes RNTL | 🟢 | `findBy*` pour l'asynchrone, `getByPlaceholderText`, `getAllByRole("button")` |
| Isolation | 🟢 | `jest.mock("@/services/api")`, `clearAllMocks` en `beforeEach` |
| Fiabilité des assertions | 🔴 | Assertions sans effet (`toBeTruthy` sans `()`, `expect(promise)`) |
| Ce qui est testé | 🟠 | Beaucoup de détails d'implémentation (couleurs, redirection 401 dupliquée) |
| Couches non testées | 🟠 | `apiFetch`, `AuthContext`, `AuthGate`, `account.tsx`, `ViewChrono`, backend |
| Outillage | 🟠 | `jest --watchAll` en script unique, config Jest orpheline à la racine, pas de CI |

---

## ✅ Ce qui est bien fait

1. **Structure Arrange / Act / Assert lisible** et homogène dans tous les fichiers, avec des helpers (`remplirFormulaireValid`, `ValueValid`).
2. **Mock à la bonne frontière** : tu mockes `@/services/api` (ta frontière réseau) plutôt que `fetch` dans chaque test d'écran. Les composants sont testés en isolation de l'API.
3. **Tests des trois chemins** pour chaque écran : erreur HTTP, `NetworkError`, succès. C'est exactement la matrice qu'on attend.
4. **`findBy*`** pour attendre l'UI asynchrone au lieu de `setTimeout` maison.
5. **Faux timers** (`jest.useFakeTimers` + `advanceTimersByTime(3000)`) pour la redirection différée de `passwordReset` — bonne technique, bien restaurée en `afterEach`.
6. **`expect(postLogin).not.toHaveBeenCalled()`** quand le formulaire est invalide : tu testes qu'une action **n'a pas** lieu, souvent oublié.
7. **Mock de `useFocusEffect`** (`callback => callback()`) : astucieux et suffisant.

---

## 🔴 Priorité 1 — Tests qui ne testent rien (faux positifs)

C'est le point le plus important de cette revue : un test qui ne peut pas échouer donne une fausse confiance.

### 1.1 Matcher non appelé

```ts
// _list.test.tsx:120 et :123
expect(await screen.findByTestId("test123")).toBeTruthy;   // ← pas de ()
expect(await screen.findByTestId("test123")).toBeFalsy;    // ← pas de ()

// _index.test.tsx:58
expect(screen.findByText("Démarrer")).toBeFalsy;           // ← pas de () ET pas de await
```

`toBeTruthy` sans parenthèses est une simple **lecture de propriété** : aucune assertion n'est exécutée. Pire, la ligne `:123` voudrait vérifier que la séance a disparu, mais `findByTestId` **throw** si l'élément est absent — l'intention et le code sont inversés.

```ts
// ✅ vérifier une disparition
await waitFor(() => expect(screen.queryByTestId("test123")).toBeNull());
// ou
await waitForElementToBeRemoved(() => screen.queryByTestId("test123"));
```

Pour `_index.test.tsx` (test « logout ») : `HomeScreen` ne gère pas la navigation après logout (c'est `AuthGate`), donc il n'y a **rien à observer** dans ce composant. Le bon test : vérifier que `logout` du Context a été appelé.

```ts
const mockLogout = jest.fn();
jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ logout: mockLogout }) }));
// ...
await fireEvent.press(screen.getByTestId("logout"));
expect(mockLogout).toHaveBeenCalledTimes(1);
```

> 💡 La règle ESLint `jest/valid-expect` (plugin `eslint-plugin-jest`) détecte automatiquement ces deux erreurs.

### 1.2 `expect(promise).toBeTruthy()`

```ts
// _passwordReset.test.tsx:77-79
expect(
  screen.findByText("Erreur du contrôle Zod sur resetpassword"),   // ← Promise, pas d'await
).toBeTruthy();
```

Une `Promise` est toujours truthy → le test passe même si le texte n'apparaît jamais. Ajoute `await` :

```ts
expect(await screen.findByText("…")).toBeOnTheScreen();
```

### 1.3 Le test « RESET » appuie sur un bouton désactivé

```ts
// _[id]run.test.tsx:177-197  "OnPress sur RESET => …"
(getSeanceId as jest.Mock).mockResolvedValueOnce(seanceNoStart);
await render(<RunPage />);
await fireEvent.press(screen.getByTestId("reset"));
```

Avec `seanceNoStart`, le chrono n'est pas lancé → le bouton reset a `disabled={!stateChrono}` → RNTL **n'appelle pas** `onPress`. Vérifié : `deleteTimerPause` est appelé **0 fois**. Les assertions qui suivent décrivent simplement l'état initial. Les 3 `mockResolvedValueOnce` (`postTimerPause`, `deleteTimerPause`, `deleteAllTimerRunner`) ne servent à rien.

Le scénario réel : play → reset.

```ts
(getSeanceId as jest.Mock).mockResolvedValueOnce(seanceNoStart);
(patchSeance as jest.Mock)
  .mockResolvedValueOnce(seanceInProgress)   // play
  .mockResolvedValueOnce(seanceNoStart);     // reset
(deleteTimerPause as jest.Mock).mockResolvedValueOnce(null);
(deleteAllTimerRunner as jest.Mock).mockResolvedValueOnce(null);

await render(<RunPage />);
await fireEvent.press(await screen.findByTestId("play"));
await fireEvent.press(await screen.findByTestId("reset"));

await waitFor(() => expect(deleteTimerPause).toHaveBeenCalledWith(seanceNoStart.id));
expect(await screen.findByText("00:00:00")).toBeOnTheScreen();
expect(screen.getByTestId("play")).toBeEnabled();
```

> 🎓 **Réflexe TDD** (ta préférence) : avant de considérer un test comme valide, **casse volontairement le code** (commente l'appel à `deleteTimerPause`) et vérifie que le test devient rouge. Si tout reste vert, le test ne protège rien.

### 1.4 `expect(...)` sans matcher

```ts
// _btnandlist.test.tsx:107, _form.test.tsx:88, _list.test.tsx:109, _[id]run.test.tsx:133 …
expect(await screen.findByText("Le chronomètre n'est pas actif"));
```

Ça fonctionne (c'est `findByText` qui throw si absent), mais l'`expect` est décoratif et le lecteur croit à une assertion. Écris-le explicitement : `expect(await screen.findByText("…")).toBeOnTheScreen();`.

---

## 🟠 Priorité 2 — Que tester ? (comportement vs implémentation)

### 2.1 Tester les couleurs, c'est tester le CSS

```ts
// _[id]run.test.tsx:151-171
expect(await screen.findByTestId("play")).toHaveStyle({ backgroundColor: "rgb(176, 171, 171)" });
```

Si tu changes la couleur du thème, 9 assertions cassent alors que l'app fonctionne. Ce que l'utilisateur perçoit, c'est « le bouton est désactivé » :

```ts
expect(screen.getByTestId("play")).toBeDisabled();
expect(screen.getByTestId("pause")).toBeEnabled();
```

Même remarque pour `_btnandlist.test.tsx:118` (gris = déjà arrivé) → `toBeDisabled()`.

### 2.2 Les tests 401 figent du code dupliqué

Les tests « Non autorisé => redirection /login » (form, list, result, run) mockent `services/api` et vérifient que **le composant** redirige. Or ce comportement est censé vivre dans `apiFetch` (voir `reviewFrontend.md` §1.2). Quand tu centraliseras le 401, ces 4 tests casseront alors que l'app marchera mieux : ils testent **où** est le code, pas **ce que** vit l'utilisateur.

→ Après le refactor : supprime-les des écrans et teste le 401 **une seule fois**, dans les tests de `apiFetch` (§3.1).

### 2.3 Préférer les requêtes accessibles aux `testID`

Ordre de préférence recommandé par Testing Library :

1. `getByRole("button", { name: "Se connecter" })`
2. `getByLabelText` / `getByPlaceholderText` / `getByText`
3. `getByTestId` — en dernier recours

Aujourd'hui les boutons icône (play, pause, reset, logout, poubelle) n'ont pas de nom accessible, d'où les `testID`. En ajoutant `accessibilityLabel="Pause"` (ce qui améliore aussi TalkBack), tu peux écrire `getByRole("button", { name: "Pause" })` : **le test et l'accessibilité progressent ensemble**.

### 2.4 Mocks au nom trompeur

```ts
// _list.test.tsx:20-23
router: {
  replace: (...args) => mockReplace(...args),
  push:    (...args) => mockReplace(...args),   // ← push branché sur mockReplace
},
```

Les tests 6 et 7 (« redirection => /run ») vérifient `mockReplace` alors que le code appelle `router.push`. Ça passe, mais si quelqu'un remplace `push` par `replace` dans le composant (changement de comportement : plus de retour arrière possible), aucun test ne le verra. Crée `mockPush` séparément.

---

## 🟠 Priorité 3 — Ce qui n'est pas testé

### 3.1 `services/api.ts` — la couche la plus critique

Elle contient : injection du token, timeout, 401 → déconnexion, conversion des erreurs. Tout est mocké ailleurs, donc **jamais exécuté** en test. Exemple :

```ts
// tests/api.test.ts
import * as SecureStore from "expo-secure-store";
import { getSeance, deleteManySeance } from "@/services/api";
import { HttpError, NetworkError } from "@/lib/errors";

jest.mock("expo-secure-store");
jest.mock("expo-router", () => ({ router: { replace: jest.fn() } }));

beforeEach(() => {
  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("tok123");
  global.fetch = jest.fn();
});

it("ajoute le header Authorization", async () => {
  (fetch as jest.Mock).mockResolvedValue(new Response("[]", { status: 200 }));
  await getSeance();
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/api/seance"),
    expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer tok123" }) }),
  );
});

it("401 → supprime le token et lève HttpError", async () => {
  (fetch as jest.Mock).mockResolvedValue(new Response("{}", { status: 401 }));
  await expect(getSeance()).rejects.toBeInstanceOf(HttpError);
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("accessToken");
});

it("échec réseau → NetworkError", async () => {
  (fetch as jest.Mock).mockRejectedValue(new TypeError("Network request failed"));
  await expect(getSeance()).rejects.toBeInstanceOf(NetworkError);
});

it("204 → ne plante pas", async () => {
  (fetch as jest.Mock).mockResolvedValue(new Response(null, { status: 204 }));
  await expect(deleteManySeance()).resolves.toBeNull();   // rouge aujourd'hui → TDD !
});
```

Le dernier test est **rouge aujourd'hui** : c'est le point de départ idéal pour corriger le bug 204 en TDD.

### 3.2 Autres cibles, par rapport effort / valeur

| Cible | Pourquoi | Difficulté |
| --- | --- | --- |
| `ViewChrono` | Fonction pure de formatage (`3661 → "01:01:01"`, `59.9 → "00:00:59"`) | ⭐ — `it.each` idéal |
| `extractErrorMessage` / `toUserMessage` | Fonctions pures | ⭐ |
| Schémas Zod (`formRegister`, …) | Règles de mot de passe sans passer par l'UI | ⭐ |
| `AuthContext` | `login` écrit dans SecureStore, `logout` vide le state | ⭐⭐ — `renderHook(() => useAuth(), { wrapper: AuthProvider })` |
| `AuthGate` | Sans token → `/login` ; avec token dans `(auth)` → `/` | ⭐⭐ — mock `useSegments` |
| `account.tsx` | Bouton « Valider » désactivé tant que le texte ≠ « chronoapp » ; suppression → `logout` | ⭐⭐ |
| `run/[id].tsx` : affichage du temps | `jest.useFakeTimers()` + `advanceTimersByTime(65_000)` → « 00:01:05 » | ⭐⭐⭐ |
| Double tap coureur | Deux `press` rapides → `postTimerRunner` appelé **une** fois (rouge aujourd'hui) | ⭐⭐ |

### 3.3 Backend : zéro test

Voir `reviewBackend.md` §Tests. Les handlers Next sont des fonctions `(Request) => Response` : très faciles à tester avec Vitest, sans serveur. Le test d'IDOR (« un utilisateur ne peut pas lire la séance d'un autre ») est le plus rentable de tout le projet.

---

## 🟡 Outillage et hygiène

| Point | Où | Action |
| --- | --- | --- |
| `"test": "jest --watchAll"` | `package.json:12` | Mode interactif : bloque une CI. Ajoute `"test:ci": "jest --ci --coverage"` |
| Config Jest orpheline | `/jest.config.js` (racine) | Pointe vers `jest.setup.ts` qui n'existe pas ; la vraie config est dans `frontend/chronoapp/package.json`. Supprimer |
| `setUpTests()` appelé 2 fois | `jest.setup.js:5-8` | Garder un seul appel |
| `afterEach(cleanup)` | tous les fichiers | RNTL le fait automatiquement → supprimer |
| Fuite en fin de suite | « worker process has failed to exit gracefully » | `setInterval` de `RunPage` / `setTimeout` de `BtnAndList` non nettoyés. `npx jest --detectOpenHandles` pour localiser ; souvent résolu en corrigeant le composant (cleanup des timers) |
| `console.error` attendus qui polluent la sortie | `BtnAndList`, `run/[id]` | `jest.spyOn(console, "error").mockImplementation(() => {})` dans les tests d'erreur, puis vérifier qu'il a été appelé |
| Fixtures dupliquées | `seance`, `seanceFinish`, `seanceNoStart`… dans 5 fichiers | `tests/fixtures.ts` avec une factory : `makeSeance({ state: "Finish" })` |
| Fixtures incohérentes | `createdAt: new Date()` vs `"2026-10-03T…"` | Toujours des `string` ISO : c'est ce que renvoie l'API (et ça révèle le problème de types `Date`) |
| `describe("… - affichage des erreurs")` | tous les fichiers | Le nom ne correspond plus (navigation, succès…) → `describe("Login")` + sous-`describe` |
| Noms de fichiers `_[id]run.test.tsx` | `tests/` | Les `[]` posent problème dans certains shells/globs → `run.test.tsx`, `result.test.tsx` |

### Proposition de CI minimale

`.github/workflows/ci.yml` — c'est elle qui donnera du sens aux PR Dependabot :

```yaml
name: CI
on: [pull_request]
jobs:
  frontend:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: frontend/chronoapp } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: frontend/chronoapp/package-lock.json }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npx jest --ci
  backend:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: backend/chronoapp } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: backend/chronoapp/package-lock.json }
      - run: npm ci
      - run: npx prisma generate
      - run: npx tsc --noEmit
      - run: npm run lint
```

---

## 📋 Plan d'action tests

1. [ ] Corriger les 4 faux positifs (§1.1 → §1.3) — **casser le code pour vérifier qu'ils rougissent**
2. [ ] Ajouter `eslint-plugin-jest` (`jest/valid-expect`, `jest/no-disabled-tests`)
3. [ ] `toHaveStyle` → `toBeDisabled` / `toBeEnabled`
4. [ ] `tests/api.test.ts` : 401, réseau, header, **204 (rouge → fix en TDD)**
5. [ ] `ViewChrono` + schémas Zod avec `it.each`
6. [ ] `tests/fixtures.ts` + dates en `string`
7. [ ] Script `test:ci`, suppression de `/jest.config.js`, un seul `setUpTests()`
8. [ ] Workflow CI GitHub Actions
9. [ ] Premiers tests backend (IDOR, 204, calcul de durée)
