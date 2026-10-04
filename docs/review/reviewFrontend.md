# Revue pédagogique — Frontend (Expo / React Native)

> Périmètre : `frontend/chronoapp/` — Expo SDK 57, expo-router, React Hook Form + Zod, SecureStore, Sentry.
> Date : 2026-10-03 · Objectif : publication Google Play Store.

---

## Vue d'ensemble

| Domaine | Note | Commentaire court |
| --- | --- | --- |
| Architecture (routes / services / context) | 🟢 | `services/api.ts` centralise tous les appels, `AuthContext` + `AuthGate` propres |
| Formulaires | 🟢 | RHF + `Controller` + `zodResolver`, `defaultValues` renseignés |
| Erreurs typées | 🟢 | `HttpError` / `NetworkError` / `extractErrorMessage` — très bon pattern |
| Gestion du 401 | 🔴 | Faite à 3 endroits différents, et `AuthContext` n'est jamais mis à jour |
| Duplication | 🟠 | Le même bloc `catch` copié 15 fois |
| Effets / cycle de vie | 🟠 | Cleanups `cancelled` non branchés, intervalles qui peuvent fuir |
| Types | 🟠 | `Date` dans les types de réponse API (c'est une `string` en JSON) |
| Accessibilité / UX | 🟠 | Suppression de toutes les séances sans confirmation, clavier email absent |
| Prêt pour le Store | 🔴 | `icon: ""`, nom `chronoapp`, dépendances inutiles |

---

## ✅ Ce qui est bien fait

1. **`apiFetch<T>` générique** avec timeout (`AbortController`), injection du token, et conversion en erreurs typées. C'est la bonne couche d'abstraction.
2. **`AuthGate` + `useSegments`** : la redirection selon l'état d'auth est déclarative et centralisée — le pattern recommandé par expo-router.
3. **`useAuth()` qui throw hors Provider** : erreur explicite plutôt qu'un `undefined` silencieux.
4. **SecureStore** pour le JWT (Keystore Android chiffré), pas AsyncStorage. ✔
5. **Garde `cancelled`** dans les fetchs : tu connais le problème du setState après démontage. (Il reste à le brancher correctement, voir §2.2.)
6. **`IconSymbol` avec `satisfies`** : typage strict du mapping SF Symbols → Material.
7. **`config/api.ts` qui throw au démarrage** si l'URL d'API manque : fail-fast, très bien pour un build EAS.

---

## 🔴 Priorité 1 — Bugs / risques réels

### 1.1 `apiFetch` suppose que toute réponse est du JSON

```ts
// services/api.ts:57-59
if (!response.ok) throw new HttpError(response.status, await response.json());
return response.json();
```

Deux cas cassent :
- **204 No Content** (une fois le backend corrigé, voir `reviewBackend.md` §1.1) → `response.json()` throw `SyntaxError`.
- **Erreur d'infra** (502 Vercel, page HTML de maintenance) → `response.json()` throw `SyntaxError`, ton UI affiche « Une erreur inattendue » au lieu du statut.

```ts
async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { message: text.slice(0, 200) }; }
}

if (!response.ok) throw new HttpError(response.status, await parseBody(response));
return (await parseBody(response)) as T;
```

Et les fonctions qui ne renvoient rien deviennent `apiFetch<void>`. Conséquence : les `if (deleteResponse)` / `if (response)` dans `account.tsx:27`, `list.tsx:107`, `run/[id].tsx:230` sont à remplacer par « pas d'exception = succès ».

### 1.2 Le 401 est géré à trois endroits… et l'état React n'est jamais synchronisé

1. `services/api.ts:51-55` : supprime le token + `router.replace("/(auth)/login")` + throw.
2. Dans **11** `catch` de composants : `if (err.status === 401) { deleteItemAsync; router.replace(...) }` → **déjà fait** par `apiFetch`, donc code mort.
3. `AuthGate` : redirige si `token === null`… mais **personne ne remet `token` à `null`** dans le Context lors d'un 401. Le state React dit « connecté » alors que le SecureStore est vide.

> 🎓 **Concept : une seule source de vérité.** Le token vit à deux endroits (SecureStore + state du Context) ; seul le Context doit piloter la navigation.

Solution simple : `apiFetch` notifie le Context au lieu de naviguer lui-même.

```ts
// services/api.ts
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };

if (response.status === 401 && !isAuthEndpoint) {
  onUnauthorized?.();               // ← plus de router ici
  throw new HttpError(401, { message: "Session expirée" });
}

// context/AuthContext.tsx
useEffect(() => { setUnauthorizedHandler(() => { logout(); }); }, []);
```

`logout()` vide SecureStore **et** le state → `AuthGate` redirige tout seul. Tu supprimes ensuite les 11 blocs 401 des composants (et `expo-router` disparaît de `services/`, qui n'a pas à connaître la navigation).

### 1.3 Supprimer **toutes** les séances en un tap, sans confirmation

```tsx
// list.tsx:136-142
<Pressable testID="delete-seance" onPress={handleDelete}>
  <IconSymbol name={"delete.forward"} />
```

Action destructive et irréversible sur une icône poubelle sans label. Tu as déjà fait une confirmation propre pour la suppression du compte (`account.tsx`) — réutilise `Alert.alert` au minimum :

```ts
Alert.alert("Tout supprimer ?", "Cette action est irréversible.", [
  { text: "Annuler", style: "cancel" },
  { text: "Supprimer", style: "destructive", onPress: handleDelete },
]);
```

### 1.4 Double tap = coureur enregistré deux fois

`BtnAndList.tsx:214-226` : le bouton coureur n'est désactivé qu'**après** la réponse du serveur. Deux taps rapides = deux `POST /timerrunner`. Ajoute un état « en cours » :

```ts
const [pending, setPending] = useState<Set<number>>(new Set());
// disabled={item.state || pending.has(item.number)}
```

(et la contrainte `@@unique` côté base, voir revue backend §2.3 — la défense doit exister des deux côtés).

### 1.5 Fuite d'intervalle dans `run/[id].tsx`

```ts
// run/[id].tsx:108-125
const handleStartChrono = (start: Date) => {
  intervalRef.current = setInterval(...)   // ← écrase l'ancien sans le clear
```

Si `handleStartChrono` est appelé alors qu'un intervalle tourne déjà, l'ancien n'est plus référencé → il tourne indéfiniment. Garde systématique :

```ts
if (intervalRef.current) clearInterval(intervalRef.current);
intervalRef.current = setInterval(...);
```

Et dans `handlePause` (`:258`), remets aussi `intervalRef.current = null` après le `clearInterval`.

---

## 🟠 Priorité 2 — React / TypeScript

### 2.1 La frontière JSON : `Date` vs `string` (gap identifié dans ton profil)

```ts
// types/api.ts:31-32
createdAt: Date;
startedAt: Date | null;
```

Ce qui arrive par `fetch` est du **JSON** : les dates sont des `string`. TypeScript te ment donc ici, et tu compenses partout avec `new Date(...)`. Les fixtures de tests le montrent : tantôt `new Date()`, tantôt `"2026-10-03T…"`.

```ts
export type SeanceResponse = {
  createdAt: string;        // ISO 8601
  startedAt: string | null;
  state: "NoStart" | "InProgress" | "Finish";   // ← union plutôt que string
  ...
};
```

Pour aller plus loin : **valider la réponse** avec un schéma Zod (`z.coerce.date()`) dans `apiFetch` → le type devient vrai à l'exécution.

### 2.2 Cleanups jamais branchés

```ts
// list.tsx:65-69
useFocusEffect(useCallback(() => { initListPage(); }, []));
//                                  ^ la fonction de cleanup retournée est jetée

// result/[id].tsx:64-66
useEffect(() => { initPage(); }, []);   // idem
```

`initListPage()` **retourne** `() => { cancelled = true }`, mais tu ne la retournes pas à React → `cancelled` reste toujours `false`. Fix d'un mot :

```ts
useFocusEffect(useCallback(() => initListPage(), []));
useEffect(() => initPage(), []);
```

Dans `run/[id].tsx:58-61`, le `setError(true)` du cas `!data` ne vérifie pas `cancelled`.

### 2.3 Le bloc `catch` dupliqué 15 fois

```ts
} catch (err) {
  if (err instanceof HttpError) { ...; setDetailError(extractErrorMessage(err.body)); }
  else if (err instanceof NetworkError) setDetailError(err.message);
  else setDetailError("Une erreur inattendue est survenue");
  setError(true);
}
```

Une fois le 401 centralisé (§1.2), il ne reste qu'une traduction erreur → message. Extrais-la :

```ts
// lib/errors.ts
export function toUserMessage(err: unknown): string {
  if (err instanceof HttpError) return extractErrorMessage(err.body);
  if (err instanceof NetworkError) return err.message;
  return "Une erreur inattendue est survenue";
}
```

Étape suivante (custom hook, que tu maîtrises) :

```ts
function useAsyncAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<void>) => {
    setLoading(true); setError(null);
    try { await fn(); } catch (e) { setError(toUserMessage(e)); } finally { setLoading(false); }
  };
  return { loading, error, clearError: () => setError(null), run };
}
```

Tu remplaces 3 `useState` (`loading`, `error`, `detailError`) par un seul hook dans chaque écran. Note : `error: boolean` + `detailError: string` est un état redondant — `error: string | null` suffit.

### 2.4 État dérivé dans `BtnAndList`

`arrayNumber` (boutons grisés) est **calculable** à partir de `seance.totalRunner` + `arrayResult`. Le stocker dans un second state oblige à synchroniser les deux (3 `setArrayNumber` différents + un `useEffect` sur `reset`).

```ts
const buttons = Array.from({ length: seance.totalRunner }, (_, i) => ({
  number: i + 1,
  done: arrayResult.some((r) => r.numberRunner === i + 1),
}));
```

> 🎓 **Règle React** : si une valeur peut être calculée pendant le rendu, ce n'est pas un state.

Le prop `reset` devient alors inutile : le parent fait `key={resetCount}` sur `<BtnAndList>` pour le remonter à zéro. Autres points :
- `reset: Boolean` (`:31`) → `boolean` (le type primitif, pas l'objet wrapper).
- `useEffect(..., [])` (`:42-66`) lit `seance` sans le déclarer en dépendance → `useState(() => seance.timerRunners)` en initialiseur suffit.
- `timeoutId` (`:120`) jamais nettoyé → setState possible après démontage.

### 2.5 Le reset de séance orchestré par le client

`run/[id].tsx:226-228` enchaîne 3 requêtes. Voir `reviewBackend.md` §2.1 : un seul `POST /api/seance/[id]/reset` en transaction. Côté UI, également : le bouton reset est `disabled={!stateChrono}` (`:370`) donc **impossible de réinitialiser pendant une pause**. Voulu ?

### 2.6 Petites erreurs React

| Fichier | Point |
| --- | --- |
| `account.tsx:27-29` | `deleteItemAsync` puis `logout()` qui refait `deleteItemAsync` |
| `account.tsx:66-69` | `[styles.btnSelect, , cond && ...]` — virgule en trop (trou dans le tableau) |
| `account.tsx:93`, `list.tsx:83`, `result/[id].tsx:80` | `styles.btnSelect` (style de **bouton**) appliqué à un `<Text>` |
| `login.tsx:49-53` | `if (status === 429) {X} else {X}` — branches identiques |
| `form.tsx:70-73` | `onInvalid` affiche toujours « Veuillez saisir une couleur », quelle que soit l'erreur |
| `form.tsx:24-29` | `arrayColor` recréé à chaque rendu → constante hors du composant |
| `ErrorMessage.tsx:9` | `function ErrorMessage(detailSend: props)` puis `detailSend.detailSend` → déstructure : `({ detailSend }: Props)` |
| `list.tsx:49,116` | Log « Erreur du fetch API/REGISTER » dans l'écran liste (copier-coller) |
| `list.tsx:185` | Affiche l'enum brut `NoStart` / `InProgress` à l'utilisateur → table de libellés |
| `AuthContext.tsx:19` | `getItemAsync().then()` sans `.catch` → si SecureStore échoue, `isLoading` reste `true` à vie (écran blanc) |
| `lib/schema/*.tsx` | Fichiers sans JSX en `.tsx` → `.ts` |
| `app/formSeance/page.tsx` | Réflexe Next.js : avec expo-router, ça crée la route `/formSeance/page`. Renomme en `app/formSeance.tsx` ou `app/seance/new.tsx` |
| `config/api.ts:4` | `process.env.EXPO_BASE_URL` : seules les variables `EXPO_PUBLIC_*` sont injectées dans le bundle → toujours `undefined` |

---

## ♿ Accessibilité et UX mobile

- **Inputs email** (`login.tsx:93`, `register.tsx`, `passwordReset.tsx`) : ajoute `keyboardType="email-address"`, `autoCapitalize="none"`, `autoComplete="email"`, `textContentType="emailAddress"`. Aujourd'hui Android met une majuscule à la 1ʳᵉ lettre.
- **Mot de passe** : `autoComplete="password"` / `"new-password"` → active le gestionnaire de mots de passe Google.
- **Boutons icône** (logout, poubelle, play/pause/reset) : aucun `accessibilityLabel` → TalkBack lit « bouton » sans contexte. Ajoute `accessibilityRole="button"` + `accessibilityLabel="Se déconnecter"`, etc. Bonus : ça te donne des sélecteurs de test sémantiques (`getByRole("button", { name: "Pause" })`) à la place des `testID`.
- **Choix de couleur** (`form.tsx:152`) : uniquement visuel → `accessibilityLabel="Bleu"` + `accessibilityState={{ selected: value === item }}`.
- **Clavier qui masque les champs** : `KeyboardAvoidingView` sur les écrans de formulaire.
- **Layouts en `%` de hauteur** (`styles.ts`) : fragile sur petits écrans / grand texte système. Préfère `flex: 1` + `ScrollView` pour les formulaires.
- **Le chrono s'arrête-t-il quand l'app passe en arrière-plan ?** L'affichage oui (JS en pause), mais le calcul repart de `Date.now() - startedAt` au retour → correct. 👍 Pense à `expo-keep-awake` pendant une séance (l'écran qui s'éteint en plein chrono est frustrant).

---

## 📦 Préparation Play Store (côté app)

| Élément | État | Action |
| --- | --- | --- |
| `app.json` `icon` | `""` | Icône 1024×1024 obligatoire |
| `app.json` `name` | `"chronoapp"` | Nom affiché sous l'icône → `"Chrono App"` |
| `android.package` | `com.yanndev181steam.chronoapp` | ⚠️ **Définitif** une fois publié. Vérifie qu'il te convient (ex. `fr.chronoappsport.app`) |
| `version` / `versionCode` | `appVersionSource: remote` + `autoIncrement` | ✔ bien configuré |
| `android.permissions` | Non restreint | Ajoute `"blockedPermissions"` pour retirer celles non utilisées (ex. `RECORD_AUDIO` ajoutée par certaines libs) |
| Sentry `tracesSampleRate: 1.0` | 100 % des transactions | `0.1`–`0.2` en production (quota) |
| Sentry DSN en dur | `_layout.tsx:10` | Pas secret, mais à passer en `EXPO_PUBLIC_SENTRY_DSN` pour séparer dev/prod |
| Dépendances inutiles | `@upstash/redis`, `expo-auth-session`, `expo-haptics` (jamais importées) ; `react-dom`, `react-native-web` (si pas de web) ; `expo-web-browser`, `expo-image` (listées en plugins mais non utilisées) | Vérifier avec `npx depcheck`, supprimer paquet **et** plugin `app.json`, puis `npx expo-doctor` → bundle plus léger, moins d’alertes Dependabot |
| `app.json` `web` | Présent | Inutile si pas de version web |
| `AGENTS.md` | Pointe vers la doc **SDK 54** | Tu es en SDK 57 → mettre à jour le lien |

---

## 📋 Plan d'action frontend

1. [ ] `apiFetch` robuste (204 / non-JSON) — **en même temps** que le fix 204 backend
2. [ ] 401 → `logout()` du Context, supprimer les 11 blocs 401 dupliqués
3. [ ] Confirmation avant « tout supprimer »
4. [ ] Anti double tap sur les boutons coureurs + garde `clearInterval`
5. [ ] Types API en `string` + union pour `state`
6. [ ] Brancher les cleanups `useEffect` / `useFocusEffect`
7. [ ] `toUserMessage()` puis hook `useAsyncAction`
8. [ ] Accessibilité : labels, clavier email
9. [ ] Store : icône, nom, dépendances inutiles, Sentry sample rate
