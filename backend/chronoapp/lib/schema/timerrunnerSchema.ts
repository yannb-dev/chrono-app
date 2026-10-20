import { z } from "zod";

const ONE_HOUR_MS = 60 * 60 * 1000;

export const TimerRunnerSchema = z.object({
  numberRunner: z.number().int(),
  endedAt: z.coerce
    .date()
    .refine((d) => d.getTime() >= Date.now() - ONE_HOUR_MS),
  seanceId: z.string().min(1),
});

export type TimerRunnerSchema = z.infer<typeof TimerRunnerSchema>;
