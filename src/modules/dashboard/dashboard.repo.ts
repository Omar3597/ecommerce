import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ParsedInterval } from "./dashboard.parser";

const LOW_STOCK_THRESHOLD = 10;

const PAID_STATUSES = ["PAID", "SHIPPED", "DELIVERED"] as const;

type RevenueRow = {
  period: Date;
  revenue: number;
  order_count: number;
};

type CategoryRow = {
  category: string;
  count: number;
  revenue: number;
};

type BestSellerRow = {
  id: string;
  name: string;
  price: number;
  total_sold: number;
  revenue: number;
};

type OrderStatusRow = {
  status: string;
  count: number;
  revenue: number;
};

type CustomerStats = { repeat_count: number; total_count: number };

type DeadStockRow = {
  id: string;
  name: string;
  stock: number;
  price: number;
  daysWithoutSales: number;
};

export class DashboardRepo {
  public getSummaryStats(interval: ParsedInterval) {
    const { from, to, previousFrom, previousTo } = interval;

    return prisma.$transaction([
      // current period revenue + orders
      prisma.order.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: {
          status: { in: [...PAID_STATUSES] },
          createdAt: { gte: from, lte: to },
        },
      }),

      // previous period revenue + orders (for growth%)
      prisma.order.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: {
          status: { in: [...PAID_STATUSES] },
          createdAt: { gte: previousFrom, lte: previousTo },
        },
      }),

      // new users in current period
      prisma.user.count({
        where: { createdAt: { gte: from, lte: to }, isVerified: true },
      }),
    ]);
  }

  public getSalesOverTime(interval: ParsedInterval) {
    const { from, to, trunc } = interval;

    return prisma.$queryRaw<RevenueRow[]>(
      Prisma.sql`
        SELECT
          DATE_TRUNC(${trunc}, "createdAt") AS period,
          SUM(total)::int                   AS revenue,
          COUNT(*)::int                     AS order_count
        FROM orders
        WHERE
          status IN (${Prisma.join(PAID_STATUSES)})
          AND "createdAt" >= ${from}
          AND "createdAt" <= ${to}
        GROUP BY 1
        ORDER BY 1
      `,
    );
  }

  public getCategoryDistribution(interval: ParsedInterval) {
    const { from, to } = interval;

    return prisma.$queryRaw<CategoryRow[]>(
      Prisma.sql`
        SELECT
          c.name AS category,
          SUM(oi.quantity)::int AS count,
          SUM(oi.quantity * ops.price)::int AS revenue
        FROM order_items oi
        JOIN ordered_product_snapshot ops ON ops.id = oi."productSnapshotId"
        JOIN products p ON p.id = oi."productId"
        JOIN "Category" c ON c.id = p."categoryId"
        JOIN orders o ON o.id = oi."orderId"
        WHERE
          o.status IN (${Prisma.join(PAID_STATUSES)})
          AND o."createdAt" >= ${from}
          AND o."createdAt" <= ${to}
        GROUP BY c.name
        ORDER BY count DESC
      `,
    );
  }

  public getLowStockProducts() {
    return prisma.product.findMany({
      where: {
        stock: { lte: LOW_STOCK_THRESHOLD },
        isHidden: false,
        category: { isHidden: false },
      },
      select: { id: true, name: true, stock: true, price: true },
      orderBy: { stock: "asc" },
    });
  }

  public getBestSellers(interval: ParsedInterval) {
    const { from, to } = interval;

    return prisma.$queryRaw<BestSellerRow[]>(
      Prisma.sql`
        SELECT
          p.id,
          p.name,
          p.price::int                       AS price,
          SUM(oi.quantity)::int              AS total_sold,
          SUM(oi.quantity * ops.price)::int  AS revenue
        FROM order_items oi
        JOIN ordered_product_snapshot ops ON ops.id = oi."productSnapshotId"
        JOIN products p ON p.id = oi."productId"
        JOIN orders o ON o.id = oi."orderId"
        WHERE
          o.status IN (${Prisma.join(PAID_STATUSES)})
          AND o."createdAt" >= ${from}
          AND o."createdAt" <= ${to}
          AND oi."productId" IS NOT NULL
        GROUP BY p.id, p.name, p.price
        ORDER BY total_sold DESC
        LIMIT 10
      `,
    );
  }

  public getOrderStatusDistribution(interval: ParsedInterval) {
    const { from, to } = interval;

    return prisma.$queryRaw<OrderStatusRow[]>(
      Prisma.sql`
        SELECT
          status,
          COUNT(*)::int AS count,
          COALESCE(SUM(total), 0)::int AS revenue
        FROM orders
        WHERE
          "createdAt" >= ${from}
          AND "createdAt" <= ${to}
        GROUP BY status
        ORDER BY count DESC
      `,
    );
  }

  public async getCustomerStats(interval: ParsedInterval) {
    const { from, to, previousFrom, previousTo } = interval;

    const getStats = async (start: Date, end: Date) => {
      const rows = await prisma.$queryRaw<CustomerStats[]>(Prisma.sql`
        WITH user_orders AS (
          SELECT "userId", COUNT(id) as order_count
          FROM orders
          WHERE status IN (${Prisma.join(PAID_STATUSES)})
            AND "createdAt" >= ${start}
            AND "createdAt" <= ${end}
          GROUP BY "userId"
        )
        SELECT 
          COUNT(*)::int as total_count,
          COUNT(CASE WHEN order_count > 1 THEN 1 END)::int as repeat_count
        FROM user_orders
      `);
      return rows[0] || { repeat_count: 0, total_count: 0 };
    };

    const [current, previous] = await Promise.all([
      getStats(from, to),
      getStats(previousFrom, previousTo),
    ]);

    return { current, previous };
  }

  public getDeadStock() {
    return prisma.$queryRaw<DeadStockRow[]>(
      Prisma.sql`
        SELECT 
          p.id, 
          p.name, 
          p.stock,
          p.price,
          EXTRACT(DAY FROM (NOW() - COALESCE(MAX(o."createdAt"), p."createdAt")))::int AS "daysWithoutSales"
        FROM products p
        LEFT JOIN order_items oi ON oi."productId" = p.id
        LEFT JOIN orders o ON o.id = oi."orderId" AND o.status IN (${Prisma.join(PAID_STATUSES)}) 
        LEFT JOIN "Category" c ON c.id = p."categoryId"
        WHERE p.stock > 0 AND p."isHidden" = false 
        AND c."isHidden" = false
        GROUP BY p.id, p.name, p.stock, p.price, p."createdAt"
        HAVING EXTRACT(DAY FROM (NOW() - COALESCE(MAX(o."createdAt"), p."createdAt"))) >= 30
        ORDER BY "daysWithoutSales" DESC
        LIMIT 10
      `,
    );
  }

  public async getProductStockStats() {
    return prisma.$transaction([
      prisma.product.count({
        where: { isHidden: false, category: { isHidden: false } },
      }),
      prisma.product.count({
        where: { isHidden: false, stock: 0, category: { isHidden: false } },
      }),
    ]);
  }
}
