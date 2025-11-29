import z from "zod";
import { addVariantSchema, updateVariantSchema } from "../schemas/variant.schema";

export type AddVariantRequest = z.infer<typeof addVariantSchema>
export type UpdateVariantRequest = z.infer<typeof updateVariantSchema>