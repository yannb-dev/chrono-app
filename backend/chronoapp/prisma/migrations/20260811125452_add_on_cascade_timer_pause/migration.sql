-- DropForeignKey
ALTER TABLE "TimerPause" DROP CONSTRAINT "TimerPause_timerSessionId_fkey";

-- AddForeignKey
ALTER TABLE "TimerPause" ADD CONSTRAINT "TimerPause_timerSessionId_fkey" FOREIGN KEY ("timerSessionId") REFERENCES "TimerSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
