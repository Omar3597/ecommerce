import { prisma } from "../../lib/prisma";
import AppError from "../../common/utils/appError";
import { CreateReviewInput, UpdateReviewInput } from "./review.validator";
import { QueryBuilder } from "../../common/utils/queryBuilder";
import { Actor, ReviewPolicy } from "./review.policy";

const REVIEW_SORT_WHITELIST = ["comment", "rating", "createdAt"];

export class ReviewService {
  async createReview({
    productId,
    userId,
    data,
  }: {
    productId: string;
    userId: string;
    data: CreateReviewInput;
  }) {
    const reviewableProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        isHidden: false,
        orderItems: {
          some: {
            order: {
              userId,
              status: "DELIVERED",
            },
          },
        },
      },
      select: { id: true },
    });

    if (!reviewableProduct) {
      const product = await prisma.product.findFirst({
        where: { id: productId, isHidden: false },
        select: { id: true },
      });

      if (!product) {
        throw new AppError(404, "Product is not found");
      }

      throw new AppError(
        403,
        "You can only review products you have purchased before",
      );
    }

    return prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: { ...data, userId, productId },
      });

      await this.updateProductRating(productId, tx);

      return review;
    });
  }

  async getProductReviews(productId: string, query: Record<string, any>) {
    const qb = new QueryBuilder(query, 15).sort(REVIEW_SORT_WHITELIST).build();

    const { orderBy, take, skip } = qb;

    const product = await prisma.product.findUnique({
      where: { id: productId, isHidden: false },
      select: { id: true },
    });

    if (!product) {
      throw new AppError(404, "Product is not found");
    }

    return prisma.review.findMany({
      where: { productId },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take,
      skip,
      orderBy,
    });
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
    return prisma.$transaction(async (tx) => {
      const review = await this.getReviewWithVisibleProductOrThrow(reviewId, tx);
      ReviewPolicy.assertCanUpdate(actor, review);

      const updatedReview = await tx.review.update({
        where: { id: review.id },
        data,
      });

      await this.updateProductRating(review.productId, tx);

      return updatedReview;
    });
  }

  async deleteReview({ reviewId, actor }: { reviewId: string; actor: Actor }) {
    await prisma.$transaction(async (tx) => {
      const review = await this.getReviewWithVisibleProductOrThrow(reviewId, tx);
      ReviewPolicy.assertCanDelete(actor, review);

      await tx.review.delete({
        where: { id: review.id },
      });

      await this.updateProductRating(review.productId, tx);
    });
  }

  private async updateProductRating(productId: string, tx: any) {
    const stats = await tx.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await tx.product.update({
      where: { id: productId },
      data: {
        ratingAvg: stats._avg.rating || 0,
        ratingCount: stats._count.rating || 0,
      },
    });
  }

  private async getReviewWithVisibleProductOrThrow(reviewId: string, tx: any) {
    const review = await tx.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        productId: true,
        product: {
          select: {
            id: true,
            isHidden: true,
          },
        },
      },
    });

    if (!review) {
      throw new AppError(404, "Review is not found");
    }

    if (!review.product || review.product.isHidden) {
      throw new AppError(404, "Product is not found");
    }

    return review;
  }
}
