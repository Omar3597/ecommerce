import { Router } from "express";
import { ReviewController } from "./review.controller";
import { ReviewService } from "./review.service";
import { ReviewRepo } from "./review.repo";

const reviewRepo = new ReviewRepo();
const reviewService = new ReviewService(reviewRepo);
const reviewController = new ReviewController(reviewService);

const router = Router();

router.get("/", reviewController.getUserReviewsOnProducts);

router
  .route("/:reviewId")
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);

export default router;
