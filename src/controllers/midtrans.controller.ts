import { Context } from "hono";
import { MidtransRequest } from "../types/midtrans";
import prisma from "../../prisma/client";

export const midtransWebhook = async (c: Context) => {
  try {
    const { order_id, transaction_status, fraud_status } = c.get(
      "validatedBody"
    ) as MidtransRequest;
    const checkout = await prisma.checkouts.findUnique({
      where: { order_id },
      include: { status: {
        orderBy: {created_at: 'desc'},
        take: 1
      } },
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

    const latestStatus = checkout.status[0].payment_status
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
