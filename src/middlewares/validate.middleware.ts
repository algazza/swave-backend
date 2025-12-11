import { MiddlewareHandler } from "hono";
import z from "zod";
import { formatZodErrors } from "../utils";

export const validateBody = <T extends z.ZodTypeAny>(
  schema: T
): MiddlewareHandler => {
  return async (c, next) => {
    const ct = c.req.header("Content-Type") || "";
    let raw: any = {};

    try {
      if (ct.includes('application/json')) {
        raw = await c.req.json();
      } else if(ct.includes('multipart/form-data')){
        const form = await c.req.parseBody({all: true})
        raw = {}

        for (const key in form) {
          if(form[key] instanceof File) continue
          raw[key] = form[key]          
        }
        c.set('files', form)
      } else {
        return c.json(
          {
            success: false,
            message: "Unsupported Media Type: use application/json or multipart/form-data",
          },
          415
        );
      }

    } catch {
      return c.json({ success: false, message: "Invalid JSON payload" }, 400);
    }

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return c.json(
        {
          success: false,
          message: "Validation Failed!",
          errors: formatZodErrors(parsed.error),
        },
        422
      );
    }

    c.set('validatedBody', parsed.data)
    await next()
  };
};
