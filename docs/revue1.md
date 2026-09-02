# Revue pédagogique — Chrono App (2026-09-01)

Revue en 3 parties : backend, frontend, avis technique sur l'architecture générale.

---

## 1. Revue du `/backend`

**Stack** : Next.js 16 (API Routes only) + Prisma 6 + JWT maison (`jsonwebtoken` + `bcryptjs`), sans NextAuth cette fois — cohérent avec le module roadmap "Auth mobile JWT sans cookies".

### Points forts confirmés

- `getUserIdFromRequest` : bon réflexe de centraliser la lecture/vérification du Bearer token dans une fonction réutilisée par toutes les routes.
- `register` : hash bcrypt, mot de passe jamais renvoyé dans la réponse, contrôle d'unicité de l'email avant création.
- Zod `safeParse` systématique sur les payloads POST/PATCH, avec messages d'erreur différenciés.
- `seance/[id]` GET/DELETE : ownership correctement vérifié via `where: { id, userId }` (le filtrage combiné id+userId sur `findUnique`/`delete` est le bon pattern, déjà acquis).

### Bugs identifiés

CORRIGE **Critique — faille d'ownership (PATCH `seance/[id]/route.ts:86`)**

```ts
const udpateSeance = await prisma.seance.update({
  where: { id },   // userId manquant !
```

Contrairement au GET et au DELETE du même fichier, le PATCH ne filtre pas par `userId`. N'importe quel utilisateur authentifié peut modifier le `startedAt` (démarrer/arrêter le chrono) d'une séance appartenant à un autre utilisateur, en connaissant juste son `id`. C'est exactement le pattern d'ownership déjà maîtrisé ailleurs dans ce fichier — juste oublié sur cette route.

CORRIGE **Critique — pas de vérification d'ownership avant écriture liée (`timerrunner/route.ts` et `timerpause/route.ts`, POST)**

Les deux routes POST créent une ressource liée à un `seanceId` fourni par le client, sans jamais vérifier que cette `seance` appartient à `userId`. Un utilisateur authentifié peut donc injecter des `TimerRunner`/`TimerPause` sur la séance d'un autre utilisateur.

CORRIGE **Critique — aucune vérification d'ownership sur `timerrunner/[id]/route.ts` (GET et DELETE)**

```ts
const timerSessionSearch = await prisma.timerRunner.findUnique({ where: { id } });
...
const deleteSession = await prisma.timerRunner.delete({ where: { id } });
```

Aucun filtre `userId` (direct ou via la relation `seance.userId`). N'importe quel utilisateur connecté peut lire ou supprimer le `TimerRunner` de n'importe qui en devinant/énumérant un `id`. C'est le bug le plus sérieux du lot : lecture ET suppression arbitraires.

CORRIGE **Critique — `timerpause/[id]/route.ts` GET et PATCH**

- GET (`findMany({ where: { seanceId: id } })`) : pas de filtre `userId`, expose les pauses de n'importe quelle séance.
- PATCH (`update({ where: { id } })`) : même trou que sur `seance/[id]` — pas de filtre `userId`.

CORRIGE **Incohérence de contrat dans un seul fichier (`timerpause/[id]/route.ts`)**

Le segment dynamique `[id]` désigne tantôt le `seanceId` (GET, DELETE — `where: { seanceId: id }`), tantôt l'`id` propre du `TimerPause` (PATCH — `where: { id }`). Même sémantique de paramètre, deux significations différentes selon le verbe HTTP : c'est une source de confusion et de bugs futurs (le prochain refactor mélangera forcément les deux). À trancher : soit deux routes distinctes (`/api/timerpause/by-seance/[seanceId]` et `/api/timerpause/[id]`), soit documenter clairement.

CORRIGE **Bug fonctionnel — coercition Zod silencieuse sur "stop" (`seanceSchema.ts:11` + usage côté front)**

```ts
export const SeanceUpdateSchema = z.object({
  startedAt: z.coerce.date(),
});
```

