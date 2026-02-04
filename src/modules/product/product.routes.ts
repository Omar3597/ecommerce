import { Router } from "express";
import { ProductController } from "./product.controller";
import { ProductService } from "./product.service";
import { protect } from "../../common/middlewares/protect";

const router = Router();

const productService = new ProductService();
const productController = new ProductController(productService);

router.get("/", productController.getAllProducts);
router.get("/:id", protect, productController.getOneProduct);

export default router;
