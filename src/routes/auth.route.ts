import { Hono } from "hono";
import { validateBody } from "../middlewares/validate.middleware";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { signin, signup } from "../controllers/auth.controller";

const router = new Hono()

router.post('/signup', validateBody(registerSchema), signup)
router.post('/signin', validateBody(loginSchema), signin)

export const authRoute = router