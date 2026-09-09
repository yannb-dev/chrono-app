# Checklist — Points de contrôle avant une revue pédagogique

Liste de contrôle à parcourir systématiquement au début de chaque revue pédagogique (`/backend`, `/frontend`), constituée à partir des motifs de bugs récurrents relevés sur ce projet et sur Learning-App. Objectif : ne pas redécouvrir à chaque fois les mêmes classes de bugs.

---

## 1. Sécurité — Ownership (backend)

- [ ] Pour **chaque route** d'un fichier `route.ts` et **chaque verbe HTTP** (GET/POST/PATCH/DELETE), vérifier que le `where` Prisma filtre par `userId` (direct ou via la relation parente). Un pattern correct sur une route (ex: GET/DELETE) ne garantit rien sur les autres routes du même fichier (ex: PATCH) — à vérifier une par une, sans généraliser.
- [ ] Pour toute route qui **crée une ressource liée à un id fourni par le client** (ex: `seanceId` dans un POST `timerrunner`/`timerpause`), vérifier qu'un contrôle d'ownership de la ressource parente est fait _avant_ l'écriture — pas seulement sur les DELETE.
- [ ] Vérifier que la session/le token est contrôlé **avant** toute lecture du body (`request.json()`) ou requête Prisma.
- [ ] Vérifier qu'un `findMany`/`findUnique` sans filtre `userId` n'expose pas les données d'un autre utilisateur.

## 2. Validation Zod

- [ ] Un champ nullable côté client doit être déclaré `.nullable()` explicitement dans le schéma — `z.coerce.date()` appliqué à `null` ne rejette pas la valeur, il la coerce silencieusement vers l'epoch Unix (`new Date(null)` → 1970-01-01).
- [ ] Vérifier qu'un `z.enum([...])` couvre bien toutes les valeurs possibles envoyées par le formulaire (une option manquante = rejet 400 silencieux).
- [ ] `safeParse` plutôt que `parse` pour ne pas lever d'exception non gérée.

## 3. Transactions Prisma

- [ ] Dans un `prisma.$transaction(async (tx) => {...})`, **toutes** les opérations doivent utiliser `tx.`, jamais `prisma.` direct — sinon les opérations hors `tx` échappent au rollback.

## 4. Frontière serveur/client (Next.js)

- [ ] `Response.json`, `redirect()`, `fs` sont réservés au serveur — jamais dans un Client Component ou un event handler.
- [ ] `redirect()` en Server Component vs `router.push()` en Client Component — vérifier le bon choix selon le contexte d'exécution.
- [ ] Sérialisation `Date` SC → CC : une `Date` devient une `string` en traversant la frontière, wrapper avec `new Date()` côté Client Component.
- [ ] `await` présent sur `getServerSession(...)` — son absence rend le garde de session inopérant sans lever d'erreur visible.

## 5. State dérivé / anti-patterns React

- [ ] Un `useEffect` qui ne fait que recopier une prop dans un state est un state dérivé inutile — utiliser directement la prop.
- [ ] Pour un filtre/une pagination, préférer `useSearchParams()` / l'URL à un `useState` local qui se désynchronise de la navigation directe.
- [ ] `usePathname()` pour dériver un onglet actif de la route réelle plutôt que `useState` + `useEffect`.

## 6. Piège du zéro falsy

- [ ] Repérer tout `if (!valeur)` où `valeur` peut légitimement valoir `0` (durée de pause, somme agrégée, ratio, `resumedAt`/`pauseDurationMs`...) — `0` est falsy en JS, la condition traite alors "zéro" comme "absent".
- [ ] Préférer un test explicite (`!== null && !== undefined`) ou vérifier un autre champ non ambigu (ex: `endedAt` plutôt qu'une durée qui peut valoir 0).

## 7. Unités et conversions (ms/s, etc.)

- [ ] Vérifier que toutes les opérations arithmétiques sur des durées restent dans la **même unité** avant toute conversion — combiner (additionner/soustraire) d'abord, diviser en dernier.
- [ ] Chercher les implémentations dupliquées d'un même calcul dans un composant (souvent une correcte, une fausse) — signal qu'il faut extraire une fonction pure unique et testable.

## 8. React Native / Pressable

- [ ] Le callback `style` de `Pressable` reçoit `{ pressed, ... }`, pas un booléen — vérifier systématiquement la déstructuration `({ pressed }) => ...`.
- [ ] Styles centralisés (`lib/styles.ts`) plutôt que dupliqués par écran via des `StyleSheet.create()` locaux redondants.

## 9. Cohérence de typage TypeScript

- [ ] Un type manuel (`types/api.ts`) doit rester synchronisé avec le modèle Prisma réel (`Int` côté Prisma ≠ `string` côté type front).
- [ ] `String`/`Number`/`Boolean` (majuscule, type objet-boîte JS) ne doivent jamais remplacer `string`/`number`/`boolean` (primitifs).
- [ ] `instanceof Error` dans un `catch` — `err` est `unknown` en TypeScript strict.

## 10. Code mort / résidus

- [ ] Fonctions exportées jamais appelées (`grep` avant de conclure) — surtout si elles sont en plus cassées (mauvais verbe HTTP, body manquant).
- [ ] `console.log` de debug oubliés, en particulier dans un composant qui re-render fréquemment (ex: à chaque tick d'un chrono).
- [ ] Imports devenus inutilisés après un refactor.
- [ ] Variable réservée masquée (ex: `module` en scope Node.js).
- [ ] `return` manquant dans un corps de fonction (`filter`, `forEach`...) — bug silencieux, pas d'erreur levée.

## 11. Tests (Vitest / React Native Testing Library)

- [ ] `it.each(tableau)("titre $prop", ...)` doit interpoler les **vraies clés** de l'objet itéré (`$label`, pas `$routes`) — sinon les titres de test perdent toute valeur diagnostique.
- [ ] `beforeEach()` déclaré au niveau du `describe`, jamais dans le corps d'un `it`/`it.each`.
- [ ] `queryByText()` (vérifie une absence, retourne `null`) vs `getByText()` (vérifie une présence, lève une erreur) — ne pas confondre les deux.

## 12. Cohérence de contrat API

- [ ] Un même segment dynamique `[id]` ne doit pas désigner deux ressources différentes selon le verbe HTTP dans le même fichier de route (ex: `seanceId` pour GET/DELETE, id propre de la ressource pour PATCH) — source de confusion et de bugs futurs.
- [ ] Un nom de champ ambigu (ex: `resumedAt` pour stocker une durée et non une date) coûte plus cher à corriger à mesure qu'il se propage dans plusieurs fichiers — le repérer tôt.

---

---
