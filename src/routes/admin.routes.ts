import { Router } from "express";
import { adminProductRouter } from "../modules/product";
import { adminCategoryRouter } from "../modules/category";
import { adminDashboardRouter } from "../modules/dashboard";

const adminRouter = Router();

adminRouter.use("/products", adminProductRouter);
adminRouter.use("/categories", adminCategoryRouter);
adminRouter.use("/dashboard", adminDashboardRouter);

export default adminRouter;
