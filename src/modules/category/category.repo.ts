import { prisma } from "../../lib/prisma";

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  isHidden: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      products: true,
    },
  },
} as const;

export class CategoryRepo {
  findIdBySlug(slug: string) {
    return prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
  }

  createCategory(name: string, slug: string, isHidden: boolean) {
    return prisma.category.create({
      data: {
        name,
        slug,
        isHidden,
      },
      select: categorySelect,
    });
  }

  findAllCategories(includeHidden: boolean) {
    return prisma.category.findMany({
      where: includeHidden ? {} : { isHidden: false },
      select: categorySelect,
      orderBy: { createdAt: "desc" },
    });
  }

  findCategoryById(categoryId: string, includeHidden: boolean) {
    return prisma.category.findFirst({
      where: {
        id: categoryId,
        ...(includeHidden ? {} : { isHidden: false }),
      },
      select: categorySelect,
    });
  }

  findCategoryForUpdate(categoryId: string) {
    return prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true, slug: true },
    });
  }

  updateCategory(
    categoryId: string,
    data: { name?: string; isHidden?: boolean; slug?: string },
  ) {
    return prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.isHidden !== undefined && { isHidden: data.isHidden }),
        ...(data.slug !== undefined && { slug: data.slug }),
      },
      select: categorySelect,
    });
  }

  findCategoryForDelete(categoryId: string) {
    return prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  deleteCategory(categoryId: string) {
    return prisma.category.delete({
      where: { id: categoryId },
    });
  }
}
