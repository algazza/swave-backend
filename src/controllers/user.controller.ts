import { Context } from "hono";
import prisma from "../../prisma/client";
import { UpdateUserRequest } from "../types/user";

export const getAllUser = async (c: Context) => {
  try {
    const users = await prisma.users.findMany({
      select: {
        name: true,
        username: true,
        phone: true,
      },
    });

    return c.json(
      {
        success: true,
        data: users,
      },
      200
    );
  } catch (err) {
    return c.json(
      {
        success: false,
        message:
          err instanceof Error
            ? err.message
            : String(err) || "Internal server error",
      },
      500
    );
  }
};

export const getOneUser = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        name: true,
        username: true,
        phone: true,
        address: {
          omit: {
            id: true,
            user_id: true,
          },
        },
      },
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

    return c.json(
      {
        success: true,
        data: user,
      },
      200
    );
  } catch (err) {
    return c.json(
      {
        success: false,
        message:
          err instanceof Error
            ? err.message
            : String(err) || "Internal server error",
      },
      500
    );
  }
};

export const updateUser = async (c: Context) => {
  try {
    const userId = c.get("userId");

    const user = await prisma.users.findUnique({
      where: { id: userId },
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

    const { name, username, phone, password } = c.get(
      "validatedBody"
    ) as UpdateUserRequest;

    const existing = await prisma.users.findFirst({
      where: { OR: [{ username }, { phone }], NOT: { id: Number(userId) } },
      select: { id: true, username: true, phone: true },
    });

    if (existing) {
      const conflictField =
        existing.username === username
          ? "username"
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
    await prisma.users.update({
      where: { id: Number(userId) },
      data: {
        name,
        username,
        phone,
        password: password ? await Bun.password.hash(password) : user.password,
      },
    });

    return c.json(
      {
        success: true,
        message: "success edit profile",
      },
      200
    );
  } catch (err) {
    return c.json(
      {
        success: false,
        message:
          err instanceof Error
            ? err.message
            : String(err) || "Internal server error",
      },
      500
    );
  }
};

export const deleteUser = async (c: Context) => {
  try {
    const userId = c.req.param("id");

    const user = await prisma.users.findUnique({
      where: { id: Number(userId) },
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

    await prisma.users.delete({
      where: { id: Number(userId) },
    });

    return c.json(
      {
        success: true,
        message: "success delete user",
      },
      200   
    );
  } catch (err) {
    return c.json(
      {
        success: false,
        message:
          err instanceof Error
            ? err.message
            : String(err) || "Internal server error",
      },
      500
    );
  }
};
