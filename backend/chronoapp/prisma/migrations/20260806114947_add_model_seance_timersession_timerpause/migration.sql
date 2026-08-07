-- CreateTable
CREATE TABLE "Seance" (
    "id" TEXT NOT NULL,
    "totalRunner" INTEGER NOT NULL,
    "colorRunner" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Seance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimerSession" (
    "id" TEXT NOT NULL,
    "numberRunner" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "seanceId" TEXT NOT NULL,

    CONSTRAINT "TimerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimerPause" (
    "id" TEXT NOT NULL,
    "timerSessionId" TEXT NOT NULL,
    "pausedAt" TIMESTAMP(3) NOT NULL,
    "resumedAt" TIMESTAMP(3),

    CONSTRAINT "TimerPause_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TimerSession" ADD CONSTRAINT "TimerSession_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "Seance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimerPause" ADD CONSTRAINT "TimerPause_timerSessionId_fkey" FOREIGN KEY ("timerSessionId") REFERENCES "TimerSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
