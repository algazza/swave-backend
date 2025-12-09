import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { authRoute } from "./routes/auth.route";
import { userRoute } from "./routes/user.route";
import { AddressRoute } from "./routes/address.route";
import { categoryRoute } from "./routes/category.route";
import { variantRoute } from "./routes/variant.route";
import { productRoute } from "./routes/product.route";
import { contactRoute } from "./routes/contact.route";
import { cartRoute } from "./routes/cart.route";
import { checkoutRoute } from "./routes/checkout.route";

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
app.route("/api/contact", contactRoute);

export default {
  port,
  fetch: app.fetch,
};
