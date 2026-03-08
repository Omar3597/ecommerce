export function toPublicCategoryResponse(category: any) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    count: category._count?.products ?? 0,
  };
}

export function toPublicCategoriesResponse(categories: any[]) {
  return categories.map(toPublicCategoryResponse);
}

export function toCategoryResponse(category: any) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    isHidden: category.isHidden,
    productsCount: category._count?.products ?? 0,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export function toCategoriesResponse(categories: any[]) {
  return categories.map(toCategoryResponse);
}
