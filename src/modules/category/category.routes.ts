import { Router } from "express";
import { CategoryController } from "./category.controller";
import { CategoryService } from "./category.service";

const router = Router();

const categoryService = new CategoryService();
const categoryController = new CategoryController(categoryService);

router.get("/", categoryController.getAllCategories);
router.get("/:categoryId", categoryController.getOneCategory);

export default router;