Le front envoie `{ startedAt: null }` pour réinitialiser le chrono (`chrono.tsx`, `handleStop`). `z.coerce.date()` appliqué à `null` ne rejette pas la valeur : `new Date(null)` retourne l'epoch Unix (`1970-01-01`). Le "stop" ne remet donc jamais `startedAt` à `null` en base, il le pousse en 1970 — ce qui casse silencieusement tous les calculs de durée à la prochaine relecture (`Date.now() - epoch` = plusieurs dizaines d'années en secondes). Le schéma doit être `z.coerce.date().nullable()`.

CORRIGE **Modélisation Prisma — nommage trompeur**

`TimerPause.resumedAt` (type `Int?`) ne stocke pas une date de reprise mais une **durée** de pause en millisecondes (`endedAt.getTime() - pausedAt.getTime()`, calculé côté PATCH `timerpause/[id]/route.ts:66-67`). Le nom suggère un timestamp, la valeur est une durée. Renommer en `pauseDurationMs` clarifierait tout le code qui en dépend (front et back).

CORRIGE **Duplication évitable (`timerrunner/route.ts:50-98`)**

Les deux branches du `if (!somPauses._sum.resumedAt)` sont identiques à l'exception de la soustraction du total de pause. À simplifier en un seul bloc :

```ts
const chrono =
  safeTimerRunner.data.endedAt.getTime() - searchSeance.startedAt.getTime();
const duration = chrono - (somPauses._sum.resumedAt ?? 0);
```

CORRIGE
**Détail de modélisation** : `User.password @unique` dans `schema.prisma:19` — inoffensif (deux hash bcrypt salés sont virtuellement toujours différents) mais sémantiquement étrange ; ce n'est pas la propriété qu'on veut réellement contraindre.

---

## 2. Revue du `/frontend`

**Stack** : Expo 54 (SDK récent) + Expo Router + React Hook Form + Zod + `expo-secure-store` — cohérent avec les modules 3/4/6 de la roadmap mobile (navigation, connexion au backend, JWT sans cookies).

### Points forts confirmés

- `AuthContext` + `AuthGate` : bon pattern de garde de route basé sur les segments Expo Router (`segments[0] === "(auth)"`), équivalent mobile du pattern "vérifier session → redirect" déjà acquis côté Next.js.
- `expo-secure-store` pour le token plutôt qu'un state React seul — bon réflexe de sécurité mobile.
- `apiFetch<T>` générique avec injection automatique du Bearer token — bonne factorisation.
- Schémas Zod séparés par action (`startChronoSchema`, `pausedSchema`, `endedSchema`) plutôt qu'un seul schéma fourre-tout — lisible.

### Bugs identifiés

CORRIGE **Bug d'unités, silencieux — `chrono.tsx:44-58` (calcul initial de `elapsed`)**

```ts
const totalPause = seance.timerpauses.reduce(
  (t, item) => t + Number(item.resumedAt),
  0,
); // en ms
setElapsed(Math.floor((Date.now() - startedAt) / 1000) - totalPause); // secondes - millisecondes !
```

`totalPause` est en millisecondes, mais il est soustrait à une valeur déjà convertie en secondes. Comparer avec `handleStartChrono` (ligne 65-86), qui fait la soustraction **avant** de diviser par 1000 — c'est la version correcte. Résultat : au chargement d'une séance ayant eu au moins une pause, l'affichage initial de `elapsed` est faux (décalage de plusieurs ordres de grandeur) jusqu'à ce que l'utilisateur relance le chrono. Deux implémentations du même calcul, une juste et une fausse, dans le même fichier — signal qu'il faut extraire une seule fonction `computeElapsed(startedAt, pausesMs)`.

COORIGE **Bug de logique — `handlePlay`, branche pause (`chrono.tsx:129`)**

```ts
if (response.resumedAt) { setTimerPauseInProgress(null); ... }
```

