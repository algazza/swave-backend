import z from "zod";
import { AddressSchema } from "../schemas/address.schema";

export type AddAddressRequest = z.infer<typeof AddressSchema>
export type UpdateAddressRequest = z.infer<typeof AddressSchema>