import {Router} from "express";
import adminProductRouter from "../modules/product/product.admin.routes";
import adminCategoryRouter from "../modules/category/category.admin.routes";

const adminRouter = Router();

adminRouter.use("/products", adminProductRouter);
adminRouter.use("/categories", adminCategoryRouter);

export default adminRouter;