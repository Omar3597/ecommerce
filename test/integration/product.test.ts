import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { resetDatabase, seedUser, seedCategoryAndProduct } from "../utils/testHelpers";
import { Role } from "@prisma/client";

describe("Product Integration Tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  // ─── GET /products ─────────────────────────────────────────────────────────

  describe("GET /api/v1/products", () => {
    it("should fetch a list of products", async () => {
      await seedCategoryAndProduct({ name: "Product A" });
      await seedCategoryAndProduct({ name: "Product B" });

      const response = await request(app).get("/api/v1/products");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination).toHaveProperty("totalItems");
      expect(response.body.pagination.totalItems).toBeGreaterThanOrEqual(2);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });
  });

  // ─── GET /products/:productId ──────────────────────────────────────────────

  describe("GET /api/v1/products/:productId", () => {
    it("should fetch a specific product by ID", async () => {
      const { product } = await seedCategoryAndProduct({ name: "Seeded Product 1" });

      const response = await request(app).get(
        `/api/v1/products/${product.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.product).toBeDefined();
      expect(response.body.data.product.id).toBe(product.id);
      expect(response.body.data.product.name).toBe("Seeded Product 1");
    });

    it("should fail validation if productId is not a UUID", async () => {
      const response = await request(app).get("/api/v1/products/invalid-id");
      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent UUID", async () => {
      const fakeUuid = "00000000-0000-0000-0000-000000000000";
      const response = await request(app).get(`/api/v1/products/${fakeUuid}`);
      expect(response.status).toBe(404);
    });
  });

  // ─── POST /admin/products ──────────────────────────────────────────────────

  describe("POST /api/v1/admin/products", () => {
    it("should successfully create a new product with ADMIN token", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });
      const { category } = await seedCategoryAndProduct();

      const response = await request(app)
        .post("/api/v1/admin/products")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "New Admin Product",
          summary: "A nice summary",
          description: "A nice description",
          price: 200000,
          stock: 100,
          categoryId: category.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data.product).toBeDefined();
      expect(response.body.data.product.id).toBeDefined();
    });

    it("should fail validation if required fields are missing", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });

      const response = await request(app)
        .post("/api/v1/admin/products")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Missing price and category",
          summary: "A nice summary",
        });

      expect(response.status).toBe(400);
    });

    it("should fail when unauthorized (no token)", async () => {
      const { category } = await seedCategoryAndProduct();

      const response = await request(app).post("/api/v1/admin/products").send({
        name: "Unauthorized Product",
        summary: "A nice summary",
        price: 200000,
        stock: 100,
        categoryId: category.id,
      });

      expect(response.status).toBe(401);
    });

    it("should fail with standard USER token", async () => {
      const { token } = await seedUser({ role: Role.USER });
      const { category } = await seedCategoryAndProduct();

      const response = await request(app)
        .post("/api/v1/admin/products")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "User Product",
          summary: "A nice summary",
          price: 2000,
          stock: 100,
          categoryId: category.id,
        });

      expect(response.status).toBe(403);
    });
  });

  // ─── PATCH /admin/products/:productId ──────────────────────────────────────

  describe("PATCH /api/v1/admin/products/:productId", () => {
    it("should successfully update an existing product with ADMIN token", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });
      const { product } = await seedCategoryAndProduct();

      const response = await request(app)
        .patch(`/api/v1/admin/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ price: 9999, stock: 20 });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.product.price).toBe(9999);
      expect(response.body.data.product.stock).toBe(20);
    });

    it("should fail validation if no fields are provided", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });
      const { product } = await seedCategoryAndProduct();

      const response = await request(app)
        .patch(`/api/v1/admin/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it("should fail with standard USER token", async () => {
      const { token } = await seedUser({ role: Role.USER });
      const { product } = await seedCategoryAndProduct();

      const response = await request(app)
        .patch(`/api/v1/admin/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ price: 8888 });

      expect(response.status).toBe(403);
    });
  });

  // ─── DELETE /admin/products/:productId ─────────────────────────────────────

  describe("DELETE /api/v1/admin/products/:productId", () => {
    it("should successfully delete a product with ADMIN token", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });
      const { product } = await seedCategoryAndProduct();

      const response = await request(app)
        .delete(`/api/v1/admin/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);

      // Verify deletion
      const verifyResponse = await request(app).get(
        `/api/v1/products/${product.id}`,
      );
      expect(verifyResponse.status).toBe(404);
    });

    it("should fail with standard USER token", async () => {
      const { token } = await seedUser({ role: Role.USER });
      const { product } = await seedCategoryAndProduct();

      const response = await request(app)
        .delete(`/api/v1/admin/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });
});
