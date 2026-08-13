/*
  Warnings:

  - You are about to drop the column `timerSessionId` on the `TimerPause` table. All the data in the column will be lost.
  - You are about to drop the `TimerSession` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `seanceId` to the `TimerPause` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TimerPause" DROP CONSTRAINT "TimerPause_timerSessionId_fkey";

-- DropForeignKey
ALTER TABLE "TimerSession" DROP CONSTRAINT "TimerSession_seanceId_fkey";

-- AlterTable
ALTER TABLE "Seance" ADD COLUMN     "startedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TimerPause" DROP COLUMN "timerSessionId",
ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "seanceId" TEXT NOT NULL;

-- DropTable
DROP TABLE "TimerSession";

-- CreateTable
CREATE TABLE "TimerRunner" (
    "id" TEXT NOT NULL,
    "numberRunner" INTEGER NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "seanceId" TEXT NOT NULL,

    CONSTRAINT "TimerRunner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TimerRunner_seanceId_key" ON "TimerRunner"("seanceId");

-- AddForeignKey
ALTER TABLE "TimerRunner" ADD CONSTRAINT "TimerRunner_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "Seance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimerPause" ADD CONSTRAINT "TimerPause_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "Seance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
