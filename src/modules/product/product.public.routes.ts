import { Router } from "express";
import { ProductController } from "./product.controller";
import { ProductService } from "./product.service";
import { ProductRepo } from "./product.repo";

const publicProductRouter = Router();

const productRepo = new ProductRepo();
const productService = new ProductService(productRepo);
const productController = new ProductController(productService);

publicProductRouter.get("/", productController.getAllProducts);
publicProductRouter.get("/:productId", productController.getOneProduct);

export default publicProductRouter;
