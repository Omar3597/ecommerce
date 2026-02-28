import { Router } from "express";
import { ReviewController } from "./review.controller";
import { ReviewService } from "./review.service";
import { protect } from "../../common/middlewares/protect";

const reviewService = new ReviewService();
const reviewController = new ReviewController(reviewService);

const router = Router({ mergeParams: true });

router.get("/", reviewController.getProductReviews);
router.post("/", protect, reviewController.createReview);

router
  .route("/:reviewId")
  .patch(protect, reviewController.updateReview)
  .delete(protect, reviewController.deleteReview);

export default router;
