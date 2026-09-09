import { z } from "zod";

export const FormSchema = z.object({
  totalRunner: z
    .number()
    .min(1, "La quantité minimale est 1")
    .max(40, "La quantité maximal est 40"),
  colorRunner: z.string().min(1, "Choisis une couleur"),
});

export type FormSchema = z.infer<typeof FormSchema>;
