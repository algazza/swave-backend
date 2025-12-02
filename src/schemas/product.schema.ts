import z from "zod";

export const AddProductSchema = z.object({
    name: z.string(),
    description: z.string(),
    category: z.string(),
})