import { Router } from "express";
import { adminProductRouter } from "../modules/product";
import { adminCategoryRouter } from "../modules/category";
import { adminDashboardRouter } from "../modules/dashboard";
import { adminLimiter } from "../middlewares/rateLimit";

const adminRouter = Router();

adminRouter.use("/products", adminLimiter, adminProductRouter);
adminRouter.use("/categories", adminLimiter, adminCategoryRouter);
adminRouter.use("/dashboard", adminLimiter, adminDashboardRouter);

export default adminRouter;
