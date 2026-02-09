import z from "zod";
import { updateUserSchema } from "../schemas/user.schema";

export type UpdateUserRequest = z.infer<typeof updateUserSchema>