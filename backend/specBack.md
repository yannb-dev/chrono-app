# Spécification backend

## Détail

1. Premier temps un backend avec une base de donnée avec authentification simple (email + password)
2. Enregistrement en base de donnée de trois models [seance], [timerRunner] et [timerPause]

## Modèle du schema.prisma

// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
provider = "prisma-client"
output = "../app/generated/prisma"
}

datasource db {
provider = "postgresql"
url = env("DATABASE_URL")
}

model User {
id String @id @default(cuid())
email String @unique
name String?
image String?
createdAt DateTime @default(now())
}

model Seance {
id String @id @default(cuid())
totalRunner Int
colorRunner String
startedAt DateTime?
userId String
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
createdAt DateTime @default(now())
timerRunners TimerRunner[]
timerpauses TimerPause[]
}

model TimerRunner {
id String @id @default(cuid())
numberRunner Int
endedAt DateTime
duration Int
seanceId String @unique
seance Seance @relation(fields: [seanceId], references: [id], onDelete: Cascade)

}

model TimerPause {
id String @id @default(cuid())
pausedAt DateTime
endedAt DateTime?
resumedAt Int?
seanceId String
seance Seance @relation(fields: [seanceId], references: [id], onDelete: Cascade)
}

## Principe du chrono

Déclenchement via un OnPress pour enregistrer en BDD la date de départ et de fin. Côté serveur on enregistre et on calcul les cumul de pause à soustraire au [TimerRunner]
Côté client l'affichage se réalise avec un calcul à la volée pour le chrono et via un calcul de nombre de milisecond converti en mm:ss pour les listes de résultats.

## Valeurs POST

- [x] SEANCE
      data: {
      totalRunner: safeSeance.data.totalRunner,
      colorRunner: safeSeance.data.colorRunner,
      }
- [x] TIMERRUNNER
      data: {
      numberRunner: safeTimerRunner.data.numberRunner,
      endedAt: safeTimerRunner.data.endedAt,
      seanceId: safeTimerRunner.data.seanceId,
      },
- [x] TIMERPAUSE
      data: {
      seanceId: safeTimerPause.data.timerSessionId,
      pausedAt: safeTimerPause.data.pausedAt,
      },

  ## Valeurs UPDATE

- [x] SEANCE
      data: {
      startedAt: safeValuePatch.data.sartedAt,
      },

- [x] TIMERPAUSE
      data: {
      endedAt: safeValue.data?.endedAt,
      },

## Contrôle de l'ensemble des routes VALIDES

## Déploiement sur Vercel

nom de deploy : chronoappepms.vercel.app
