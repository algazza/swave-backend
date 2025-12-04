import z from "zod";
import { addCartSchema, updateCartSchema } from "../schemas/cart.schema";

export type AddCartRequest = z.infer<typeof addCartSchema>
export type UpdateCartRequest = z.infer<typeof updateCartSchema>