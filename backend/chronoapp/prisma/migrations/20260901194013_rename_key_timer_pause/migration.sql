/*
  Warnings:

  - You are about to drop the column `resumedAt` on the `TimerPause` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TimerPause" DROP COLUMN "resumedAt",
ADD COLUMN     "pauseDurationMs" INTEGER;
