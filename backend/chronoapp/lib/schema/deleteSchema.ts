import { z } from "zod";

export const DeleteControlUserPasswordSchema = z.object({
  password: z.string().min(1).max(128),
});

export const DeleteControlUserEmailPasswordSchema =
  DeleteControlUserPasswordSchema.extend({
    email: z.string().min(1).trim().toLowerCase().email(),
  });

export type DeleteControlUserPasswordSchema = z.infer<
  typeof DeleteControlUserPasswordSchema
>;
export type DeleteControlUserEmailPasswordSchema = z.infer<
  typeof DeleteControlUserEmailPasswordSchema
>;
