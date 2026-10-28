# Revue pédagogique — Frontend (Expo SDK 57 / React Native 0.86 / Expo Router)

> Périmètre : `frontend/chronoapp/` (écrans, composants, `services/`, `context/`, config Expo/EAS) · Date : 2026-10-27 · Contexte : 2ᵉ revue, avant publication Play Store. Revue précédente : [`archive/2026-10-04/reviewFrontend.md`](archive/2026-10-04/reviewFrontend.md).

## Vue d'ensemble

| Domaine | Note | Commentaire court |
| --- | --- | --- |
| Client HTTP (`apiFetch`) | 🟢 | 204 / texte / JSON gérés via `parseBody`, timeout, 401 centralisé |
| Auth (Context + 401) | 🟢 | `authEvents` → `logout()` du Context : une seule voie de déconnexion |
| Actions destructives / double tap | 🟠 | Coureurs protégés ✅ ; **play** et **pause** toujours sans garde |
| Cycle de vie des effets | 🔴 | Intervalle sans garde, cleanup `useFocusEffect` non retourné, timeout jamais nettoyé |
| Typage (frontière JSON) | 🟠 | `TimerRunner` / `TimerPause` en `string` ✅ ; `SeanceResponse` encore en `Date` |
| Accessibilité | 🔴 | Aucun `accessibilityLabel`, clavier email non configuré (FRONT-08) |
| Préparation store | 🟢 | Icône, nom, package, `blockedPermissions`, Sentry configurés |
| ESLint | 🟠 | 6 erreurs, 32 warnings (dont une vraie erreur d'ordre de déclaration) |

---

## ✅ Ce qui est bien fait

1. **`apiFetch` est devenu robuste** (`services/api.ts:28-85`) : `parseBody` distingue `empty` / `json` / `text`, le `clearTimeout` est dans un `finally`, l'erreur réseau devient `NetworkError`, et le corps d'erreur texte est tronqué à 200 caractères. C'est un client HTTP de qualité professionnelle.
2. **401 centralisé** (`lib/authEvents.ts` + `context/AuthContext.tsx:37-44`) : le service ne connaît pas React, il émet un événement ; le Context s'abonne et appelle **son** `logout()`. Le service n'importe plus la navigation pour déconnecter : c'est la bonne frontière (V-09). L'exclusion des routes `/api/auth/` évite de « déconnecter » sur un mauvais mot de passe.
3. **Anti double tap sur les coureurs** (`components/BtnAndList.tsx:40,86-87,123`) : un `useRef<Set<number>>` synchrone, libéré dans le `finally`. Le `ref` est le bon outil ici : un `useState` ne serait pas encore à jour au 2ᵉ tap. Le test associé est excellent (voir `reviewTestingLibrary.md`).
4. **Confirmation avant « tout supprimer »** (`app/(tabs)/list.tsx:121-155`) et avant suppression de compte avec mot de passe (`account.tsx`).
5. **Sentry configuré pour la prod** (`app/_layout.tsx:9-81`) : `sendDefaultPii: false`, filtrage des headers sensibles, regex de masquage des JWT dans les messages, breadcrumbs `console` et `ui.input` supprimés, `tracesSampleRate: 0.1`, DSN en `EXPO_PUBLIC_SENTRY_DSN`. Très soigné.
6. **`app.json` prêt pour le store** : icône, nom « Chrono App », package Android, `blockedPermissions` (`AD_ID`), plugin Sentry.
7. **Cleanup du `setTimeout` de redirection** (`register.tsx:35-42`, `passwordReset.tsx:34-41`) : effet dépendant de `messageConfirm`, `clearTimeout` retourné. C'est le modèle à reproduire ailleurs.
8. **Types `TimerRunner` / `TimerPause` en `string`** (`types/api.ts:10-25`) : la frontière JSON est respectée sur ces deux types.

---

## 🔴 Priorité 1 — Bugs / risques réels

### 1.1 Le reset ne fonctionne pas sans pause (bug back + front)

Le bouton reset enchaîne trois appels (`app/run/[id].tsx:213-215`) ; les deux premiers renvoient désormais **404** quand il n'y a rien à supprimer. Lancer le chrono puis appuyer sur reset sans avoir fait de pause affiche donc « Pauses introuvables », et la séance reste `InProgress` en base alors que l'écran a déjà arrêté le chrono.

Le mécanisme et la correction (endpoint `POST /seance/:id/reset` transactionnel) sont détaillés dans **`reviewBackend.md` §1.1**. Côté front, à faire **dans la même PR** :

```ts
// services/api.ts
export function resetSeance(id: string) {
  return apiFetch<SeanceResponse>(`/api/seance/${id}/reset`, { method: "POST" });
}

// app/run/[id].tsx — handleReset
try {
  const seance = await resetSeance(seanceGet.id);
  stopInterval();                // arrêter le chrono APRÈS le succès serveur
  setSeanceGet(seance);
  setElapsed(0);
  timerPausesLocal.current = [];
  setReset(true);
} catch (err) { /* … */ }
```

> 🎓 **Concept** : n'arrête l'état local qu'**après** la confirmation du serveur (ou annule-le si le serveur refuse). Aujourd'hui `clearInterval` + `setStateChrono(false)` s'exécutent avant les appels : en cas d'erreur, l'écran dit « arrêté » et la base dit « en cours ». Deux sources de vérité qui divergent (V-01).

### 1.2 Double tap sur « play » ou « pause » : deux requêtes, deux intervalles

```ts
// app/run/[id].tsx:123-143 — handlePlay
if (stateChrono) return;                    // stateChrono ne passe à true qu'APRÈS le PATCH
const response = await patchSeance(…);
handleStartChrono(response.startedAt);      // crée un setInterval sans arrêter le précédent

// :102-106 — handleStartChrono
intervalRef.current = setInterval(…);       // écrase la référence → l'ancien intervalle fuit
```

**Scénario** : deux taps rapides sur play. `stateChrono` vaut encore `false` au 2ᵉ tap (le premier `await` n'est pas fini), donc deux `PATCH` partent, chacun avec son propre `startedAt` : le second **écrase** le premier en base. Puis deux `setInterval` sont créés ; `intervalRef` ne garde que le dernier, le premier tourne pour toujours (même après démontage, car le cleanup ne nettoie que `intervalRef.current`). C'est le cas concret de **FRONT-04** (#90, ouverte).

Même chose pour pause : deux taps → deux `POST /timerpause` → deux pauses ouvertes (le serveur l'accepte, voir `reviewBackend.md` §2.2).

```ts
const pending = useRef(false);

const stopInterval = () => {
  if (intervalRef.current) clearInterval(intervalRef.current);
  intervalRef.current = null;
};

const handleStartChrono = (start: string) => {
  stopInterval();                            // garde : jamais deux intervalles
  setStateChrono(true);
  setViewPaused(false);
  intervalRef.current = setInterval(() => { /* … */ }, 1000);
};

const handlePlay = async () => {
  if (pending.current) return;
  pending.current = true;
  try { /* … */ } finally { pending.current = false; }
};
```

Tu as déjà écrit ce patron dans `BtnAndList` (§✅3) : c'est le même réflexe, appliqué à tous les boutons qui déclenchent une écriture.

> 🎓 **Concept** (V-07) : toute création de ressource (intervalle, abonnement, timeout) doit répondre à deux questions : « qui l'arrête ? » et « que se passe-t-il si je la crée deux fois ? ».

### 1.3 Le cleanup de `useFocusEffect` n'est pas retourné (FRONT-06, #92, ouverte)

```ts
// app/(tabs)/list.tsx:61-65
useFocusEffect(
  useCallback(() => {
    initListPage();          // ← retourne le cleanup… qui est jeté
  }, []),
);
```

`initListPage` construit bien un `cancelled` et renvoie `() => { cancelled = true }`, mais la valeur de retour n'est pas transmise à `useFocusEffect`. Le garde ne s'active donc jamais. Même chose dans `app/result/[id].tsx:58-60`. Correction d'un mot :

```ts
useFocusEffect(useCallback(() => initListPage(), []));
// result/[id].tsx
useEffect(() => initPage(), [id]);
```

Au passage, dans les deux `catch`, `setDetailError(...)` est appelé **sans** vérifier `cancelled` (seul `setError` l'est) : déplace la vérification en tête du `catch`.

---

## 🟠 Priorité 2 — React / TypeScript

### 2.1 `SeanceResponse` ment sur les dates et sur les relations (FRONT-05, #91)

```ts
// types/api.ts:27-37
export type SeanceResponse = {
  createdAt: Date;              // JSON → string
  startedAt: Date | null;       // JSON → string | null
  state: string;                // union littérale possible
  timerRunners: TimerRunner[];  // absent des réponses POST et PATCH !
  timerpauses: TimerPause[];
};
```

Deux mensonges :

1. **Dates** : `handleStartChrono(start: Date)` reçoit en réalité une `string` ; ça marche uniquement parce que `new Date(start)` accepte les deux. `format(item.createdAt, …)` dans `list.tsx:195` fonctionne parce que date-fns v4 accepte une string, mais TypeScript ne te protège plus.
2. **Relations** : `PATCH /seance/:id` et `POST /seance` renvoient la séance **sans** `include`. Pourtant `patchSeance` est typé `SeanceResponse`, puis `setSeanceGet(response)` (`run/[id].tsx:140`) remplace la séance complète par un objet où `timerRunners` et `timerpauses` sont `undefined`. Aujourd'hui rien ne les relit après coup, mais le premier qui écrira `seanceGet.timerRunners.length` aura un crash que TypeScript n'a pas vu venir.

```ts
export type SeanceState = "NoStart" | "InProgress" | "Finish";
export type Seance = {
  id: string; userId: string; totalRunner: number; colorRunner: string;
  createdAt: string; startedAt: string | null; state: SeanceState;
};
export type SeanceWithRelations = Seance & { timerRunners: TimerRunner[]; timerpauses: TimerPause[] };

export function getSeanceId(id: string) { return apiFetch<SeanceWithRelations>(`/api/seance/${id}`); }
export function patchSeance(…)          { return apiFetch<Seance>(…); }
```

> 🎓 **Concept** (V-06) : un type d'API décrit ce qui **traverse le réseau**, pas ce que tu aimerais avoir. Un endpoint = un type de réponse. Le générique `apiFetch<T>` est un `as T` déguisé : il te fait confiance, à toi de ne pas lui mentir.

### 2.2 `AuthContext` : lecture du SecureStore sans `catch` (FRONT-07, #93) et effet `[logout]`

```ts
// context/AuthContext.tsx:20-25
SecureStore.getItemAsync("accessToken").then((t) => { setToken(t); setIsLoading(false); });
```

Si la lecture échoue (keystore Android corrompu après restauration de sauvegarde, cas réel), `isLoading` reste `true` et `AuthGate` renvoie `null` → **écran blanc permanent**.

```ts
SecureStore.getItemAsync("accessToken")
  .then(setToken)
  .catch(async () => { await SecureStore.deleteItemAsync("accessToken").catch(() => {}); setToken(null); })
  .finally(() => setIsLoading(false));
```

Sur l'effet `[logout]` (lignes 37-44, signalé dans #164) : `logout` est une fonction recréée à chaque rendu. Avec `reactCompiler: true`, le compilateur la mémoïse probablement et l'effet ne se relance pas — mais tu dépends alors d'une optimisation, pas d'un contrat. Rends la dépendance stable explicitement : `useCallback` sur `logout` (et `login`), ou `[]` avec un `ref`. Mémoïse aussi la `value` du Provider (`useMemo`), sinon tous les consommateurs se re-rendent à chaque changement d'état du Provider.

### 2.3 `run/[id].tsx` : « Cannot access variable before it is declared » (erreur ESLint)

`handleStartChrono` est appelé ligne 75 dans l'effet, mais déclaré ligne 102 avec `const`. Ça fonctionne à l'exécution (l'effet s'exécute après le rendu), mais c'est fragile et le React Compiler le signale comme erreur. Déclare les handlers **avant** l'effet, ou sors `computeElapsed(start, pauses)` en fonction pure hors du composant (facile à tester en plus).

### 2.4 `BtnAndList` : timeout non nettoyé et état dérivé (FRONT-11, #108)

```ts
// components/BtnAndList.tsx:118-121
setError(true);
const timeoutId = setTimeout(() => { setError(false); }, 3000);   // jamais nettoyé, variable inutilisée
```

Si l'utilisateur quitte l'écran dans les 3 s, `setError` s'exécute sur un composant démonté. Et l'écran d'erreur a aussi un bouton « Réessayer » : deux mécanismes concurrents pour la même chose. Garde le bouton **ou** un effet `useEffect(() => { if (!error) return; const t = setTimeout(…); return () => clearTimeout(t); }, [error])` — le patron de `register.tsx`.

Les deux erreurs ESLint `set-state-in-effect` (lignes 63 et 80) sont le symptôme de l'état dérivé déjà décrit dans la revue précédente : `arrayNumber` se calcule à partir de `seance.totalRunner` + `arrayResult`, il n'a pas besoin d'être stocké.

```ts
const [results, setResults] = useState<TimerRunner[]>(seance.timerRunners);
const arrived = new Set(results.map((r) => r.numberRunner));
const buttons = Array.from({ length: seance.totalRunner }, (_, i) => ({
  number: i + 1, done: arrived.has(i + 1), color: seance.colorRunner,
}));
```

Le `reset` devient alors : `key={resetCount}` sur `<BtnAndList>` dans le parent (remonter le composant remet l'état à zéro), sans aucun effet.

### 2.5 Duplication des `catch` (FRONT-10, #107)

Le bloc `HttpError / NetworkError / else` apparaît **15 fois** à l'identique dans 9 fichiers (`grep -c "err instanceof NetworkError"`). Rien de nouveau par rapport à la [revue précédente §2.3](archive/2026-10-04/reviewFrontend.md) ; c'est le bon exercice de factorisation (`toUserMessage(err)` puis `useAsyncAction`).

---

## 🟡 Priorité 3 — Qualité

| Fichier | Point | Correction |
| --- | --- | --- |
| `services/api.ts:5` | `import { router } from "expo-router"` inutilisé (reste de l'ancien 401) | Supprimer — un service ne doit pas importer la navigation (V-09) |
| `account.tsx:40-41` | `SecureStore.deleteItemAsync` puis `logout()` qui le refait | Garder seulement `logout()` |
| `account.tsx:155` | `onPress={() => console.log}` (ne fait rien) dans un `Link asChild` | Supprimer le `onPress` |
| `account.tsx:154` | URL de la politique en dur | Constante dans `config/` (dérivée de l'URL de l'API) |
| `login.tsx:49-53` | `if (status === 429) {X} else {X}` | Une seule ligne |
| `BtnAndList.tsx:30` | `reset: Boolean` (objet wrapper) | `boolean` |
| `BtnAndList.tsx:137` | `const response` inutilisé | `await patchSeance(…)` |
| `ErrorMessage.tsx:9` | `ErrorMessage(detailSend: props)` puis `detailSend.detailSend` | `({ detailSend }: Props)` |
| `form.tsx:23-28` | `arrayColor` recréé à chaque rendu | Constante hors du composant |
| `form.tsx:65-68` | `onInvalid` affiche toujours « Veuillez saisir une couleur » | Lire `errors` |
| `formRegister.tsx:14` | `.max(72)` en **caractères** ; le back limite à 72 **octets** | Un mot de passe avec accents passe le front et échoue au back : même `refine` (`new TextEncoder().encode(v).length <= 72`) |
| `list.tsx:45,112` | Log « Erreur du fetch API/REGISTER » dans la liste | Libellé correct |
| `list.tsx:217` | Affiche l'enum brut `NoStart` / `InProgress` | Table de libellés |
| `config/api.ts:4` | `process.env.EXPO_BASE_URL` : seules les `EXPO_PUBLIC_*` sont injectées | Supprimer le fallback ou renommer |
| `app/formSeance/page.tsx` | Réflexe Next.js : crée la route `/formSeance/page` | `app/seance/new.tsx` |
| `lib/schema/*.tsx` | Fichiers sans JSX en `.tsx` | `.ts` |
| `app.json` | `versionCode: 1` ignoré (`appVersionSource: remote`) ; `web` et `ios.supportsTablet` inutiles | Nettoyer (STORE-05, #111) |
| `AGENTS.md` | Pointe vers la doc SDK **54**, projet en SDK **57** | Mettre à jour (STORE-05) |
| `frontend/.npmrc` | `legacy-peer-deps` placé **au-dessus** du projet : `npm config get legacy-peer-deps` dans `chronoapp/` → `false` | Le déplacer dans `frontend/chronoapp/` (sinon ni EAS Build ni la CI ne le lisent) — ou mieux, résoudre le conflit de peer deps |
| `node_modules` local | Désynchronisé du lockfile (`zod 4.6.5` installé, `4.6.6` verrouillé ; `expo 57.0.30` vs `57.0.31`) | `npm ci` après chaque merge Dependabot |

---

## ♿ Accessibilité (FRONT-08, #94 — inchangé)

Aucun `accessibilityLabel` dans le projet (`grep -c accessibilityLabel` → 0), un seul `accessibilityRole` (boutons coureurs). Les champs email n'ont ni `keyboardType="email-address"` ni `autoCapitalize="none"` : Android met une majuscule au premier caractère. La liste complète des corrections est dans la [revue précédente](archive/2026-10-04/reviewFrontend.md) (section ♿) : elle reste valable telle quelle. Pour un premier passage, commence par les boutons icône (logout, poubelle, play/pause/reset) — c'est aussi ce qui te permettra de remplacer les `testID` par `getByRole("button", { name: "Pause" })` dans les tests.

---

## 📋 Plan d'action frontend

1. [ ] Reset via un seul endpoint serveur (§1.1) — **même PR** que `reviewBackend.md` §1.1
2. [ ] Garde `pending` + `stopInterval()` sur play / pause / reset (§1.2) → ferme FRONT-04
3. [ ] Retourner les cleanups (`list.tsx`, `result/[id].tsx`) et nettoyer le timeout de `BtnAndList` (§1.3, §2.4) → ferme FRONT-06
4. [ ] Types `Seance` / `SeanceWithRelations` en `string` + union `SeanceState` (§2.1) → ferme FRONT-05
5. [ ] `AuthContext` : `.catch/.finally`, `useCallback`, `useMemo` (§2.2) → ferme FRONT-07
6. [ ] Accessibilité minimale + clavier email (FRONT-08)
7. [ ] `.npmrc` au bon endroit, `npm ci`, passe qualité 🟡

> 💡 Exercice : extrais `computeElapsedSeconds(startedAt: string, pauses: TimerPause[], now: number)` en fonction pure dans `lib/chrono.ts`, écris 3 tests Jest (sans pause, avec pauses terminées, pause ouverte ignorée) **avant** de l'extraire, puis utilise-la dans `run/[id].tsx`. Ça règle l'erreur ESLint §2.3 et rend testable la logique la plus importante de l'app.
