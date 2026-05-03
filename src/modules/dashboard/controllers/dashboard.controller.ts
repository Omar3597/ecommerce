import { Response } from "express";
import { catchAsync } from "../../../middlewares/catchAsync";
import { statsQuerySchema } from "../validators/dashboard.validator";
import { parseInterval } from "../utils/dashboard.parser";
import { DashboardService } from "../services/dashboard.service";
import { AuthRequest } from "../../../shared/types/auth.types";
import { toStatsResponse } from "../dtos/dashboard.dto";

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  public getStats = catchAsync(async (req: AuthRequest, res: Response) => {
    const { query } = statsQuerySchema.parse({ query: req.query });

    const interval = parseInterval(query);

    const data = await this.dashboardService.getStats(interval, {
      userId: req.user.id,
      role: req.user.role,
    });

    res.status(200).json({ status: "success", data: toStatsResponse(data) });
  });
}
