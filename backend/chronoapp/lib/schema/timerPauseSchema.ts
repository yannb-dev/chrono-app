import { z } from "zod";

export const TimerPauseSchema = z.object({
  timerSessionId: z.string().min(1),
  pausedAt: z.date(),
});

export type TimerPauseSchema = z.infer<typeof TimerPauseSchema>;
