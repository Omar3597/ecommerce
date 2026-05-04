import { Router } from "express";
import { authorize } from "../../../middlewares/authorize";
import { CategoryService } from "../services/category.service";
import { CategoryController } from "../controllers/category.controller";
import { CategoryRepo } from "../repositories/category.repo";
import { cacheAdapter } from "../../../infra/cache";

const adminCategoryRouter = Router();

const categoryRepo = new CategoryRepo();
const categoryService = new CategoryService(categoryRepo, cacheAdapter);
const categoryController = new CategoryController(categoryService);

adminCategoryRouter.get(
  "/",
  authorize("category", "read"),
  categoryController.getAllCategoriesAdmin,
);

adminCategoryRouter.get(
  "/:categoryId",
  authorize("category", "read"),
  categoryController.getOneCategoryAdmin,
);

adminCategoryRouter.post(
  "/",
  authorize("category", "create"),
  categoryController.createCategory,
);

adminCategoryRouter.patch(
  "/:categoryId",
  authorize("category", "update"),
  categoryController.updateCategory,
);

adminCategoryRouter.delete(
  "/:categoryId",
  authorize("category", "delete"),
  categoryController.deleteCategory,
);

export default adminCategoryRouter;
