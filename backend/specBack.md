# Spécification backend

## Détail

1. Premier temps un backend avec une base de donnée accessible sans authentification
2. Enregistrement en base de donnée de deux models [seance] et [timerSession], créer un lien entre seance et chrono

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
createdAt DateTime @default(now())
chronos Chrono[]
}

model TimerSession {
id String @id @default(cuid())
numberRunner String
startedAt DateTime
endedAt DateTime?
duration Int?
seanceId String
seance Seance @relation(fields: [seanceId], references: [id])
pauses TimerPause[]
}

model TimerPause {
id String @id @default(cuid())
timerSessionId String
timerSession TimerSession @relation(fields: [timerSessionId], references: [id])
pausedAt DateTime
resumedAt DateTime? // null si la pause est en cours
}

## Principe du chrono

Déclenchement via un OnPress pour enregistrer en BDD la date de départ et de fin. Côté client pour la lecture calculer la différence. Chaque pause reprise sera enregistré en TimerPause et soustrait au total.
Côté client l'affichage se réalise avec un calcul à la volée.
