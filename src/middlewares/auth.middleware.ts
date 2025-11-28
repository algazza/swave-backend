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
    const role = (payload as any).role ?? "user";
    c.set("userId", userId);
    c.set("role", role);

    await next();
  } catch {
    return c.json({ message: "Invalid token" }, 401);
  }
};

export const verifyAdmin: MiddlewareHandler = async (c, next) => {
  try {
    const role = c.get("role");

    if (role !== "admin") {
      return c.json({ message: "Forbidden: Admin access only" }, 403);
    }
    await next();
  } catch {
    return c.json({ message: "Invalid token" }, 401);
  }
};
