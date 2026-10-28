import { z } from "zod";

export const SeanceSchema = z.object({
  totalRunner: z.number().int().min(1).max(20),
  colorRunner: z.string().min(1).max(20),
});

export type SeanceSchema = z.infer<typeof SeanceSchema>;

const MAX_PAST_MS = 1 * 60 * 1000;
const CLOCK_SKEW_MS = 60 * 1000;

export const SeanceUpdateSchema = z.object({
  startedAt: z.coerce
    .date()
    .refine(
      (d) => {
        const now = Date.now();
        const t = d.getTime();
        return t <= now + CLOCK_SKEW_MS && t >= now - MAX_PAST_MS;
      },
      {
        message:
          "startedAt doit être dans les dernières 24h et pas dans le futur",
      },
    )
    .nullable(),
  state: z.enum(["NoStart", "InProgress", "Finish"]),
});

export type SeanceUpdateSchema = z.infer<typeof SeanceUpdateSchema>;
