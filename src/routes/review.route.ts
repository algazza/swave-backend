import { Hono } from "hono";
import {
  createReview,
  getHistoryReview,
  getHistoryUnreview,
} from "../controllers/review.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { addReviewSchema } from "../schemas/review.schema";

const route = new Hono();

route.get("/review/me", verifyToken, getHistoryReview);
route.get("/unreview/me", verifyToken, getHistoryUnreview);
route.post("/review", verifyToken, validateBody(addReviewSchema), createReview);

export const reviewRoute = route;
