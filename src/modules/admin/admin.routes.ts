import express from "express";
import adminProductRouter from "./routes/admin.product.routes";
import adminCategoryRouter from "./routes/admin.category.routes";

const router = express.Router();

router.use("/products", adminProductRouter);
router.use("/categories", adminCategoryRouter);

export default router;
