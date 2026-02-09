import z from "zod";
import { midtransSchema } from "../schemas/midtrans.schema";

export type MidtransRequest = z.infer<typeof midtransSchema>