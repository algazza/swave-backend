import z from "zod";

export const addReviewSchema = z.object({
    star: z.number(),
    description: z.string(),
    order_id: z.string(),
    product_id: z.number()
})