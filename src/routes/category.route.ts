import { Hono } from "hono";
import { verifyAdmin, verifyToken } from "../middlewares/auth.middleware";
import {
  createCategory,
  deleteCategory,
  getAllCategory,
  getOneCategory,
  updateCategory,
} from "../controllers/category.controller";
import { validateBody } from "../middlewares/validate.middleware";
import { categorySchema } from "../schemas/category.schema";

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
route.delete("/:category", verifyToken, verifyAdmin, deleteCategory);

export const categoryRoute = route;
