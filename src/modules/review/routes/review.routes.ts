import { Router } from "express";
import { ReviewController } from "../controllers/review.controller";
import { ReviewService } from "../services/review.service";
import { userLimiter } from "../../../middlewares/rateLimit";

const reviewService = new ReviewService();
const reviewController = new ReviewController(reviewService);

const router = Router();

router.get("/", userLimiter, reviewController.getUserReviewsOnProducts);

router
  .route("/:reviewId")
  .patch(userLimiter, reviewController.updateReview)
  .delete(userLimiter, reviewController.deleteReview);

export default router;
