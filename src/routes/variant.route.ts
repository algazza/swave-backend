import { Hono } from "hono";
import { verifyAdmin, verifyToken } from "../middlewares/auth.middleware";
import { createVariant, deleteVaraint, getVariantByCategory, updateVariant } from "../controllers/variant.controller";
import { validateBody } from "../middlewares/validate.middleware";
import { addVariantSchema, updateVariantSchema } from "../schemas/variant.schema";

const route = new Hono()

route.get('/:productId', verifyToken, verifyAdmin, getVariantByCategory)
route.post('/:productId', verifyToken, verifyAdmin, validateBody(addVariantSchema), createVariant)
route.put('/:productId/:variant', verifyToken, verifyAdmin, validateBody(updateVariantSchema), updateVariant)
route.delete('/:productId/:variant', verifyToken, verifyAdmin, deleteVaraint)

export const variantRoute = route 
