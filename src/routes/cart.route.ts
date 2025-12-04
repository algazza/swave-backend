import { Hono } from "hono";
import { verifyToken } from "../middlewares/auth.middleware";
import { addCart, deleteCart, getAllCart, updateCart } from "../controllers/cart.controller";
import { validateBody } from "../middlewares/validate.middleware";
import { addCartSchema, updateCartSchema } from "../schemas/cart.schema";

const router = new Hono()

router.get('/', verifyToken, getAllCart)
router.post('/', verifyToken, validateBody(addCartSchema), addCart)
router.put('/:id', verifyToken, validateBody(updateCartSchema), updateCart)
router.delete('/:id', verifyToken, deleteCart)

export const cartRoute = router