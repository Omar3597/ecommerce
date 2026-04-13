import { Router } from "express";
import { authorize } from "../../common/middlewares/authorize";
import { CategoryService } from "./category.service";
import { CategoryController } from "./category.controller";
import { CategoryRepo } from "./category.repo";

const adminCategoryRouter = Router();

const categoryRepo = new CategoryRepo();
const categoryService = new CategoryService(categoryRepo);
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
