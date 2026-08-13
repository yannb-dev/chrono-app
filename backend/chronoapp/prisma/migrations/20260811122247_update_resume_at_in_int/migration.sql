/*
  Warnings:

  - The `resumedAt` column on the `TimerPause` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "TimerPause" DROP COLUMN "resumedAt",
ADD COLUMN     "resumedAt" INTEGER;
