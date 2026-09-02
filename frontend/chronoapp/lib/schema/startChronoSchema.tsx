import { z } from "zod";

export const StartChronoSchema = z.object({
  startedAt: z.date().nullable(),
});

export type StartChronoSchema = z.infer<typeof StartChronoSchema>;
