import { Hono } from "hono";
import {
  chartCheckout,
  getDashboardOverview,
} from "../controllers/dashboard.controller";
import { verifyAdmin, verifyToken } from "../middlewares";

const route = new Hono();

route.get("/overview", verifyToken, verifyAdmin, getDashboardOverview);

route.get("/chart-checkout", verifyToken, verifyAdmin, chartCheckout);

export const dashboardRoute = route;
