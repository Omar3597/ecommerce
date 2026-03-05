import { Request, Response } from "express";
import { catchAsync } from "../../common/middlewares/catchAsync";
import { assertAuth } from "../../common/guards/assert-auth";
import { ReviewService } from "./review.service";
import {
  createReviewSchema,
  deleteReviewSchema,
  updateReviewSchema,
  getProductReviewsSchema,
} from "./review.validator";
import {
  toPaginatedProductReviewsResponse,
  toPaginatedUserReviewsResponse,
} from "./review.dto";

export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  public getProductReviews = catchAsync(async (req: Request, res: Response) => {
    const validatedData = getProductReviewsSchema.parse({ params: req.params });
    const { productId } = validatedData.params;

    const result = await this.reviewService.getProductReviews(
      productId,
      req.query,
    );
    const { pagination, reviews } = toPaginatedProductReviewsResponse(result);

    res.status(200).json({
      status: "success",
      results: result.reviews.length,
      pagination,
      data: { reviews },
    });
  });

  public createReview = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

    const validatedData = createReviewSchema.parse({
      params: req.params,
      body: req.body,
    });

    const review = await this.reviewService.createReview({
      productId: validatedData.params.productId,
      userId: req.user.id,
      data: validatedData.body,
    });

    res.status(201).json({
      status: "success",
      data: { review },
    });
  });

  public updateReview = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

    const validatedData = updateReviewSchema.parse({
      params: req.params,
      body: req.body,
    });

    const updatedReview = await this.reviewService.updateReview({
      reviewId: validatedData.params.reviewId,
      actor: {
        id: req.user.id,
        role: req.user.role,
      },
      data: validatedData.body,
    });

    res.status(200).json({
      status: "success",
      data: { review: updatedReview },
    });
  });

  public deleteReview = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

    const validatedData = deleteReviewSchema.parse({ params: req.params });

    await this.reviewService.deleteReview({
      reviewId: validatedData.params.reviewId,
      actor: {
        id: req.user.id,
        role: req.user.role,
      },
    });

    res.status(204).send();
  });

  public getUserReviewsOnProducts = catchAsync(
    async (req: Request, res: Response) => {
      assertAuth(req);

      const result = await this.reviewService.getUserReviewsOnProducts(
        req.user.id,
        req.query,
      );
      const { pagination, reviews } = toPaginatedUserReviewsResponse(result);

      res.status(200).json({
        status: "success",
        results: result.reviews.length,
        pagination,
        data: { reviews },
      });
    },
  );
}
