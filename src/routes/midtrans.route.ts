import { Hono } from "hono";
import { validateBody, verifyMidtransSignature } from "../middlewares";
import { midtransSchema } from "../schemas/midtrans.schema";
import { midtransWebhook } from "../controllers/midtrans.controller";

const route = new Hono()

route.post('/', validateBody(midtransSchema), verifyMidtransSignature, midtransWebhook)

export const midtransRoute = route