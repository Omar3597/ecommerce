import { Request, Response } from "express";
import { catchAsync } from "../../../common/middlewares/catchAsync";
import { statsQuerySchema } from "../validators/dashboard.validator";
import { parseInterval } from "../utils/dashboard.parser";
import { DashboardService } from "../services/dashboard.service";
import { assertAuth } from "../../../common/guards/assert-auth";
import { toStatsResponse } from "../dtos/dashboard.dto";

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  public getStats = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

    const { query } = statsQuerySchema.parse({ query: req.query });

    const interval = parseInterval(query);

    const data = await this.dashboardService.getStats(interval, {
      userId: req.user.id,
      role: req.user.role,
    });

    res.status(200).json({ status: "success", data: toStatsResponse(data) });
  });
}
