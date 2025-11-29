import z from "zod";
import { categorySchema } from "../schemas/category.schema";

export type CategoryRequest = z.infer<typeof categorySchema>