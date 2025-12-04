import z from "zod";

export const addCartSchema = z.object({
    quantity: z.number(),
    variant_id: z.number(),
    product_id: z.number() 
})

export const updateCartSchema = z.object({
    quantity: z.number(),
})