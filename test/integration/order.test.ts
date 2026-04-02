import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import {
  resetDatabase,
  seedUser,
  seedCategoryAndProduct,
  seedAddress,
  seedCartWithItem,
} from "../utils/testHelpers";

describe("Order Integration Tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  /**
   * Helper: Seeds the full prerequisite chain needed to create an order via the API.
   * Returns user, token, address, product, cart, and cartItem.
   */
  const seedOrderPrerequisites = async () => {
    const { user, token } = await seedUser();
    const { address } = await seedAddress(user.id);
    const { product } = await seedCategoryAndProduct({ stock: 10, price: 5000 });
    const { cart, cartItem } = await seedCartWithItem(user.id, product.id, 2);
    return { user, token, address, product, cart, cartItem };
  };

  // ─── POST /orders ──────────────────────────────────────────────────────────

  describe("POST /api/v1/orders", () => {
    it("should successfully create an order from the cart", async () => {
      const { token, address } = await seedOrderPrerequisites();

      const response = await request(app)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ addressId: address.id });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data.order).toHaveProperty("id");
      expect(response.body.data.order.status).toBe("PENDING");
    });

    it("should fail validation if addressId is missing or wrong format", async () => {
      const { token } = await seedOrderPrerequisites();

      const response = await request(app)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ addressId: "not-a-uuid" });

      expect(response.status).toBe(400);
    });

    it("should fail if the cart is empty", async () => {
      const { user, token } = await seedUser();
      const { address } = await seedAddress(user.id);

      // No cart or items seeded — cart is empty
      const response = await request(app)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ addressId: address.id });

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/cart/i);
    });

    it("should fail when unauthorized", async () => {
      const response = await request(app)
        .post("/api/v1/orders")
        .send({ addressId: "00000000-0000-0000-0000-000000000000" });

      expect(response.status).toBe(401);
    });
  });

  // ─── GET /orders ───────────────────────────────────────────────────────────

  describe("GET /api/v1/orders", () => {
    it("should fetch all orders for the user", async () => {
      const { token, address } = await seedOrderPrerequisites();

      // Create an order first
      await request(app)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ addressId: address.id });

      const response = await request(app)
        .get("/api/v1/orders")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(Array.isArray(response.body.data.orders)).toBe(true);
      expect(response.body.data.orders.length).toBe(1);
    });

    it("should return empty array if user has no orders", async () => {
      const { token } = await seedUser();

      const response = await request(app)
        .get("/api/v1/orders")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.orders.length).toBe(0);
    });

    it("should fail when unauthorized", async () => {
      const response = await request(app).get("/api/v1/orders");
      expect(response.status).toBe(401);
    });
  });

  // ─── GET /orders/:orderId ──────────────────────────────────────────────────

  describe("GET /api/v1/orders/:orderId", () => {
    it("should fetch a specific order by ID", async () => {
      const { token, address } = await seedOrderPrerequisites();

      const createRes = await request(app)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ addressId: address.id });

      const orderId = createRes.body.data.order.id;

      const response = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.order.id).toBe(orderId);
    });

    it("should fail validation if orderId is not a valid UUID", async () => {
      const { token } = await seedUser();

      const response = await request(app)
        .get("/api/v1/orders/invalid-id")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it("should return 404 for an order that does not exist", async () => {
      const { token } = await seedUser();
      const fakeUuid = "00000000-0000-0000-0000-000000000000";

      const response = await request(app)
        .get(`/api/v1/orders/${fakeUuid}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it("should fail when unauthorized", async () => {
      const response = await request(app).get(
        "/api/v1/orders/00000000-0000-0000-0000-000000000000",
      );
      expect(response.status).toBe(401);
    });
  });
});
