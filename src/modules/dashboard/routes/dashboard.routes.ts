import { Router } from "express";
import { authorize } from "../../../middlewares/authorize";
import { DashboardRepo } from "../repositories/dashboard.repo";
import { DashboardService } from "../services/dashboard.service";
import { DashboardController } from "../controllers/dashboard.controller";
import { cacheAdapter } from "../../../infra/cache";

const dashboardRouter = Router();

const dashboadRepo = new DashboardRepo();
const dashboardService = new DashboardService(dashboadRepo, cacheAdapter);
const dashboardController = new DashboardController(dashboardService);

dashboardRouter.get(
  "/stats",
  authorize("dashboard", "read"),
  dashboardController.getStats,
);

export default dashboardRouter;
