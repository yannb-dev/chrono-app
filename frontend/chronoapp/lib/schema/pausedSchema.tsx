import { z } from "zod";

export const PausedChronoSchema = z.object({
  pausedAt: z.date(),
  seanceId: z.string().min(1),
});

export type PausedChronoSchema = z.infer<typeof PausedChronoSchema>;
