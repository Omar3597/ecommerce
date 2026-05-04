import { Router } from "express";
import { authorize } from "../../../middlewares/authorize";
import { ProductService } from "../services/product.service";
import { ProductController } from "../controllers/product.controller";
import { upload } from "../../../middlewares/upload";
import { ProductRepo } from "../repositories/product.repo";
import { cacheAdapter } from "../../../infra/cache";

const adminProductRouter = Router();
const productRepo = new ProductRepo();
const productService = new ProductService(productRepo, cacheAdapter);
const productController = new ProductController(productService);

adminProductRouter.get(
  "/",
  authorize("product", "read"),
  productController.getAllProductsAdmin,
);

adminProductRouter.get(
  "/:productId",
  authorize("product", "read"),
  productController.getOneProductAdmin,
);

adminProductRouter.post(
  "/uploads/images",
  authorize("product", "create"),
  upload.array("image"),
  productController.uploadImages,
);

adminProductRouter.delete(
  "/uploads/images/:publicId",
  authorize("product", "update"),
  productController.deleteImage,
);

adminProductRouter.post(
  "/",
  authorize("product", "create"),
  productController.createProduct,
);

adminProductRouter.patch(
  "/:productId",
  authorize("product", "update"),
  productController.updateProduct,
);

adminProductRouter.delete(
  "/:productId",
  authorize("product", "delete"),
  productController.deleteProduct,
);

export default adminProductRouter;
