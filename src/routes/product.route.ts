import { Hono } from "hono"
import { validateBody, verifyAdmin, verifyToken } from "../middlewares"
import { AddProductSchema } from "../schemas/product.schema"
import { createProduct, deleteProduct, getAllProduct, getOneProduct } from "../controllers/product.controller"

const route = new Hono()

route.get('/', getAllProduct)
route.get('/:id', getOneProduct)
route.post('/', verifyToken, verifyAdmin, validateBody(AddProductSchema), createProduct)
route.delete('/:id', verifyToken, verifyAdmin, deleteProduct)

export const productRoute = route