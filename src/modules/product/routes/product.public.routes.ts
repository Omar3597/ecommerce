import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { ProductService } from "../services/product.service";
import { ProductRepo } from "../repositories/product.repo";
import { cacheAdapter } from "../../../infra/cache";

const publicProductRouter = Router();

const productRepo = new ProductRepo();
const productService = new ProductService(productRepo, cacheAdapter);
const productController = new ProductController(productService);

publicProductRouter.get("/", productController.getAllProducts);
publicProductRouter.get("/:productId", productController.getOneProduct);

export default publicProductRouter;
