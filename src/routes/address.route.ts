import { Hono } from "hono";
import { verifyToken } from "../middlewares/auth.middleware";
import { createAddress, deleteAddress, getAllAddress, getOneAddress, updateAddress } from "../controllers/address.controller";
import { validateBody } from "../middlewares/validate.middleware";
import { AddressSchema } from "../schemas/address.schema";

const router = new Hono()

router.get('/', verifyToken, getAllAddress)
router.get('/:id', verifyToken, getOneAddress)
router.post('/', verifyToken, validateBody(AddressSchema), createAddress)
router.put('/:id', verifyToken, validateBody(AddressSchema), updateAddress)
router.delete('/:id', verifyToken, deleteAddress)

export const AddressRoute = router