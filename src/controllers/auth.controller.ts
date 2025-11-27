import type { Context } from "hono";
import { LoginRequest, RegisterRequest } from "../types/auth";
import { sign } from "hono/jwt";
import prisma from "../../prisma/client";

export const signup = async (c: Context) => {
  try {
    const { name, username, phone, password } = c.get(
      "validatedBody"
    ) as RegisterRequest;

    const existing = await prisma.users.findFirst({
      where: { OR: [{ username }, { phone }] },
      select: { id: true, username: true, phone: true },
    });

    if (existing) {
      const conflictField =
        existing.username === username
          ? "Username"
          : existing.phone === phone
          ? "phone"
          : "username";
      return c.json(
        {
          success: false,
          message:
            conflictField === "username"
              ? "Username already registered"
              : "Phone has been registered",
          errors: { [conflictField]: "already in used" },
        },
        409
      );
    }

    const hashedPassword = await Bun.password.hash(password);
    const user = await prisma.users.create({
      data: { name, username, phone, password: hashedPassword },
    });

    const payload = {
      sub: user.id,
      username: user.username,
    };
    const secret = process.env.JWT_SECRET || "radiohead";
    const token = await sign(payload, secret);

    return c.json({
      success: true,
      message: "success sign in",
      token: token,
    });
  } catch (err) {
    console.error(err);

    return c.json(
      {
        success: false,
        message: "Internal server error",
        error: err instanceof Error ? err.message : String(err), 
      },
      500
    );
  }
};
export const signin = async (c: Context) => {
  try {
    const { username, password } = c.get("validatedBody") as LoginRequest;
    const user = await prisma.users.findUnique({
      where: { username },
    });

    if (!user) {
      return c.json(
        {
          success: false,
          message: "User not found",
        },
        401
      );
    }

    const isPasswordValid = user.password
      ? await Bun.password.verify(password, user.password)
      : false;
    if (!isPasswordValid) {
      return c.json(
        {
          success: false,
          message: "incorrect password",
        },
        401
      );
    }

    const payload = {
      sub: user.id,
      username: user.username,
    };
    const secret = process.env.JWT_SECRET || "radiohead";
    const token = await sign(payload, secret);

    return c.json({
      success: true,
      message: "success sign in",
      token: token,
    });
  } catch (err) {
    return c.json(
      {
        success: false,
        message: "Internal server error",
      },
      500
    );
  }
};
