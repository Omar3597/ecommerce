import { Router } from "express";
import { authorize } from "../../../common/middlewares/authorize";
import { DashboardService } from "../services/dashboard.service";
import { DashboardController } from "../controllers/dashboard.controller";

const dashboardRouter = Router();

const dashboardService = new DashboardService();
const dashboardController = new DashboardController(dashboardService);

dashboardRouter.get(
  "/stats",
  authorize("dashboard", "read"),
  dashboardController.getStats,
);

export default dashboardRouter;
