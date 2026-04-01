import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { resetDatabase, seedUser, seedCategory } from "../utils/testHelpers";
import { Role } from "@prisma/client";

describe("Category Integration Tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  // ─── POST (Admin) ──────────────────────────────────────────────────────────

  describe("POST /api/v1/admin/categories", () => {
    it("should create a new category when authenticated as admin", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });

      const categoryData = {
        name: "Electronics " + Date.now(),
        slug: "electronics-" + Date.now(),
        isHidden: false,
      };

      const response = await request(app)
        .post("/api/v1/admin/categories")
        .set("Authorization", `Bearer ${token}`)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data.category).toHaveProperty("id");
      expect(response.body.data.category.name).toBe(categoryData.name);
    });

    it("should fail to create a category when authenticated as a regular user", async () => {
      const { token } = await seedUser({ role: Role.USER });

      const response = await request(app)
        .post("/api/v1/admin/categories")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Fail Category", slug: "test-category-fail" });

      expect(response.status).toBe(403);
    });

    it("should fail to create a category when unauthenticated", async () => {
      const response = await request(app)
        .post("/api/v1/admin/categories")
        .send({ name: "Fail Category No Auth", slug: "test-category-no-auth" });

      expect(response.status).toBe(401);
    });
  });

  // ─── GET (Public) ──────────────────────────────────────────────────────────

  describe("GET /api/v1/categories", () => {
    it("should get all categories", async () => {
      const { category } = await seedCategory();

      const response = await request(app).get("/api/v1/categories");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(Array.isArray(response.body.data.categories)).toBe(true);

      const found = response.body.data.categories.find(
        (c: any) => c.id === category.id,
      );
      expect(found).toBeDefined();
    });
  });

  // ─── GET (Admin) ───────────────────────────────────────────────────────────

  describe("GET /api/v1/admin/categories", () => {
    it("should get all categories including hidden fields when authenticated as admin", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });
      await seedCategory();

      const response = await request(app)
        .get("/api/v1/admin/categories")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(Array.isArray(response.body.data.categories)).toBe(true);
      expect(response.body.data.categories[0].isHidden).toBeDefined();
    });
  });

  // ─── GET /:categoryId (Public) ─────────────────────────────────────────────

  describe("GET /api/v1/categories/:categoryId", () => {
    it("should get a single category by id", async () => {
      const { category } = await seedCategory();

      const response = await request(app).get(
        `/api/v1/categories/${category.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.category.id).toBe(category.id);
    });

    it("should return 404 for non-existent category", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const response = await request(app).get(`/api/v1/categories/${fakeId}`);
      expect(response.status).toBe(404);
    });
  });

  // ─── PATCH (Admin) ─────────────────────────────────────────────────────────

  describe("PATCH /api/v1/admin/categories/:categoryId", () => {
    it("should update a category when authenticated as admin", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });
      const { category } = await seedCategory();

      const updateData = { name: "Updated Category " + Date.now() };

      const response = await request(app)
        .patch(`/api/v1/admin/categories/${category.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.category.name).toBe(updateData.name);
    });
  });

  // ─── DELETE (Admin) ────────────────────────────────────────────────────────

  describe("DELETE /api/v1/admin/categories/:categoryId", () => {
    it("should delete a category when authenticated as admin", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });
      const { category } = await seedCategory();

      const response = await request(app)
        .delete(`/api/v1/admin/categories/${category.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);

      // Verify deletion
      const checkResponse = await request(app).get(
        `/api/v1/categories/${category.id}`,
      );
      expect(checkResponse.status).toBe(404);
    });
  });
});
