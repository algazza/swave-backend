import { Hono } from "hono";
import { validateBody, verifyToken } from "../middlewares";
import { addressSchema, updateAddressSchema } from "../schemas/address.schema";
import {
  createAddress,
  deleteAddress,
  getAllAddress,
  getOneAddress,
  updateAddress,
} from "../controllers/address.controller";

const router = new Hono();

router.get("/", verifyToken, getAllAddress);
router.get("/:id", verifyToken, getOneAddress);
router.post("/", verifyToken, validateBody(addressSchema), createAddress);
router.put(
  "/:id",
  verifyToken,
  validateBody(updateAddressSchema),
  updateAddress
);
router.delete("/:id", verifyToken, deleteAddress);

export const AddressRoute = router;
