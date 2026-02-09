import z from "zod";
import { loginSchema, registerSchema } from "../schemas/auth.schema";

export type RegisterRequest = z.infer<typeof registerSchema>
export type LoginRequest = z.infer<typeof loginSchema>