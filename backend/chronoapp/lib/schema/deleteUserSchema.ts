import { z } from "zod";

export const DeleteUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("Mauvais format d'email"),
  password: z
    .string()
    .min(1, "Saisir votre mot de passe")
    .max(128, "Mot de passe trop long"),
});

export type DeleteUserSchema = z.infer<typeof DeleteUserSchema>;
