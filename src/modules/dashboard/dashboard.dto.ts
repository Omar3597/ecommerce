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
  revenue: number;
};

type RawCustomerStats = {
  current: { total_count: number; repeat_count: number };
  previous: { total_count: number; repeat_count: number };
};

type RawDeadStockRow = {
  id: string;
  name: string;
  stock: number;
  price: number;
  daysWithoutSales: number;
};

type RawLowStockProduct = {
  id: string;
  name: string;
  stock: number;
  price: number;
};

type RawStatsData = {
  currentPeriod: RawPeriodAggregate;
  previousPeriod: RawPeriodAggregate;
  newUsers: number;
  salesOverTime: RawSalesRow[];
  categoryDistribution: RawCategoryRow[];
  bestSellers: RawBestSellerRow[];
  orderStatus: RawOrderStatusRow[];
  lowStock: RawLowStockProduct[];
  customerStats: RawCustomerStats;
  deadStock: RawDeadStockRow[];
  productStockStats: [number, number];
};

// ─── Mappers ─────────────────────────────────────────────────────────────────

function calcGrowth(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10; // one decimal place
}

export function toStatsResponse(raw: RawStatsData) {
  const currentRevenue = raw.currentPeriod._sum.total ?? 0;
  const previousRevenue = raw.previousPeriod._sum.total ?? 0;
  const currentOrders = raw.currentPeriod._count.id;
  const previousOrders = raw.previousPeriod._count.id;
  const avgOrderValue =
    currentOrders > 0 ? Math.round(currentRevenue / currentOrders) : 0;

  const repeatCurrent = raw.customerStats.current.repeat_count;
  const repeatPrevious = raw.customerStats.previous.repeat_count;
  const totalCurrent = raw.customerStats.current.total_count;
  const repeatRate =
    totalCurrent > 0 ? Math.round((repeatCurrent / totalCurrent) * 100) : null;
  const repeatGrowth = calcGrowth(repeatCurrent, repeatPrevious);

  const topCategory = raw.categoryDistribution[0]?.category || null;
  const topProduct = raw.bestSellers[0]?.name || null;
  const bestDayRow = raw.salesOverTime.reduce(
    (max, curr) => (curr.revenue > max.revenue ? curr : max),
    raw.salesOverTime[0] || null,
  );
  const bestDay = bestDayRow
    ? bestDayRow.period.toISOString().split("T")[0]
    : null;

  const totalProducts = raw.productStockStats[0];
  const outOfStockProducts = raw.productStockStats[1];
  const outOfStockRate =
    totalProducts > 0
      ? Math.round((outOfStockProducts / totalProducts) * 100 * 10) / 10 // one decimal place
      : null;

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
      repeatCustomers: {
        current: repeatCurrent,
        previous: repeatPrevious,
        rate: repeatRate,
        growth: repeatGrowth,
        isReliable: repeatCurrent >= 10 && repeatPrevious >= 10, // at least 10 repeat customers in both periods for reliability
      },
      highlights: {
        topCategory,
        topProduct,
        bestDay,
      },
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
        revenue: row.revenue,
      })),
    },
    alerts: {
      outOfStockRate,
      lowStock: raw.lowStock,
      deadStock: raw.deadStock,
    },
  };
}
