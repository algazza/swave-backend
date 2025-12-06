import { Snap } from "midtrans-client";

export const snap = new Snap({
  isProduction: false,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
});
