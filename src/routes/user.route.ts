import { Hono } from "hono";
import { validateBody } from "../middlewares/validate.middleware";
import { deleteUser, getAllUser, getOneUser, updateUser } from "../controllers/user.controller";
import { verifyAdmin, verifyToken } from "../middlewares/auth.middleware";
import { updateUserSchema } from "../schemas/user.schema";

const router = new Hono()

router.get('/', verifyToken, verifyAdmin, getAllUser)
router.get('/me', verifyToken, getOneUser)
router.put('/', verifyToken, validateBody(updateUserSchema) , updateUser)
router.delete('/:id', verifyToken, verifyAdmin, deleteUser)

export const userRoute = router