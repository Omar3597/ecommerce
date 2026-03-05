type PaginatedReviews<TReview = any> = {
  totalItems: number;
  limit: number;
  skip: number;
  reviews: TReview[];
};

function toPaginatedResponse<TInput, TOutput>(
  p: PaginatedReviews<TInput>,
  mapReview: (review: TInput) => TOutput,
) {
  const limit = Math.max(1, p.limit || 1);
  const totalItems = Math.max(0, p.totalItems || 0);
  const totalPages = Math.ceil(totalItems / limit);

  const rawPage = Math.floor((p.skip || 0) / limit) + 1;
  const currentPage =
    totalPages === 0 ? 0 : Math.min(Math.max(rawPage, 1), totalPages);

  return {
    pagination: {
      totalItems,
      totalPages,
      currentPage,
      nextPage:
        currentPage > 0 && currentPage < totalPages ? currentPage + 1 : null,
      prevPage: currentPage > 1 ? currentPage - 1 : null,
      limit,
    },
    reviews: p.reviews.map(mapReview),
  };
}

export function toPaginatedProductReviewsResponse(p: PaginatedReviews) {
  return toPaginatedResponse(p, (review: any) => ({
    isModified:
      new Date(review.updatedAt).getTime() >
      new Date(review.createdAt).getTime(),
    id: review.id,
    rating: Number(review.rating) || review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: review.user,
  }));
}

export function toPaginatedUserReviewsResponse(p: PaginatedReviews) {
  return toPaginatedResponse(p, (review: any) => ({
    isModified:
      new Date(review.updatedAt).getTime() >
      new Date(review.createdAt).getTime(),
    id: review.id,
    rating: Number(review.rating) || review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    product: review.product,
  }));
}
