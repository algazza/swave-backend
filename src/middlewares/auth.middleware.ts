import type { MiddlewareHandler } from "hono";
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

    const claims = payload as { id?: unknown; sub?: unknown; role?: unknown };
    const rawUserId = claims.id ?? claims.sub;
    const userId =
      typeof rawUserId === "number"
        ? rawUserId
        : typeof rawUserId === "string" && /^\\d+$/.test(rawUserId)
          ? Number(rawUserId)
          : null;
    const role = claims.role;

    if (
      !Number.isSafeInteger(userId) ||
      (role !== "user" && role !== "admin")
    ) {
      return c.json({ message: "Invalid token" }, 401);
    }

    c.set("userId", userId);
    c.set("role", role);

    await next();
  } catch (error) {
    console.error("JWT verification failed:", error);
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
