import { z } from "zod";

const MAX_PAST_MS = 1 * 60 * 1000;
const CLOCK_SKEW_MS = 60 * 1000;

export const TimerPauseSchema = z.object({
  seanceId: z.string().min(1),
  pausedAt: z.coerce.date().refine(
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
});

export type TimerPauseSchema = z.infer<typeof TimerPauseSchema>;

export const TimerPauseSchemaUpdate = z.object({
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
});

export type TimerPauseSchemaUpdate = z.infer<typeof TimerPauseSchemaUpdate>;
