import { z } from "zod";

export const PatchChronoSchema = z.object({
  startedAt: z.date().nullable().optional(),
  state: z.enum(["NoStart", "InProgress", "Finish"]).optional(),
});

export type PatchChronoSchema = z.infer<typeof PatchChronoSchema>;
