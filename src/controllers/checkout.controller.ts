import { Context } from "hono";
import prisma from "../../prisma/client";
import { AddCheckoutRequest, UpdateStatusRequest } from "../types/checkout";
import { id } from "zod/v4/locales";

export const getAllCheckout = async (c: Context) => {
  try {
    const checkout = await prisma.checkouts.findMany({
      select: {
        order_id: true,
        user: {
          select: {
            name: true,
          },
        },
        status: {
          orderBy: {
            created_at: "desc",
          },
          take: 1,
          select: {
            status_type: true,
          },
        },
        delivery: {
          select: {
            delivery_type: true,
          },
        },
        total_price: true,
      },
    });

    const checkoutJson = checkout.map((item) => ({
      order_id: item.order_id,
      name: item.user.name,
      status: item.status[0].status_type,
      delivery: item.delivery.delivery_type,
      amount: item.total_price,
    }));

    return c.json({
      success: true,
      data: checkoutJson,
    });
  } catch (err) {
    return c.json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getHistoryCheckout = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const checkout = await prisma.checkouts.findMany({
      where: { user_id: userId },
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
            status_type: true,
          },
        },
        product_checkout: true,
      },
    });

    return c.json({
      success: true,
      data: checkout,
    });
  } catch (err) {
    return c.json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getOneCheckoutAdmin = async (c: Context) => {
  try {
    const orderId = c.req.param("orderId");
    const checkout = await prisma.checkouts.findUnique({
      where: { order_id: orderId },
      include: {
        delivery: {
          include: {
            address: true,
          },
        },
        user: {
          select: {
            username: true,
            name: true,
          },
        },
        status: true,
        product_checkout: true,
      },
    });

    if (!checkout) {
      return c.json({
        success: false,
        message: "Checkout not found",
      });
    }

    return c.json({
      success: true,
      data: checkout,
    });
  } catch (err) {
    return c.json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getOneCheckoutUser = async (c: Context) => {
  try {
    const orderId = c.req.param("orderId");
    const userId = c.get("userId");
    const checkout = await prisma.checkouts.findUnique({
      where: { order_id: orderId, user_id: userId },
      include: {
        delivery: {
          include: {
            address: true,
          },
        },
        status: true,
      },
      omit: {
        user_id: true,
        snap_token: true,
        id: true,
      },
    });

    if (!checkout) {
      return c.json({
        success: false,
        message: "Checkout not found",
      });
    }

    return c.json({
      success: true,
      data: checkout,
    });
  } catch (err) {
    return c.json({
      success: false,
      message: "Internal server error",
    });
  }
};

// TODO: add midtrans
export const createCheckout = async (c: Context) => {
  try {
    const userId = c.get("userId");

    const {
      description,
      gift_card,
      gift_description,
      delivery,
      product_checkout,
    } = c.get("validatedBody") as AddCheckoutRequest;

    const address = await prisma.address.findUnique({
      where: { id: delivery.address_id, user_id: userId },
    });

    if (!address) {
      return c.json({
        success: false,
        message: "Address not found",
      });
    }

    const variantItems = await Promise.all(
      product_checkout.map(async (p) => {
        const product = await prisma.products.findUnique({
          where: { id: p.product_id },
        });

        if (!product) {
          throw new Error("Product not found");
        }

        const variant = await prisma.variants.findUnique({
          where: { id: p.variant_id },
          select: {
            id: true,
            price: true,
            stock: true,
            product_id: true,
          },
        });

        if (!variant) {
          throw new Error("Variant not found");
        }

        if (variant.product_id !== p.product_id) {
          throw new Error("Variant not belong to product");
        }

        if (variant.stock < p.quantity) {
          throw new Error("Stock is overload");
        }

        const cart = await prisma.carts.findFirst({
          where: {
            product_id: p.product_id,
            variant_id: p.variant_id,
            quantity: p.quantity,
            user_id: userId,
          },
          select: {id: true}
        });

        if (!cart) {
          throw new Error("Product not found in cart");
        }

        await prisma.carts.delete({
          where: {id: cart.id}
        })

        await prisma.products.update({
          where: { id: p.product_id },
          data: {
            sold: {
              increment: p.quantity,
            },
            variant: {
              update: {
                where: { id: p.variant_id },
                data: {
                  stock: {
                    decrement: p.quantity,
                  },
                },
              },
            },
          },
        });

        return {
          ...p,
          price: variant.price,
          subtotal: variant.price * p.quantity,
        };
      })
    );

    const total_price = variantItems.reduce(
      (acc, item) => acc + item.subtotal,
      0
    );

    await prisma.checkouts.create({
      data: {
        description,
        gift_card,
        gift_description,
        order_id: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
        estimation: String(new Date().setDate(new Date().getDate() + 3)),
        total_price,
        status: {
          create: {
            status_type: "pending",
          },
        },
        delivery: {
          create: {
            delivery_type: delivery.delivery_type,
            pickup_date: delivery.pickup_date,
            pickup_hour: delivery.pickup_hour,
            delivery_price: 0,
            address: {
              connect: {
                id: delivery.address_id,
              },
            },
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },
        product_checkout: {
          create: variantItems.map((p) => ({
            quantity: p.quantity,
            price: p.price * p.quantity,
            product: {
              connect: {
                id: p.product_id,
              },
            },
            variant: {
              connect: {
                id: p.variant_id,
              },
            },
          })),
        },
      },
    });

    return c.json({
      success: true,
      message: "Success add checkout",
    });
  } catch (err) {
    return c.json({
      success: false,
      message:
        err instanceof Error
          ? err.message
          : String(err) || "Internal server error",
    });
  }
};

export const createStatusCheckout = async (c: Context) => {
  try {
    const orderId = c.req.param("orderId");
    const checkout = await prisma.checkouts.findUnique({
      where: { order_id: orderId },
      select: { id: true, product_checkout: true },
    });

    if (!checkout) {
      return c.json({
        success: false,
        message: "Checkout not found",
      });
    }

    const { status_type, description, created_at } = c.get(
      "validatedBody"
    ) as UpdateStatusRequest;

    await prisma.status.create({
      data: {
        status_type,
        description,
        created_at,
        checkout: {
          connect: {
            id: checkout.id,
          },
        },
      },
    });
    if (status_type === "cancel") {
      checkout.product_checkout.map(async (p) => {
        await prisma.products.update({
          where: { id: p.product_id },
          data: {
            sold: {
              decrement: p.quantity,
            },
            variant: {
              update: {
                where: { id: p.variant_id },
                data: {
                  stock: {
                    increment: p.quantity,
                  },
                },
              },
            },
          },
        });
      });

      return c.json({
        success: true,
        message: 'Success add cancel status'
      })
    }

    return c.json({
      success: true,
      message: "Success add status",
    });
  } catch (err) {
    return c.json({
      success: false,
      message:
        err instanceof Error
          ? err.message
          : String(err) || "Internal server error",
    });
  }
};
