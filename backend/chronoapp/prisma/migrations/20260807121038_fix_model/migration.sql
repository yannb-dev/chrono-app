/*
  Warnings:

  - Added the required column `userId` to the `Seance` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `numberRunner` on the `TimerSession` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Seance" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TimerSession" DROP COLUMN "numberRunner",
ADD COLUMN     "numberRunner" INTEGER NOT NULL;
