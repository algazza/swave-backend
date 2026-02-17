import { Hono } from "hono";
import { validateBody, verifyAdmin, verifyToken } from "../middlewares";
import { AddProductSchema, emptyBodySchema, UpdateProductSchema } from "../schemas/product.schema";
import {
  addProductImage,
  createProduct,
  deleteProduct,
  deleteProductImage,
  getAllDeletedProduct,
  getAllProduct,
  getOneProduct,
  getRecomendedProducts,
  softDeleteProduct,
  updateProduct,
  updateProductImage,
} from "../controllers/product.controller";

const route = new Hono();

route.get("/", getAllProduct);
route.get("/recommended/:slug", getRecomendedProducts);
route.get("/:slug", getOneProduct);
route.get("/deleted", getAllDeletedProduct);
route.post(
  "/",
  verifyToken,
  verifyAdmin,
  validateBody(AddProductSchema),
  createProduct,
);
route.put("/:id", verifyToken, verifyAdmin, validateBody(UpdateProductSchema), updateProduct);
route.delete('/:id/delete', verifyToken, verifyAdmin, softDeleteProduct);
route.delete("/:id", verifyToken, verifyAdmin, deleteProduct);

route.post('/:id/image', verifyToken, verifyAdmin, validateBody(emptyBodySchema), addProductImage);
route.post('/:id/image/:imageId', verifyToken, verifyAdmin, validateBody(emptyBodySchema), updateProductImage);
route.delete("/:id/image/:imageId", verifyToken, verifyAdmin, deleteProductImage);

export const productRoute = route;
