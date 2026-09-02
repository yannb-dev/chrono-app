/*
  Warnings:

  - Added the required column `userId` to the `TimerRunner` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TimerRunner" ADD COLUMN     "userId" TEXT NOT NULL;
