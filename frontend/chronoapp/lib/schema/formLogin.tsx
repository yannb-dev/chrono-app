import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Mauvais format d'email"),
  password: z
    .string()
    .min(8, "8 caractères minimum")
    .max(72, "72 caractères maximum")
    .regex(/[a-z]/, "Au moins une minuscule")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre")
    .regex(/[^A-Za-z0-9]/, "Au moins un caractère spécial"),
});

export type LoginSchema = z.infer<typeof LoginSchema>;
