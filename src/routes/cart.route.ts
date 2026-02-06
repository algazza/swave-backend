import { Hono } from "hono";
import { validateBody, verifyToken } from "../middlewares";
import { addCartSchema, updateCartSchema } from "../schemas/cart.schema";
import { addCart, deleteCart, getAllCart, getCountCart, updateCart } from "../controllers/cart.controller";

const router = new Hono()

router.get('/', verifyToken, getAllCart)
router.get('/count', verifyToken, getCountCart)
router.post('/', verifyToken, validateBody(addCartSchema), addCart)
router.put('/:id', verifyToken, validateBody(updateCartSchema), updateCart)
router.delete('/:id', verifyToken, deleteCart)

export const cartRoute = router