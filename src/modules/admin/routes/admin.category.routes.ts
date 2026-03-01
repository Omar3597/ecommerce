import express from "express";
import { authorize } from "../../../common/middlewares/authorize";
import { CategoryService } from "../../category/category.service";
import { CategoryController } from "../../category/category.controller";

const router = express.Router({ mergeParams: true });

const categoryService = new CategoryService();
const categoryController = new CategoryController(categoryService);

router.get("/", authorize("category", "read"), categoryController.getAllCategoriesAdmin);
router.get("/:categoryId", authorize("category", "read"), categoryController.getOneCategoryAdmin);
router.post("/", authorize("category", "create"), categoryController.createCategory);
router.patch("/:categoryId", authorize("category", "update"), categoryController.updateCategory);
router.delete("/:categoryId", authorize("category", "delete"), categoryController.deleteCategory);

export default router;
