# Revue pédagogique — Chrono App (2026-09-09)

Revue en 4 parties : suivi des points ouverts de `revue1.md`/`revue2.md`, backend, frontend, puis une partie dédiée aux trois réflexions que tu as formulées toi-même (tests vs review, erreurs réseau, protection API). Portée : le diff non commité depuis `82d7331` (ajout de `register.tsx`, route `/api/auth/register` Zod-validée, route `timerrunner/byseance/[id]`, simplification de `timerrunner/route.ts`, suppression de `chrono.tsx`).

---

## 0. Suivi des points ouverts

| Point relevé dans revue1/revue2 | État au 2026-09-09 |
| --- | --- |
| Duplication `if/else` dans `timerrunner/route.ts` POST | **Corrigé** — un seul bloc `create` avec `chrono - (somPauses._sum.pauseDurationMs ?? 0)`, exactement la simplification suggérée dans `revue2.md`. |
| `components/chrono.tsx` mort | **Supprimé** (`git status` confirme la suppression du fichier). |
| Import mort `@react-native-picker/picker` dans `form.tsx` | **Supprimé** (plus aucune occurrence). |
| `list.tsx` : point toujours vert (`item.state` truthy) | **Corrigé** — `item.state === "Finish" ? "green" : "red"`. |
| `run/[id].tsx` : JSX retourné dans `fetchSeance` (non-render) | **Corrigé** — remplacé par `setErrorFetch(true); return;`. |
| `run/[id].tsx` : piège du zéro falsy sur `pauseDurationMs` | **Corrigé** — le split `pausedInProgress`/`pausedEnded` ne teste plus que `endedAt`. |
| `run/[id].tsx` `handleReset` : check dupliqué/incomplet | **Corrigé** — `responseTimerPause && responseTimerRunner && responseSeance`. |
| `timerpause/[id]/route.ts` PATCH sans `userId` | **Corrigé** (confirmé dans `revue2.md`, toujours vrai). |
| Ambiguïté du paramètre `[id]` dans `timerpause/[id]/route.ts` (`seanceId` pour GET/DELETE, id propre pour PATCH) | **Toujours ouvert** — non traité, comme déjà noté dans `revue2.md`. |
| `User.password @unique` dans `schema.prisma` | **Toujours ouvert** (mineur). |

Le point le plus important de ce suivi n'est pas dans ce tableau : il est en partie 4.2.

---

## 1. Revue du `/backend` — nouveauté : `auth/register`

### Points forts
- Le flux `register` est passé d'un `req.json()` non validé à un `RegisterSchema.safeParse` complet, avec règles de mot de passe (longueur, majuscule/minuscule/chiffre/caractère spécial) et confirmation via `.refine()` — bonne application du réflexe Zod déjà acquis.
- La nouvelle route `timerrunner/byseance/[id]` (DELETE) combine `seanceId` + `userId` dès l'écriture, sans qu'il ait fallu te le rappeler — confirmation du point positif déjà noté dans `revue2.md`.

### Bugs / points à corriger

**Incohérence de rigueur entre schéma backend et frontend — `registerSchema.ts` vs `formRegister.tsx`**

```ts
// backend/chronoapp/lib/schema/registerSchema.ts
email: z.string().min(1),

// frontend/chronoapp/lib/schema/formRegister.tsx
email: z.string().email("Mauvais format d'email"),
```

Le frontend valide le format d'email, le backend non. Le principe à retenir : **le backend est la seule ligne de défense qui compte réellement** (un client mobile n'est pas la seule porte d'entrée — Postman, curl, une future version de l'app contournent le frontend). Si le format n'est validé que côté client, n'importe quel appel direct à l'API peut créer un `User` avec un email invalide. À aligner : `z.string().email(...)` des deux côtés.

**Mauvais code de statut + fuite d'objet d'erreur brut — `register/route.ts` (catch)**

```ts
} catch (error) {
  console.error("Erreur du fetch API/REGISTER", error);
  return NextResponse.json({ error: error }, { status: 400 });
}
```

