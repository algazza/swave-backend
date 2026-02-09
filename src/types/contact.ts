import z from "zod";
import { contactSchema, updateContactSchema } from "../schemas/contact.schema";

export type AddContactRequest = z.infer<typeof contactSchema>
export type UpdateContactRequest = z.infer<typeof updateContactSchema>