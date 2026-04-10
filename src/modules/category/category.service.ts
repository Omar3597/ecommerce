import AppError from "../../common/utils/appError";
import { CreateCategoryInput, UpdateCategoryInput } from "./category.validator";
import { CategoryRepo } from "./category.repo";
import baseLogger from "../../config/logger";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

export class CategoryService {
  private logger = baseLogger.child({ module: "category" });

  constructor(private readonly categoryRepo: CategoryRepo) {}

  private async createUniqueSlug(baseSlug: string, excludedId?: string) {
    let nextSlug = baseSlug;
    let suffix = 2;

    while (true) {
      const existingCategory = await this.categoryRepo.findIdBySlug(nextSlug);

      if (!existingCategory || existingCategory.id === excludedId) {
        return nextSlug;
      }

      nextSlug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  }

  async createCategory(
    data: CreateCategoryInput,
    context: { userId: string; role: string },
  ) {
    const baseSlug = slugify(data.slug ?? data.name);

    if (!baseSlug) {
      throw new AppError(400, "Category slug cannot be empty");
    }

    const slug = await this.createUniqueSlug(baseSlug);

    const category = await this.categoryRepo.createCategory(
      data.name,
      slug,
      data.isHidden ?? false,
    );

    this.logger.info(
      {
        action: "CREATE_CATEGORY",
        userId: context.userId,
        role: context.role,
        entityId: category.id,
      },
      "Category created",
    );

    return category;
  }

  async getAllCategories(includeHidden = false) {
    return this.categoryRepo.findAllCategories(includeHidden);
  }

  async getCategoryById(categoryId: string, includeHidden = false) {
    const category = await this.categoryRepo.findCategoryById(
      categoryId,
      includeHidden,
    );

    if (!category) {
      throw new AppError(404, "Category is not found");
    }

    return category;
  }

  async updateCategory(
    categoryId: string,
    data: UpdateCategoryInput,
    context: { userId: string; role: string },
  ) {
    const existingCategory =
      await this.categoryRepo.findCategoryForUpdate(categoryId);

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

    const category = await this.categoryRepo.updateCategory(categoryId, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.isHidden !== undefined && { isHidden: data.isHidden }),
      ...(nextSlug !== undefined && { slug: nextSlug }),
    });

    this.logger.info(
      {
        action: "UPDATE_CATEGORY",
        userId: context.userId,
        role: context.role,
        entityId: category.id,
      },
      "Admin updated category",
    );

    return category;
  }

  async deleteCategory(
    categoryId: string,
    context: { userId: string; role: string },
  ) {
    const category = await this.categoryRepo.findCategoryForDelete(categoryId);

    if (!category) {
      throw new AppError(404, "Category is not found");
    }

    await this.categoryRepo.deleteCategory(categoryId);

    this.logger.warn(
      {
        action: "DELETE_CATEGORY",
        userId: context.userId,
        role: context.role,
        entityId: categoryId,
      },
      "Category deleted",
    );
  }
}
