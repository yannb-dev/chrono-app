import { z } from "zod";

export const DeleteControlUserSchema = z.object({
  password: z.string().min(1).max(128),
});

export type DeleteControlUserSchema = z.infer<typeof DeleteControlUserSchema>;
