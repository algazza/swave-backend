import { Hono } from "hono";
import { validateBody, verifyAdmin, verifyToken } from "../middlewares";
import {
  AddVariantArraySchema,
  updateVariantSchema,
} from "../schemas/variant.schema";
import {
  createVariant,
  deleteVaraint,
  getVariantByCategory,
  softDeleteVariant,
  updateVariant,
} from "../controllers/variant.controller";

const route = new Hono();

route.get("/:productId", verifyToken, verifyAdmin, getVariantByCategory);
route.post(
  "/:productId",
  verifyToken,
  verifyAdmin,
  validateBody(AddVariantArraySchema),
  createVariant,
);
route.put(
  "/:productId/:variant",
  verifyToken,
  verifyAdmin,
  validateBody(updateVariantSchema),
  updateVariant,
);
route.delete(
  "/:productId/:variant",
  verifyToken,
  verifyAdmin,
  softDeleteVariant,
);
route.delete("/:productId/:variant/delete", verifyToken, verifyAdmin, deleteVaraint);

export const variantRoute = route;
