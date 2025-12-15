import { MiddlewareHandler } from "hono";
import { MidtransRequest } from "../types/midtrans";

export const verifyMidtransSignature: MiddlewareHandler = async (c, next) => {
  const { order_id, status_code, gross_amount, signature_key } = c.get(
    "validatedBody"
  ) as MidtransRequest;
  const server_key = process.env.MIDTRANS_SERVER_KEY || "";
  const payload = order_id + status_code + gross_amount + server_key;

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);

    const hashBuffer = await crypto.subtle.digest("SHA-512", data);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (hashHex !== signature_key) {
      return c.json({ message: "Invalid signature" }, 401);
    }
    await next();
  } catch (err) {
    return c.json({ message: "Invalid signature" }, 401);
  }
};
