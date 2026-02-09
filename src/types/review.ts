import z from "zod";
import { addReviewSchema } from "../schemas/review.schema";

export type AddReviewRequest = z.infer<typeof addReviewSchema>