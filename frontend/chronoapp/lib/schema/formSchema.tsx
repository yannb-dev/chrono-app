import { z } from "zod";

export const FormSchema = z.object({
  nbrRunner: z.string().min(1),
  color: z.enum([
    "rgb(39, 91, 245)",
    "rgb(15, 184, 68)",
    "rgb(240, 245, 2)",
    "rgb(245, 2, 55)",
  ]),
});

export type FormSchema = z.infer<typeof FormSchema>;
