import { Prisma } from "@prisma/client";
import AppError from "../../common/utils/appError";
import { CreateReviewInput, UpdateReviewInput } from "./review.validator";
import { Actor, ReviewPolicy } from "./review.policy";
import { ReviewRepo } from "./review.repo";

export class ReviewService {
  constructor(private readonly reviewRepo: ReviewRepo = new ReviewRepo()) {}

  async createReview({
    productId,
    userId,
    data,
  }: {
    productId: string;
    userId: string;
    data: CreateReviewInput;
  }) {
    const reviewableProduct = await this.reviewRepo.findReviewableProduct(
      productId,
      userId,
    );

    if (!reviewableProduct) {
      const product = await this.reviewRepo.findVisibleProductById(productId);

      if (!product) {
        throw new AppError(404, "Product is not found");
      }

      throw new AppError(
        403,
        "You can only review products you have purchased before",
      );
    }

    return this.reviewRepo.runInTransaction(async (tx) => {
      const review = await this.reviewRepo.createReview(tx, {
        productId,
        userId,
        data,
      });

      await this.updateProductRating(productId, tx);

      return review;
    });
  }

  async getProductReviews(productId: string, query: Record<string, any>) {
    const product = await this.reviewRepo.findVisibleProductById(productId);

    if (!product) {
      throw new AppError(404, "Product is not found");
    }

    return this.reviewRepo.findProductReviews(productId, query);
  }

  async getUserReviewsOnProducts(userId: string, query: Record<string, any>) {
    return this.reviewRepo.findUserReviewsOnProducts(userId, query);
  }

  async updateReview({
    reviewId,
    actor,
    data,
  }: {
    reviewId: string;
    actor: Actor;
    data: UpdateReviewInput;
  }) {
    return this.reviewRepo.runInTransaction(async (tx) => {
      const review = await this.getReviewWithVisibleProductOrThrow(
        reviewId,
        tx,
      );
      ReviewPolicy.assertCanUpdate(actor, review);

      const updatedReview = await this.reviewRepo.updateReview(
        tx,
        review.id,
        data,
      );

      await this.updateProductRating(review.productId, tx);

      return updatedReview;
    });
  }

  async deleteReview({ reviewId, actor }: { reviewId: string; actor: Actor }) {
    await this.reviewRepo.runInTransaction(async (tx) => {
      const review = await this.getReviewWithVisibleProductOrThrow(
        reviewId,
        tx,
      );
      ReviewPolicy.assertCanDelete(actor, review);

      await this.reviewRepo.deleteReview(tx, review.id);

      await this.updateProductRating(review.productId, tx);
    });
  }

  private async updateProductRating(
    productId: string,
    tx: Prisma.TransactionClient,
  ) {
    const stats = await this.reviewRepo.aggregateReviewStats(tx, productId);

    await this.reviewRepo.updateProductRating(
      tx,
      productId,
      stats._avg.rating ?? 0,
      stats._count.rating ?? 0,
    );
  }

  private async getReviewWithVisibleProductOrThrow(
    reviewId: string,
    tx: Prisma.TransactionClient,
  ) {
    const review = await this.reviewRepo.findReviewWithProductById(
      reviewId,
      tx,
    );

    if (!review) {
      throw new AppError(404, "Review is not found");
    }

    if (!review.product || review.product.isHidden) {
      throw new AppError(404, "Product is not found");
    }

    return review;
  }
}
