import { Prisma } from "@prisma/client";
import { buildPrismaArgs } from "../../common/query/query.engine";
import { prisma } from "../../lib/prisma";
import { CreateReviewInput, UpdateReviewInput } from "./review.validator";
import { reviewsQuery } from "./review.query";

const productReviewsSelect: Prisma.ReviewSelect = {
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
} as const;

const userReviewsSelect: Prisma.ReviewSelect = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  updatedAt: true,
  product: {
    select: {
      id: true,
      name: true,
      summary: true,
      price: true,
    },
  },
} as const;

const reviewWithProductSelect: Prisma.ReviewSelect = {
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
} as const;

type Tx = Prisma.TransactionClient;

export class ReviewRepo {
  public findReviewableProduct(productId: string, userId: string) {
    return prisma.product.findFirst({
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
  }

  public findVisibleProductById(productId: string) {
    return prisma.product.findFirst({
      where: { id: productId, isHidden: false },
      select: { id: true },
    });
  }

  public runInTransaction<T>(fn: (tx: Tx) => Promise<T>) {
    return prisma.$transaction(fn);
  }

  public createReview(
    tx: Tx,
    {
      productId,
      userId,
      data,
    }: {
      productId: string;
      userId: string;
      data: CreateReviewInput;
    },
  ) {
    return tx.review.create({
      data: { ...data, userId, productId },
    });
  }

  public findProductReviews(productId: string, query: Record<string, any>) {
    const args = buildPrismaArgs(query, reviewsQuery);
    const extraWhere: Prisma.ReviewWhereInput = { productId };
    const finalWhere: Prisma.ReviewWhereInput = args.where
      ? {
          AND: [args.where, extraWhere],
        }
      : extraWhere;

    return prisma.$transaction(async (tx) => {
      const [totalItems, reviews] = await Promise.all([
        tx.review.count({ where: finalWhere }),
        tx.review.findMany({
          ...args,
          where: finalWhere,
          select: productReviewsSelect,
        }),
      ]);

      return {
        totalItems,
        reviews,
        limit: args.take ?? reviewsQuery.defaultLimit ?? 20,
        skip: args.skip ?? 0,
      };
    });
  }

  public findUserReviewsOnProducts(userId: string, query: Record<string, any>) {
    const args = buildPrismaArgs(query, reviewsQuery);
    const extraWhere: Prisma.ReviewWhereInput = {
      userId,
      product: {
        isHidden: false,
      },
    };
    const finalWhere: Prisma.ReviewWhereInput = args.where
      ? {
          AND: [args.where, extraWhere],
        }
      : extraWhere;

    return prisma.$transaction(async (tx) => {
      const [totalItems, reviews] = await Promise.all([
        tx.review.count({ where: finalWhere }),
        tx.review.findMany({
          ...args,
          where: finalWhere,
          select: userReviewsSelect,
        }),
      ]);

      return {
        totalItems,
        reviews,
        limit: args.take ?? reviewsQuery.defaultLimit ?? 20,
        skip: args.skip ?? 0,
      };
    });
  }

  public findReviewWithProductById(reviewId: string, tx: Tx) {
    return tx.review.findUnique({
      where: { id: reviewId },
      select: reviewWithProductSelect,
    });
  }

  public updateReview(tx: Tx, reviewId: string, data: UpdateReviewInput) {
    return tx.review.update({
      where: { id: reviewId },
      data,
    });
  }

  public deleteReview(tx: Tx, reviewId: string) {
    return tx.review.delete({
      where: { id: reviewId },
    });
  }

  public aggregateReviewStats(tx: Tx, productId: string) {
    return tx.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });
  }

  public updateProductRating(
    tx: Tx,
    productId: string,
    ratingAvg: number,
    ratingCount: number,
  ) {
    return tx.product.update({
      where: { id: productId },
      data: {
        ratingAvg,
        ratingCount,
      },
    });
  }
}
