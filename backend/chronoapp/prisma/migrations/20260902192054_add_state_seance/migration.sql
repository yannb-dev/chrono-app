-- CreateEnum
CREATE TYPE "StateSeance" AS ENUM ('NoStart', 'InProgress', 'Finish');

-- AlterTable
ALTER TABLE "Seance" ADD COLUMN     "state" "StateSeance" NOT NULL DEFAULT 'NoStart';
