import { Router } from "express";
import { ReviewController } from "./review.controller";
import { ReviewService } from "./review.service";
import { ReviewRepo } from "./review.repo";
import { protect } from "../../common/middlewares/protect";

const reviewRepo = new ReviewRepo();
const reviewService = new ReviewService(reviewRepo);
const reviewController = new ReviewController(reviewService);

const productReviewRouter = Router({ mergeParams: true });

productReviewRouter.get("/", reviewController.getProductReviews);
productReviewRouter.post("/", protect, reviewController.createReview);

export default productReviewRouter;
