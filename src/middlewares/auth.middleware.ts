import { MiddlewareHandler } from "hono";
import { verify } from "hono/jwt";

export const verifyToken: MiddlewareHandler = async (c, next) => {
  const header =
    c.req.header("Authorization") || c.req.header("authorization") || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7).trim()
    : header.trim();

  if (!token) {
    return c.json({ message: "Unauthenticated." }, 401);
  }

  try {
    const secret = process.env.JWT_SECRET || "radiohead";
    const payload = await verify(token, secret);

    const userId = (payload as any).id ?? (payload as any).sub;
    c.set("userId", userId);

    await next();
  } catch {
    return c.json({ message: "Invalid token" }, 401);
  }
};
