import { Router } from "express";
import { ReviewController } from "../controllers/review.controller";
import { ReviewService } from "../services/review.service";

const reviewService = new ReviewService();
const reviewController = new ReviewController(reviewService);

const router = Router();

router.get("/", reviewController.getUserReviewsOnProducts);

router
  .route("/:reviewId")
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);

export default router;
