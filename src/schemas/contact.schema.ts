import z from "zod";

export const contactSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    topic: z.string(),
    description: z.string()
})

export const updateContactSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    topic: z.string().optional(),
    description: z.string().optional()
})