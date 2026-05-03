import { Request, Response } from "express";
import { CategoryService } from "../services/category.service";
import { catchAsync } from "../../../common/middlewares/catchAsync";
import {
  createCategorySchema,
  deleteCategorySchema,
  getCategorySchema,
  updateCategorySchema,
} from "../validators/category.validator";
import {
  toPublicCategoriesResponse,
  toPublicCategoryResponse,
  toCategoriesResponse,
  toCategoryResponse,
} from "../dtos/category.dto";
import { AuthRequest } from "../../../common/types/auth.types";

export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  public createCategory = catchAsync(async (req: AuthRequest, res: Response) => {
    const validatedData = createCategorySchema.parse(req);

    const category = await this.categoryService.createCategory(
      validatedData.body,
      {
        userId: req.user.id,
        role: req.user.role,
      },
    );

    res.status(201).json({
      status: "success",
      data: { category: toCategoryResponse(category) },
    });
  });

  public getAllCategories = catchAsync(async (_req: Request, res: Response) => {
    const categories = await this.categoryService.getAllCategories();

    res.status(200).json({
      status: "success",
      results: categories.length,
      data: { categories: toPublicCategoriesResponse(categories) },
    });
  });

  public getAllCategoriesAdmin = catchAsync(
    async (_req: Request, res: Response) => {
      const categories = await this.categoryService.getAllCategories(true);

      res.status(200).json({
        status: "success",
        results: categories.length,
        data: { categories: toCategoriesResponse(categories) },
      });
    },
  );

  public getOneCategory = catchAsync(async (req: Request, res: Response) => {
    const validatedData = getCategorySchema.parse(req);
    const { categoryId } = validatedData.params;

    const category = await this.categoryService.getCategoryById(categoryId);

    res.status(200).json({
      status: "success",
      data: { category: toPublicCategoryResponse(category) },
    });
  });

  public getOneCategoryAdmin = catchAsync(
    async (req: Request, res: Response) => {
      const validatedData = getCategorySchema.parse(req);
      const { categoryId } = validatedData.params;

      const category = await this.categoryService.getCategoryById(
        categoryId,
        true,
      );

      res.status(200).json({
        status: "success",
        data: { category: toCategoryResponse(category) },
      });
    },
  );

  public updateCategory = catchAsync(async (req: AuthRequest, res: Response) => {
    const validatedData = updateCategorySchema.parse(req);
    const { categoryId } = validatedData.params;

    const category = await this.categoryService.updateCategory(
      categoryId,
      validatedData.body,
      {
        userId: req.user.id,
        role: req.user.role,
      },
    );

    res.status(200).json({
      status: "success",
      data: { category: toCategoryResponse(category) },
    });
  });

  public deleteCategory = catchAsync(async (req: AuthRequest, res: Response) => {
    const validatedData = deleteCategorySchema.parse(req);
    const { categoryId } = validatedData.params;

    await this.categoryService.deleteCategory(categoryId, {
      userId: req.user.id,
      role: req.user.role,
    });

    res.status(204).send();
  });
}
