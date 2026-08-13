-- DropForeignKey
ALTER TABLE "TimerSession" DROP CONSTRAINT "TimerSession_seanceId_fkey";

-- AddForeignKey
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimerSession" ADD CONSTRAINT "TimerSession_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "Seance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
