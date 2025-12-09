import z from "zod";
import { addCartSchema } from "./cart.schema";

export const addStatusSchema = z.object({
  status_type: z.enum(["pending", "packaged", "delivery", "cancel", "success"]),
  description: z.string().optional(),
  created_at: z.string().datetime().optional(),
});

export const addDeliveriySchema = z.object({
  delivery_type: z.enum(["delivery", "pickup"]),
  pickup_date: z.string().optional(),
  pickup_hour: z.string().optional(),
  address_id: z.number(),
});

export const addCheckoutSchema = z.object({
  description: z.string().optional(),
  gift_card: z.boolean(),
  gift_description: z.string().optional(),
  delivery: addDeliveriySchema,
  product_checkout: z.array(addCartSchema),
});
