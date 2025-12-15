import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import {
  AddressRoute,
  authRoute,
  cartRoute,
  categoryRoute,
  checkoutRoute,
  contactRoute,
  midtransRoute,
  productRoute,
  reviewRoute,
  userRoute,
  variantRoute,
} from "./routes";

const port = process.env.PORT || 3000;
const app = new Hono();

app.use("*", cors());
app.use("/images/*", serveStatic({ root: "./" }));

app.route("/api/auth", authRoute);
app.route("/api/account/profile", userRoute);
app.route("/api/account/address", AddressRoute);
app.route("/api/category", categoryRoute);
app.route("/api/variant", variantRoute);
app.route("/api/product", productRoute);
app.route("/api/cart", cartRoute);
app.route("/api/checkout", checkoutRoute);
app.route("/api/account", reviewRoute);
app.route("/api/contact", contactRoute);
app.route("/api/midtrans/webhook", midtransRoute);

export default {
  port,
  fetch: app.fetch,
};
