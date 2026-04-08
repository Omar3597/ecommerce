import express from "express";
import { authorize } from "../../../common/middlewares/authorize";
import { ProductService } from "../../product/product.service";
import { ProductController } from "../../product/product.controller";
import { upload } from "../../../common/middlewares/upload";

const router = express.Router({ mergeParams: true });

const productService = new ProductService();
const productController = new ProductController(productService);

router.get(
  "/",
  authorize("product", "read"),
  productController.getAllProductsAdmin,
);
router.get(
  "/:productId",
  authorize("product", "read"),
  productController.getOneProductAdmin,
);

router.post(
  "/uploads/images",
  authorize("product", "create"),
  upload.array("image"),
  productController.uploadImages,
);

router.delete(
  "/uploads/images/:publicId",
  authorize("product", "update"),
  productController.deleteImage,
);

router.post(
  "/",
  authorize("product", "create"),
  productController.createProduct,
);

router.patch(
  "/:productId",
  authorize("product", "update"),
  productController.updateProduct,
);

router.delete(
  "/:productId",
  authorize("product", "delete"),
  productController.deleteProduct,
);

export default router;
