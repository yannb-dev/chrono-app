# Revue pédagogique — Fonctionnalité "Reset password" (2026-09-21)

Revue ciblée sur la fonctionnalité de réinitialisation de mot de passe, en trois parties : Frontend, Backend, Intégration. Contexte croisé avec `docs/revue5.md` (revue déploiement) pour les points qui se recoupent (variables d'environnement, absence de rate limiting).

---

## 1. Frontend

La fonctionnalité a en réalité **deux surfaces client distinctes**, ce qui vaut la peine d'être nommé explicitement :

- **Écran mobile** (`frontend/chronoapp/app/(auth)/passwordReset.tsx`) — demande de réinitialisation (saisie email)
- **Page web** (`backend/chronoapp/app/page.tsx` + `app/component/formResetPassword.tsx`) — saisie du nouveau mot de passe, servie par le backend Next.js lui-même et ouverte depuis le lien reçu par email

C'est un choix d'architecture cohérent (le lien d'un email ne peut pas rouvrir directement un écran React Native sans deep linking), mais ça mérite d'être conscientisé : le "backend" n'est plus un pur serveur d'API, il sert aussi une page HTML avec Tailwind. C'est légitime avec Next.js, mais ça explique pourquoi le blocage `next build` de `revue5.md` (point 1, `prisma.config.ts`) casse *aussi* cette page, pas seulement les routes API.

**Points positifs à noter** :
- `passwordReset.tsx` réutilise exactement le même pattern que `login.tsx`/`register.tsx` (RHF + `zodResolver`, `HttpError`/`NetworkError`/`extractErrorMessage`) — signe d'une convention personnelle qui se stabilise, pas du code ad hoc à chaque écran.
- Le `useEffect` de redirection auto vers `/login` après 3s nettoie bien son `setTimeout` (`return () => clearTimeout(...)`) — un piège classique évité.
- `formResetPassword.tsx` valide bien la complexité du mot de passe côté client via `NewPasswordSchema` avant l'envoi.

**Point d'amélioration (mineur, pas bloquant)** : dans `formResetPassword.tsx`, les 4 états (`loading`, `error`, `messageConfirmValid`, `detailError`) sont des booléens indépendants alors qu'ils sont mutuellement exclusifs (on ne peut pas être à la fois `loading` et `error`). Bon exercice pour la suite : les fusionner en un seul `status: "idle" | "loading" | "success" | "error"`. Pas urgent, mais c'est le genre de refacto qui devient nécessaire dès que l'écran gagne un état de plus.

---

## 2. Backend

`backend/chronoapp/app/api/auth/passwordresettoken/route.ts` gère POST (demande) et PATCH (nouveau mot de passe).

**Ce qui est bien fait — à souligner, parce que c'est du réflexe acquis, pas suggéré :**
- Le POST ne révèle jamais si l'email existe (message générique dans tous les cas) — protection anti-énumération de comptes.
- Le token est stocké **hashé** (SHA-256) en base, jamais en clair — une fuite de la table `PasswordResetToken` ne donne donc pas de tokens utilisables.
- Le PATCH utilise `prisma.$transaction` pour changer le mot de passe et marquer le token `usedAt` **atomiquement** — évite qu'un crash entre les deux laisse un token valide réutilisable.
- Le PATCH capture `P2025` → `400 "Lien invalide ou expiré"` au lieu d'un `500` générique — exactement la leçon de `revue4`/`revue5` (point 5b), appliquée ici sans qu'on te le redemande.

**Bugs trouvés :**

1. **Incohérence de durée d'expiration** — `route.ts` fixe `expiresAt: Date.now() + 30 * 60 * 1000` (30 min), mais `lib/mail.ts` écrit dans l'email *"Ce lien expire dans 1h."* Un utilisateur qui clique à 40 minutes se fait dire par email qu'il a encore 20 minutes, et tombe sur "Lien invalide ou expiré". Fix propre : une seule constante partagée (ex. `RESET_TOKEN_TTL_MINUTES`) utilisée à la fois dans le calcul et interpolée dans le texte de l'email.
2. **Sujet d'email copié-collé d'un autre flow** — `mail.ts` envoie le sujet *"Confirme ton adresse email"* alors que c'est un email de réinitialisation de mot de passe (le corps du mail, lui, est correct). Reste probablement d'un copier-coller depuis un flow de vérification d'email qui n'existe pas (encore) dans ce projet.

**Point d'attention réel — absence de rate limiting :**

`/api/auth/login` a un `loginRateLimit` (Upstash) depuis `revue5`. `passwordresettoken` (POST **et** PATCH) n'en a **aucun**. Concrètement :
- Le POST déclenche un appel à Resend (quota payant/limité) et une écriture en base à chaque requête, sans aucun frein.
- Même si la réponse ne révèle jamais si le compte existe, rien n'empêche de spammer la boîte mail d'une victime en boucle — vecteur d'ennui/harcèlement distinct de l'énumération.

→ Le même `Ratelimit` que sur le login devrait s'appliquer ici (ex. `resetRateLimit`, clé IP+email).

---

## 3. Intégration de "Reset password"

En suivant le flux de bout en bout, trois choses n'apparaissent qu'à ce niveau — ni dans le frontend seul, ni dans le backend seul :

**a) Le lien de l'email pointe vers le backend lui-même, pas vers le mobile.** `mail.ts` construit `${APP_URL}/?token=...`, et `APP_URL` dans `backend/chronoapp/.env` vaut `https://chrono-app-blond.vercel.app` — donc contrairement au problème d'IP privée de `revue5` (point 3, côté frontend), cette URL-ci est déjà publique en local. Mais reste à confirmer un point que `revue5` a soulevé pour Upstash (point 2) et qui s'applique identiquement ici : **`RESEND_TOKEN` et `APP_URL` sont-ils bien posés comme variables d'environnement sur Vercel**, ou seulement dans le `.env` local (non commité, donc invisible de l'hébergeur) ? Si non, le POST plantera en prod exactement comme le login plante sans les clés Upstash.

**b) Le bug d'expiration (30 min vs "1h") est un bug d'intégration, pas un bug de fichier isolé.** Aucun test unitaire sur `route.ts` seul ni sur `mail.ts` seul ne l'aurait détecté — il faut regarder les deux fichiers ensemble pour le voir. Bon exemple concret de pourquoi une seule source de vérité (constante partagée) vaut mieux que deux nombres qui doivent rester synchronisés "à la main".

**c) Couverture de test : zéro, sur toute la fonctionnalité.** Ni l'écran mobile, ni la page web, ni le POST, ni le PATCH n'ont de test (aucun fichier `*.test.*` ne mentionne "password" ou "reset"). Notable parce que cette fonctionnalité touche à la fois un mot de passe utilisateur et un service tiers payant (Resend) — précisément le genre d'endroit où un bug silencieux coûte cher. Étant donné la préférence pour écrire les tests avant le code, le point d'entrée le plus rentable est le **PATCH** : c'est de la logique pure (token invalide / expiré / déjà utilisé / succès), sans dépendance à un service externe — contrairement au POST qui orchestre surtout un appel à Resend.

### Priorités concrètes, propres à cette fonctionnalité

1. Unifier la durée d'expiration (constante partagée, backend + texte de l'email).
2. Corriger le sujet de l'email (copié d'un autre flow).
3. Ajouter un rate limit sur `passwordresettoken` (POST et PATCH), sur le modèle de `loginRateLimit`.
4. Vérifier que `RESEND_TOKEN` et `APP_URL` sont bien posés sur l'hébergeur (pas seulement en local) — même classe de problème que le point 2 de `revue5`.
5. Écrire un premier test sur le PATCH (les 4 branches : token introuvable, déjà utilisé, expiré, succès) — meilleur point d'entrée TDD ici.
6. *(Discussion, pas urgent)* : faut-il invalider les anciens tokens en attente quand l'utilisateur redemande une réinitialisation ? Actuellement, plusieurs liens valides peuvent coexister pour un même compte.
