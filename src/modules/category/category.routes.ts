import { Router } from "express";
import { CategoryController } from "./category.controller";
import { CategoryService } from "./category.service";
import { CategoryRepo } from "./category.repo";

const router = Router();

const categoryRepo = new CategoryRepo();
const categoryService = new CategoryService(categoryRepo);
const categoryController = new CategoryController(categoryService);

router.get("/", categoryController.getAllCategories);
router.get("/:categoryId", categoryController.getOneCategory);

export default router;