Deux problèmes :
1. Ce `catch` intercepte un échec de `bcrypt.hash` ou de `prisma.user.create` — une erreur **serveur**, pas une erreur de saisie utilisateur. Le statut correct est `500`, pas `400` (à réserver aux erreurs Zod, déjà gérées plus haut).
2. `{ error: error }` sérialise un objet `Error` en JSON : `message`/`stack` ne sont pas énumérables, donc le client reçoit `{}` la plupart du temps — inutile pour le débogage front, et risqué si un jour l'objet loggé contient plus de détails (ne jamais renvoyer un objet d'erreur brut au client, toujours un message construit à la main).

---

## 2. Revue du `/frontend`

### Bugs identifiés

**Le bug de `revue2.md` s'est reproduit exactement comme prévu — `login.tsx` ET `register.tsx`**

`revue2.md` avait signalé que `login.tsx` ne repasse jamais `loading` à `false` dans son `catch`, et avait explicitement prédit : *« c'est très probablement le piège numéro un que tu vas recroiser en écrivant `register.tsx` »*. C'est exactement ce qui s'est passé :

```ts
// login.tsx — catch toujours sans setLoading(false)
} catch (err) {
  console.error(err);
  setError("Erreur réseau");
  // setLoading(false) manquant
}

// register.tsx — pire : aucun des deux cas d'échec ne réagit
if (res.status === 201) {
  setLoading(false);
  setMessageConfirm(true);
  return;
}
// si res.status !== 201 (400 Zod, 409 email déjà pris) : rien ne se passe,
// ni setLoading(false), ni setError(true) → écran bloqué sur "Chargement" pour toujours
```

Sur `register.tsx`, c'est même plus grave que sur `login.tsx` : une erreur métier (email déjà utilisé, mot de passe non conforme) renvoyée par l'API avec un statut ≠ 201 ne déclenche **aucune** branche du code — pas de message d'erreur, pas de sortie du `loading`. Le `finally { setLoading(false); }` recommandé dans `revue2.md` reste à appliquer — voir partie 4.2 pour pourquoi ce n'est plus juste "une bonne pratique" mais le genre de chose qu'un test aurait empêché de repasser deux fois.

**Effet de bord dans le corps du render — `register.tsx:56-59`**

```ts
if (messageConfirm) {
  const timeoutId = setTimeout(() => {
    router.push("/(auth)/login");
  }, 3000);
  return (...)
}
```

