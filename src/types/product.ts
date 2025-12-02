import z from "zod";
import { AddProductSchema } from "../schemas/product.schema";

export type AddProductRequest = z.infer<typeof AddProductSchema> 