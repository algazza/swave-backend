import { Hono } from "hono";
import { validateBody, verifyAdmin, verifyToken } from "../middlewares";
import { addCheckoutSchema, addStatusSchema } from "../schemas/checkout.schema";
import {
  createCheckout,
  createStatusCheckout,
  getAllCheckout,
  getHistoryCheckout,
  getOneCheckoutAdmin,
  getOneCheckoutUser,
} from "../controllers/checkout.controller";

const route = new Hono();

route.get("/", verifyToken, verifyAdmin, getAllCheckout);
route.get("/me", verifyToken, getHistoryCheckout);
route.get("/:orderId", verifyToken, verifyAdmin, getOneCheckoutAdmin);
route.get("/me/:orderId", verifyToken, getOneCheckoutUser);
route.post("/", verifyToken, validateBody(addCheckoutSchema), createCheckout);
route.post(
  "/:orderId",
  verifyToken,
  verifyAdmin,
  validateBody(addStatusSchema),
  createStatusCheckout
);

export const checkoutRoute = route;
