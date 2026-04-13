// ─── Raw shapes from repo ────────────────────────────────────────────────────

type RawPeriodAggregate = {
  _sum: { total: number | null };
  _count: { id: number };
};

type RawSalesRow = {
  period: Date;
  revenue: number;
  order_count: number;
};

type RawCategoryRow = {
  category: string;
  count: number;
  revenue: number;
};

type RawBestSellerRow = {
  id: string;
  name: string;
  price: number;
  total_sold: number;
  revenue: number;
};

type RawOrderStatusRow = {
  status: string;
  count: number;
};

type RawLowStockProduct = {
  id: string;
  name: string;
  stock: number;
  price: number;
};

export type RawStatsData = {
  currentPeriod: RawPeriodAggregate;
  previousPeriod: RawPeriodAggregate;
  newUsers: number;
  salesOverTime: RawSalesRow[];
  categoryDistribution: RawCategoryRow[];
  bestSellers: RawBestSellerRow[];
  orderStatus: RawOrderStatusRow[];
  lowStock: RawLowStockProduct[];
};

// ─── Mappers ─────────────────────────────────────────────────────────────────

function calcGrowth(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function toStatsResponse(raw: RawStatsData) {
  const currentRevenue = raw.currentPeriod._sum.total ?? 0;
  const previousRevenue = raw.previousPeriod._sum.total ?? 0;
  const currentOrders = raw.currentPeriod._count.id;
  const previousOrders = raw.previousPeriod._count.id;
  const avgOrderValue =
    currentOrders > 0 ? Math.round(currentRevenue / currentOrders) : 0;

  return {
    summary: {
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        growth: calcGrowth(currentRevenue, previousRevenue),
      },
      orders: {
        current: currentOrders,
        previous: previousOrders,
        growth: calcGrowth(currentOrders, previousOrders),
      },
      avgOrderValue,
      newUsers: raw.newUsers,
    },
    charts: {
      salesOverTime: raw.salesOverTime.map((row) => ({
        date: row.period.toISOString().split("T")[0],
        revenue: row.revenue,
        orderCount: row.order_count,
      })),
      categoryDistribution: raw.categoryDistribution.map((row) => ({
        category: row.category,
        count: row.count,
        revenue: row.revenue,
      })),
      bestSellers: raw.bestSellers.map((row) => ({
        id: row.id,
        name: row.name,
        price: row.price,
        totalSold: row.total_sold,
        revenue: row.revenue,
      })),
      orderStatus: raw.orderStatus.map((row) => ({
        status: row.status,
        count: row.count,
      })),
    },
    alerts: {
      lowStock: raw.lowStock,
    },
  };
}
