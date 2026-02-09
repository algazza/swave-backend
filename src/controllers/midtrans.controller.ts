import { Context } from "hono";
import { MidtransRequest } from "../types/midtrans";
import prisma from "../../prisma/client";
import {
  OrderStatus,
  PaymentStatus,
} from "../../prisma/generated/prisma/enums";

// TODO: add validation for midtrans webhook payload
export const midtransWebhook = async (c: Context) => {
  try {
    const { order_id, transaction_status } = c.get(
      "validatedBody"
    ) as MidtransRequest;
    const checkout = await prisma.checkouts.findUnique({
      where: { order_id },
      select: {
        id: true,
        status: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    });

    if (!checkout) {
      return c.json(
        {
          success: false,
          message: "Order not found",
        },
        404
      );
    }

    const latestStatus = checkout.status[0];
    if (
      latestStatus.payment_status === "paid" &&
      transaction_status !== "refund"
    ) {
      return c.json({ message: "Already processed" });
    }

    let paymentStatus: PaymentStatus | null = null;
    let orderStatus: OrderStatus | null = null;

    switch (transaction_status) {
      case "capture":
      case "settlement":
        paymentStatus = "paid";
        orderStatus = "pending";
        break;

      case "pending":
        paymentStatus = "pending";
        break;

      case "expire":
        paymentStatus = "expired";
        orderStatus = "cancelled";
        break;

      case "deny":
      case "cancel":
        paymentStatus = "failed";
        orderStatus = "cancelled";
        break;

      case "refund":
        paymentStatus = "refunded";
        orderStatus = "cancelled";
        break;

      default:
        return c.json({ message: "Unhandled transaction status" });
    }

    if (
      latestStatus?.payment_status === paymentStatus &&
      latestStatus.order_status === orderStatus
    ) {
      return c.json({ message: "Already processed" });
    }

    if (paymentStatus === "expired" || paymentStatus === "failed") {
      const items = await prisma.product_checkouts.findMany({
        where: { checkout_id: checkout.id },
      });

      for (const item of items) {
        await prisma.variants.update({
          where: { id: item.variant_id },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });

        await prisma.products.update({
          where: { id: item.product_id },
          data: {
            sold: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    await prisma.status.create({
      data: {
        payment_status: paymentStatus,
        order_status: orderStatus || "pending",
        checkout: {
          connect: {
            id: checkout.id,
          },
        },
      },
    });

    return c.json({ received: true });
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
