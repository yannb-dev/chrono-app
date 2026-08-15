import { z } from "zod";

export const TimerPauseSchema = z.object({
  seanceId: z.string().min(1),
  pausedAt: z.coerce.date(),
});

export type TimerPauseSchema = z.infer<typeof TimerPauseSchema>;

export const TimerPauseSchemaUpdate = z.object({
  endedAt: z.coerce.date(),
});

export type TimerPauseSchemaUpdate = z.infer<typeof TimerPauseSchemaUpdate>;
