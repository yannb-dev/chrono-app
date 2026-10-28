# Revue pédagogique — Tests (Jest + RNTL côté mobile · Vitest côté API)

> Périmètre : `frontend/chronoapp/tests/` (11 fichiers), `backend/chronoapp/test/` (12 fichiers + `prismaMock.ts`), outillage et CI · Date : 2026-10-27 · Revue précédente : [`archive/2026-10-04/reviewTestingLibrary.md`](archive/2026-10-04/reviewTestingLibrary.md).

## État constaté (commandes exécutées)

| Suite | Commande | Résultat |
| --- | --- | --- |
| Frontend | `npx jest --ci` | **11 suites, 47 tests, tous verts** (8,2 s) — sortie polluée par des `console.error` attendus |
| Backend | `npx vitest run` | **12 fichiers, 105 tests, tous verts** (6 s) |
| CI | `.github/workflows/` | **Absente** (seul `dependabot.yml`) — CI-02 #100 ouverte |

Évolution depuis le 2026-10-04 : frontend 39 → 47 tests, backend **0 → 105**. C'est le plus gros progrès du projet.

---

## ✅ Ce qui est bien fait

1. **Tests backend au bon niveau** : les handlers sont appelés directement avec un vrai `Request` (`new Request(url, { method, headers, body })`), Prisma est mocké à la frontière avec `vitest-mock-extended` + `mockReset` dans `beforeEach` (`test/prismaMock.ts`). C'est la technique standard pour tester des route handlers Next sans base de données.
2. **Les chemins d'erreur sont couverts** : 401, 400 (Zod), 400 (IP absente), 429 (IP et email séparément), **503 (Upstash HS)**, 404, 409, 500. Tu testes ce qui peut casser, pas seulement le chemin heureux.
3. **Assertions de sécurité réelles** : `expect(prismaMock.user.delete).not.toHaveBeenCalled()` après un mauvais mot de passe ; « bcrypt est quand même appelé avec le hash factice » (`_route_login.test.ts`) ; « updateMany ne touche aucune ligne (race condition) » (`_route_passwordReset.test.ts`). Ce sont des tests qui protègent une propriété de sécurité, pas un détail d'implémentation.
4. **Ownership vérifié** : `toHaveBeenCalledWith({ where: { id, userId } })` dans les tests `GET` — si quelqu'un retire `userId` du `where`, le test casse.
5. **Test du double tap exemplaire** (`tests/_btnandlist.test.tsx:181-205`) : la promesse de `postTimerRunner` est maintenue en attente, deux `press` synchrones, `toHaveBeenCalledTimes(1)`. Il échoue vraiment si on retire le `Set` (FRONT-03).
6. **`services/api.ts` enfin testé** (`tests/_servicesApi.test.tsx`) : header `Authorization`, `NetworkError` en mode avion, 401 → `triggerUnauthorized`, **pas** de déconnexion sur `/api/auth/login`.
7. **Faux timers** maîtrisés côté backend (`vi.setSystemTime`) pour tester la borne « date de plus d'une heure ».

---

## 🔴 Priorité 1 — Tests qui ne testent rien (TEST-01 fermée, 3 faux positifs sur 4 toujours présents)

