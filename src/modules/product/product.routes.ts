import { Router } from "express";
import { ProductController } from "./product.controller";
import { ProductService } from "./product.service";
import { ProductRepo } from "./product.repo";

const router = Router();

const productRepo = new ProductRepo();
const productService = new ProductService(productRepo);
const productController = new ProductController(productService);

router.get("/", productController.getAllProducts);
router.get("/:productId", productController.getOneProduct);

export default router;
