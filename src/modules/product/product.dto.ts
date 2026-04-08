type PaginatedProducts<TProduct = any> = {
  totalItems: number;
  limit: number;
  skip: number;
  products: TProduct[];
};

function toPaginatedResponse<TInput, TOutput>(
  p: PaginatedProducts<TInput>,
  mapProduct: (product: TInput) => TOutput,
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
    products: p.products.map(mapProduct),
  };
}

export function toPaginatedPublicResponse(
  p: PaginatedProducts,
  maxCartQty: number,
) {
  return toPaginatedResponse(p, (product: any) => {
    const ratingAvgNum = Number(product.ratingAvg);
    const ratingAvg = Number.isFinite(ratingAvgNum) ? ratingAvgNum : null;
    const image: string | null = product.productImages?.[0]?.url ?? null;

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      summary: product.summary,
      stock: Math.min(product.stock, maxCartQty),
      ratingAvg,
      ratingCount: product.ratingCount,
      image,
    };
  });
}

export function toPaginatedAdminResponse(p: PaginatedProducts) {
  return toPaginatedResponse(p, (product: any) => ({
    id: product.id,
    name: product.name,
    summary: product.summary,
    description: product.description,
    price: product.price,
    stock: product.stock,
    isHidden: product.isHidden,
    categoryId: product.categoryId,
    image: product.productImages?.[0]?.url ?? null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }));
}

export function toPublicProductDetails(p: any, maxCartQty: number) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    summary: p.summary,
    price: p.price,
    stock: Math.min(p.stock, maxCartQty),
    ratingAvg: Number(p.ratingAvg) ?? p.ratingAvg,
    ratingCount: p.ratingCount,
    category: p.category,
    images: (p.productImages ?? []).map((img: any) => ({
      url: img.url,
      sortOrder: img.sortOrder,
    })),
    reviews: p.reviews,
  };
}
