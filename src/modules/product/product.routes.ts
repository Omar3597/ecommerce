import { Router } from "express";
import { ProductController } from "./product.controller";
import { ProductService } from "./product.service";
import reviewRouter from "../review/review.routes";

const router = Router();

const productService = new ProductService();
const productController = new ProductController(productService);

router.get("/", productController.getAllProducts);

router.get("/:productId", productController.getOneProduct);

export default router;
