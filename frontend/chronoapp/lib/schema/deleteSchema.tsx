import { z } from "zod";

export const DeleteControlUserSchema = z.object({
  password: z
    .string()
    .min(1, "Veuillez entrer votre mot de passe")
    .max(128, "Mot de passe trop long"),
});

export type DeleteControlUserSchema = z.infer<typeof DeleteControlUserSchema>;
