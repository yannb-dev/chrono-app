# Corrections à appliquer

> Généré depuis : reviewBackend.md, reviewFrontend.md, reviewSecurity.md, reviewTestingLibrary.md · Date : 2026-10-04 · **Mis à jour : 2026-10-28** (revue du 2026-10-27)
> Points `BACK-01` à `TEST-07` : revue du 2026-10-04 (liens vers `review/archive/2026-10-04/`). Points ajoutés le 2026-10-28 : `BACK-14+`, `FRONT-14+`, `SEC-09+`, `STORE-06`, `TEST-08+`, `CI-03` (liens vers les revues courantes).
> Ligne **Revue 2026-10-27** : constat de la nouvelle revue sur un point existant. ⚠️ = issue fermée dont le critère de fin n'est pas atteint → ne pas passer ce point à `corrigé`.
> Champ `Réflexe` : identifiant du point de vigilance dans `3_Projets/docs/LEARNING.md` §4 (mis à jour quand l'issue est fermée).
> Trier ce fichier (supprimer, changer la priorité, passer `Statut` à `ignoré`) **avant** de lancer « Crée les issues ».

## Récapitulatif

| ID | Titre | Priorité | Labels | Issue |
| --- | --- | --- | --- | --- |
| SEC-01 | Mettre à jour Next.js (CVE critique) | P1 | security, backend, bug, P1 | #68 |
| SEC-02 | Rendre le rate limit du reset password non contournable | P1 | security, backend, bug, P1 | #69 |
| SEC-03 | Exiger le mot de passe pour supprimer le compte | P1 | security, backend, frontend, enhancement, P1 | #70 |
| BACK-01 | Renvoyer de vrais 201/204 et rendre `apiFetch` compatible | P1 | backend, frontend, bug, P1 | #71 |
| BACK-02 | Empêcher l'enregistrement d'un coureur en double (base) | P1 | backend, bug, P1 | #72 |
| FRONT-01 | Centraliser le 401 et synchroniser `AuthContext` | P1 | frontend, bug, P1 | #73 |
| FRONT-02 | Confirmer avant de supprimer toutes les séances | P1 | frontend, bug, P1 | #74 |
| FRONT-03 | Bloquer le double tap sur les boutons coureurs | P1 | frontend, bug, P1 | #75 |
| STORE-01 | Créer la page web de suppression de compte | P1 | store, backend, enhancement, P1 | #76 |
| STORE-02 | Publier la politique de confidentialité et remplir Data safety | P1 | store, documentation, P1 | #77 |
| STORE-03 | Finaliser l'identité de l'app (icône, nom, package) | P1 | store, frontend, enhancement, P1 | #78 |
| CI-01 | Activer les protections de sécurité GitHub | P1 | ci, security, enhancement, P1 | #79 |
| BACK-03 | Rentrer tous les appels Prisma dans les `try` | P2 | backend, bug, P2 | #80 |
| BACK-04 | Créer un endpoint de reset de séance transactionnel | P2 | backend, frontend, enhancement, P2 | #81 |
| BACK-05 | Valider les dates envoyées par le client | P2 | backend, security, enhancement, P2 | #82 |
| BACK-06 | Ajouter les règles métier de `POST /timerrunner` | P2 | backend, bug, P2 | #83 |
| BACK-07 | Corriger les 404 manquants et le code mort P2025 | P2 | backend, bug, P2 | #84 |
| BACK-08 | Ajouter index et relations dans le schéma Prisma | P2 | backend, enhancement, P2 | #85 |
| BACK-09 | Rate limit sur les routes métier et pagination des séances | P2 | backend, security, enhancement, P2 | #86 |
| SEC-04 | Appliquer les en-têtes de sécurité à toutes les routes | P2 | security, backend, enhancement, P2 | #87 |
| SEC-05 | Figer l'algorithme JWT et valider les variables d'environnement | P2 | security, backend, enhancement, P2 | #88 |
| SEC-06 | Gérer l'indisponibilité d'Upstash (fail-closed) | P2 | security, backend, bug, P2 | #89 |
| FRONT-04 | Corriger la fuite d'intervalle du chronomètre | P2 | frontend, bug, P2 | #90 |
| FRONT-05 | Typer les réponses API comme du JSON (dates en `string`) | P2 | frontend, enhancement, P2 | #91 |
| FRONT-06 | Brancher les cleanups de `useEffect` / `useFocusEffect` | P2 | frontend, bug, P2 | #92 |
| FRONT-07 | Gérer l'échec de lecture du SecureStore au démarrage | P2 | frontend, bug, P2 | #93 |
| FRONT-08 | Améliorer l'accessibilité et les champs de saisie | P2 | frontend, enhancement, P2 | #94 |
| FRONT-09 | Supprimer les dépendances inutilisées | P2 | frontend, security, enhancement, P2 | #95 |
| STORE-04 | Configurer Sentry pour la production | P2 | store, frontend, enhancement, P2 | #96 |
| TEST-01 | Corriger les 4 tests faux positifs | P2 | tests, bug, P2 | #97 |
| TEST-02 | Tester `services/api.ts` | P2 | tests, frontend, enhancement, P2 | #98 |
| TEST-03 | Mettre en place les premiers tests backend (Vitest) | P2 | tests, backend, enhancement, P2 | #99 |
| CI-02 | Ajouter un workflow CI (lint, types, tests) | P2 | ci, enhancement, P2 | #100 |
| BACK-10 | Harmoniser les routes `/timerpause` | P3 | backend, enhancement, P3 | #101 |
| BACK-11 | Factoriser l'authentification des routes (`withAuth`) | P3 | backend, enhancement, P3 | #102 |
| BACK-12 | Corrections de qualité backend | P3 | backend, enhancement, P3 | #103 |
| BACK-13 | Purger les tokens de reset expirés | P3 | backend, security, enhancement, P3 | #104 |
| SEC-07 | Ajouter un endpoint de déconnexion de tous les appareils | P3 | security, backend, enhancement, P3 | #105 |
| SEC-08 | Statuer sur l'énumération à l'inscription / vérification d'email | P3 | security, backend, documentation, P3 | #106 |
| FRONT-10 | Factoriser la gestion d'erreurs (`toUserMessage`, `useAsyncAction`) | P3 | frontend, enhancement, P3 | #107 |
| FRONT-11 | Supprimer l'état dérivé de `BtnAndList` | P3 | frontend, enhancement, P3 | #108 |
| FRONT-12 | Corrections de qualité frontend | P3 | frontend, enhancement, P3 | #109 |
| FRONT-13 | Garder l'écran allumé pendant une séance | P3 | frontend, enhancement, P3 | #110 |
| STORE-05 | Nettoyer la configuration Expo (permissions, web, AGENTS.md) | P3 | store, frontend, enhancement, P3 | #111 |
| TEST-04 | Ajouter `eslint-plugin-jest` | P3 | tests, enhancement, P3 | #112 |
| TEST-05 | Tester le comportement plutôt que l'implémentation | P3 | tests, enhancement, P3 | #113 |
| TEST-06 | Couvrir les couches non testées | P3 | tests, frontend, enhancement, P3 | #114 |
| TEST-07 | Nettoyer l'outillage Jest | P3 | tests, enhancement, P3 | #115 |
| BACK-14 | Rendre les `DELETE` de collection idempotents (reset cassé) | P1 | backend, bug, P1 | #166 |
| BACK-15 | Fiabiliser `DELETE /api/user` (body, Upstash, token invalide) | P1 | backend, security, bug, P1 | #167 |
| SEC-09 | Supprimer l'énumération de comptes sur la suppression web | P1 | security, backend, bug, P1 | #168 |
| SEC-10 | Régénérer la clé Resend et le mot de passe du compte testeur | P1 | security, bug, P1 | #169 |
| STORE-06 | Compléter la politique de confidentialité (Upstash, Resend) et Data safety | P1 | store, documentation, P1 | #170 |
| BACK-16 | Ajouter les règles métier de `POST /timerpause` | P2 | backend, bug, P2 | #171 |
| BACK-17 | Borner les dates côté serveur et refuser les durées négatives | P2 | backend, security, bug, P2 | #172 |
| BACK-18 | Contrôler les transitions d'état d'une séance | P2 | backend, enhancement, P2 | #173 |
| BACK-19 | Paginer `GET /api/seance` | P2 | backend, enhancement, P2 | #174 |
| SEC-11 | Utiliser `env` validé dans toutes les routes | P2 | security, backend, bug, P2 | #175 |
| SEC-12 | Passer HSTS en production (2 ans) | P2 | security, backend, enhancement, P2 | #176 |
| FRONT-14 | Bloquer le double tap sur play / pause / reset | P2 | frontend, bug, P2 | #177 |
| TEST-08 | Corriger les 3 faux positifs restants | P2 | tests, bug, P2 | #178 |
| TEST-09 | Corriger `afterEach` importé de `node:test` et figer les dates | P2 | tests, bug, P2 | #179 |
| TEST-10 | Rendre réalistes les mocks `fetch` du formulaire web | P2 | tests, bug, P2 | #180 |
| TEST-11 | Couvrir les règles métier et les cas d'erreur non testés | P2 | tests, enhancement, P2 | #181 |
| CI-03 | Placer `.npmrc` dans le projet Expo et resynchroniser les dépendances | P2 | ci, frontend, bug, P2 | #182 |
| FRONT-15 | Extraire le calcul du chrono en fonction pure | P3 | frontend, enhancement, P3 | #183 |
| FRONT-16 | Stabiliser `logout` et la `value` d'`AuthContext` | P3 | frontend, enhancement, P3 | #184 |
| FRONT-17 | Corrections de qualité frontend (revue 2026-10-27) | P3 | frontend, enhancement, P3 | #185 |
| BACK-20 | Corrections de qualité backend (revue 2026-10-27) | P3 | backend, enhancement, P3 | #186 |
| TEST-12 | Aligner les titres des tests et nettoyer le lint des tests | P3 | tests, enhancement, P3 | #187 |
| SEC-13 | Limiter la suppression mobile par `userId` | P3 | security, backend, enhancement, P3 | #188 |

**Total** : 71 points · P1 : 17 (5 nouveaux) · P2 : 33 (12 nouveaux) · P3 : 21 (6 nouveaux) · 23 nouveaux points, issues #166 à #188 créées le 2026-10-28

---

## P1 — Avant mise en production

### SEC-01 · Mettre à jour Next.js (CVE critique)

- **Priorité** : P1
- **Labels** : security, backend, bug, P1
- **Milestone** : Pré-prod Play Store
- **Fichiers** : `backend/chronoapp/package.json:19`, `backend/chronoapp/package.json:37`
- **Revue** : [reviewSecurity.md §S1](review/archive/2026-10-04/reviewSecurity.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #68

**Problème** — `next@16.3.5` est concerné par une vulnérabilité critique (RCE dans `next/og`). Le correctif est disponible en patch (16.3.8). `eslint-config-next` est désaligné (16.2.12).

**Correction** — `npm install next@latest eslint-config-next@latest` dans `backend/chronoapp`. Ne **pas** lancer `npm audit fix --force` (il rétrograderait Prisma).

**Critère de fin**
- [ ] `npm ls next` ≥ 16.3.8, `eslint-config-next` à la même version mineure
- [ ] `npm audit --omit=dev` ne remonte plus d'alerte `critical` sur `next`
- [ ] `npm run build` passe

### SEC-02 · Rendre le rate limit du reset password non contournable

- **Priorité** : P1
- **Labels** : security, backend, bug, P1
- **Milestone** : Pré-prod Play Store
- **Fichiers** : `backend/chronoapp/app/api/auth/passwordresettoken/route.ts:23`, `backend/chronoapp/app/api/auth/passwordresettoken/route.ts:28-36`, `backend/chronoapp/lib/rateLimit.ts:19-23`, `backend/chronoapp/lib/getClientIp.ts:1-7`
- **Revue** : [reviewSecurity.md §S2](review/archive/2026-10-04/reviewSecurity.md)
- **Réflexe** : V-05
- **Statut** : issue créée
- **Issue** : #69

**Problème** — L'IP est lue dans la chaîne brute `x-forwarded-for` (fournie par le client, donc falsifiable), avec une faute de frappe sur `x-rel-ip`. L'IP et l'email partagent le même limiteur et le même préfixe. Le 400 renvoie le message brut de Zod.

**Correction** — Utiliser `getClientIp()` adapté à l'hébergeur (`x-real-ip` sur Vercel), créer deux limiteurs distincts (`resetPasswordRateLimitIp`, `resetPasswordRateLimitEmail`) et renvoyer un message 400 fixe.

**Critère de fin**
- [ ] Changer `X-Forwarded-For` à chaque requête ne permet plus de dépasser la limite IP
- [ ] Préfixes Redis distincts pour l'IP et l'email
- [ ] La réponse 400 ne contient plus le détail Zod

### SEC-03 · Exiger le mot de passe pour supprimer le compte

- **Priorité** : P1
- **Labels** : security, backend, frontend, enhancement, P1
- **Milestone** : Pré-prod Play Store
- **Fichiers** : `backend/chronoapp/app/api/user/route.ts:6-28`, `frontend/chronoapp/app/(tabs)/account.tsx:21-84`, `frontend/chronoapp/services/api.ts:63-67`
- **Revue** : [reviewSecurity.md §S3](review/archive/2026-10-04/reviewSecurity.md), [securityPlus.md §7](security/securityPlus.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #70

**Problème** — `DELETE /api/user` ne demande que le JWT : un token volé suffit à supprimer définitivement le compte et les données.

**Correction** — Le body contient `password` (validé par Zod) ; le serveur fait `bcrypt.compare` avant la suppression et renvoie 403 sinon. L'écran Compte remplace la saisie de « chronoapp » par la saisie du mot de passe.

**Critère de fin**
- [ ] Suppression refusée (403) avec un mauvais mot de passe ou sans mot de passe
- [ ] Suppression acceptée avec le bon mot de passe
- [ ] Le message d'erreur s'affiche dans l'écran Compte

### BACK-01 · Renvoyer de vrais 201/204 et rendre `apiFetch` compatible

- **Priorité** : P1
- **Labels** : backend, frontend, bug, P1
- **Milestone** : Pré-prod Play Store
- **Fichiers** : `backend/chronoapp/app/api/seance/route.ts:82`, `backend/chronoapp/app/api/timerpause/[id]/route.ts:114`, `backend/chronoapp/app/api/timerrunner/[id]/route.ts:53`, `backend/chronoapp/app/api/timerrunner/byseance/[id]/route.ts:26`, `backend/chronoapp/app/api/user/route.ts:18`, `backend/chronoapp/app/api/auth/register/route.ts:57`, `frontend/chronoapp/services/api.ts:57-59`
- **Revue** : [reviewBackend.md §1.1](review/archive/2026-10-04/reviewBackend.md), [reviewFrontend.md §1.1](review/archive/2026-10-04/reviewFrontend.md), [reviewTestingLibrary.md §3.1](review/archive/2026-10-04/reviewTestingLibrary.md)
- **Réflexe** : V-03
- **Statut** : issue créée
- **Issue** : #71

**Problème** — `NextResponse.json({ status: 204 })` envoie `{status: 204}` comme body avec un code **200**. Côté mobile, `apiFetch` appelle `response.json()` sur toutes les réponses : il plantera dès que les vrais 204 (sans body) arriveront, ainsi que sur une erreur d'infra en HTML.

**Correction** — Backend : `new NextResponse(null, { status: 204 })` et `NextResponse.json(data, { status: 201 })`. Frontend : un `parseBody()` qui gère 204, body vide et non-JSON ; supprimer les `if (response)` qui testaient le body. **Une seule PR** pour les deux côtés, en TDD (test 204 rouge d'abord, cf. TEST-02).

**Critère de fin**
- [ ] Les 5 routes DELETE renvoient 204 sans body, register renvoie 201
- [ ] `apiFetch` ne plante ni sur un 204 ni sur un body HTML
- [ ] Suppression de séances, de compte et reset fonctionnent dans l'app
- [ ] Un test couvre le cas 204

### BACK-02 · Empêcher l'enregistrement d'un coureur en double (base)

- **Priorité** : P1
- **Labels** : backend, bug, P1
- **Milestone** : Pré-prod Play Store
- **Fichiers** : `backend/chronoapp/prisma/schema.prisma:57-66`, `backend/chronoapp/app/api/timerrunner/route.ts:55-70`
- **Revue** : [reviewBackend.md §2.3](review/archive/2026-10-04/reviewBackend.md)
- **Réflexe** : V-05
- **Statut** : issue créée
- **Issue** : #72

**Problème** — Rien n'empêche deux `TimerRunner` avec le même `numberRunner` dans une séance (double tap, retry réseau) : les résultats affichent un coureur deux fois.

**Correction** — `@@unique([seanceId, numberRunner])` + migration ; dans le `catch`, `P2002` → `409 Conflict`. À coupler avec FRONT-03.

**Critère de fin**
- [ ] Migration appliquée
- [ ] Un 2ᵉ POST pour le même coureur renvoie 409
- [ ] L'app affiche un message compréhensible sur 409

### FRONT-01 · Centraliser le 401 et synchroniser `AuthContext`

- **Priorité** : P1
- **Labels** : frontend, bug, P1
- **Milestone** : Pré-prod Play Store
- **Fichiers** : `frontend/chronoapp/services/api.ts:51-55`, `frontend/chronoapp/context/AuthContext.tsx:14-39`, `frontend/chronoapp/components/AuthGate.tsx:15-19`, 11 blocs `if (err.status === 401)` dans `app/run/[id].tsx`, `app/result/[id].tsx`, `app/(tabs)/list.tsx`, `app/(tabs)/account.tsx`, `components/BtnAndList.tsx`, `components/form.tsx`
- **Revue** : [reviewFrontend.md §1.2](review/archive/2026-10-04/reviewFrontend.md), [reviewTestingLibrary.md §2.2](review/archive/2026-10-04/reviewTestingLibrary.md)
- **Réflexe** : V-01, V-09
- **Statut** : issue créée
- **Issue** : #73

**Problème** — Sur un 401, `apiFetch` vide le SecureStore et navigue vers `/login`, mais le `token` du Context reste renseigné. `AuthGate` voit alors « token présent + groupe (auth) » et renvoie vers `/` : l'utilisateur est ramené sur l'accueil avec un token invalide. La logique 401 est en plus dupliquée dans 11 `catch`.

**Correction** — `apiFetch` appelle un handler `onUnauthorized` enregistré par `AuthProvider`, qui exécute `logout()`. Plus de `router` dans `services/`. Supprimer les 11 blocs 401 des composants.

**Critère de fin**
- [ ] Après un 401, l'utilisateur reste sur l'écran de login
- [ ] `services/api.ts` n'importe plus `expo-router`
- [ ] Plus aucun `err.status === 401` dans `app/` et `components/`
- [ ] Le 401 est testé une seule fois (TEST-02)

### FRONT-02 · Confirmer avant de supprimer toutes les séances

- **Priorité** : P1
- **Labels** : frontend, bug, P1
- **Milestone** : Pré-prod Play Store
- **Fichiers** : `frontend/chronoapp/app/(tabs)/list.tsx:103-123`, `frontend/chronoapp/app/(tabs)/list.tsx:136-142`
- **Revue** : [reviewFrontend.md §1.3](review/archive/2026-10-04/reviewFrontend.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #74

**Problème** — Un tap sur l'icône poubelle supprime toutes les séances, sans confirmation ni label.

**Correction** — `Alert.alert` avec les boutons « Annuler » et « Supprimer » (style `destructive`) ; `accessibilityLabel="Supprimer toutes les séances"`.

**Critère de fin**
- [ ] Aucune suppression sans confirmation
- [ ] Le test de `list` vérifie que « Annuler » n'appelle pas `deleteManySeance`

### FRONT-03 · Bloquer le double tap sur les boutons coureurs

- **Priorité** : P1
- **Labels** : frontend, bug, P1
- **Milestone** : Pré-prod Play Store
- **Fichiers** : `frontend/chronoapp/components/BtnAndList.tsx:84-125`, `frontend/chronoapp/components/BtnAndList.tsx:214-226`
- **Revue** : [reviewFrontend.md §1.4](review/archive/2026-10-04/reviewFrontend.md)
- **Réflexe** : V-05
- **Statut** : issue créée
- **Issue** : #75

**Problème** — Le bouton n'est désactivé qu'après la réponse du serveur : deux taps rapides envoient deux POST.

**Correction** — État `pending: Set<number>` ; `disabled={item.state || pending.has(item.number)}` ; retrait du `pending` dans un `finally`.

**Critère de fin**
- [ ] Deux `press` rapides → `postTimerRunner` appelé une seule fois (test)
- [ ] En cas d'erreur, le bouton redevient cliquable

### STORE-01 · Créer la page web de suppression de compte

- **Priorité** : P1
- **Labels** : store, backend, enhancement, P1
- **Milestone** : Pré-prod Play Store
- **Fichiers** : `backend/chronoapp/app/` (nouvelle page, ex. `app/delete-account/page.tsx`)
- **Revue** : [reviewSecurity.md §Conformité Google Play](review/archive/2026-10-04/reviewSecurity.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #76

**Problème** — Google Play exige qu'une app avec création de compte propose la suppression du compte **dans l'app et via une URL web**. Seule la version dans l'app existe.

**Correction** — Page Next (formulaire email + mot de passe) qui appelle une route de suppression ; réutiliser la logique de SEC-03 ; rate limit IP/email.

**Critère de fin**
- [ ] URL publique accessible en HTTPS
- [ ] Suppression effective avec les bons identifiants, message générique sinon
- [ ] URL renseignée dans la Play Console

### STORE-02 · Publier la politique de confidentialité et remplir Data safety

- **Priorité** : P1
- **Labels** : store, documentation, P1
- **Milestone** : Pré-prod Play Store
- **Fichiers** : `backend/chronoapp/app/` (nouvelle page, ex. `app/privacy/page.tsx`)
- **Revue** : [reviewSecurity.md §Conformité Google Play](review/archive/2026-10-04/reviewSecurity.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #77
- **Revue 2026-10-27** : politique publiée ✅ mais incomplète (Upstash, Resend absents) → **STORE-06**.

**Problème** — URL de politique de confidentialité et formulaire Data safety obligatoires pour publier.

**Correction** — Page listant les données collectées (email, mot de passe haché, séances, diagnostics Sentry), les sous-traitants (hébergeur, Upstash, Resend, Sentry), la durée de conservation et les moyens de suppression. Remplir Data safety en cohérence.

**Critère de fin**
- [ ] Page publique en ligne
- [ ] Data safety rempli et validé dans la Play Console

### STORE-03 · Finaliser l'identité de l'app (icône, nom, package)

- **Priorité** : P1
- **Labels** : store, frontend, enhancement, P1
- **Milestone** : Pré-prod Play Store
- **Fichiers** : `frontend/chronoapp/app.json:3`, `frontend/chronoapp/app.json:7`, `frontend/chronoapp/app.json:14`
- **Revue** : [reviewFrontend.md §Préparation Play Store](review/archive/2026-10-04/reviewFrontend.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #78

**Problème** — `icon: ""`, nom affiché `chronoapp`, et `android.package` (`com.yanndev181steam.chronoapp`) qui deviendra **définitif** après la première publication.

**Correction** — Icône 1024×1024, `name: "Chrono App"`, valider ou changer le package avant le premier upload.

**Critère de fin**
- [ ] Build EAS `production` avec la bonne icône et le bon nom
- [ ] Package validé (décision notée dans le README)

### CI-01 · Activer les protections de sécurité GitHub

- **Priorité** : P1
- **Labels** : ci, security, enhancement, P1
- **Milestone** : Pré-prod Play Store
- **Fichiers** : `.github/dependabot.yml`, paramètres du dépôt
- **Revue** : [reviewSecurity.md §Dependabot](review/archive/2026-10-04/reviewSecurity.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #79

**Problème** — `dependabot.yml` est en place, mais les alertes, les mises à jour de sécurité et le secret scanning s'activent dans les paramètres du dépôt.

**Correction** — `Settings → Code security` : Dependency graph, Dependabot alerts, Dependabot security updates, Secret scanning + Push protection. Créer les labels `backend`, `frontend`, `ci`.

**Critère de fin**
- [ ] Les 4 options sont actives
- [ ] Une première PR Dependabot apparaît avec les bons labels

### BACK-14 · Rendre les `DELETE` de collection idempotents (reset cassé)

- **Priorité** : P1
- **Labels** : backend, bug, P1
- **Milestone** : Correction P1 Sécurity
- **Fichiers** : `backend/chronoapp/app/api/timerpause/[id]/route.ts:117-126`, `backend/chronoapp/app/api/timerrunner/byseance/[id]/route.ts:18-30`, `backend/chronoapp/app/api/seance/route.ts:110-121`, `backend/chronoapp/test/_route_timerpauseId.test.ts:97`, `backend/chronoapp/test/_route_timerrunnerBySeance.test.ts:49`
- **Revue** : [reviewBackend.md §1.1](review/reviewBackend.md), [reviewFrontend.md §1.1](review/reviewFrontend.md), [reviewTestingLibrary.md §1.1, §2.2](review/reviewTestingLibrary.md)
- **Réflexe** : V-03
- **Statut** : issue créée
- **Issue** : #166

**Problème** — Depuis BACK-07, `deleteMany` avec `count === 0` renvoie 404. Le reset enchaîne `DELETE /timerpause/:seanceId` puis `DELETE /timerrunner/byseance/:seanceId` : sans pause (ou sans coureur), le premier appel échoue, l'app affiche « Pauses introuvables » et la séance reste `InProgress` en base.

**Correction** — Correctif rapide en attendant BACK-04 : renvoyer **204** même quand `count === 0` (un `DELETE` de collection est idempotent). Changer d'abord les deux tests qui attendent 404 (ils deviennent rouges), puis le code. Même règle pour `DELETE /api/seance` (liste vide → 204).

**Critère de fin**
- [ ] Les trois routes renvoient 204 quand il n'y a rien à supprimer, et un test le vérifie pour chacune
- [ ] Sur l'app : lancer le chrono, ne faire aucune pause, appuyer sur reset → chrono à 00:00:00, aucun message d'erreur

### BACK-15 · Fiabiliser `DELETE /api/user` (body, Upstash, token invalide)

- **Priorité** : P1
- **Labels** : backend, security, bug, P1
- **Milestone** : Correction P1 Sécurity
- **Fichiers** : `backend/chronoapp/app/api/user/route.ts:19-23`, `backend/chronoapp/app/api/user/route.ts:42`, `backend/chronoapp/app/api/user/route.ts:94-95`, `backend/chronoapp/app/api/user/route.ts:113-114`
- **Revue** : [reviewBackend.md §1.2, §1.3](review/reviewBackend.md), [reviewSecurity.md §2.1](review/reviewSecurity.md)
- **Réflexe** : V-03
- **Statut** : issue créée
- **Issue** : #167

**Problème** — `await req.json()` sans `.catch` et `limit()` hors `try` : un body non-JSON ou une panne d'Upstash fait planter le handler (500 brute, vérifié par un test temporaire). Un token expiré bascule dans la branche web et renvoie 400 « Format non conforme » au lieu de 401.

**Correction** — `req.json().catch(() => null)` ; `try { limit } catch { 503 }` dans les deux branches ; choisir la branche selon la **présence** du header `Bearer` et renvoyer 401 si le token est invalide (option : deux routes séparées pour le mobile et le web).

**Critère de fin**
- [ ] Body non-JSON → 400, Upstash indisponible → 503, Bearer invalide → 401 : un test pour chaque cas
- [ ] Sur mobile, un token expiré pendant la suppression ramène à l'écran de login

### SEC-09 · Supprimer l'énumération de comptes sur la suppression web

- **Priorité** : P1
- **Labels** : security, backend, bug, P1
- **Milestone** : Correction P1 Sécurity
- **Fichiers** : `backend/chronoapp/app/api/user/route.ts:125-146`, `backend/chronoapp/app/component/formDeleteUser.tsx:47-48`, `backend/chronoapp/test/_route_user.test.ts:123-145`
- **Revue** : [reviewSecurity.md §1.1](review/reviewSecurity.md), [reviewTestingLibrary.md §2.2](review/reviewTestingLibrary.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #168

**Problème** — La page publique `/delete-user` répond 404 « Utilisateur introuvable » ou 403 « Mot de passe incorrect », et ne lance pas bcrypt quand le compte n'existe pas : on peut savoir si un email est inscrit, par le message ou par le temps de réponse.

**Correction** — Reprendre le patron du login : `bcrypt.compare(password, user?.password ?? DUMMY_HASH)` (hash partagé dans `lib/`), puis une seule réponse `401 { message: "Identifiants invalides" }` pour les deux cas. Réécrire d'abord les tests 404/403 de la branche web.

**Critère de fin**
- [ ] Email inconnu et mauvais mot de passe donnent le même statut et le même message
- [ ] Un test vérifie que `bcrypt.compare` est appelé une fois quand l'utilisateur n'existe pas

### SEC-10 · Régénérer la clé Resend et le mot de passe du compte testeur

- **Priorité** : P1
- **Labels** : security, bug, P1
- **Milestone** : Correction P1 Sécurity
- **Fichiers** : hors code — variable `RESEND_TOKEN` (Vercel), compte testeur Google (voir issue #164)
- **Revue** : [reviewSecurity.md §1.2](review/reviewSecurity.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #169

**Problème** — Une vraie clé Resend a été visible en clair dans un document d'architecture (hors dépôt, `git grep` négatif). Le mot de passe du compte testeur Google est dans un `.env.local` d'outil de documentation. Les avoir retirés ne les révoque pas.

**Correction** — Resend : révoquer l'ancienne clé, en créer une (« Sending access », domaine `chronoappsport.fr`) ; Vercel : mettre à jour `RESEND_TOKEN` en Production et Preview, redéployer. Changer le mot de passe du compte testeur avant de le saisir dans la Play Console.

**Critère de fin**
- [ ] L'ancienne clé apparaît comme révoquée dans Resend
- [ ] Un email de reset est bien reçu après redéploiement
- [ ] Le mot de passe testeur n'est plus celui qui a été exposé

### STORE-06 · Compléter la politique de confidentialité (Upstash, Resend) et Data safety

- **Priorité** : P1
- **Labels** : store, documentation, P1
- **Milestone** : Correction P1 Sécurity
- **Fichiers** : `backend/chronoapp/app/privacy/page.tsx:110-131`
- **Revue** : [reviewSecurity.md §2.4](review/reviewSecurity.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #170

**Problème** — La politique liste Vercel, Neon, Expo/Google et Sentry, mais pas Upstash (reçoit l'IP et l'email, clés des limiteurs) ni Resend (reçoit l'email). Le RGPD (art. 13) impose de nommer les destinataires, et Google compare la politique au formulaire Data safety.

**Correction** — Ajouter Upstash (« protection contre les abus », conservation 1 min à 1 h) et Resend (« envoi des emails de réinitialisation ») ; relire Data safety : email et IP déclarés comme collectés, finalité « Sécurité / prévention de la fraude ».

**Critère de fin**
- [ ] `/privacy` nomme les 6 prestataires avec leur finalité
- [ ] Data safety relu et cohérent avec la page

---

## P2 — Robustesse et logique métier

### BACK-03 · Rentrer tous les appels Prisma dans les `try`

- **Priorité** : P2
- **Labels** : backend, bug, P2
- **Fichiers** : `backend/chronoapp/app/api/timerpause/[id]/route.ts:55-65`, `backend/chronoapp/app/api/timerrunner/route.ts:25-53`
- **Revue** : [reviewBackend.md §1.2](review/archive/2026-10-04/reviewBackend.md)
- **Réflexe** : V-03
- **Statut** : issue créée
- **Issue** : #80

**Problème** — Des `await prisma.*` sont exécutés hors du `try` : une erreur de base de données renvoie une 500 HTML de Next au lieu du JSON maîtrisé.

**Correction** — Déplacer `findUnique` / `aggregate` dans le `try` existant.

**Critère de fin**
- [ ] Plus aucun `await prisma` hors d'un `try` dans `app/api`
- [ ] Une erreur Prisma simulée renvoie `{ message: "Erreur serveur" }` en 500

### BACK-04 · Créer un endpoint de reset de séance transactionnel

- **Priorité** : P2
- **Labels** : backend, frontend, enhancement, P2
- **Fichiers** : `frontend/chronoapp/app/run/[id].tsx:206-252`, nouveau `backend/chronoapp/app/api/seance/[id]/reset/route.ts`
- **Revue** : [reviewBackend.md §2.1](review/archive/2026-10-04/reviewBackend.md), [reviewFrontend.md §2.5](review/archive/2026-10-04/reviewFrontend.md)
- **Réflexe** : V-02
- **Statut** : issue créée
- **Issue** : #81
- **Revue 2026-10-27** : toujours ouvert et devenu urgent : le reset est cassé sans pause (voir **BACK-14**, correctif rapide). À faire ensemble ; arrêter le chrono local **après** la réponse du serveur ([reviewBackend.md §1.1](review/reviewBackend.md), [reviewFrontend.md §1.1](review/reviewFrontend.md)).

**Problème** — Le mobile enchaîne 3 requêtes (DELETE pauses, DELETE coureurs, PATCH séance). Un échec au milieu laisse la séance incohérente. Le reset est aussi impossible pendant une pause (`disabled={!stateChrono}`).

**Correction** — `POST /api/seance/[id]/reset` en `prisma.$transaction` ; le mobile fait un seul appel. Décider si le reset est autorisé en pause.

**Critère de fin**
- [ ] Un seul appel réseau pour le reset
- [ ] Si une étape échoue, rien n'est modifié en base
- [ ] Comportement en pause décidé et implémenté

### BACK-05 · Valider les dates envoyées par le client

- **Priorité** : P2
- **Labels** : backend, security, enhancement, P2
- **Fichiers** : `backend/chronoapp/lib/schema/seanceSchema.ts:10-13`, `backend/chronoapp/lib/schema/timerPauseSchema.ts`, `backend/chronoapp/lib/schema/timerrunnerSchema.ts`, `backend/chronoapp/app/api/timerpause/[id]/route.ts:67-80`
- **Revue** : [reviewBackend.md §2.2](review/archive/2026-10-04/reviewBackend.md), [reviewSecurity.md §S6](review/archive/2026-10-04/reviewSecurity.md)
- **Réflexe** : V-05
- **Statut** : issue créée
- **Issue** : #82
- **Revue 2026-10-27** : ⚠️ fermée, critère non atteint : borne basse seulement, des durées négatives restent possibles → suite dans **BACK-17**.

**Problème** — `startedAt`, `pausedAt`, `endedAt` sont acceptés tels quels : durées négatives possibles, pause terminée re-patchable.

**Correction** — Soit le serveur pose `new Date()` lui-même, soit : écart max avec l'heure serveur, `endedAt > pausedAt`, `where: { id, userId, endedAt: null }` dans le PATCH de pause.

**Critère de fin**
- [ ] Impossible d'obtenir un `pauseDurationMs` ou une `duration` négatifs
- [ ] Une pause déjà terminée ne peut pas être modifiée

### BACK-06 · Ajouter les règles métier de `POST /timerrunner`

- **Priorité** : P2
- **Labels** : backend, bug, P2
- **Fichiers** : `backend/chronoapp/lib/schema/timerrunnerSchema.ts:4`, `backend/chronoapp/app/api/timerrunner/route.ts:25-41`
- **Revue** : [reviewBackend.md §2.3](review/archive/2026-10-04/reviewBackend.md)
- **Réflexe** : V-03, V-05
- **Statut** : issue créée
- **Issue** : #83

**Problème** — `numberRunner` n'est pas borné, une séance `Finish` accepte encore des coureurs, et « chronomètre inactif » renvoie 404 au lieu de 409.

**Correction** — Vérifier `1 ≤ numberRunner ≤ seance.totalRunner` et `state === "InProgress"` ; renvoyer 409 si l'état est incompatible ; 404 seulement si la séance n'existe pas.

**Critère de fin**
- [ ] Coureur hors limites → 400
- [ ] Séance terminée ou en pause → 409
- [ ] Séance inexistante → 404

### BACK-07 · Corriger les 404 manquants et le code mort P2025

- **Priorité** : P2
- **Labels** : backend, bug, P2
- **Fichiers** : `backend/chronoapp/app/api/timerrunner/[id]/route.ts:19-26`, `backend/chronoapp/app/api/seance/route.ts:84-90`, `backend/chronoapp/app/api/timerpause/[id]/route.ts:116-122`, `backend/chronoapp/app/api/timerrunner/byseance/[id]/route.ts:28-34`
- **Revue** : [reviewBackend.md §1.3-1.4](review/archive/2026-10-04/reviewBackend.md)
- **Réflexe** : V-03
- **Statut** : issue créée
- **Issue** : #84
- **Revue 2026-10-27** : ⚠️ régression introduite : `count === 0` → 404 sur les `DELETE` de collection casse le reset → **BACK-14**.

**Problème** — `GET /timerrunner/[id]` renvoie `null` en 200. `deleteMany` ne lève jamais P2025 : les branches 404 associées sont du code mort.

**Correction** — `if (!x) return 404` ; pour `deleteMany`, tester `count === 0` si un 404 est souhaité, sinon supprimer la branche.

**Critère de fin**
- [ ] Id inconnu → 404 sur le GET
- [ ] Plus de test P2025 après un `deleteMany`

### BACK-08 · Ajouter index et relations dans le schéma Prisma

- **Priorité** : P2
- **Labels** : backend, enhancement, P2
- **Fichiers** : `backend/chronoapp/prisma/schema.prisma:44-76`
- **Revue** : [reviewBackend.md §2.4](review/archive/2026-10-04/reviewBackend.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #85

**Problème** — `userId` de `TimerRunner`/`TimerPause` n'est pas une clé étrangère ; aucun index sur `userId` / `seanceId` ; nommage incohérent (`timerpauses`).

**Correction** — Relation `user` (ou suppression de la colonne si l'ownership passe par la séance), `@@index([userId])` sur `Seance`, `@@index([seanceId])` sur `TimerRunner`/`TimerPause`, renommage en `timerPauses` (impacte le front), puis `prisma format`.

**Critère de fin**
- [ ] Migration appliquée sans perte de données
- [ ] Front et back mis à jour si renommage

### BACK-09 · Rate limit sur les routes métier et pagination des séances

- **Priorité** : P2
- **Labels** : backend, security, enhancement, P2
- **Fichiers** : `backend/chronoapp/lib/rateLimit.ts`, `backend/chronoapp/app/api/seance/route.ts:16-19`, routes `POST` de `seance`, `timerrunner`, `timerpause`
- **Revue** : [reviewSecurity.md §S10-S11](review/archive/2026-10-04/reviewSecurity.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #86
- **Revue 2026-10-27** : ⚠️ fermée, critère non atteint : rate limit OK, liste non bornée (`take` absent) → suite dans **BACK-19**.

**Problème** — Un compte peut créer des séances sans limite, et `GET /seance` renvoie tout l'historique avec pauses et coureurs.

**Correction** — Limiteur par `userId` (ex. 60/min) sur les POST ; `take`, `orderBy: { createdAt: "desc" }` sur la liste.

**Critère de fin**
- [ ] 429 au-delà de la limite
- [ ] Liste triée et bornée

### SEC-04 · Appliquer les en-têtes de sécurité à toutes les routes

- **Priorité** : P2
- **Labels** : security, backend, enhancement, P2
- **Fichiers** : `backend/chronoapp/next.config.ts:8-19`
- **Revue** : [reviewSecurity.md §S5](review/archive/2026-10-04/reviewSecurity.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #87

**Problème** — `source: "/"` ne couvre que la racine ; pas de HSTS ni de `nosniff`.

**Correction** — `source: "/(.*)"` + HSTS, `X-Content-Type-Options`, CSP complète, `Permissions-Policy`.

**Critère de fin**
- [ ] `curl -I` sur `/` et `/api/seance` montre les en-têtes
- [ ] La page de reset fonctionne toujours avec la CSP

### SEC-05 · Figer l'algorithme JWT et valider les variables d'environnement

- **Priorité** : P2
- **Labels** : security, backend, enhancement, P2
- **Fichiers** : `backend/chronoapp/lib/auth.ts:13`, `backend/chronoapp/app/api/auth/login/route.ts:59-65`, nouveau `backend/chronoapp/lib/env.ts`
- **Revue** : [reviewSecurity.md §S4](review/archive/2026-10-04/reviewSecurity.md), [securityPlus.md §2](security/securityPlus.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #88
- **Revue 2026-10-27** : ⚠️ fermée, critère partiel : algorithme figé ✅, mais `env.ts` n'est chargé que par `lib/auth.ts` → suite dans **SEC-11**.

**Problème** — `jwt.verify` sans `algorithms` ; `process.env.JWT_SECRET!` : une variable manquante en prod donne une 500 incompréhensible.

**Correction** — `{ algorithms: ["HS256"] }` ; schéma Zod sur `process.env` (`JWT_SECRET` ≥ 32 caractères, `DATABASE_URL`, `RESEND_TOKEN`, `APP_URL`, Upstash) importé au démarrage.

**Critère de fin**
- [ ] Un token signé avec un autre algorithme est refusé
- [ ] Une variable manquante fait échouer le démarrage avec un message clair

### SEC-06 · Gérer l'indisponibilité d'Upstash (fail-closed)

- **Priorité** : P2
- **Labels** : security, backend, bug, P2
- **Fichiers** : `backend/chronoapp/app/api/auth/login/route.ts:27-30`, `backend/chronoapp/app/api/auth/register/route.ts:26-29`, `backend/chronoapp/app/api/auth/passwordresettoken/route.ts:33-36`
- **Revue** : [reviewSecurity.md §S7](review/archive/2026-10-04/reviewSecurity.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #89
- **Revue 2026-10-27** : ⚠️ fermée, une route oubliée : `DELETE /api/user` appelle Upstash hors `try` → **BACK-15**.

**Problème** — `limit()` est hors `try` : si Redis ne répond pas, la route plante sans réponse maîtrisée.

**Correction** — Entourer `limit()` d'un `try` et renvoyer un 503 explicite (fail-closed), avec un log.

**Critère de fin**
- [ ] Redis coupé → 503 JSON, pas de 500 HTML
- [ ] Choix fail-closed documenté dans le code

### FRONT-04 · Corriger la fuite d'intervalle du chronomètre

- **Priorité** : P2
- **Labels** : frontend, bug, P2
- **Fichiers** : `frontend/chronoapp/app/run/[id].tsx:108-125`, `frontend/chronoapp/app/run/[id].tsx:258`
- **Revue** : [reviewFrontend.md §1.5](review/archive/2026-10-04/reviewFrontend.md)
- **Réflexe** : V-07
- **Statut** : issue créée
- **Issue** : #90
- **Revue 2026-10-27** : toujours ouvert ; scénario concret du double tap sur play → **FRONT-14**, même PR ([reviewFrontend.md §1.2](review/reviewFrontend.md)).

**Problème** — `handleStartChrono` écrase `intervalRef.current` sans `clearInterval` ; `handlePause` ne remet pas la ref à `null`.

**Correction** — `clearInterval` avant chaque `setInterval`, et `intervalRef.current = null` après chaque arrêt.

**Critère de fin**
- [ ] Jamais plus d'un intervalle actif (vérifiable avec de faux timers)
- [ ] L'avertissement « worker process has failed to exit gracefully » disparaît (voir TEST-07)

### FRONT-05 · Typer les réponses API comme du JSON (dates en `string`)

- **Priorité** : P2
- **Labels** : frontend, enhancement, P2
- **Fichiers** : `frontend/chronoapp/types/api.ts:27-37`
- **Revue** : [reviewFrontend.md §2.1](review/archive/2026-10-04/reviewFrontend.md)
- **Réflexe** : V-06
- **Statut** : issue créée
- **Issue** : #91
- **Revue 2026-10-27** : toujours ouvert ; ajouter des types distincts pour les réponses **sans** relations (`POST`/`PATCH /seance`) ([reviewFrontend.md §2.1](review/reviewFrontend.md)).

**Problème** — `createdAt: Date` alors que le JSON contient une `string` ; `state: string` au lieu d'une union.

**Correction** — Dates en `string`, `state: "NoStart" | "InProgress" | "Finish"`. Option : valider les réponses avec Zod (`z.coerce.date()`).

**Critère de fin**
- [ ] `tsc --noEmit` passe
- [ ] Fixtures de tests alignées (dates en `string`)

### FRONT-06 · Brancher les cleanups de `useEffect` / `useFocusEffect`

- **Priorité** : P2
- **Labels** : frontend, bug, P2
- **Fichiers** : `frontend/chronoapp/app/(tabs)/list.tsx:65-69`, `frontend/chronoapp/app/result/[id].tsx:64-66`, `frontend/chronoapp/app/run/[id].tsx:58-61`, `frontend/chronoapp/components/BtnAndList.tsx:120-122`
- **Revue** : [reviewFrontend.md §2.2](review/archive/2026-10-04/reviewFrontend.md), [reviewFrontend.md §2.4](review/archive/2026-10-04/reviewFrontend.md)
- **Réflexe** : V-07
- **Statut** : issue créée
- **Issue** : #92
- **Revue 2026-10-27** : toujours ouvert : `frontend/chronoapp/app/(tabs)/list.tsx:61-65`, `frontend/chronoapp/app/result/[id].tsx:58-60`, `frontend/chronoapp/components/BtnAndList.tsx:118-121` ([reviewFrontend.md §1.3, §2.4](review/reviewFrontend.md)).

**Problème** — La fonction de cleanup est créée mais pas retournée à React : `cancelled` reste toujours `false`. Le `setTimeout` de `BtnAndList` n'est jamais nettoyé.

**Correction** — `useFocusEffect(useCallback(() => initListPage(), []))`, idem pour `useEffect` ; vérifier `cancelled` avant chaque `setState` ; nettoyer le timeout.

**Critère de fin**
- [ ] Aucun `setState` après démontage (pas d'avertissement dans les tests)

### FRONT-07 · Gérer l'échec de lecture du SecureStore au démarrage

- **Priorité** : P2
- **Labels** : frontend, bug, P2
- **Fichiers** : `frontend/chronoapp/context/AuthContext.tsx:18-23`
- **Revue** : [reviewFrontend.md §2.6](review/archive/2026-10-04/reviewFrontend.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #93
- **Revue 2026-10-27** : toujours ouvert ([reviewFrontend.md §2.2](review/reviewFrontend.md)) ; la stabilité de `logout` / `value` est traitée à part (**FRONT-16**).

**Problème** — `getItemAsync().then()` sans `.catch` : en cas d'échec, `isLoading` reste `true` et l'app affiche un écran blanc indéfiniment.

**Correction** — `.catch(() => setToken(null)).finally(() => setIsLoading(false))`.

**Critère de fin**
- [ ] Un échec simulé du SecureStore mène à l'écran de login (test)

### FRONT-08 · Améliorer l'accessibilité et les champs de saisie

- **Priorité** : P2
- **Labels** : frontend, enhancement, P2
- **Fichiers** : `frontend/chronoapp/app/(auth)/login.tsx:89-122`, `frontend/chronoapp/app/(auth)/register.tsx:110-163`, `frontend/chronoapp/app/(auth)/passwordReset.tsx:102-115`, `frontend/chronoapp/app/(tabs)/index.tsx:17`, `frontend/chronoapp/app/run/[id].tsx:330-374`, `frontend/chronoapp/components/form.tsx:152-162`
- **Revue** : [reviewFrontend.md §Accessibilité](review/archive/2026-10-04/reviewFrontend.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #94

**Problème** — Majuscule automatique sur l'email, pas d'autocomplétion, boutons icône sans nom pour TalkBack, choix de couleur uniquement visuel, clavier qui masque les champs.

**Correction** — `keyboardType="email-address"`, `autoCapitalize="none"`, `autoComplete` ; `accessibilityRole` + `accessibilityLabel` sur les boutons icône et les couleurs ; `KeyboardAvoidingView`.

**Critère de fin**
- [ ] Parcours connexion et séance utilisable avec TalkBack
- [ ] Les tests peuvent utiliser `getByRole("button", { name })` (voir TEST-05)

### FRONT-09 · Supprimer les dépendances inutilisées

- **Priorité** : P2
- **Labels** : frontend, security, enhancement, P2
- **Fichiers** : `frontend/chronoapp/package.json:28-53`, `frontend/chronoapp/app.json:41-45`
- **Revue** : [reviewFrontend.md §Préparation Play Store](review/archive/2026-10-04/reviewFrontend.md), [reviewSecurity.md §S13](review/archive/2026-10-04/reviewSecurity.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #95

**Problème** — `@upstash/redis` (risque d'embarquer un secret dans l'APK), `expo-auth-session`, `expo-haptics` jamais importés ; `react-dom`, `react-native-web`, `expo-web-browser`, `expo-image` probablement inutiles.

**Correction** — Vérifier avec `npx depcheck`, supprimer chaque paquet et son plugin `app.json`, puis `npx expo-doctor`.

**Critère de fin**
- [ ] `@upstash/redis` absent du frontend
- [ ] `npx expo-doctor` sans erreur, build EAS OK

### STORE-04 · Configurer Sentry pour la production

- **Priorité** : P2
- **Labels** : store, frontend, enhancement, P2
- **Fichiers** : `frontend/chronoapp/app/_layout.tsx:9-25`
- **Revue** : [reviewFrontend.md §Préparation Play Store](review/archive/2026-10-04/reviewFrontend.md), [reviewSecurity.md §S14](review/archive/2026-10-04/reviewSecurity.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #96

**Problème** — `tracesSampleRate: 1.0` (quota), DSN en dur, en-tête `Authorization` potentiellement présent dans les breadcrumbs `fetch`.

**Correction** — `EXPO_PUBLIC_SENTRY_DSN`, `tracesSampleRate` à 0.1–0.2 en prod, `beforeSend` / `beforeBreadcrumb` qui retire `Authorization`.

**Critère de fin**
- [ ] DSN lu depuis l'environnement EAS
- [ ] Aucun token visible dans un événement Sentry de test

### TEST-01 · Corriger les 4 tests faux positifs

- **Priorité** : P2
- **Labels** : tests, bug, P2
- **Fichiers** : `frontend/chronoapp/tests/_list.test.tsx:117-124`, `frontend/chronoapp/tests/_index.test.tsx:53-60`, `frontend/chronoapp/tests/_passwordReset.test.tsx:67-80`, `frontend/chronoapp/tests/_[id]run.test.tsx:177-197`
- **Revue** : [reviewTestingLibrary.md §1.1-1.4](review/archive/2026-10-04/reviewTestingLibrary.md)
- **Réflexe** : V-04
- **Statut** : issue créée
- **Issue** : #97
- **Revue 2026-10-27** : ⚠️ fermée, critère non atteint : 3 faux positifs sur 4 toujours présents (vérifié) → **TEST-08**.

**Problème** — `toBeTruthy` / `toBeFalsy` sans `()`, `expect(promise)` sans `await`, et un test « RESET » qui appuie sur un bouton désactivé (`deleteTimerPause` appelé 0 fois).

**Correction** — Assertions réelles (`waitForElementToBeRemoved`, `await findBy… .toBeOnTheScreen()`, `mockLogout` appelé) ; scénario play → reset.

**Critère de fin**
- [ ] Chaque test devient rouge si on commente le code qu'il couvre (vérifié à la main)

### TEST-02 · Tester `services/api.ts`

- **Priorité** : P2
- **Labels** : tests, frontend, enhancement, P2
- **Fichiers** : `frontend/chronoapp/services/api.ts:23-60`, nouveau `frontend/chronoapp/tests/api.test.ts`
- **Revue** : [reviewTestingLibrary.md §3.1](review/archive/2026-10-04/reviewTestingLibrary.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #98

**Problème** — La couche réseau (token, timeout, 401, erreurs) est mockée partout et n'est jamais exécutée en test.

**Correction** — Mocker `fetch` et `expo-secure-store` ; cas : header `Authorization`, 401, `NetworkError`, 204 (rouge avant BACK-01), body non-JSON.

**Critère de fin**
- [ ] 5 cas couverts
- [ ] Le cas 204 a été écrit avant la correction de BACK-01

### TEST-03 · Mettre en place les premiers tests backend (Vitest)

- **Priorité** : P2
- **Labels** : tests, backend, enhancement, P2
- **Fichiers** : `backend/chronoapp/package.json`, nouveau dossier `backend/chronoapp/tests/`
- **Revue** : [reviewBackend.md §Tests](review/archive/2026-10-04/reviewBackend.md), [reviewTestingLibrary.md §3.3](review/archive/2026-10-04/reviewTestingLibrary.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #99

**Problème** — Aucun test sur les règles critiques : ownership, codes HTTP, calcul des durées, reset password.

**Correction** — Vitest + mock de `@/lib/prisma` ; appeler directement les handlers avec un `Request`.

**Critère de fin**
- [ ] Tests : sans token → 401 ; séance d'un autre utilisateur → 404 ; DELETE → 204 sans body ; durée = fin − début − Σpauses ; token de reset expiré ou utilisé → 400
- [ ] `npm test` dans le backend

### CI-02 · Ajouter un workflow CI (lint, types, tests)

- **Priorité** : P2
- **Labels** : ci, enhancement, P2
- **Fichiers** : nouveau `.github/workflows/ci.yml`
- **Revue** : [reviewTestingLibrary.md §Proposition de CI minimale](review/archive/2026-10-04/reviewTestingLibrary.md), [reviewSecurity.md §Dependabot](review/archive/2026-10-04/reviewSecurity.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #100

**Problème** — Sans CI, les PR (dont celles de Dependabot) ne sont vérifiées par rien.

**Correction** — Jobs frontend (`npm ci`, `tsc --noEmit`, lint, `jest --ci`) et backend (`npm ci`, `prisma generate`, `tsc --noEmit`, lint, tests une fois TEST-03 fait). Nécessite le scope `workflow` de `gh`.

**Critère de fin**
- [ ] Le workflow tourne sur chaque PR
- [ ] Une PR qui casse un test est marquée en échec

### BACK-16 · Ajouter les règles métier de `POST /timerpause`

- **Priorité** : P2
- **Labels** : backend, bug, P2
- **Fichiers** : `backend/chronoapp/app/api/timerpause/route.ts:60-93`
- **Revue** : [reviewBackend.md §2.2](review/reviewBackend.md)
- **Réflexe** : V-03, V-05
- **Statut** : issue créée
- **Issue** : #171

**Problème** — Séance inexistante → 403 au lieu de 404 ; chrono non lancé → 403 au lieu de 409 ; une pause peut être créée sur une séance `Finish` ; plusieurs pauses ouvertes simultanées sont acceptées (double tap), ce qui fausse les durées.

**Correction** — Reprendre la structure de `POST /timerrunner` : `$transaction` + `HttpError` ; 404 si séance absente, 409 si `Finish` ou non démarrée, 409 si `findFirst({ where: { seanceId, endedAt: null } })` trouve une pause ouverte.

**Critère de fin**
- [ ] Un test par cas : 404, 409 non démarrée, 409 `Finish`, 409 pause déjà ouverte
- [ ] Impossible d'avoir deux pauses `endedAt: null` sur une même séance

### BACK-17 · Borner les dates côté serveur et refuser les durées négatives

- **Priorité** : P2
- **Labels** : backend, security, bug, P2
- **Fichiers** : `backend/chronoapp/lib/schema/seanceSchema.ts:12-18`, `backend/chronoapp/lib/schema/timerPauseSchema.ts:14-16`, `backend/chronoapp/lib/schema/timerrunnerSchema.ts:5-11`, `backend/chronoapp/app/api/timerrunner/route.ts:109-113`
- **Revue** : [reviewBackend.md §2.1](review/reviewBackend.md), [reviewSecurity.md §2.2](review/reviewSecurity.md)
- **Réflexe** : V-05
- **Statut** : issue créée
- **Issue** : #172

**Problème** — Suite de BACK-05 (#82, fermée) : seule la borne basse existe. Un `startedAt` futur ou un `endedAt` de pause dans 10 h produit une `duration` négative ; `endedAt` de pause n'a aucune borne.

**Correction** — Un schéma partagé `recentDate` dans `lib/schema/dates.ts` (fenêtre : 1 h dans le passé, 1 min dans le futur) utilisé par les trois schémas ; dans `POST /timerrunner`, `if (result < 0) throw new HttpError(409, …)`.

**Critère de fin**
- [ ] Une date à plus d'une minute dans le futur est refusée (400) sur les 3 routes, tests à l'appui
- [ ] Un test montre qu'une `duration` négative est refusée (409)

### BACK-18 · Contrôler les transitions d'état d'une séance

- **Priorité** : P2
- **Labels** : backend, enhancement, P2
- **Fichiers** : `backend/chronoapp/app/api/seance/[id]/route.ts:90-108`
- **Revue** : [reviewBackend.md §2.3](review/reviewBackend.md)
- **Réflexe** : V-05
- **Statut** : issue créée
- **Issue** : #173

**Problème** — `SeanceUpdateSchema.partial()` accepte toute transition : `Finish → NoStart`, `InProgress` avec `startedAt: null`, nouveau `startedAt` alors que des coureurs sont enregistrés (le double tap sur play l'écrase).

**Correction** — Minimum : 409 si la séance est `Finish`, 409 si `startedAt` est envoyé alors que la séance est déjà `InProgress`. Cible : actions explicites `start` / `reset` (BACK-04) / `finish`.

**Critère de fin**
- [ ] Une séance `Finish` n'est plus modifiable (test 409)
- [ ] Un 2ᵉ `startedAt` sur une séance `InProgress` est refusé (test 409)

### BACK-19 · Paginer `GET /api/seance`

- **Priorité** : P2
- **Labels** : backend, enhancement, P2
- **Fichiers** : `backend/chronoapp/app/api/seance/route.ts:22-25`
- **Revue** : [reviewBackend.md §2.4](review/reviewBackend.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #174

**Problème** — Suite de BACK-09 (#86, fermée) : la liste est triée mais pas bornée.

**Correction** — `take: 50` (ou pagination par curseur `?cursor=`) et un `select` limité aux champs affichés par la liste.

**Critère de fin**
- [ ] La réponse contient au plus N séances, et un test vérifie `take` dans l'appel Prisma

### SEC-11 · Utiliser `env` validé dans toutes les routes

- **Priorité** : P2
- **Labels** : security, backend, bug, P2
- **Fichiers** : `backend/chronoapp/app/api/auth/login/route.ts:76`, `backend/chronoapp/lib/mail.ts:4`, `backend/chronoapp/lib/mail.ts:7`, `backend/chronoapp/lib/env.ts:12`
- **Revue** : [reviewBackend.md §2.6](review/reviewBackend.md), [reviewSecurity.md §2.3](review/reviewSecurity.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #175

**Problème** — Suite de SEC-05 (#88, fermée) : `lib/env.ts` n'est importé que par `lib/auth.ts`. `login`, `register` et `passwordresettoken` lisent `process.env.X` directement : une variable manquante donne une 500 obscure.

**Correction** — Remplacer chaque `process.env.X` par `env.X` ; `APP_URL: z.string().url()`.

**Critère de fin**
- [ ] `grep -rn "process.env" backend/chronoapp/app backend/chronoapp/lib` ne renvoie plus que `lib/env.ts` et `lib/prisma.ts` (`NODE_ENV`)
- [ ] Un `APP_URL` invalide fait échouer le démarrage avec un message clair

### SEC-12 · Passer HSTS en production (2 ans)

- **Priorité** : P2
- **Labels** : security, backend, enhancement, P2
- **Fichiers** : `backend/chronoapp/next.config.ts:5`
- **Revue** : [reviewSecurity.md §2.5](review/reviewSecurity.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #176

**Problème** — `Strict-Transport-Security: max-age=300` est une valeur de test (5 minutes).

**Correction** — `max-age=63072000; includeSubDomains` après avoir vérifié que tous les sous-domaines sont en HTTPS ; pas de `preload` sans inscription volontaire.

**Critère de fin**
- [ ] `curl -I https://chrono-app-blond.vercel.app/privacy` affiche le nouvel en-tête

### FRONT-14 · Bloquer le double tap sur play / pause / reset

- **Priorité** : P2
- **Labels** : frontend, bug, P2
- **Fichiers** : `frontend/chronoapp/app/run/[id].tsx:102-118`, `frontend/chronoapp/app/run/[id].tsx:123-190`, `frontend/chronoapp/app/run/[id].tsx:238-270`
- **Revue** : [reviewFrontend.md §1.2](review/reviewFrontend.md)
- **Réflexe** : V-05, V-07
- **Statut** : issue créée
- **Issue** : #177

**Problème** — `stateChrono` ne passe à `true` qu'après la réponse du `PATCH` : deux taps rapides sur play envoient deux `startedAt` (le second écrase le premier en base) et créent deux intervalles, dont un ne s'arrête jamais. Deux taps sur pause créent deux pauses ouvertes.

**Correction** — Même PR que FRONT-04 : `useRef` `pending` sur les trois handlers (patron de `BtnAndList`), `stopInterval()` appelé en tête de `handleStartChrono`.

**Critère de fin**
- [ ] Un test RNTL : deux `press` synchrones sur play → `patchSeance` appelé une fois (idem pause → `postTimerPause` une fois)
- [ ] Jamais plus d'un intervalle actif (faux timers)

### TEST-08 · Corriger les 3 faux positifs restants

- **Priorité** : P2
- **Labels** : tests, bug, P2
- **Fichiers** : `frontend/chronoapp/tests/_[id]run.test.tsx:151-171`, `frontend/chronoapp/tests/_index.test.tsx:57-59`, `frontend/chronoapp/tests/_passwordReset.test.tsx:77-79`
- **Revue** : [reviewTestingLibrary.md §1.1-1.3](review/reviewTestingLibrary.md)
- **Réflexe** : V-04
- **Statut** : issue créée
- **Issue** : #178

**Problème** — Suite de TEST-01 (#97, fermée) : le test RESET appuie toujours sur un bouton désactivé (`deleteTimerPause` appelé 0 fois, vérifié), `toBeFalsy` sans `()` dans `_index`, `expect(promise).toBeTruthy()` dans `_passwordReset`. Le premier cache le bug BACK-14.

**Correction** — Scénario play → reset avec un mock qui ressemble à `apiFetch` (`null` sur 204) ; `mockLogout` vérifié ; `await` + texte réellement affiché.

**Critère de fin**
- [ ] Chaque test devient rouge quand on commente le code qu'il couvre — **vérifié à la main avant de fermer l'issue**
- [ ] Un test « reset sans pause » existe

### TEST-09 · Corriger `afterEach` importé de `node:test` et figer les dates

- **Priorité** : P2
- **Labels** : tests, bug, P2
- **Fichiers** : `backend/chronoapp/test/_route_timerrunner.test.ts:13`, `backend/chronoapp/test/_route_timerrunner.test.ts:39-43`
- **Revue** : [reviewTestingLibrary.md §2.1](review/reviewTestingLibrary.md)
- **Réflexe** : V-04
- **Statut** : issue créée
- **Issue** : #179

**Problème** — `afterEach` vient de `node:test` : Vitest ne l'exécute jamais, les faux timers restent actifs. `valuePost.endedAt: new Date()` est évalué avant `vi.setSystemTime` : le test passe seulement parce que la vraie date est postérieure à la date simulée.

**Correction** — `import { afterEach } from "vitest"` ; dates fixes partout.

**Critère de fin**
- [ ] Plus aucun import de `node:test` dans `backend/chronoapp/test/`
- [ ] Aucun `new Date()` sans argument dans les fixtures de ce fichier

### TEST-10 · Rendre réalistes les mocks `fetch` du formulaire web

- **Priorité** : P2
- **Labels** : tests, bug, P2
- **Fichiers** : `backend/chronoapp/test/_deleteUser.test.tsx:73-169`
- **Revue** : [reviewTestingLibrary.md §2.3](review/reviewTestingLibrary.md)
- **Réflexe** : V-04
- **Statut** : issue créée
- **Issue** : #180

**Problème** — `fetch` y rejette un `HttpError` ou un `NetworkError`, ce que le vrai `fetch` ne fait jamais : la branche `!response.ok` n'est pas testée. Un test mocke Prisma dans un composant client ; un autre, nommé « mauvais mot de passe », teste le succès.

**Correction** — `mockResolvedValueOnce(new Response(JSON.stringify({ message }), { status: 401 }))` pour les erreurs HTTP, `mockRejectedValueOnce(new TypeError("Failed to fetch"))` pour le réseau ; supprimer le mock Prisma ; renommer.

**Critère de fin**
- [ ] Aucun mock de `fetch` ne rejette autre chose qu'un `TypeError`
- [ ] La branche `if (!response.ok)` de `formDeleteUser.tsx` est couverte

### TEST-11 · Couvrir les règles métier et les cas d'erreur non testés

- **Priorité** : P2
- **Labels** : tests, enhancement, P2
- **Fichiers** : `backend/chronoapp/test/_route_timerrunner.test.ts`, `backend/chronoapp/test/_route_timerpauseId.test.ts:5`, `frontend/chronoapp/tests/_servicesApi.test.tsx`, `frontend/chronoapp/tests/_[id]run.test.tsx`
- **Revue** : [reviewTestingLibrary.md §2.5](review/reviewTestingLibrary.md)
- **Réflexe** : V-04
- **Statut** : issue créée
- **Issue** : #181

**Problème** — Les règles 404/409 de `POST /timerrunner` (BACK-06) n'ont aucun test, `PATCH /timerpause/:id` est importé mais jamais testé, `parseBody` et le timeout d'`apiFetch` ne sont pas testés, le parcours play → pause → play non plus.

**Correction** — Un test par règle de `POST /timerrunner` (404, 409 `Finish`, 409 inactif, 409 en pause, 409 `P2002`) ; `PATCH /timerpause` (404, 400 `endedAt < pausedAt`, 200) ; `parseBody` (204, vide, texte, JSON) ; timeout avec `jest.useFakeTimers()`.

**Critère de fin**
- [ ] Les 5 règles de `POST /timerrunner` ont chacune un test
- [ ] `PATCH /timerpause/:id` et `parseBody` ont leurs tests

### CI-03 · Placer `.npmrc` dans le projet Expo et resynchroniser les dépendances

- **Priorité** : P2
- **Labels** : ci, frontend, bug, P2
- **Fichiers** : `frontend/.npmrc`, `frontend/chronoapp/package-lock.json`
- **Revue** : [reviewFrontend.md §🟡](review/reviewFrontend.md), [reviewSecurity.md §4](review/reviewSecurity.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #182

**Problème** — `.npmrc` (`legacy-peer-deps=true`) est dans `frontend/`, pas à côté du `package.json` : `npm config get legacy-peer-deps` dans `frontend/chronoapp/` → `false`, ni EAS Build ni une CI ne le lisent. Le `node_modules` local est en retard sur le lockfile (zod 4.6.5 au lieu de 4.6.6), ce qui fausse `npm audit`. `node-forge` vulnérable a un correctif non cassant.

**Correction** — Déplacer `.npmrc` dans `frontend/chronoapp/` (ou résoudre le conflit de peer deps et le supprimer) ; `npm ci` ; `npm audit fix` **sans** `--force`.

**Critère de fin**
- [ ] `npm ci` passe dans `frontend/chronoapp/` sur une copie propre du dépôt
- [ ] `npm audit --omit=dev` ne signale plus ni `zod` en direct ni `node-forge`

---

## P3 — Qualité et confort

### BACK-10 · Harmoniser les routes `/timerpause`

- **Priorité** : P3
- **Labels** : backend, enhancement, P3
- **Fichiers** : `backend/chronoapp/app/api/timerpause/[id]/route.ts`, `frontend/chronoapp/services/api.ts:154-165`
- **Revue** : [reviewBackend.md §2.5](review/archive/2026-10-04/reviewBackend.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #101

**Problème** — `[id]` désigne la séance en GET et DELETE, mais la pause en PATCH.

**Correction** — `/timerpause/byseance/[id]` pour GET et DELETE (comme `timerrunner`), ou des routes imbriquées `/seance/[id]/pauses`.

**Critère de fin**
- [ ] Un segment d'URL = un seul type de ressource

### BACK-11 · Factoriser l'authentification des routes (`withAuth`)

- **Priorité** : P3
- **Labels** : backend, enhancement, P3
- **Fichiers** : les 15 handlers qui appellent `getUserIdFromRequest`, nouveau `backend/chronoapp/lib/withAuth.ts`
- **Revue** : [reviewBackend.md §Refactor suggéré](review/archive/2026-10-04/reviewBackend.md)
- **Réflexe** : V-10
- **Statut** : issue créée
- **Issue** : #102

**Problème** — Le bloc auth + 401 est répété 15 fois.

**Correction** — Fonction d'ordre supérieur `withAuth(handler)` qui injecte `userId`.

**Critère de fin**
- [ ] Plus aucun `getUserIdFromRequest` direct dans `app/api` (hors `withAuth`)

### BACK-12 · Corrections de qualité backend

- **Priorité** : P3
- **Labels** : backend, enhancement, P3
- **Fichiers** : voir le tableau de la revue
- **Revue** : [reviewBackend.md §Priorité 3](review/archive/2026-10-04/reviewBackend.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #103

**Problème** — Des `console.error({ err }, { status: 500 })`, des messages de log copiés-collés, la typo « cham », le mélange `Response`/`NextResponse`, des variables inutilisées, `error.tsx` mal typé, `height={1800}`, un `bcrypt.hash` calculé avant la vérification de doublon dans register, les 3 `if` redondants du reset.

**Correction** — Appliquer le tableau de la revue.

**Critère de fin**
- [ ] `npm run lint` sans avertissement

### BACK-13 · Purger les tokens de reset expirés

- **Priorité** : P3
- **Labels** : backend, security, enhancement, P3
- **Fichiers** : `backend/chronoapp/prisma/schema.prisma:28-36`
- **Revue** : [reviewBackend.md §2.4](review/archive/2026-10-04/reviewBackend.md), [securityPlus.md §14](security/securityPlus.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #104

**Problème** — Les `PasswordResetToken` expirés ou utilisés s'accumulent.

**Correction** — Route protégée appelée par un cron (Vercel Cron) : `deleteMany` sur `expiresAt < now` ou `usedAt != null`.

**Critère de fin**
- [ ] Cron planifié et testé

### SEC-07 · Ajouter un endpoint de déconnexion de tous les appareils

- **Priorité** : P3
- **Labels** : security, backend, enhancement, P3
- **Fichiers** : nouveau `backend/chronoapp/app/api/auth/logout/route.ts`, `frontend/chronoapp/context/AuthContext.tsx:30-33`
- **Revue** : [reviewSecurity.md §S4](review/archive/2026-10-04/reviewSecurity.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #105

**Problème** — Le logout supprime seulement le token local, qui reste valide 7 jours.

**Correction** — `POST /api/auth/logout` → `tokenVersion: { increment: 1 }` ; appelé par `logout()` (sans bloquer en cas d'échec réseau).

**Critère de fin**
- [ ] Un token est refusé après le logout

### SEC-08 · Statuer sur l'énumération à l'inscription / vérification d'email

- **Priorité** : P3
- **Labels** : security, backend, documentation, P3
- **Fichiers** : `backend/chronoapp/app/api/auth/register/route.ts:41-51`
- **Revue** : [reviewSecurity.md §S8-S9](review/archive/2026-10-04/reviewSecurity.md), [securityPlus.md §5](security/securityPlus.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #106

**Problème** — Le 409 « Un compte existe » contredit l'anti-énumération du reset ; aucune vérification d'email.

**Correction** — Soit documenter le compromis, soit passer à une inscription avec email de vérification.

**Critère de fin**
- [ ] Décision écrite dans le README ou dans `docs/security/security.md`

### FRONT-10 · Factoriser la gestion d'erreurs (`toUserMessage`, `useAsyncAction`)

- **Priorité** : P3
- **Labels** : frontend, enhancement, P3
- **Fichiers** : `frontend/chronoapp/lib/errors.ts`, 15 blocs `catch` dans `app/` et `components/`
- **Revue** : [reviewFrontend.md §2.3](review/archive/2026-10-04/reviewFrontend.md)
- **Réflexe** : V-10
- **Statut** : issue créée
- **Issue** : #107

**Problème** — Le même `catch` est copié 15 fois ; le couple `error: boolean` + `detailError: string` est redondant. À faire après FRONT-01.

**Correction** — `toUserMessage(err)` puis un custom hook `useAsyncAction`.

**Critère de fin**
- [ ] Plus de `instanceof NetworkError` dans les écrans

### FRONT-11 · Supprimer l'état dérivé de `BtnAndList`

- **Priorité** : P3
- **Labels** : frontend, enhancement, P3
- **Fichiers** : `frontend/chronoapp/components/BtnAndList.tsx:29-82`, `frontend/chronoapp/app/run/[id].tsx:379`
- **Revue** : [reviewFrontend.md §2.4](review/archive/2026-10-04/reviewFrontend.md)
- **Réflexe** : V-01
- **Statut** : issue créée
- **Issue** : #108

**Problème** — `arrayNumber` est calculable à partir de `totalRunner` + `arrayResult` ; prop `reset: Boolean` ; `useEffect` avec dépendances manquantes.

**Correction** — Calcul pendant le rendu, `key={resetCount}` côté parent, `useState(() => seance.timerRunners)`.

**Critère de fin**
- [ ] Un seul state pour les résultats ; tests BtnAndList verts

### FRONT-12 · Corrections de qualité frontend

- **Priorité** : P3
- **Labels** : frontend, enhancement, P3
- **Fichiers** : voir le tableau de la revue
- **Revue** : [reviewFrontend.md §2.6](review/archive/2026-10-04/reviewFrontend.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #109

**Problème** — Double `deleteItemAsync` dans account, virgule en trop dans un tableau de styles, style de bouton appliqué à un `<Text>`, branches identiques dans login, `onInvalid` au message fixe, `arrayColor` recréé à chaque rendu, props d'`ErrorMessage`, logs copiés-collés, enum affichée brute, schémas en `.tsx`, route `formSeance/page`, `EXPO_BASE_URL` jamais injectée.

**Correction** — Appliquer le tableau de la revue.

**Critère de fin**
- [ ] `npm run lint` et `tsc --noEmit` sans avertissement

### FRONT-13 · Garder l'écran allumé pendant une séance

- **Priorité** : P3
- **Labels** : frontend, enhancement, P3
- **Fichiers** : `frontend/chronoapp/app/run/[id].tsx`
- **Revue** : [reviewFrontend.md §Accessibilité](review/archive/2026-10-04/reviewFrontend.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #110

**Problème** — L'écran peut s'éteindre en plein chronométrage.

**Correction** — `expo-keep-awake` (`useKeepAwake()`) quand le chrono tourne.

**Critère de fin**
- [ ] Testé sur appareil pendant plus de 2 minutes

### STORE-05 · Nettoyer la configuration Expo (permissions, web, AGENTS.md)

- **Priorité** : P3
- **Labels** : store, frontend, enhancement, P3
- **Fichiers** : `frontend/chronoapp/app.json:13-26`, `frontend/chronoapp/AGENTS.md`
- **Revue** : [reviewFrontend.md §Préparation Play Store](review/archive/2026-10-04/reviewFrontend.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #111

**Problème** — Permissions Android non restreintes, bloc `web` inutile, `AGENTS.md` qui pointe vers la doc du SDK 54.

**Correction** — `android.blockedPermissions`, retrait du bloc `web` si pas de version web, lien vers la doc SDK 57.

**Critère de fin**
- [ ] Le manifeste du build ne contient que les permissions nécessaires

### TEST-04 · Ajouter `eslint-plugin-jest`

- **Priorité** : P3
- **Labels** : tests, enhancement, P3
- **Fichiers** : `frontend/chronoapp/eslint.config.js`
- **Revue** : [reviewTestingLibrary.md §1.1](review/archive/2026-10-04/reviewTestingLibrary.md)
- **Réflexe** : V-04
- **Statut** : issue créée
- **Issue** : #112

**Problème** — Les assertions invalides (§TEST-01) ne sont détectées par aucun outil.

**Correction** — `eslint-plugin-jest` avec `jest/valid-expect` et `jest/no-disabled-tests` sur `tests/**`.

**Critère de fin**
- [ ] Réintroduire un `toBeTruthy` sans `()` fait échouer le lint

### TEST-05 · Tester le comportement plutôt que l'implémentation

- **Priorité** : P3
- **Labels** : tests, enhancement, P3
- **Fichiers** : `frontend/chronoapp/tests/_[id]run.test.tsx:151-196`, `frontend/chronoapp/tests/_btnandlist.test.tsx:118`, `frontend/chronoapp/tests/_list.test.tsx:20-23`
- **Revue** : [reviewTestingLibrary.md §2.1-2.4](review/archive/2026-10-04/reviewTestingLibrary.md)
- **Réflexe** : V-04
- **Statut** : issue créée
- **Issue** : #113

**Problème** — Les assertions portent sur les couleurs (`toHaveStyle`), `push` est branché sur `mockReplace`, et les tests 401 sont dupliqués dans les écrans.

**Correction** — `toBeDisabled` / `toBeEnabled`, un `mockPush` distinct, supprimer les tests 401 des écrans après FRONT-01, requêtes `getByRole` après FRONT-08.

**Critère de fin**
- [ ] Plus de `toHaveStyle({ backgroundColor })` dans les tests

### TEST-06 · Couvrir les couches non testées

- **Priorité** : P3
- **Labels** : tests, frontend, enhancement, P3
- **Fichiers** : `frontend/chronoapp/components/viewChrono.tsx`, `frontend/chronoapp/context/AuthContext.tsx`, `frontend/chronoapp/components/AuthGate.tsx`, `frontend/chronoapp/app/(tabs)/account.tsx`, `frontend/chronoapp/lib/schema/`
- **Revue** : [reviewTestingLibrary.md §3.2](review/archive/2026-10-04/reviewTestingLibrary.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #114

**Problème** — `ViewChrono`, les schémas, `AuthContext`, `AuthGate`, l'écran Compte et l'affichage du temps ne sont pas testés.

**Correction** — `it.each` pour les fonctions pures, `renderHook` pour le Context, faux timers pour le chrono.

**Critère de fin**
- [ ] Un fichier de test par cible listée

### TEST-07 · Nettoyer l'outillage Jest

- **Priorité** : P3
- **Labels** : tests, enhancement, P3
- **Fichiers** : `frontend/chronoapp/package.json:12`, `jest.config.js` (racine), `frontend/chronoapp/jest.setup.js:5-8`, `frontend/chronoapp/tests/*`
- **Revue** : [reviewTestingLibrary.md §Outillage et hygiène](review/archive/2026-10-04/reviewTestingLibrary.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #115

**Problème** — Seul script : `jest --watchAll` ; config Jest orpheline à la racine ; `setUpTests()` appelé deux fois ; `afterEach(cleanup)` redondant ; fixtures dupliquées ; `console.error` attendus dans la sortie ; fuite de timers en fin de suite.

**Correction** — Script `test:ci`, supprimer `/jest.config.js`, un seul `setUpTests()`, `tests/fixtures.ts` avec une factory, `jest.spyOn(console, "error")` dans les tests d'erreur.

**Critère de fin**
- [ ] `npm run test:ci` passe sans warning ni fuite

### FRONT-15 · Extraire le calcul du chrono en fonction pure

- **Priorité** : P3
- **Labels** : frontend, enhancement, P3
- **Fichiers** : `frontend/chronoapp/app/run/[id].tsx:75`, `frontend/chronoapp/app/run/[id].tsx:102-119`
- **Revue** : [reviewFrontend.md §2.3](review/reviewFrontend.md)
- **Réflexe** : V-07
- **Statut** : issue créée
- **Issue** : #183

**Problème** — `handleStartChrono` est utilisé dans l'effet (l.75) avant sa déclaration `const` (l.102) : erreur ESLint « Cannot access variable before it is declared ». Le calcul du temps écoulé, cœur de l'app, n'est pas testable isolément.

**Correction** — `computeElapsedSeconds(startedAt: string, pauses: TimerPause[], now: number)` dans `lib/chrono.ts`, tests Jest écrits d'abord (sans pause, pauses terminées, pause ouverte ignorée).

**Critère de fin**
- [ ] L'erreur ESLint de `run/[id].tsx` disparaît
- [ ] `lib/chrono.ts` a au moins 3 tests

### FRONT-16 · Stabiliser `logout` et la `value` d'`AuthContext`

- **Priorité** : P3
- **Labels** : frontend, enhancement, P3
- **Fichiers** : `frontend/chronoapp/context/AuthContext.tsx:27-51`
- **Revue** : [reviewFrontend.md §2.2](review/reviewFrontend.md)
- **Réflexe** : V-07
- **Statut** : issue créée
- **Issue** : #184

**Problème** — L'effet `[logout]` ne reste stable que si le React Compiler mémoïse `logout` ; la `value` du Provider est recréée à chaque rendu (signalé aussi dans #164).

**Correction** — `useCallback` sur `login` / `logout`, `useMemo` sur la `value`.

**Critère de fin**
- [ ] L'effet d'abonnement à `onUnauthorized` ne s'exécute qu'une fois au montage (vérifiable par un test ou un log)

### FRONT-17 · Corrections de qualité frontend (revue 2026-10-27)

- **Priorité** : P3
- **Labels** : frontend, enhancement, P3
- **Fichiers** : `frontend/chronoapp/services/api.ts:5`, `frontend/chronoapp/app/(tabs)/account.tsx:40-41`, `frontend/chronoapp/app/(tabs)/account.tsx:154-155`, `frontend/chronoapp/components/BtnAndList.tsx:30`, `frontend/chronoapp/components/BtnAndList.tsx:137`, `frontend/chronoapp/lib/schema/formRegister.tsx:14`
- **Revue** : [reviewFrontend.md §🟡](review/reviewFrontend.md)
- **Réflexe** : V-09
- **Statut** : issue créée
- **Issue** : #185

**Problème** — Points nouveaux par rapport à FRONT-12 (#109, qui reste valable) : import `router` inutilisé dans le service HTTP, double `deleteItemAsync` + `onPress={() => console.log}` et URL en dur dans `account.tsx`, `reset: Boolean` et `response` inutilisé dans `BtnAndList`, limite du mot de passe en caractères côté front contre 72 octets côté back.

**Correction** — Voir le tableau 🟡 de la revue ; pour le mot de passe : `refine((v) => new TextEncoder().encode(v).length <= 72)`.

**Critère de fin**
- [ ] `npx expo lint` : plus de warning `no-unused-vars` sur ces fichiers
- [ ] Un mot de passe de 70 caractères accentués est refusé côté front avec le même message que le back

### BACK-20 · Corrections de qualité backend (revue 2026-10-27)

- **Priorité** : P3
- **Labels** : backend, enhancement, P3
- **Fichiers** : `backend/chronoapp/app/api/timerrunner/route.ts:14-21`, `backend/chronoapp/app/api/seance/route.ts:29`, `backend/chronoapp/app/api/auth/register/route.ts:55-69`, `backend/chronoapp/app/api/auth/login/route.ts:37`, `backend/chronoapp/lib/schema/deleteUserSchema.ts`, `backend/chronoapp/app/error.tsx:3-13`, `backend/chronoapp/app/component/paswwordReset.tsx:13-23`, `backend/chronoapp/app/privacy/page.tsx`, `backend/chronoapp/.expo/`
- **Revue** : [reviewBackend.md §🟡](review/reviewBackend.md)
- **Réflexe** : V-10
- **Statut** : issue créée
- **Issue** : #186

**Problème** — Deux classes `HttpError` côté serveur ; 6 `console.error({ err }, { status: 500 })` ; messages et logs copiés-collés (« Séance introuvable » pour un coureur, « POST » dans un GET) ; P2025 → 404 au lieu de 409 sur une pause terminée ; `P2002` non géré à l'inscription ; rate limit login sur la donnée brute ; schémas de suppression dupliqués ; `error.tsx` mal typé et au message trompeur ; 24 erreurs ESLint (23 apostrophes dans `privacy`, 1 `setState` dans un effet) ; dossiers `.expo/` suivis par git.

**Correction** — Voir le tableau 🟡 de la revue.

**Critère de fin**
- [ ] `npx eslint .` : 0 erreur dans `app/` et `lib/`
- [ ] Une seule classe `HttpError` serveur ; `.expo/` ignoré par git

### TEST-12 · Aligner les titres des tests et nettoyer le lint des tests

- **Priorité** : P3
- **Labels** : tests, enhancement, P3
- **Fichiers** : `backend/chronoapp/test/_route_user.test.ts:78`, `backend/chronoapp/test/_route_timerpause.test.ts:141`, `backend/chronoapp/test/_route_timerpauseId.test.ts:82`, `frontend/chronoapp/tests/_btnandlist.test.tsx:111`, `frontend/chronoapp/tests/_btnandlist.test.tsx:162`, `frontend/chronoapp/tests/_[id]run.test.tsx:115`
- **Revue** : [reviewTestingLibrary.md §2.4, §🟡](review/reviewTestingLibrary.md)
- **Réflexe** : V-04
- **Statut** : issue créée
- **Issue** : #187

**Problème** — Des titres annoncent un statut ou un comportement différent de ce qui est vérifié (« 401 » pour un 400, « disabled » pour un message d'erreur, titre dupliqué, « chrono défile » sans assertion) ; 4 `any` et des imports inutilisés dans les tests backend ; commentaire d'un autre projet dans `_deleteUser.test.tsx:1`.

**Correction** — Renommer selon ce qui est vérifié ; typer le callback de `$transaction` ; supprimer les imports inutiles.

**Critère de fin**
- [ ] Chaque titre de test cite le statut ou le comportement réellement vérifié
- [ ] `npx eslint test/` : 0 erreur

### SEC-13 · Limiter la suppression mobile par `userId`

- **Priorité** : P3
- **Labels** : security, backend, enhancement, P3
- **Fichiers** : `backend/chronoapp/app/api/user/route.ts:42`, `backend/chronoapp/lib/rateLimit.ts:43-47`
- **Revue** : [reviewSecurity.md §🟡](review/reviewSecurity.md)
- **Réflexe** : —
- **Statut** : issue créée
- **Issue** : #188

**Problème** — La branche mobile de `DELETE /api/user` n'est limitée que par IP : un token volé permet des essais de mot de passe depuis plusieurs IP.

**Correction** — Ajouter un limiteur `userRateLimitUserId` (5/min) à côté du limiteur IP.

**Critère de fin**
- [ ] 429 au 6ᵉ essai pour un même `userId`, test à l'appui
