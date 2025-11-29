import z from "zod";

export const addVariantSchema = z.object({
    variant: z.string(),
    price: z.number(),
    stock: z.number()
})

export const updateVariantSchema = z.object({
    variant: z.string().optional(),
    price: z.number().optional(),
    stock: z.number().optional()
})