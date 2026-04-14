import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import {
  resetDatabase,
  seedUser,
  seedDashboardData,
} from "../utils/testHelpers";
import { Role } from "@prisma/client";

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("Dashboard Integration Tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  // ── 1. Access Control ───────────────────────────────────────────────────────

  describe("GET /api/v1/admin/dashboard/stats — access control", () => {
    it("should return 401 when no token is provided", async () => {
      const res = await request(app)
        .get("/api/v1/admin/dashboard/stats")
        .query({ period: "month" });

      expect(res.status).toBe(401);
    });

    it("should return 403 when a regular USER tries to access the dashboard", async () => {
      const { token } = await seedUser({ role: Role.USER });

      const res = await request(app)
        .get("/api/v1/admin/dashboard/stats")
        .set("Authorization", `Bearer ${token}`)
        .query({ period: "month" });

      expect(res.status).toBe(403);
    });

    it("should allow ADMIN to access the dashboard", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });

      const res = await request(app)
        .get("/api/v1/admin/dashboard/stats")
        .set("Authorization", `Bearer ${token}`)
        .query({ period: "month" });

      expect(res.status).toBe(200);
    });
  });

  // ── 2. Query Validation ─────────────────────────────────────────────────────

  describe("GET /api/v1/admin/dashboard/stats — query validation", () => {
    let adminToken: string;

    beforeEach(async () => {
      ({ token: adminToken } = await seedUser({ role: Role.ADMIN }));
    });

    it("should return 400 when no query params are provided", async () => {
      const res = await request(app)
        .get("/api/v1/admin/dashboard/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 400 for an invalid period preset (e.g. 'quarter')", async () => {
      const res = await request(app)
        .get("/api/v1/admin/dashboard/stats")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ period: "quarter" });

      expect(res.status).toBe(400);
    });

    it("should return 400 for a custom range where startDate is after endDate", async () => {
      const res = await request(app)
        .get("/api/v1/admin/dashboard/stats")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({
          startDate: "2024-12-31",
          endDate: "2024-01-01",
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 for a custom range with a malformed date string", async () => {
      const res = await request(app)
        .get("/api/v1/admin/dashboard/stats")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({
          startDate: "not-a-date",
          endDate: "2024-12-31",
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 when only startDate is provided (missing endDate)", async () => {
      const res = await request(app)
        .get("/api/v1/admin/dashboard/stats")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ startDate: "2024-01-01" });

      expect(res.status).toBe(400);
    });

    it("should accept a valid period preset 'week'", async () => {
      const res = await request(app)
        .get("/api/v1/admin/dashboard/stats")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ period: "week" });

      expect(res.status).toBe(200);
    });

    it("should accept a valid custom date range", async () => {
      const res = await request(app)
        .get("/api/v1/admin/dashboard/stats")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({
          startDate: "2020-01-01",
          endDate: "2030-12-31",
        });

      expect(res.status).toBe(200);
    });
  });

  // ── 3. Stats Response ───────────────────────────────────────────────────────

  describe("GET /api/v1/admin/dashboard/stats — response correctness", () => {
    it("should return correct revenue and order count from seeded paid orders", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });
      const { expectedRevenue } = await seedDashboardData();

      const res = await request(app)
        .get("/api/v1/admin/dashboard/stats")
        .set("Authorization", `Bearer ${token}`)
        .query({ period: "year" });

      expect(res.status).toBe(200);

      const { summary } = res.body.data;
      // 4 paid/shipped/delivered orders
      expect(summary.orders.current).toBe(4);
      // revenue should only include paid statuses
      expect(summary.revenue.current).toBe(expectedRevenue);
    });

    it("should correctly compute avgOrderValue", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });
      const { expectedRevenue } = await seedDashboardData();

      const res = await request(app)
        .get("/api/v1/admin/dashboard/stats")
        .set("Authorization", `Bearer ${token}`)
        .query({ period: "year" });

      const { summary } = res.body.data;
      const expectedAvg = Math.round(expectedRevenue / 4);
      expect(summary.avgOrderValue).toBe(expectedAvg);
    });

    it("should NOT count CANCELLED orders in revenue", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });
      await seedDashboardData();

      const res = await request(app)
        .get("/api/v1/admin/dashboard/stats")
        .set("Authorization", `Bearer ${token}`)
        .query({ period: "year" });

      const { orderStatus } = res.body.data.charts;
      const cancelledEntry = orderStatus.find(
        (s: { status: string }) => s.status === "CANCELLED",
      );

      // cancelled orders must still appear in the status breakdown chart
      expect(cancelledEntry).toBeDefined();
      expect(cancelledEntry.count).toBe(1);

      // but the summary revenue must not include them
      const { summary } = res.body.data;
      // 5 total orders, but only 4 are paid statuses
      expect(summary.orders.current).toBe(4);
    });

    it("should return low-stock products with stock ≤ 10", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });
      const { productA } = await seedDashboardData();

      const res = await request(app)
        .get("/api/v1/admin/dashboard/stats")
        .set("Authorization", `Bearer ${token}`)
        .query({ period: "year" });

      const { lowStock } = res.body.data.alerts;
      expect(Array.isArray(lowStock)).toBe(true);
      const match = lowStock.find((p: { id: string }) => p.id === productA.id);
      expect(match).toBeDefined();
      expect(match.stock).toBeLessThanOrEqual(10);
    });

    it("should return correct category distribution for paid orders", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });
      await seedDashboardData();

      const res = await request(app)
        .get("/api/v1/admin/dashboard/stats")
        .set("Authorization", `Bearer ${token}`)
        .query({ period: "year" });

      const { categoryDistribution } = res.body.data.charts;
      expect(Array.isArray(categoryDistribution)).toBe(true);
      expect(categoryDistribution.length).toBeGreaterThanOrEqual(2);

      const electronics = categoryDistribution.find(
        (c: { category: string }) => c.category === "Electronics",
      );
      const books = categoryDistribution.find(
        (c: { category: string }) => c.category === "Books",
      );

      expect(electronics).toBeDefined();
      expect(books).toBeDefined();

      // Electronics: order1(×1) + order2(×2) + order4(×1) = 4 units
      expect(electronics.count).toBe(4);
      // Books: order1(×2) + order3(×3) = 5 units (order5 is CANCELLED, excluded)
      expect(books.count).toBe(5);
    });

    it("should return bestSellers ordered by totalSold descending", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });
      await seedDashboardData();

      const res = await request(app)
        .get("/api/v1/admin/dashboard/stats")
        .set("Authorization", `Bearer ${token}`)
        .query({ period: "year" });

      const { bestSellers } = res.body.data.charts;
      expect(Array.isArray(bestSellers)).toBe(true);
      expect(bestSellers.length).toBeGreaterThanOrEqual(2);

      // Books sold 5 units, Electronics sold 4 units → Books should be first
      expect(bestSellers[0].name).toBe("TypeScript Handbook");
      expect(bestSellers[0].totalSold).toBe(5);
      expect(bestSellers[1].name).toBe("Laptop");
      expect(bestSellers[1].totalSold).toBe(4);
    });

    it("should identify repeat customers correctly", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });
      await seedDashboardData();

      const res = await request(app)
        .get("/api/v1/admin/dashboard/stats")
        .set("Authorization", `Bearer ${token}`)
        .query({ period: "year" });

      const { repeatCustomers } = res.body.data.summary;
      // user1 placed 3 paid orders → repeat customer
      expect(repeatCustomers.current).toBeGreaterThanOrEqual(1);
    });

    it("should return a valid response structure", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });

      const res = await request(app)
        .get("/api/v1/admin/dashboard/stats")
        .set("Authorization", `Bearer ${token}`)
        .query({ period: "month" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");

      const { data } = res.body;

      // top-level keys
      expect(data).toHaveProperty("summary");
      expect(data).toHaveProperty("charts");
      expect(data).toHaveProperty("alerts");

      // summary shape
      expect(data.summary).toHaveProperty("revenue");
      expect(data.summary).toHaveProperty("orders");
      expect(data.summary).toHaveProperty("avgOrderValue");
      expect(data.summary).toHaveProperty("newUsers");
      expect(data.summary).toHaveProperty("repeatCustomers");
      expect(data.summary).toHaveProperty("highlights");

      // charts shape
      expect(data.charts).toHaveProperty("salesOverTime");
      expect(data.charts).toHaveProperty("categoryDistribution");
      expect(data.charts).toHaveProperty("bestSellers");
      expect(data.charts).toHaveProperty("orderStatus");
      expect(Array.isArray(data.charts.salesOverTime)).toBe(true);

      // alerts shape
      expect(data.alerts).toHaveProperty("outOfStockRate");
      expect(data.alerts).toHaveProperty("lowStock");
      expect(data.alerts).toHaveProperty("deadStock");
      expect(Array.isArray(data.alerts.lowStock)).toBe(true);
      expect(Array.isArray(data.alerts.deadStock)).toBe(true);
    });

    it("should return zero revenue and orders when no data exists for the period", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });
      // Seed data but query a far-future range where no orders exist
      await seedDashboardData();

      const res = await request(app)
        .get("/api/v1/admin/dashboard/stats")
        .set("Authorization", `Bearer ${token}`)
        .query({
          startDate: "2050-01-01",
          endDate: "2050-12-31",
        });

      expect(res.status).toBe(200);
      const { summary } = res.body.data;
      expect(summary.revenue.current).toBe(0);
      expect(summary.orders.current).toBe(0);
      expect(summary.avgOrderValue).toBe(0);
    });
  });
});
