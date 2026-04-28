import baseLogger from "../../config/logger";
import { ParsedInterval } from "./dashboard.parser";
import { DashboardRepo } from "./dashboard.repo";
import cacheService from "../../common/services/cache.service";

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

    const roundTime = (date: Date) => {
      const ms = 1000 * 60 * 15; // round to nearest 15 minutes
      return new Date(Math.floor(date.getTime() / ms) * ms).toISOString();
    };

    const cacheKey = `dashboard:stats:${roundTime(interval.from)}:${roundTime(interval.to)}`;

    return cacheService.wrap(cacheKey, 900, async () => {
      // 900s = 15 minutes
      const [
        [currentPeriod, previousPeriod, newUsers],
        salesOverTime,
        categoryDistribution,
        bestSellers,
        orderStatus,
        lowStock,
        customerStats,
        deadStock,
        productStockStats,
      ] = await Promise.all([
        this.repo.getSummaryStats(interval),
        this.repo.getSalesOverTime(interval),
        this.repo.getCategoryDistribution(interval),
        this.repo.getBestSellers(interval),
        this.repo.getOrderStatusDistribution(interval),
        this.repo.getLowStockProducts(),
        this.repo.getCustomerStats(interval),
        this.repo.getDeadStock(),
        this.repo.getProductStockStats(),
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
        customerStats,
        deadStock,
        productStockStats,
      };
    });
  }
}
