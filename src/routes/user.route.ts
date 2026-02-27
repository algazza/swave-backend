import { Hono } from "hono";
import { validateBody, verifyAdmin, verifyToken } from "../middlewares";
import { updateUserSchema } from "../schemas/user.schema";
import {
  deleteUser,
  getAllUser,
  getOneUser,
  getOneUserAdmin,
  softDeleteUser,
  updateUser,
} from "../controllers/user.controller";

const router = new Hono();

router.get("/", verifyToken, verifyAdmin, getAllUser);
router.get("/me", verifyToken, getOneUser);
router.get("/:username", verifyToken, verifyAdmin, getOneUserAdmin);
router.put("/", verifyToken, validateBody(updateUserSchema), updateUser);
router.delete("/:id", verifyToken, verifyAdmin, softDeleteUser);
router.delete("/:id/delete", verifyToken, verifyAdmin, deleteUser);

export const userRoute = router;
