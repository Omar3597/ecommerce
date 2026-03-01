import { prisma } from "../../lib/prisma";
import AppError from "../../common/utils/appError";
import { CreateCategoryInput, UpdateCategoryInput } from "./category.validator";

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

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

export class CategoryService {
  private async createUniqueSlug(baseSlug: string, excludedId?: string) {
    let nextSlug = baseSlug;
    let suffix = 2;

    while (true) {
      const existingCategory = await prisma.category.findUnique({
        where: { slug: nextSlug },
        select: { id: true },
      });

      if (!existingCategory || existingCategory.id === excludedId) {
        return nextSlug;
      }

      nextSlug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  }

  async createCategory(data: CreateCategoryInput) {
    const baseSlug = slugify(data.slug ?? data.name);

    if (!baseSlug) {
      throw new AppError(400, "Category slug cannot be empty");
    }

    const slug = await this.createUniqueSlug(baseSlug);

    return prisma.category.create({
      data: {
        name: data.name,
        slug,
        isHidden: data.isHidden ?? false,
      },
      select: categorySelect,
    });
  }

  async getAllCategories(includeHidden = false) {
    return prisma.category.findMany({
      where: includeHidden ? {} : { isHidden: false },
      select: categorySelect,
      orderBy: { createdAt: "desc" },
    });
  }

  async getCategoryById(categoryId: string, includeHidden = false) {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        ...(includeHidden ? {} : { isHidden: false }),
      },
      select: categorySelect,
    });

    if (!category) {
      throw new AppError(404, "Category is not found");
    }

    return category;
  }

  async updateCategory(categoryId: string, data: UpdateCategoryInput) {
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true, slug: true },
    });

    if (!existingCategory) {
      throw new AppError(404, "Category is not found");
    }

    let nextSlug: string | undefined;
    if (data.slug !== undefined || data.name !== undefined) {
      const baseSlug = slugify(data.slug ?? data.name ?? existingCategory.name);

      if (!baseSlug) {
        throw new AppError(400, "Category slug cannot be empty");
      }

      nextSlug = await this.createUniqueSlug(baseSlug, categoryId);
    }

    return prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.isHidden !== undefined && { isHidden: data.isHidden }),
        ...(nextSlug !== undefined && { slug: nextSlug }),
      },
      select: categorySelect,
    });
  }

  async deleteCategory(categoryId: string) {
    const category = await prisma.category.findUnique({
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

    if (!category) {
      throw new AppError(404, "Category is not found");
    }

    // if (category._count.products > 0) {
    //   throw new AppError(
    //     400,
    //     "Cannot delete category while products still belong to it",
    //   );
    // }

    await prisma.category.delete({
      where: { id: categoryId },
    });
  }
}
