import { Context } from "hono";
import prisma from "../../prisma/client";

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
    const checkout = prisma.checkouts.findMany({
      where: { user_id: userId },
      select: {
        id: true,
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
      },
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
      where: { order_id: Number(orderId) },
      include: {
        delivery: {
          include: {
            address: true,
          },
        },
        user: true,
        status: true,
      },
    });

    if (!checkout) {
      return c.json({
        success: false,
        message: "Checkout not found",
      });
    }

    return c.json({
      success: false,
      data: checkout,
    });
  } catch (err) {
    return c.json({
      success: false,
      message: "Internal server error",
    });
  }
};
