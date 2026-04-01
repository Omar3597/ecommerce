import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import {
  resetDatabase,
  seedUser,
  seedCategoryAndProduct,
  seedCartWithItem,
} from "../utils/testHelpers";

describe("Cart Integration Tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  // ─── POST /cart ────────────────────────────────────────────────────────────

  describe("POST /api/v1/cart", () => {
    it("should successfully add a product to the cart", async () => {
      const { token } = await seedUser();
      const { product } = await seedCategoryAndProduct();

      const response = await request(app)
        .post("/api/v1/cart")
        .set("Authorization", `Bearer ${token}`)
        .send({ productId: product.id });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data.cartItem).toHaveProperty("id");
      expect(response.body.data.cartItem.productId).toBe(product.id);
    });

    it("should return 404 for a non-existent product", async () => {
      const { token } = await seedUser();
      const fakeUUID = "00000000-0000-0000-0000-000000000000";

      const response = await request(app)
        .post("/api/v1/cart")
        .set("Authorization", `Bearer ${token}`)
        .send({ productId: fakeUUID });

      expect(response.status).toBe(404);
    });

    it("should fail when unauthorized", async () => {
      const { product } = await seedCategoryAndProduct();

      const response = await request(app)
        .post("/api/v1/cart")
        .send({ productId: product.id });

      expect(response.status).toBe(401);
    });
  });

  // ─── GET /cart ─────────────────────────────────────────────────────────────

  describe("GET /api/v1/cart", () => {
    it("should return an empty cart when no items are added", async () => {
      const { token } = await seedUser();

      const response = await request(app)
        .get("/api/v1/cart")
        .set("Authorization", `Bearer ${token}`);

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.status).toBe("success");
      }
    });

    it("should return the cart populated with added items", async () => {
      const { user, token } = await seedUser();
      const { product } = await seedCategoryAndProduct();
      const { cartItem } = await seedCartWithItem(user.id, product.id, 2);

      const response = await request(app)
        .get("/api/v1/cart")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.items).toBeDefined();
      expect(response.body.data.items.length).toBe(1);

      const fetchedItem = response.body.data.items[0];
      expect(fetchedItem.id).toBe(cartItem.id);
      expect(fetchedItem.quantity).toBe(2);
    });

    it("should fail if unauthorized", async () => {
      const response = await request(app).get("/api/v1/cart");
      expect(response.status).toBe(401);
    });
  });

  // ─── PATCH /cart/:itemId ───────────────────────────────────────────────────

  describe("PATCH /api/v1/cart/:itemId", () => {
    it("should successfully update item quantity", async () => {
      const { user, token } = await seedUser();
      const { product } = await seedCategoryAndProduct();
      const { cartItem } = await seedCartWithItem(user.id, product.id, 1);

      const response = await request(app)
        .patch(`/api/v1/cart/${cartItem.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ quantity: 3 });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.item).toHaveProperty("quantity");
      expect(response.body.data.item.quantity).toBe(3);
    });

    it("should fail validation if quantity is 0 or negative", async () => {
      const { user, token } = await seedUser();
      const { product } = await seedCategoryAndProduct();
      const { cartItem } = await seedCartWithItem(user.id, product.id, 1);

      const response = await request(app)
        .patch(`/api/v1/cart/${cartItem.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ quantity: 0 });

      expect(response.status).toBe(400);
    });

    it("should fail when unauthorized", async () => {
      const { user } = await seedUser();
      const { product } = await seedCategoryAndProduct();
      const { cartItem } = await seedCartWithItem(user.id, product.id, 1);

      const response = await request(app)
        .patch(`/api/v1/cart/${cartItem.id}`)
        .send({ quantity: 2 });

      expect(response.status).toBe(401);
    });
  });

  // ─── DELETE /cart/:itemId ──────────────────────────────────────────────────

  describe("DELETE /api/v1/cart/:itemId", () => {
    it("should successfully remove the specific item from the cart", async () => {
      const { user, token } = await seedUser();
      const { product } = await seedCategoryAndProduct();
      const { cartItem } = await seedCartWithItem(user.id, product.id, 1);

      const response = await request(app)
        .delete(`/api/v1/cart/${cartItem.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);

      // Verify deletion
      const verifyResponse = await request(app)
        .get("/api/v1/cart")
        .set("Authorization", `Bearer ${token}`);

      const items = verifyResponse.body.data?.items || [];
      const stillExists = items.some((i: any) => i.id === cartItem.id);
      expect(stillExists).toBe(false);
    });

    it("should fail when unauthorized", async () => {
      const { user } = await seedUser();
      const { product } = await seedCategoryAndProduct();
      const { cartItem } = await seedCartWithItem(user.id, product.id, 1);

      const response = await request(app).delete(`/api/v1/cart/${cartItem.id}`);
      expect(response.status).toBe(401);
    });
  });

  // ─── DELETE /cart (clear all) ──────────────────────────────────────────────

  describe("DELETE /api/v1/cart", () => {
    it("should successfully clear the entire cart", async () => {
      const { user, token } = await seedUser();
      const { product: p1 } = await seedCategoryAndProduct({ name: "P1" });
      const { product: p2 } = await seedCategoryAndProduct({ name: "P2" });

      // Seed the first item via Prisma
      await seedCartWithItem(user.id, p1.id, 1);

      // Add second item via API (reuses existing cart)
      await request(app)
        .post("/api/v1/cart")
        .set("Authorization", `Bearer ${token}`)
        .send({ productId: p2.id });

      const response = await request(app)
        .delete("/api/v1/cart")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);

      const verifyResponse = await request(app)
        .get("/api/v1/cart")
        .set("Authorization", `Bearer ${token}`);

      expect(verifyResponse.body.data?.items?.length || 0).toBe(0);
    });

    it("should fail when unauthorized", async () => {
      const response = await request(app).delete("/api/v1/cart");
      expect(response.status).toBe(401);
    });
  });
});
