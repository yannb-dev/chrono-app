import { z } from "zod";

export const FormSchema = z.object({
  totalRunner: z.string().min(1),
  colorRunner: z
    .enum([
      "rgb(39, 91, 245)",
      "rgb(15, 184, 68)",
      "rgb(240, 245, 2)",
      "rgb(245, 2, 55)",
    ])
    .describe("Choisis une couleur"),
});

export type FormSchema = z.infer<typeof FormSchema>;
