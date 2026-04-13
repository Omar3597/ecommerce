import { Router } from "express";
import { CategoryController } from "./category.controller";
import { CategoryService } from "./category.service";
import { CategoryRepo } from "./category.repo";

const publicCategoryRouter = Router();

const categoryRepo = new CategoryRepo();
const categoryService = new CategoryService(categoryRepo);
const categoryController = new CategoryController(categoryService);

publicCategoryRouter.get("/", categoryController.getAllCategories);
publicCategoryRouter.get("/:categoryId", categoryController.getOneCategory);

export default publicCategoryRouter;
