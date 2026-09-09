/*
  Warnings:

  - Changed the type of `totalRunner` on the `Seance` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Seance" DROP COLUMN "totalRunner",
ADD COLUMN     "totalRunner" INTEGER NOT NULL;
