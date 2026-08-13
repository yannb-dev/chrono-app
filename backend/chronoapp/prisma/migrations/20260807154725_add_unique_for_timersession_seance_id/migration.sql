/*
  Warnings:

  - A unique constraint covering the columns `[seanceId]` on the table `TimerSession` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TimerSession_seanceId_key" ON "TimerSession"("seanceId");
