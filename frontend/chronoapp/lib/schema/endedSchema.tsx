import { z } from "zod";

export const EndedPausedSchema = z.object({
  endedAt: z.date(),
});

export type EndedPausedSchema = z.infer<typeof EndedPausedSchema>;
