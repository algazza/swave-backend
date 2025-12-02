import { Hono } from "hono";
import { validateBody } from "../middlewares/validate.middleware";
import { contactSchema } from "../schemas/contact.schema";
import { createContact, deleteContact, getAllContact, getOneContact } from "../controllers/contact.controller";
import { verifyAdmin, verifyToken } from "../middlewares/auth.middleware";

const route = new Hono()

route.get('/', verifyToken, verifyAdmin, getAllContact)
route.get('/:id', verifyToken, verifyAdmin, getOneContact)
route.post('/', validateBody(contactSchema), createContact)
route.delete('/:id', verifyToken, verifyAdmin, deleteContact)

export const contactRoute = route