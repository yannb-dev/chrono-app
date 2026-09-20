import { z } from "zod";

export const ResetPasswordSchema = z.object({
  email: z.string().email("Mauvais format d'email"),
});

export type ResetPasswordSchema = z.infer<typeof ResetPasswordSchema>;
