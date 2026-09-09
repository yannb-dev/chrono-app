import { z } from "zod";

export const SeanceSchema = z.object({
  totalRunner: z.number().int(),
  colorRunner: z.string().min(1),
});

export type SeanceSchema = z.infer<typeof SeanceSchema>;

export const SeanceUpdateSchema = z.object({
  startedAt: z.coerce.date().nullable(),
  state: z.enum(["NoStart", "InProgress", "Finish"]),
});

export type SeanceUpdateSchema = z.infer<typeof SeanceUpdateSchema>;
