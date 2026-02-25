import { Context } from "hono";
import prisma from "../../prisma/client";
import { UpdateUserRequest } from "../types/user";

export const getAllUser = async (c: Context) => {
  try {
    const users = await prisma.users.findMany({
      where: { role: "user", is_active: true },
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
      200,
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
      500,
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
      },
    });

    if (!user) {
      return c.json(
        {
          success: false,
          message: "User not found",
        },
        404,
      );
    }

    return c.json(
      {
        success: true,
        data: user,
      },
      200,
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
      500,
    );
  }
};

export const getOneUserAdmin = async (c: Context) => {
  try {
    const username = c.req.param("username");
    const user = await prisma.users.findUnique({
      where: { username },
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
        checkout: {
          select: {
            id: true,
            order_id: true,
            created_at: true,
            status: {
              orderBy: {
                created_at: "desc",
              },
              take: 1,
              select: {
                order_status: true,
              },
            },
            product_checkout: {
              select: {
                quantity: true,
                price: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    product_images: {
                      take: 1,
                      select: { image_path: true },
                    },
                    category: {
                      select: {
                        category: true,
                      },
                    },
                  },
                },
                variant: {
                  select: {
                    variant: true,
                    price: true,
                  },
                },
              },
            },
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
        404,
      );
    }
    const checkoutJson = user.checkout.map((item) => ({
      id: item.id,
      order_id: item.order_id,
      created_at: item.created_at,
      status: item.status[0].order_status,
      products: item.product_checkout.map((p) => ({
        id: p.product.id,
        category: p.product.category.category,
        name: p.product.name,
        image_path: p.product.product_images.map((img) => img.image_path)[0],
        variant: p.variant.variant,
        variant_price: p.variant.price,
        quantity: p.quantity,
        total_price: p.price,
      })),
    }));
    return c.json(
      {
        success: true,
        data: { ...user, checkout: checkoutJson },
      },
      200,
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
      500,
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
        404,
      );
    }

    const { name, username, phone, password } = c.get(
      "validatedBody",
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
        409,
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
      200,
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
      500,
    );
  }
};

export const softDeleteUser = async (c: Context) => {
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
        404,
      );
    }

    await prisma.users.update({
      where: { id: Number(userId) },
      data: {
        is_active: false,
        deleted_at: new Date(),
      },
    });

    return c.json(
      {
        success: true,
        message: "success soft delete user",
      },
      200,
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
      500,
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
        404,
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
      200,
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
      500,
    );
  }
};
