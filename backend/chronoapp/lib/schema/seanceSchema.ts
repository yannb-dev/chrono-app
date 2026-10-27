import { z } from "zod";

const ONE_HOUR_MS = 60 * 60 * 1000;

export const SeanceSchema = z.object({
  totalRunner: z.number().int().min(1).max(20),
  colorRunner: z.string().min(1).max(20),
});

export type SeanceSchema = z.infer<typeof SeanceSchema>;

export const SeanceUpdateSchema = z.object({
  startedAt: z.coerce
    .date()
    .refine((d) => d.getTime() >= Date.now() - ONE_HOUR_MS)
    .nullable(),
  state: z.enum(["NoStart", "InProgress", "Finish"]),
});

export type SeanceUpdateSchema = z.infer<typeof SeanceUpdateSchema>;
