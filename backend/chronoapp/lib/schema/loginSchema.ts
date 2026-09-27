import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Mauvais format d'email"),
  password: z.string().max(128),
});

export type LoginSchema = z.infer<typeof LoginSchema>;
