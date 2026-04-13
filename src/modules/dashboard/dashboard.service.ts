import baseLogger from "../../config/logger";
import { ParsedInterval } from "./dashboard.parser";
import { DashboardRepo } from "./dashboard.repo";

export class DashboardService {
  private logger = baseLogger.child({ module: "dashboard" });

  constructor(private readonly repo: DashboardRepo = new DashboardRepo()) {}

  async getStats(
    interval: ParsedInterval,
    context: { userId: string; role: string },
  ) {
    this.logger.info(
      {
        action: "GET_DASHBOARD_STATS",
        userId: context.userId,
        role: context.role,
      },
      "Fetching dashboard stats",
    );

    const [
      [currentPeriod, previousPeriod, newUsers],
      salesOverTime,
      categoryDistribution,
      bestSellers,
      orderStatus,
      lowStock,
    ] = await Promise.all([
      this.repo.getSummaryStats(interval),
      this.repo.getSalesOverTime(interval),
      this.repo.getCategoryDistribution(interval),
      this.repo.getBestSellers(interval),
      this.repo.getOrderStatusDistribution(interval),
      this.repo.getLowStockProducts(),
    ]);

    return {
      currentPeriod,
      previousPeriod,
      newUsers,
      salesOverTime,
      categoryDistribution,
      bestSellers,
      orderStatus,
      lowStock,
    };
  }
}
