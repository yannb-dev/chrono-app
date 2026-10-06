/*
  Warnings:

  - A unique constraint covering the columns `[seanceId,numberRunner]` on the table `TimerRunner` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TimerRunner_seanceId_numberRunner_key" ON "TimerRunner"("seanceId", "numberRunner");
