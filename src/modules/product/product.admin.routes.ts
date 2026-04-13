import { Router } from "express";
import { authorize } from "../../common/middlewares/authorize";
import { ProductService } from "./product.service";
import { ProductController } from "./product.controller";
import { upload } from "../../common/middlewares/upload";

const adminProductRouter = Router();

const productService = new ProductService();
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