Si une pause dure moins d'une milliseconde côté serveur (`resumedAt === 0`), la condition est fausse (0 est falsy) et l'app reste bloquée en état "pause" sans jamais relancer l'intervalle. Cas limite, mais même famille de piège que le `!somPauses._sum.resumedAt` côté backend — à corriger avec un test explicite (`response.resumedAt !== null && response.resumedAt !== undefined`, ou mieux : contrôler `response.endedAt`).

CORRIGE **Bug d'état non réinitialisé — `handleStop` (`chrono.tsx:146-165`)**

Le stop remet `elapsed` à 0 et arrête l'intervalle, mais ne réinitialise ni `timerPausesLocal.current` (le `useRef` local) ni `timerPauseInProgress`. Si l'utilisateur relance un chrono juste après un stop, les anciennes pauses locales pollueront le calcul de `handleStartChrono`.

CORRIGE **Bug d'interaction — `list.tsx:53`**

```ts
style={(pressed) => [styles.btnCourse, pressed && styles.btnPressed]}
```

Le callback `style` de `Pressable` reçoit `{ pressed: boolean, ... }`, pas un booléen. Comparer avec `form.tsx:90`, `login.tsx:63` et `chrono.tsx:111`, qui font tous correctement `({ pressed }) => ...`. Ici, `pressed` est l'objet entier, toujours truthy → `styles.btnPressed` s'applique en permanence, indépendamment de l'appui réel.

CORRIGE **Bug d'UX — état de chargement bloquant sur erreur (`form.tsx:29-45`)**

`setLoading(true)` est appelé au début de `onSubmit`, mais en cas d'erreur (`catch`), `setLoading` n'est jamais repassé à `false`. Or le message `{error && <Text>Erreur de soumission</Text>}` est affiché dans la branche `{!loading ? (...) : ...}` — c'est-à-dire précisément la branche qui disparaît quand `loading` reste `true`. En cas d'échec réseau, l'utilisateur reste bloqué sur "Chargement ..." sans jamais voir le message d'erreur ni pouvoir réessayer.

CORRIGE **Fonctions mortes et cassées — `services/api.ts:47-53`**

```ts
export function postLogin() {
  return apiFetch("/api/auth/login");
}
export function postRegister() {
  return apiFetch("/api/auth/register");
}
```

Ni appelées nulle part (vérifié par recherche), ni fonctionnelles si elles l'étaient : pas de `method: "POST"`, pas de `body`. `login.tsx` fait d'ailleurs son propre `fetch` en dur plutôt que de passer par ce service — incohérence d'architecture (tous les autres appels passent par `services/api.ts`, sauf l'auth). À supprimer ou à réellement implémenter et brancher.

CORRIGE **Typage incohérent avec le contrat backend — `types/api.ts:1-16`**

