import { Router } from "express";
import { authorize } from "../../common/middlewares/authorize";
import { DashboardService } from "./dashboard.service";
import { DashboardController } from "./dashboard.controller";

const dashboardRouter = Router();

const dashboardService = new DashboardService();
const dashboardController = new DashboardController(dashboardService);

dashboardRouter.get(
  "/stats",
  authorize("dashboard", "read"),
  dashboardController.getStats,
);

export default dashboardRouter;
