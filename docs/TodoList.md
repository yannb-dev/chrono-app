# Prochain travaux

Gestion des erreurs pour les api route => NextResponse.json() avec corrélation front fetch()

- [ ] /login route.ts => login.tsx
- [ ] /seance route.ts => list.tsx
- [ ] /seance route.ts => /result [id].tsx
- [ ] /seance route.ts => /run [id].tsx
- [ ] /seance route.ts => BtnAndList.tsx
- [ ] /seance route.ts => form.tsx
- [ ] /timerRunner route.ts => BtnAndList.tsx
- [ ] /timerRunner route.ts => /run [id].tsx
- [ ] /timerPause route.ts => /run [id].tsx

#

#

#

# Fiche de pattern de développement — RN/Expo + Next.js/Prisma

> À cocher à chaque nouvelle feature ou nouvelle session de travail. L'objectif : ne jamais commencer au mauvais endroit, ne jamais perdre le fil Git, ne jamais tester trop tard.

## Phase 0 — Avant de coder (une fois par feature)

- [ ] Spec écrite : quelles données sont concernées ?
- [ ] Modèle de données défini (Prisma / Zod)
- [ ] API repérée : déjà existante ou à créer (lister les endpoints)
- [ ] Écran(s) concerné(s) identifié(s)
- [ ] Dépendances identifiées (qu'est-ce qui doit déjà exister avant de commencer)
- [ ] Feature découpée en incréments de moins de 30 min

## Ordre technique (toujours bottom-up)

- [ ] 1. Modèle de données
- [ ] 2. API / logique backend
- [ ] 3. Écran UI (consomme l'API existante)
- [ ] 4. Intégration (cas limites, edge cases)

## Boucle par incrément (à répéter pour chaque petite tâche)

- [ ] Créer ou checkout une branche dédiée (`feature/...` ou `fix/...`)
- [ ] Écrire le test avant le code (ce que le composant/la fonction doit recevoir et produire)
- [ ] Coder l'incrément
- [ ] Faire passer le test
- [ ] Vérifier la sécurité si zone sensible (voir checklist dédiée ci-dessous)
- [ ] Commit atomique avec message clair

## Filet de sécurité Git

- [ ] Avant tout debug profond → `git commit -am "wip: description du bug"`
- [ ] Bug résolu → nettoyer le commit (`git commit --amend` ou squash)
- [ ] Règle : jamais plus de 30 min sans commit ou checkpoint

## Checklist sécurité (spécifique à la stack)

- [ ] `.env` présent dans `.gitignore`
- [ ] Ownership check côté API : `if (data.userId !== session.userId) throw`
- [ ] Token JWT stocké dans `expo-secure-store`, jamais dans `AsyncStorage`
- [ ] Validation Zod sur chaque payload entrant côté API Route
- [ ] Vérification de l'expiration du token avant un appel sensible

## Fin de session ou de feature

- [ ] Merge & push
- [ ] Mettre à jour `seance.json` (objectives modifiés, memos, practicalProject)
