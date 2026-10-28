import { z } from "zod";

const MAX_PAST_MS = 1 * 60 * 1000;
const CLOCK_SKEW_MS = 60 * 1000;

export const TimerRunnerSchema = z.object({
  numberRunner: z.number().int().min(1).max(20),
  endedAt: z.coerce.date().refine(
    (d) => {
      const now = Date.now();
      const t = d.getTime();
      return t <= now + CLOCK_SKEW_MS && t >= now - MAX_PAST_MS;
    },
    {
      message:
        "startedAt doit être dans les dernières 24h et pas dans le futur",
    },
  ),
  seanceId: z.string().min(1),
});

export type TimerRunnerSchema = z.infer<typeof TimerRunnerSchema>;
