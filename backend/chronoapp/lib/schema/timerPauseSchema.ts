import { z } from "zod";

const ONE_HOUR_MS = 60 * 60 * 1000;

export const TimerPauseSchema = z.object({
  seanceId: z.string().min(1),
  pausedAt: z.coerce
    .date()
    .refine((d) => d.getTime() >= Date.now() - ONE_HOUR_MS),
});

export type TimerPauseSchema = z.infer<typeof TimerPauseSchema>;

export const TimerPauseSchemaUpdate = z.object({
  endedAt: z.coerce.date(),
});

export type TimerPauseSchemaUpdate = z.infer<typeof TimerPauseSchemaUpdate>;
