import { Hono } from "hono";
import { validateBody, verifyAdmin, verifyToken } from "../middlewares";
import { contactSchema } from "../schemas/contact.schema";
import { createContact, deleteContact, getAllContact, getOneContact } from "../controllers/contact.controller";

const route = new Hono()

route.get('/', verifyToken, verifyAdmin, getAllContact)
route.get('/:id', verifyToken, verifyAdmin, getOneContact)
route.post('/', validateBody(contactSchema), createContact)
route.delete('/:id', verifyToken, verifyAdmin, deleteContact)

export const contactRoute = route