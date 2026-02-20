import { Context } from "hono";
import prisma from "../../prisma/client";
import { AddCartRequest, UpdateCartRequest } from "../types/cart";

export const getAllCart = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const cart = await prisma.carts.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        quantity: true,
        price: true,
        product: {
          select: {
            id: true,
            name: true,
            category: {
              select: {
                category: true
              }
            },
            product_images: {
              take: 1,
              select: {
                image_path: true,
              },
            },
          },
        },
        variant: {
          select: {
            id: true,
            variant: true,
            price: true,
            stock: true,
          },
        },
      },
    });

    const cartJson = cart.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      product: {
        id: item.product.id,
        name: item.product.name,
        product_images: item.product.product_images.map((img) => img.image_path)[0],
        category: item.product.category.category,
      },
      variant: item.variant,
    }));
    return c.json({
      success: true,
      data: cartJson,
    });
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

export const getCountCart = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const count = await prisma.carts.count({
      where: { user_id: userId },
    });

    return c.json({
      success: true,
      data: count,
    });
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
}

export const addCart = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const { quantity, variant_id, product_id } = c.get(
      "validatedBody",
    ) as AddCartRequest;

    const product = await prisma.products.findUnique({
      where: {
        id: product_id,
      },
    });

    if (!product) {
      return c.json({
        success: false,
        message: "Product not found",
      }, 404);
    }

    const variant = await prisma.variants.findUnique({
      where: { id: variant_id },
      select: { stock: true, price: true, product_id: true },
    });

    if (!variant) {
      return c.json({
        success: false,
        message: "Variant not found",
      }, 404);
    }

    if (variant.product_id !== product_id) {
      return c.json({
        success: false,
        message: "Variant does not belong to this product",
      }, 404);
    }

    const existing = await prisma.carts.findFirst({
      where: { variant_id, product_id, user_id: userId },
      select: {
        id: true,
        variant: {
          select: {
            stock: true,
            price: true,
          },
        },
      },
    });

    if (existing) {
      const maxValue = existing.variant.stock;
      const fixQuantity = maxValue < quantity ? maxValue : quantity;
      const price = existing.variant.price * fixQuantity;

      await prisma.carts.update({
        where: { id: existing.id },
        data: {
          price,
          quantity: fixQuantity,
        },
      });

      return c.json({
        success: true,
        message: "Success update cart",
      });
    }

    const maxValue = variant.stock;
    const fixQuantity = maxValue < quantity ? maxValue : quantity;
    const price = variant.price * fixQuantity;

    await prisma.carts.create({
      data: {
        quantity: fixQuantity,
        price,
        product: {
          connect: {
            id: product_id,
          },
        },
        variant: {
          connect: {
            id: variant_id,
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });

    return c.json({
      success: true,
      data: "Sueccess add product to cart",
    });
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

export const updateCart = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const userId = c.get("userId");

    const cart = await prisma.carts.findUnique({
      where: { id: Number(id), user_id: userId },
      select: {
        variant: {
          select: {
            stock: true,
            price: true,
          },
        },
      },
    });

    if (!cart) {
      return c.json({
        success: false,
        message: "Cart not found",
      }, 404);
    }

    const { quantity } = c.get("validatedBody") as UpdateCartRequest;
    const maxValue = cart.variant.stock;
    const fixQuantity = maxValue < quantity ? maxValue : quantity;
    const price = cart.variant.price * fixQuantity;

    await prisma.carts.update({
      where: { id: Number(id) },
      data: {
        price,
        quantity: fixQuantity,
      },
    });

    return c.json({
      success: true,
      message: "Success update cart",
    });
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

export const deleteCart = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const userId = c.get("userId");
    const cart = await prisma.carts.findUnique({
      where: { id: Number(id), user_id: userId },
    });

    if (!cart) {
      return c.json({
        success: false,
        message: "Cart not found",
      }, 404);
    }

    await prisma.carts.delete({
      where: { id: Number(id), user_id: userId },
    });

    return c.json({
      success: true,
      message: "Success delete cart",
    });
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
