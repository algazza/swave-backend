import { Hono } from "hono";
import { validateBody, verifyToken } from "../middlewares";
import { addReviewSchema } from "../schemas/review.schema";
import {
  createReview,
  getHistoryReview,
  getHistoryUnreview,
} from "../controllers/review.controller";

const route = new Hono();

route.get("/review/me", verifyToken, getHistoryReview);
route.get("/unreview/me", verifyToken, getHistoryUnreview);
route.post("/review", verifyToken, validateBody(addReviewSchema), createReview);

export const reviewRoute = route;
