import { Hono } from "hono"
import { createProduct, deleteProduct, getAllProduct, getOneProduct } from "../controllers/product.controller"
import { verifyAdmin, verifyToken } from "../middlewares/auth.middleware"
import { validateBody } from "../middlewares/validate.middleware"
import { AddProductSchema } from "../schemas/product.schema"

const route = new Hono()

route.get('/', getAllProduct)
route.get('/:id', getOneProduct)
route.post('/', verifyToken, verifyAdmin, validateBody(AddProductSchema), createProduct)
route.delete('/:id', verifyToken, verifyAdmin, deleteProduct)

export const productRoute = route