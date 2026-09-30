import { z } from "zod";

export const TimerRunnerSchema = z.object({
  numberRunner: z.number().int().min(1).max(40),
  endedAt: z.coerce.date(),
  seanceId: z.string().min(1),
});

export type TimerRunnerSchema = z.infer<typeof TimerRunnerSchema>;