- `TimerRunner.numberRunner: string` et `.duration: string` alors que Prisma définit `numberRunner Int` et `duration Int` (le JSON renvoyé par l'API sera bien un nombre). Ce décalage force des `Number(item.duration)` défensifs un peu partout dans le code (`chrono.tsx:135`, `run/[id].tsx:84`) au lieu de typer juste dès le départ.
- `TimerRunner.seanceId: String` — `String` (majuscule) est le type "objet boîte" JS, pas le type primitif `string`. Erreur de frappe classique en TypeScript, à corriger partout où elle apparaît.

**État mort — `index.tsx:11`**

`const [loading, setLoading] = useState(true);` n'est jamais lu ni mis à jour dans le composant — à supprimer.

**`console.log` de debug oublié — `viewChrono.tsx:7`**

Se déclenche à chaque tick de chrono (toutes les secondes). Même famille de résidu de debug déjà relevée sur le projet Learning-App.

---

Partiellement corrigé — à rouvrir :

- handleStop (chrono.tsx) : timerPauseInProgress est bien remis à null, mais timerPausesLocal.current n'est toujours pas réinitialisé. Si tu relances un chrono après un stop sur le même écran monté, les
  anciennes pauses locales pollueront encore le calcul suivant.
- types/api.ts : duration et seanceId sont corrigés, mais numberRunner est toujours typé string alors que Prisma le définit en Int.

Non traité (marqué CORRIGE mais inchangé dans le code) :

- L'ambiguïté du paramètre [id] dans timerpause/[id]/route.ts (seanceId pour GET/DELETE, id propre pour PATCH) — c'était une recommandation d'architecture, rien n'a changé dans le fichier.
- User.password @unique dans schema.prisma — toujours présent (mineur).
- La duplication de branches dans timerrunner/route.ts POST — toujours dupliquée (mineur, juste enveloppée dans le nouveau if/else d'ownership).

Rien de critique ne reste ouvert — les deux points "partiellement corrigés" sont mineurs comparés aux failles d'ownership, qui sont, elles, toutes bien fermées.

## 3. Avis technique sur l'architecture générale

**Cohérence globale** : le découpage `backend/chronoapp` (Next.js API-only, exposé publiquement) + `frontend/chronoapp` (Expo, client pur consommant l'API via JWT) est la bonne architecture pour ce cas d'usage, et applique directement ce qui était prévu dans la roadmap mobile (réutiliser le backend Next.js existant sans le réécrire). Le remplacement de NextAuth (cookies navigateur) par un JWT `Authorization: Bearer` fait main est le bon choix technique pour un client mobile sans cookies — et c'est cohérent avec le module 6 de la roadmap.

**Le point structurel le plus important à corriger avant d'ajouter des features : l'ownership n'est pas appliqué de façon systématique.** Sur 4 des 8 endpoints qui écrivent ou lisent des données liées à un utilisateur, le filtre `userId` (direct ou via la relation `seance`) est absent. Ce n'est pas un problème ponctuel de code, c'est un problème de discipline : chaque route qui touche une ressource devrait, par réflexe, répondre à la question "cette ressource appartient-elle bien à `userId` ?" avant de lire/écrire/supprimer — exactement le principe déjà maîtrisé et appliqué sur `seance/[id]` GET/DELETE, mais pas généralisé aux autres fichiers. Avant d'ajouter des features, une passe systématique route par route avec cette seule question en tête est recommandée.

**Le calcul de durée est fragile parce qu'il est dupliqué et basé sur des horloges client.** Le "temps de course" et le "temps de pause" reposent entièrement sur des `Date` envoyées par le client (`endedAt`, `pausedAt`) plutôt que sur `new Date()` côté serveur au moment de la requête. Pour un chrono de groupe, ça expose à deux problèmes : (1) un client avec une horloge désynchronisée fausse tous les temps, (2) la logique de calcul (soustraction du total de pause) existe en double — une fois côté backend (POST `timerrunner`), une fois côté frontend (`chrono.tsx`, avec le bug d'unité relevé plus haut) — deux endroits à maintenir en synchronisation manuelle. Piste de refonte : faire calculer `duration` uniquement côté serveur à partir de `new Date()` au moment où la requête arrive (le serveur devient la seule source de vérité temporelle), le client se contentant d'envoyer "j'appuie sur le bouton maintenant" sans horodatage.

**Le nommage `resumedAt` pour une durée de pause (et non une date de reprise) mérite d'être corrigé avant que le code ne grossisse** — ce type d'incohérence de nom devient plus coûteux à corriger à mesure que le modèle se propage dans plus de fichiers (déjà présent dans 2 schémas backend, 1 type frontend, et 3 composants).

**Niveau évalué** : les bugs relevés ici (falsy zero, coercition Zod silencieuse, unités ms/s, callback `Pressable` mal déstructuré) sont exactement la même famille que ceux déjà rencontrés et corrigés sur Learning-App — signe d'une progression réelle (l'architecture SC/CC-équivalente, les patterns Zod/Prisma/ownership sont là), mais aussi que ces classes de bugs ne sont pas encore devenues des réflexes de relecture systématiques. Le point d'ownership en particulier vaut la peine d'être internalisé comme check-list avant tout merge de route API, sur ce projet comme sur les prochains.
