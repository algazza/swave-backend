import { Context } from "hono";
import prisma from "../../prisma/client";
import { AddCheckoutRequest, UpdateStatusRequest } from "../types/checkout";
import { snap } from "../service/midtrans";
import { getDistance } from "./address.controller";
import { distanceLocation } from "../service/location";

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
            order_status: true,
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
      status: item.status[0].order_status,
      delivery: item.delivery.delivery_type,
      amount: item.total_price,
    }));

    return c.json({
      success: true,
      data: checkoutJson,
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
    });

    const checkoutJson = checkout.map((item) => ({
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

    return c.json({
      success: true,
      data: checkoutJson,
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
      }, 404);
    }

    return c.json({
      success: true,
      data: checkout,
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

export const getOneCheckoutUser = async (c: Context) => {
  try {
    const orderId = c.req.param("orderId");
    const userId = c.get("userId");
    const checkout = await prisma.checkouts.findUnique({
      where: { order_id: orderId, user_id: userId },
      include: {
        delivery: {
          include: {
            address: {
              omit: {
                id: true,
                user_id: true,
                latitude: true,
                longitude: true,
              },
            },
          },
          omit: {
            id: true,
            address_id: true,
          },
        },
        status: {
          omit: {
            id: true,
            checkout_id: true,
            payment_status: true,
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
      omit: {
        user_id: true,
        snap_token: true,
        id: true,
        delevery_id: true,
      },
    });

    if (!checkout) {
      return c.json({
        success: false,
        message: "Checkout not found",
      }, 404);
    }

    const checkoutJson = {
      ...checkout,
      product_checkout: checkout.product_checkout.map((p) => ({
        id: p.product.id,
        category: p.product.category.category,
        name: p.product.name,
        image_path: p.product.product_images.map((img) => img.image_path)[0],
        variant: p.variant.variant,
        variant_price: p.variant.price,
        quantity: p.quantity,
        total_price: p.price,
      })),
    };

    return c.json({
      success: true,
      data: checkoutJson,
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
      select: {
        longitude: true,
        latitude: true,
      },
    });

    if (!address) {
      return c.json({
        success: false,
        message: "Address not found",
      }, 404);
    }

    const adminAddress = await prisma.address.findFirst({
      where: { user_id: 1 },
      select: {
        latitude: true,
        longitude: true,
      },
    });

    if (!adminAddress) {
      return c.json({
        success: false,
        message: "address admin not found",
      }, 404);
    }

    const res = await distanceLocation(
      adminAddress.longitude,
      adminAddress.latitude,
      address.longitude,
      address.latitude,
    );

    const distanceRound = Math.round(res / 1000) * 1000;

    const result = await prisma.$transaction(async (tx) => {
      const variantItems = await Promise.all(
        product_checkout.map(async (p) => {
          const variant = await tx.variants.findUnique({
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

          const cart = await tx.carts.findFirst({
            where: {
              product_id: p.product_id,
              quantity: p.quantity,
              variant_id: p.variant_id,
              user_id: userId,
            },
            select: { id: true },
          });

          if (!cart) {
            throw new Error("Product not found in cart");
          }

          await tx.carts.delete({
            where: { id: cart.id },
          });

          await tx.products.update({
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
        }),
      );

      const total_price =
        variantItems.reduce((acc, item) => acc + item.subtotal, 0) +
        distanceRound * 1.5;

      const order_id = `ORD-${Date.now()}${Math.floor(Math.random() * 1000)}`;

      const checkout = await tx.checkouts.create({
        data: {
          order_id,
          description,
          gift_card,
          gift_description,
          estimation: String(new Date(Date.now() + 3 * 86400000)),
          total_price: total_price,
          status: {
            create: {
              payment_status: "pending",
              order_status: "pending",
            },
          },
          delivery: {
            create: {
              delivery_type: delivery.delivery_type,
              pickup_date: delivery.pickup_date,
              pickup_hour: delivery.pickup_hour,
              delivery_price: distanceRound * 1.5,
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

      return {
        checkoutId: checkout.id,
        orderId: order_id,
        totalPrice: total_price,
      };
    });

    const snapTransaction = await snap.createTransaction({
      transaction_details: {
        order_id: result.orderId,
        gross_amount: result.totalPrice,
      },
    });

    await prisma.checkouts.update({
      where: { id: result.checkoutId },
      data: {
        snap_token: snapTransaction.token,
      },
    });

    return c.json({
      success: true,
      message: "Success add checkout",
      data: {
        order_id: result.orderId,
        snap_token: snapTransaction.token,
      },
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

export const createStatusCheckout = async (c: Context) => {
  try {
    const orderId = c.req.param("orderId");
    const checkout = await prisma.checkouts.findUnique({
      where: { order_id: orderId },
      select: {
        id: true,
        product_checkout: true,
        status: {
          orderBy: {
            created_at: "desc",
          },
          take: 1,
          select: {
            order_status: true,
          },
        },
      },
    });

    if (!checkout) {
      return c.json({
        success: false,
        message: "Checkout not found",
      }, 404);
    }

    const { order_status, description } = c.get(
      "validatedBody",
    ) as UpdateStatusRequest;

    const statusFlow = [
      "pending",
      "processing",
      "delivery",
      "success",
    ] as const;
    const latestStatus = checkout.status[0]?.order_status ?? "pending";

    if (order_status !== "cancelled") {
      const currentIndex = statusFlow.indexOf(
        latestStatus as (typeof statusFlow)[number],
      );
      const nextIndex = statusFlow.indexOf(
        order_status as (typeof statusFlow)[number],
      );

      if (
        currentIndex === -1 ||
        nextIndex === -1 ||
        nextIndex !== currentIndex + 1
      ) {
        return c.json(
          {
            success: false,
            message:
              "Status must follow sequence: pending -> processing -> delivery -> success",
          },
          400,
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.status.create({
        data: {
          order_status,
          description,
          checkout: {
            connect: {
              id: checkout.id,
            },
          },
        },
      });
  
      if (order_status === "cancelled") {
        await Promise.all(
          checkout.product_checkout.map((p) =>
            tx.products.update({
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
            }),
          ),
        );
  
        return c.json({
          success: true,
          message: "Success add cancel status",
        });
      }
    })

    return c.json({
      success: true,
      message: "Success add status",
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
