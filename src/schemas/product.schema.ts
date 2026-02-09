import z from "zod";

export const AddProductSchema = z.object({
    name: z.string(),
    description: z.string(),
    category: z.string(),
})

export const UpdateProductSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
})

export const emptyBodySchema = z.object({}).passthrough();