import { z } from "zod";

export const NewPasswordSchema = z
  .object({
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

export type NewPasswordSchema = z.infer<typeof NewPasswordSchema>;

export const NewPasswordEmailSchema = z.object({
  newpassword: z
    .string()
    .min(8, "8 caractères minimum")
    .max(72, "72 caractères maximum")
    .regex(/[a-z]/, "Au moins une minuscule")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre")
    .regex(/[^A-Za-z0-9]/, "Au moins un caractère spécial"),
  token: z.string(),
});

export type NewPasswordEmailSchema = z.infer<typeof NewPasswordEmailSchema>;
