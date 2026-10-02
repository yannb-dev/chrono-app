import { z } from "zod";

export const ResetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email requis")
    .trim()
    .toLowerCase()
    .email("Mauvais format d'email"),
});

export type ResetPasswordSchema = z.infer<typeof ResetPasswordSchema>;
