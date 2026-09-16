# Revue pédagogique — Chrono App (2026-09-15)

Revue ciblée, à la demande, sur un seul axe : **la codebase est-elle prête pour un premier déploiement, en vue de faire tester l'app sur Android par des testeurs externes ?** Contrôle croisé entre `docs/revue4.md`, `docs/TodoList.md`, l'état réel du code (diff non commité inclus), et une vérification effective (`npx tsc`, `next build`, `jest`).

---

## 0. Suivi de `revue4.md`

| Point relevé en `revue4.md` | État au 2026-09-15 |
| --- | --- |
| 1 — `postRegister`/`postLogin` appelaient `/api/seance` | **Corrigé** — pointent bien vers `/api/auth/register` et `/api/auth/login`. |
| 2 — Assertion `run/[id].test.tsx` qui ne peut jamais échouer (virgule manquante) | **Corrigé** dans le texte comparé — mais voir point 4 ci-dessous, plus grave : ce fichier ne teste pas le bon composant. |
| 3 — Mock de module incomplet (`patchTimerPause`, etc. non mockés) | Non revérifié en détail cette fois, hors périmètre (focus déploiement). |
| 4 — `describe` dupliqué + titre trompeur | **Toujours présent**, déplacé dans `tests/_[id]run.test.tsx` (lignes 27 et 36 : deux `describe("... Run - affichage des erreurs")` imbriqués et quasi identiques). |
| 5a — `seance/[id]` GET renvoie `200` + `null` au lieu de `404` | **Toujours pas corrigé.** |
| 5b — `P2025` capturé en `500` générique sur delete/update | **Corrigé** — `seance/[id]` (DELETE, PATCH) et `timerpause/[id]` (PATCH, DELETE) mappent maintenant `P2025 → 404`. |
| 6 — `401` utilisé à la place de `400` pour une erreur Zod | **Partiellement corrigé** — `timerrunner` POST renvoie bien `400` désormais, mais `timerpause/[id]` PATCH (`route.ts:51`) renvoie toujours `401`. |
| 7 — Timeout `apiFetch` à 1000ms | **Corrigé** — remonté à 10000ms. |

Le suivi est sérieux : 5 des 7 points sont traités ou en bonne voie. Mais cette revue ne portait plus sur le contenu des tests — elle portait sur "est-ce que ça déploie et tourne pour un inconnu sur son téléphone", et c'est là que des blocages neufs apparaissent, plus critiques que les points restants ci-dessus.

---

## 1. Bloquant — le build backend échoue, tel quel, aujourd'hui

```
$ npx next build
✓ Compiled successfully in 16.0s
  Running TypeScript ...
prisma.config.ts(5,24): error TS2305: Module '"prisma/config"' has no exported member 'env'.
prisma.config.ts(12,3): error TS2353: Object literal may only specify known properties, and 'engine' does not exist in type 'PrismaConfig'.
Failed to type check.
```

Cause : `prisma.config.ts` utilise `env()` et l'option `engine`, deux API introduites dans une version plus récente du **CLI** `prisma` que celle réellement installée.

```json
// package.json
"@prisma/client": "^6.19.3",
"prisma": "^6.12.0"        // trop ancien pour prisma.config.ts tel qu'il est écrit
```

Vercel (ou tout autre hébergeur qui lance `next build`) refusera ce build sans même toucher au reste du code. C'est le blocage numéro un, avant tous les autres : **rien de ce qui suit ne peut être vérifié en conditions réelles tant que celui-ci n'est pas levé.**

**Fix** : aligner `prisma` sur `^6.19.3` (même version que `@prisma/client`), ou réécrire `prisma.config.ts` pour l'API de la version 6.12.

---

## 2. Bloquant — le rate limiting va faire échouer *tous* les logins en prod

`backend/chronoapp/lib/rateLimit.ts` (nouveau fichier, non commité) :

```ts
import { Redis } from "@upstash/redis";
const redis = Redis.fromEnv();   // lève une erreur si les env vars sont absentes — au chargement du module
```

`Redis.fromEnv()` lit `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`. Ces variables **n'existent nulle part** — ni dans `backend/chronoapp/.env`, ni (a fortiori) sur un hébergeur qui n'a pas encore reçu de config. Comme `login/route.ts` importe `loginRateLimit` en haut de fichier, l'erreur se déclenche dès le premier appel à `POST /api/auth/login` : **login cassé en 500 pour tout le monde**, tant qu'un compte Upstash n'est pas créé et ses identifiants posés en variables d'environnement sur l'hébergeur.

---

## 3. Bloquant — l'URL de l'API frontend ne sortira jamais de ton réseau local

```
// frontend/chronoapp/.env (committé)
EXPO_PUBLIC_API_URL=http://10.79.78.233:3000   // committé — puis modifié localement en 10.177.14.233, non commité
```

```
// frontend/chronoapp/.env.production (committé)
# variante pour le build de prod        ← fichier vide, jamais rempli
```

