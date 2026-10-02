import { z } from "zod";

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, "Email requis")
    .trim()
    .toLowerCase()
    .email("Mauvais format d'email"),
  password: z.string().min(1, "Mot de passe requis"),
});

export type LoginSchema = z.infer<typeof LoginSchema>;