`setTimeout` est appelé directement dans le corps de la fonction composant, pas dans un `useEffect`. À chaque re-render du composant pendant que `messageConfirm` est `true`, un nouveau timer est programmé (et `timeoutId` n'est jamais nettoyé avec `clearTimeout`). Le pattern correct :

```ts
useEffect(() => {
  if (!messageConfirm) return;
  const timeoutId = setTimeout(() => router.push("/(auth)/login"), 3000);
  return () => clearTimeout(timeoutId);
}, [messageConfirm]);
```

**`console.log` de debug oubliés**
- `register.tsx:30` — `console.log("cliqué")`.
- `form.tsx:58` — `console.log(errors)`.

Même famille déjà relevée sur les deux revues précédentes.

---

## 3. Avis technique sur l'architecture générale

**L'ownership est maintenant un réflexe stable.** Aucune régression sur les routes existantes, et `timerrunner/byseance/[id]` confirme que le pattern `where: { seanceId, userId }` est appliqué par défaut sur une route neuve, sans checklist consciente. Ce point, déjà souligné dans `revue2.md`, continue de se vérifier — c'est acquis.

**`apiFetch` (services/api.ts) traite toute erreur HTTP de façon indifférenciée**, et c'est le fil conducteur des trois réflexions que tu as formulées :

```ts
if (!response.ok) {
  throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
}
```

Un `401` (token expiré), un `404` (séance supprimée), un `500` (bug serveur) et une coupure réseau pure (le `fetch` qui rejette avant même d'obtenir une réponse) finissent tous dans le même `catch (err) { setErrorFetch(true) }` générique, un peu partout dans le code. Ce n'est pas un bug à proprement parler — le projet fonctionne — mais c'est très exactement la frontière que tu identifies toi-même comme non maîtrisée. Détail en 4.2.

---

## 4. Ce que tu as identifié toi-même — et qui est le vrai sujet de cette revue

Tu as fait trois observations justes en fin de session. Elles ne sont pas séparées les unes des autres : elles pointent toutes vers la même transition, du "faire fonctionner une fonctionnalité" vers "la rendre robuste en conditions réelles".

### 4.1 « Je passe du temps à faire des reviews de code alors qu'un test serait plus efficace »

Ce diagnostic est correct, et cette revue en est la preuve la plus concrète possible : **le bug `loading` non réinitialisé, signalé dans `revue2.md`, s'est reproduit à l'identique sur `register.tsx`** trois jours plus tard, alors même qu'il avait été explicitement anticipé par écrit. Une revue de code dépend de la mémoire du relecteur (toi, ou moi) au moment où il relit un fichier donné. Un test, lui, s'exécute automatiquement à chaque modification, sur tous les fichiers, sans avoir besoin de se souvenir de rien.

Un test aussi simple que celui-ci aurait intercepté ce bug avant tout commit :

```ts
it("repasse loading à false même si le fetch échoue", async () => {
  fetchMock.mockRejectedValueOnce(new Error("network"));
  render(<Register />);
  fireEvent.press(screen.getByText("S'inscrire"));
  await waitFor(() => expect(screen.queryByText(/Chargement/i)).toBeNull());
});
```

Vu que tu n'as aucune notion de test pour l'instant, ne pars pas sur tout le projet d'un coup. Ordre de priorité pour un premier ROI (retour sur investissement) maximal avec un minimum de nouveauté :

1. **Fonctions pures d'abord** (aucune notion de rendu ni de mock nécessaire) : les schémas Zod (`RegisterSchema`, `SeanceSchema` — vérifier qu'un `startedAt: null` est bien accepté, que `totalRunner` rejette une chaîne), et tout calcul isolable (`chrono - (somPauses._sum.pauseDurationMs ?? 0)`).
2. **Routes API ensuite** (Vitest + mock de `prisma`) : un test par bug déjà trouvé fait un excellent point de départ — "PATCH `seance/[id]` avec le `userId` d'un autre utilisateur renvoie 404/401, pas 200" verrouille définitivement la régression la plus grave qu'on a fermée dans `revue1.md`.
3. **Composants en dernier** (React Native Testing Library) — plus coûteux à écrire, à réserver aux flux critiques (`login`, `register`, `handlePlay`/`handlePause`).

Le module 7 de ta roadmap (« Tests React Native ») est déjà prévu, mais planifié après l'auth (module 6). Vu que les fonctionnalités sont maintenant toutes développées, il n'y a plus de raison de l'attendre — c'est probablement le module à avancer en priorité plutôt que d'ajouter une nouvelle fonctionnalité.

### 4.2 Gestion des erreurs réseau

C'est un point neuf par rapport aux deux revues précédentes, qui portaient sur des bugs de logique plutôt que sur la résilience. Trois lacunes concrètes, toutes visibles dans le code actuel :

1. **Aucune distinction entre les types d'échec.** `apiFetch` lève une seule `Error` générique que la panne vienne du réseau (pas de connexion), du serveur (500) ou d'une erreur métier (400 avec un message Zod détaillé côté backend, actuellement jeté à la poubelle côté client). Piste : un type `NetworkError | HttpError | ValidationError` distingué dans `apiFetch`, pour que chaque écran puisse afficher un message différent ("Vérifie ta connexion" vs "Email déjà utilisé").
2. **Aucun timeout.** Un `fetch` sans `AbortController` attend indéfiniment. Sur mobile (le scénario que ton propre module 4 de roadmap identifie déjà comme le vrai sujet nouveau par rapport au web), une connexion lente ou instable fait rester l'utilisateur bloqué sur "Chargement" sans jamais échouer ni réussir. Un timeout de 8-10s avec message dédié est le minimum.
3. **Aucune réaction à un token expiré.** `apiFetch` traite un `401` (token invalide/expiré) comme n'importe quelle autre erreur HTTP → l'utilisateur atterrit sur l'écran générique "Oups, une erreur !" au lieu d'être déconnecté et renvoyé vers `login`. C'est le seul endroit qui manque pour boucler proprement l'`AuthContext` déjà en place : un `401` devrait appeler `logout()`.

Concrètement, le point d'entrée pour progresser sur ce sujet est un seul fichier, `services/api.ts` — pas besoin de librairie externe pour commencer :

```ts
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: { /* ... */ },
    });
  } catch (err) {
    throw new NetworkError("Pas de connexion réseau");
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401) { /* déclencher logout() */ }
  if (!response.ok) throw new HttpError(response.status, await response.json());

  return response.json();
}
```

### 4.3 Protection API contre la saturation d'appels

C'est un vrai angle mort, et c'est normal à ce stade (rien dans ta roadmap ne l'aborde encore explicitement). Deux réalités concrètes, vérifiées sur ce projet :

- **Aucune limite de tentatives sur `/api/auth/login` ni `/api/auth/register`.** Rien n'empêche un script d'essayer des milliers de mots de passe par minute sur un email donné (brute force), ni de créer des milliers de comptes en boucle.
- **Aucun garde-fou côté écriture** (`POST /api/timerrunner`, `POST /api/timerpause`) : un client buggé (ou un bouton pressé deux fois avant que l'état `disabled` ne se mette à jour, ce qui est un risque réel sur `handlePlay`/`handlePause` en cas de latence réseau) peut créer des doublons en base sans qu'aucune limite ne l'en empêche.

Pour un projet perso à ce stade, pas besoin d'infrastructure lourde (Redis, Upstash) tout de suite — l'objectif est de comprendre le concept avant de le faire passer à l'échelle. Un compteur en mémoire par IP, avec expiration, suffit pour un premier apprentissage :

```ts
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string, max = 5, windowMs = 60_000) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}
```

À brancher en tête de `login/route.ts` et `register/route.ts`. Limite connue de cette approche (bonne à connaître, pas à corriger tout de suite) : elle ne survit pas à un redémarrage du serverless et ne fonctionne pas si l'API tourne sur plusieurs instances — c'est justement la raison pour laquelle un vrai déploiement utilise un store partagé (Upstash Redis, Vercel KV). Comprendre d'abord la version en mémoire donne le pourquoi avant d'apprendre l'outil.

Ce sujet n'existe pas encore dans `roadmap.md` — il aurait sa place comme complément du module 6 (Authentification mobile), juste après le flux JWT, puisque `login`/`register` sont la cible naturelle d'un premier rate limiting.

---

## Niveau évalué

Les fonctionnalités prévues sont toutes en place, et la discipline d'ownership — le point le plus critique des deux revues précédentes — est maintenant acquise et stable sur une route écrite sans supervision (`timerrunner/byseance`). Le bug restant le plus révélateur (`loading` jamais réinitialisé en cas d'échec) n'est pas un nouveau bug : c'est la preuve empirique, en une semaine, que la relecture manuelle ne suffit pas à empêcher la récidive d'un pattern déjà identifié — exactement le constat que tu as fait toi-même. Les deux autres lacunes (réseau, saturation) ne sont pas des régressions : ce sont des compétences qui n'ont simplement pas encore été pratiquées, ce qui est cohérent avec une roadmap qui n'a pas encore abordé ces modules. Les trois pistes de la partie 4 sont, dans cet ordre, la suite la plus rentable avant d'ajouter une nouvelle fonctionnalité au projet.
