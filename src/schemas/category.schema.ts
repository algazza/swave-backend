import z from "zod";

export const categorySchema = z.object({
    category: z.string()
})