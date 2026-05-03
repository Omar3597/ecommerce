import { Router } from "express";
import { CategoryController } from "../controllers/category.controller";
import { CategoryService } from "../services/category.service";
import { CategoryRepo } from "../repositories/category.repo";

const publicCategoryRouter = Router();

const categoryRepo = new CategoryRepo();
const categoryService = new CategoryService(categoryRepo);
const categoryController = new CategoryController(categoryService);

publicCategoryRouter.get("/", categoryController.getAllCategories);
publicCategoryRouter.get("/:categoryId", categoryController.getOneCategory);

export default publicCategoryRouter;
