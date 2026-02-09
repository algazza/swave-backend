import z from "zod";
import { addressSchema, updateAddressSchema } from "../schemas/address.schema";

export type AddAddressRequest = z.infer<typeof addressSchema>
export type UpdateAddressRequest = z.infer<typeof updateAddressSchema>