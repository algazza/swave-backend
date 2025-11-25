import { MiddlewareHandler } from "hono";
import z from "zod";
import { formatZodErrors } from "../utils/validation";

export const validateBody = <T extends z.ZodTypeAny>(
  schema: T
): MiddlewareHandler => {
  return async (c, next) => {
    const ct = c.req.header("Content-Type") || "";
    if (!ct.toLowerCase().includes("application/json")) {
      return c.json(
        {
          success: false,
          message: "Unsupported Media Type: use application/json",
        },
        415
      );
    }

    let raw: unknown;
    try {
      raw = await c.req.json();
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
