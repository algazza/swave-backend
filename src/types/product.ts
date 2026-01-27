import z from "zod";
import { AddProductSchema, UpdateProductSchema } from "../schemas/product.schema";

export type AddProductRequest = z.infer<typeof AddProductSchema> 
export type UpdateProductRequest = z.infer<typeof UpdateProductSchema> 