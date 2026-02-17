import { Hono } from "hono";
import { validateBody, verifyAdmin, verifyToken } from "../middlewares";
import { categorySchema } from "../schemas/category.schema";
import {
  createCategory,
  deleteCategory,
  getAllCategory,
  getOneCategory,
  softDeleteCategory,
  updateCategory,
} from "../controllers/category.controller";

const route = new Hono();

route.get("/", getAllCategory);
route.get("/:category", getOneCategory);
route.post(
  "/",
  verifyToken,
  verifyAdmin,
  validateBody(categorySchema),
  createCategory
);
route.put(
  "/:category",
  verifyToken,
  verifyAdmin,
  validateBody(categorySchema),
  updateCategory
);
route.delete('/:category', verifyToken, verifyAdmin, softDeleteCategory);
route.delete("/:category/delete", verifyToken, verifyAdmin, deleteCategory);

export const categoryRoute = route;
