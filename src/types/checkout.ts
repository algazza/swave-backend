import z from "zod";
import { addCheckoutSchema, addStatusSchema,  } from "../schemas/checkout.schema";

export type AddCheckoutRequest = z.infer<typeof addCheckoutSchema>
export type UpdateStatusRequest = z.infer<typeof addStatusSchema>