Deux problèmes combinés :
- L'IP committée est une IP privée de ton réseau domestique, qui change en plus d'une session à l'autre (le diff non commité le montre : `10.79.78.233` → `10.177.14.233`). Un testeur sur son propre réseau (4G ou wifi différent) ne pourra jamais l'atteindre.
- `.env.production`, censé porter l'URL réelle du backend déployé, est un placeholder vide. `config/api.ts` retombe alors sur `http://localhost:3000` — l'adresse locale du téléphone du testeur lui-même.

**Fix** : une fois le backend déployé (point 1 + 2 résolus), renseigner `EXPO_PUBLIC_API_URL` dans `.env.production` avec l'URL publique réelle (ex. `https://chronoapp-backend.vercel.app`).

---

## 4. Bloquant — aucune configuration EAS/Android n'existe encore

Vérifié : pas de `eas.json`, pas de `android.package` dans `app.json`, pas de `extra.eas.projectId`. C'est attendu à ce stade (jamais fait), mais ça reste une étape obligatoire avant de pouvoir produire un binaire installable :

```json
// app.json — actuellement
"android": {
  "adaptiveIcon": { ... },
  "predictiveBackGestureEnabled": false
  // pas de "package": "com.xxx.chronoapp"
}
```

**Fix** : `eas init` (lie le projet à un compte Expo), `eas build:configure` (génère `eas.json` avec un profil `preview` adapté à la distribution interne), ajouter `android.package` dans `app.json`.

---

## 5. Bug non détecté en `revue4.md` — `run/[id].tsx` n'a en réalité aucun test

`tests/_[id]run.test.tsx`, dont le nom suggère qu'il teste `app/run/[id].tsx` (l'écran Play/Pause/Reset, cœur fonctionnel de l'app), fait en réalité :

```ts
import Result from "@/app/result/[id]";   // ❌ mauvais composant

describe("Run - affichage des erreurs", () => {
  describe("[id] Run - affichage des erreurs", () => {   // describe dupliqué, cf. revue4 point 4
    it("...", async () => {
      await render(<Result />);   // toujours Result, jamais le composant Run
      ...
```

C'est un quasi-doublon exact de `tests/_[id].test.tsx` (même import, mêmes assertions à une ligne près). Les 20 tests du projet passent (`jest` vert), ce qui masque le problème : **la fonctionnalité la plus critique de l'app (le chronomètre lui-même) n'est couverte par aucun test réel**, malgré la case cochée dans `docs/TodoList.md` (`- [x] /seance route.ts => /run [id].tsx + testing`). Un copier-coller de `_[id].test.tsx` vers `_[id]run.test.tsx` sans changer l'import du composant testé.

**Pas un bloquant pour déployer**, mais un point de vigilance réel : avant de faire tester par des externes, `run/[id].tsx` mérite un vrai fichier de test qui importe le bon composant.

---

## 6. Points déjà connus, non bloquants, à garder en tête

- `timerpause/[id]` PATCH renvoie encore `401` sur une erreur Zod (`route.ts:51`) → un payload malformé déconnectera un testeur avec un message "session expirée" trompeur (cf. revue4 point 6, toujours ouvert sur cette route précise).
- `seance/[id]` GET renvoie `200` + corps `null` au lieu de `404` quand la séance n'existe pas (cf. revue4 point 5a, toujours ouvert).
- `describe` dupliqué dans `tests/_[id]run.test.tsx` (cosmétique, cf. revue4 point 4).

---

## Niveau évalué

Le travail de correction depuis `revue4.md` est réel et suit la bonne méthode (5 des 7 points traités, dont le plus grave — l'URL cassée de login/register). Mais cette session révèle un écueil différent de celui des revues précédentes : **jusqu'ici, le code était testé en local, sur ta propre machine, avec ton propre réseau — un contexte qui masque plusieurs classes de problèmes qui n'apparaissent qu'au moment de sortir de cet environnement** : version d'outil non alignée (`prisma.config.ts`), variable d'environnement jamais provisionnée (Upstash), configuration réseau non paramétrable (IP en dur), configuration de build jamais initialisée (EAS). Aucun de ces points n'est un bug de logique métier — ce sont tous des points de configuration/infrastructure, un type de problème nouveau par rapport aux revues 1 à 4, qui portaient sur la qualité du code applicatif. C'est une étape normale et attendue de la première mise en production : ce n'est pas un signal de régression, c'est un chapitre qui n'avait pas encore été ouvert.

**Priorité concrète pour la prochaine session**, dans cet ordre :
1. Aligner la version de `prisma` (CLI) sur `@prisma/client` pour que `next build` passe.
2. Créer le compte Upstash et poser `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` sur l'hébergeur backend.
3. Déployer le backend (Vercel/Railway), récupérer l'URL publique.
4. Renseigner cette URL dans `.env.production` du frontend.
5. `eas init` + `eas build:configure` + `android.package` dans `app.json`.
6. Corriger le `401` restant de `timerpause/[id]` PATCH et le `200`/`null` de `seance/[id]` GET.
7. Réécrire `tests/_[id]run.test.tsx` pour qu'il importe et rende réellement `run/[id].tsx`.
8. `eas build --platform android --profile preview` → distribuer le lien aux testeurs.
