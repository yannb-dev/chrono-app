import { z } from "zod";

export const TimerSessionSchema = z.object({
  numberRunner: z.int().min(1),
  startedAt: z.date(),
  seanceId: z.string().min(1),
});

export type TimerSessionSchema = z.infer<typeof TimerSessionSchema>;

export const TimerSessionUpdateSchema = z.object({
  endedAt: z.date(),
  duration: z.int().min(1),
});

export type TimerSessionUpdateSchema = z.infer<typeof TimerSessionUpdateSchema>;
