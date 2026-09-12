import { z } from "zod";

export const RegisterSchema = z
  .object({
    email: z.string().email(),
    password: z
      .string()
      .min(8, "8 caractères minimum")
      .max(72, "72 caractères maximum")
      .regex(/[a-z]/, "Au moins une minuscule")
      .regex(/[A-Z]/, "Au moins une majuscule")
      .regex(/[0-9]/, "Au moins un chiffre")
      .regex(/[^A-Za-z0-9]/, "Au moins un caractère spécial"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type RegisterSchema = z.infer<typeof RegisterSchema>;
