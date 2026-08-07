import { z } from "zod";

export const SeanceSchema = z.object({
  totalRunner: z.int().min(1),
  colorRunner: z.string().min(1),
});

export type SeanceSchema = z.infer<typeof SeanceSchema>;