TEST-01 (#97) a été fermée aujourd'hui, mais trois des quatre faux positifs listés sont **inchangés** dans le code. Seul `_list.test.tsx` a été corrigé.

### 1.1 Le test « RESET » appuie toujours sur un bouton désactivé

```ts
// tests/_[id]run.test.tsx:151-171
(getSeanceId as jest.Mock).mockResolvedValueOnce(seanceNoStart);
(deleteTimerPause as jest.Mock).mockResolvedValueOnce({ ok: 204 });
await render(<RunPage />);
await fireEvent.press(screen.getByTestId("reset"));   // disabled={!stateChrono} → onPress jamais appelé
```

**Vérifié à nouveau par un test temporaire** (écrit, exécuté, supprimé) : après ce `press`, `deleteTimerPause` a été appelé **0 fois**. Les assertions décrivent l'état initial de l'écran.

Ce faux positif a un coût réel aujourd'hui : il cache le bug n°1 de cette revue. Le reset échoue dès qu'il n'y a pas de pause (`reviewBackend.md` §1.1), et aucun test ne le voit, car (1) ce test n'atteint jamais `handleReset`, (2) les mocks renvoient toujours un succès (`{ ok: 204 }`, qui n'est d'ailleurs pas ce que renvoie `apiFetch` sur un 204 : il renvoie `null`).

Le test qui aurait détecté la régression :

```ts
it("reset sans pause : remet le chrono à zéro", async () => {
  (getSeanceId as jest.Mock).mockResolvedValueOnce(seanceNoStart);
  (patchSeance as jest.Mock).mockResolvedValueOnce(seanceInProgress);
  (resetSeance as jest.Mock).mockResolvedValueOnce(seanceNoStart);   // après BACK-04

  await render(<RunPage />);
  await fireEvent.press(await screen.findByTestId("play"));
  await fireEvent.press(await screen.findByTestId("reset"));

  await waitFor(() => expect(resetSeance).toHaveBeenCalledWith(seanceNoStart.id));
  expect(await screen.findByText("00:00:00")).toBeOnTheScreen();
  expect(screen.getByTestId("play")).toBeEnabled();
});

it("reset refusé par le serveur : le chrono continue", async () => {
  // … resetSeance rejette HttpError(409) → message affiché ET bouton pause toujours actif
});
```

### 1.2 `toBeFalsy` sans parenthèses ni `await`

```ts
// tests/_index.test.tsx:57-59
await waitFor(() => {
  expect(screen.findByText("Démarrer")).toBeFalsy;   // lecture de propriété, aucune assertion
});
```

Inchangé. Le correctif proposé reste valable : mocker `useAuth` et vérifier `expect(mockLogout).toHaveBeenCalledTimes(1)`.

### 1.3 `expect(promise).toBeTruthy()`

```ts
// tests/_passwordReset.test.tsx:77-79
expect(
  screen.findByText("Erreur du contrôle Zod sur resetpassword"),   // Promise → toujours truthy
).toBeTruthy();
```

Inchangé. Ajoute `await` — et le test deviendra rouge, car ce texte est un log serveur, pas un message affiché. C'est la preuve que ce test n'a jamais rien vérifié.

> 🎓 **Concept** (V-04) : fermer une issue de tests demande une preuve, pas une impression. Le critère de fin de #97 était : « chaque test devient rouge si on commente le code qu'il couvre (vérifié à la main) ». Prends l'habitude, avant de fermer, de **casser volontairement** le code couvert (commente l'appel, inverse la condition) et de regarder le test passer au rouge. Si tout reste vert, l'issue n'est pas finie. `eslint-plugin-jest` (TEST-04, #112) aurait détecté automatiquement 1.2 et 1.3 (`jest/valid-expect`).

---

## 🟠 Priorité 2 — Tests qui trompent ou figent un mauvais comportement

### 2.1 `_route_timerrunner.test.ts` importe `afterEach` depuis `node:test`

```ts
// backend/chronoapp/test/_route_timerrunner.test.ts:13
import { afterEach } from "node:test";
```

C'est le `afterEach` du runner **natif de Node**, pas celui de Vitest : il n'est jamais exécuté par Vitest. `vi.useRealTimers()` ne tourne donc pas après chaque test ; les faux timers restent actifs jusqu'à la fin du fichier. Aujourd'hui ça ne casse rien (l'isolation par fichier limite les dégâts), mais le premier test asynchrone basé sur `setTimeout` ajouté dans ce fichier restera bloqué sans raison apparente. Importe `afterEach` depuis `"vitest"` (une auto-complétion d'IDE malheureuse, classique).

Dans le même fichier, `valuePost.endedAt: new Date()` est évalué **avant** `vi.setSystemTime(…)` : le test fonctionne seulement parce que la vraie date du jour est postérieure à la date simulée. Utilise des dates fixes partout.

### 2.2 Des tests qui figent un comportement vulnérable

`_route_user.test.ts:123-145` (branche web) attend `404` pour un utilisateur inconnu et `403` pour un mauvais mot de passe, et vérifie que `bcrypt.compare` n'est **pas** appelé quand l'utilisateur n'existe pas. C'est exactement l'énumération décrite dans `reviewSecurity.md` §1.1. De même, `_route_timerpauseId.test.ts` (« renvoie 404 - Aucun timerPause ») et `_route_timerrunnerBySeance.test.ts` figent le 404 qui casse le reset.

Ce n'est pas une faute de test : tu as testé ce que fait le code. Mais quand la règle change, **commence par changer le test** (il devient rouge), puis le code. C'est l'ordre TDD.

```ts
it("401 générique - utilisateur inconnu : bcrypt appelé avec le hash factice", async () => {
  userIdMock.mockResolvedValue(null as never);
  prismaMock.user.findUnique.mockResolvedValue(null as never);
  compareMock.mockResolvedValue(false as never);

  const res = await DELETE(makeDelete(validBody));

  expect(res.status).toBe(401);
  expect(compareMock).toHaveBeenCalledTimes(1);
  expect(await res.json()).toEqual({ message: "Identifiants invalides" });
});
```

### 2.3 `_deleteUser.test.tsx` (formulaire web) teste des chemins qui n'existent pas

| Test | Problème |
| --- | --- |
| « Mauvais mot de passe à la validation » (l.73) | Mocke `prisma.user.findUnique` — un composant client n'appelle jamais Prisma. Le test est une copie du test 1 (email invalide) |
| « Mauvais mot de passe à la suppression » (l.96) | Teste en réalité le **succès** (204) |
| « Renvoi un message d'erreur si 404 » (l.124) | `fetch` **rejette** un `HttpError(403)`. Un vrai `fetch` ne rejette jamais sur un statut HTTP : il résout `{ ok: false, status }`. La branche `if (!response.ok)` du composant n'est donc jamais exécutée |
| « … si NetworkError » (l.149) | `fetch` ne lève jamais de `NetworkError` (classe maison) mais un `TypeError`. En réalité l'utilisateur verrait « Une erreur inattendue » |

Le mock doit imiter **la vraie API** :

```ts
vi.mocked(fetch).mockResolvedValueOnce(
  new Response(JSON.stringify({ message: "Identifiants invalides" }), { status: 401 }),
);
// …
expect(await screen.findByText("Identifiants invalides")).toBeInTheDocument();

vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Failed to fetch"));   // vraie panne réseau
```

> 🎓 **Concept** : un mock est une **promesse** sur le comportement de la dépendance. S'il fait quelque chose que la vraie dépendance ne fait jamais, le test vérifie un monde imaginaire. Avant d'écrire `mockRejectedValue`, demande-toi : « le vrai `fetch` peut-il rejeter avec ça ? »

### 2.4 Titres qui contredisent le test

| Fichier | Titre | Ce qui est vérifié |
| --- | --- | --- |
| `_route_user.test.ts:78` | « 401 - format non conforme ZOD » | 400 |
| `_route_timerpause.test.ts:141` | « renvoie 400 - … startedAt : Null » | 403 |
| `_route_timerpauseId.test.ts:82` | « renvoie 500 via P2002 - Conflit » | `P2002` sur un `deleteMany` n'arrive jamais ; c'est un test « erreur inattendue → 500 » |
| `_btnandlist.test.tsx:111` et `:162` | « Button runner disabled si chrono en PAUSE » (deux fois) | L'affichage d'un message d'erreur, pas l'état `disabled` |
| `_[id]run.test.tsx:115,151` | « … chrono défile » | Aucune assertion sur le temps affiché |

Le titre est la documentation du test : quand il échouera dans six mois, c'est lui que tu liras en premier.

### 2.5 Couverture manquante qui compte

| Cible | Pourquoi |
| --- | --- |
| `POST /timerrunner` : 404, 409 `Finish`, 409 chrono inactif / en pause, 409 `P2002` | Les règles de BACK-06 n'ont **aucun** test : seul le chemin heureux est couvert |
| `DELETE /api/user` : body non-JSON, Upstash HS, Bearer invalide | Les trois bugs de `reviewBackend.md` §1.2-1.3 |
| `PATCH /timerpause/:id` | Importé mais jamais testé (`PATCH` inutilisé dans `_route_timerpauseId.test.ts`) |
| `run/[id].tsx` : play → pause → play, reprise d'une séance avec pause ouverte | Le cœur métier de l'app |
| `AuthContext` (lecture SecureStore, `onUnauthorized`) | TEST-06 #114 |
| `parseBody` | Mocké dans `_servicesApi.test.tsx`, jamais testé directement (204, corps vide, texte, JSON) |
| `apiFetch` : timeout (`AbortController`) | Testable avec `jest.useFakeTimers()` + `advanceTimersByTime(10000)` |

---

## 🟡 Outillage et hygiène

| Point | Où | Action |
| --- | --- | --- |
| `"test": "jest --watchAll"` | `frontend/chronoapp/package.json:12` | Bloque une CI → ajouter `"test:ci": "jest --ci"` (TEST-07 #115) |
| Config Jest orpheline | `/jest.config.js` (racine) | Pointe vers `jest.setup.ts`, inexistant → supprimer |
| `setUpTests()` appelé 2 fois | `jest.setup.js:5-8` | Un seul appel |
| `afterEach(cleanup)` | fichiers RNTL | Automatique dans RNTL → supprimer |
| `console.error` attendus dans la sortie | `services/api.ts:52`, écrans | `jest.spyOn(console, "error").mockImplementation(() => {})` dans les tests d'erreur |
| `any` + imports inutilisés | 4 fichiers de tests backend (`npx eslint .`) | Typer `cb` : `(cb: (tx: typeof prismaMock) => unknown) => cb(prismaMock)` |
| `vite-tsconfig-paths` | `vitest.config.mts` | Vitest le signale : remplaçable par `resolve.tsconfigPaths: true` |
| `_deleteUser.test.tsx:1` | Commentaire `// app/exercices/page.test.tsx` | Reste d'un autre projet |
| Pas de CI | `.github/workflows/` | Voir ci-dessous |

### CI minimale (CI-02, #100)

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
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
      - run: npx vitest run
  frontend:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: frontend/chronoapp } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: frontend/chronoapp/package-lock.json }
      - run: npm ci        # échouera tant que .npmrc n'est pas dans frontend/chronoapp/ (reviewFrontend.md §🟡)
      - run: npx tsc --noEmit
      - run: npx expo lint
      - run: npx jest --ci
```

Le lint échouera au premier passage (27 erreurs backend, 6 frontend) : c'est voulu, c'est la liste de ce qu'il faut corriger avant d'activer la protection de branche.

---

## 📋 Plan d'action tests

1. [ ] Rouvrir #97 : corriger les 3 faux positifs restants **en vérifiant qu'ils deviennent rouges** quand on casse le code (§1)
2. [ ] Écrire d'abord (rouge) les tests du reset sans pause, puis faire BACK-04 (§1.1)
3. [ ] Changer les tests qui figent l'énumération et le 404 du reset **avant** de changer le code (§2.2)
4. [ ] `afterEach` depuis `vitest` ; dates fixes (§2.1)
5. [ ] Mocks `fetch` réalistes dans `_deleteUser.test.tsx` (§2.3)
6. [ ] Tests des règles 409 de `POST /timerrunner` et des bugs de `DELETE /api/user` (§2.5)
7. [ ] `eslint-plugin-jest` (TEST-04), `test:ci`, puis le workflow CI (CI-02)
