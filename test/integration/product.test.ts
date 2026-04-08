import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import app from "../../src/app";
import {
  resetDatabase,
  seedUser,
  seedCategoryAndProduct,
} from "../utils/testHelpers";
import { Role } from "@prisma/client";
import { StorageService } from "../../src/common/services/cloudinary.service";

vi.mock("../../src/common/services/cloudinary.service", () => ({
  StorageService: {
    bulkUploadImages: vi.fn(),
    deleteImage: vi.fn(),
    bulkDeleteImages: vi.fn(),
  },
}));

describe("Product Integration Tests", () => {
  beforeEach(async () => {
    await resetDatabase();
    vi.clearAllMocks();
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
      expect(response.body.pagination.totalItems).toBe(2);
      expect(Array.isArray(response.body.data.products)).toBe(true);

      const productA = response.body.data.products.find((p: any) => p.name === "Product A");
      expect(productA).toHaveProperty("image");
      expect(productA.image).toBe("https://example.com/default.png");
      expect(productA).not.toHaveProperty("publicId");
    });
  });

  // ─── GET /products/:productId ──────────────────────────────────────────────

  describe("GET /api/v1/products/:productId", () => {
    it("should fetch a specific product by ID", async () => {
      const { product } = await seedCategoryAndProduct({
        name: "Seeded Product 1",
      });

      const response = await request(app).get(`/api/v1/products/${product.id}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.product).toBeDefined();
      expect(response.body.data.product.id).toBe(product.id);
      expect(response.body.data.product.name).toBe("Seeded Product 1");
      expect(response.body.data.product).toHaveProperty("images");
      expect(Array.isArray(response.body.data.product.images)).toBe(true);
      expect(response.body.data.product.images[0]).toHaveProperty("url", "https://example.com/default.png");
      expect(response.body.data.product.images[0]).not.toHaveProperty("publicId");
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

  // ─── GET /admin/products ──────────────────────────────────────────────────

  describe("GET /api/v1/admin/products", () => {
    it("should fetch a list of products including hidden ones for ADMIN", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });
      await seedCategoryAndProduct({
        name: "Visible Product",
        isHidden: false,
      });
      await seedCategoryAndProduct({ name: "Hidden Product", isHidden: true });

      const response = await request(app)
        .get("/api/v1/admin/products")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.pagination.totalItems).toBe(2);
      expect(response.body.data.products[0]).toHaveProperty("isHidden");
    });

    it("should fail for regular USER", async () => {
      const { token } = await seedUser({ role: Role.USER });
      const response = await request(app)
        .get("/api/v1/admin/products")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });

  // ─── GET /admin/products/:productId ───────────────────────────────────────

  describe("GET /api/v1/admin/products/:productId", () => {
    it("should fetch a specific product including isHidden status for ADMIN", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });
      const { product } = await seedCategoryAndProduct({
        name: "Admin Product",
        isHidden: true,
      });

      const response = await request(app)
        .get(`/api/v1/admin/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.product.id).toBe(product.id);
      expect(response.body.data.product).toHaveProperty("isHidden", true);
    });

    it("should fail for regular USER", async () => {
      const { token } = await seedUser({ role: Role.USER });
      const { product } = await seedCategoryAndProduct();

      const response = await request(app)
        .get(`/api/v1/admin/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
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
          images: [
            { url: "https://example.com/img1.jpg", publicId: "img1", sortOrder: 0 },
          ],
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
        images: [{ url: "https://example.com/img2.jpg", publicId: "img2", sortOrder: 0 }],
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
          images: [{ url: "https://example.com/img3.jpg", publicId: "img3", sortOrder: 0 }],
        });

      expect(response.status).toBe(403);
    });
  });

  // ─── POST /admin/products/uploads/images ─────────────────────────────────────

  describe("POST /api/v1/admin/products/uploads/images", () => {
    it("should successfully upload images for ADMIN", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });
      const buffer = Buffer.from("dummy content");

      vi.mocked(StorageService.bulkUploadImages).mockResolvedValue([
        { url: "https://fake.url/img.jpg", publicId: "fake_public_id" }
      ]);

      const response = await request(app)
        .post("/api/v1/admin/products/uploads/images")
        .set("Authorization", `Bearer ${token}`)
        .attach("image", buffer, "test_image.jpg");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.images[0].url).toBe("https://fake.url/img.jpg");
      expect(StorageService.bulkUploadImages).toHaveBeenCalledTimes(1);
    });

    it("should fail for regular USER", async () => {
      const { token } = await seedUser({ role: Role.USER });
      const buffer = Buffer.from("dummy content");

      const response = await request(app)
        .post("/api/v1/admin/products/uploads/images")
        .set("Authorization", `Bearer ${token}`)
        .attach("image", buffer, "test_image.jpg");

      expect(response.status).toBe(403);
    });
  });

  // ─── DELETE /admin/products/uploads/images/:publicId ────────────────────────

  describe("DELETE /api/v1/admin/products/uploads/images/:publicId", () => {
    it("should successfully delete an image for ADMIN", async () => {
      const { token } = await seedUser({ role: Role.ADMIN });

      vi.mocked(StorageService.deleteImage).mockResolvedValue(undefined);

      const response = await request(app)
        .delete("/api/v1/admin/products/uploads/images/fake_public_id")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
      expect(StorageService.deleteImage).toHaveBeenCalledWith("fake_public_id");
    });

    it("should fail for regular USER", async () => {
      const { token } = await seedUser({ role: Role.USER });

      const response = await request(app)
        .delete("/api/v1/admin/products/uploads/images/fake_public_id")
        .set("Authorization", `Bearer ${token}`);

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
      const publicId = product.productImages[0].publicId;

      vi.mocked(StorageService.bulkDeleteImages).mockResolvedValue(undefined);

      const response = await request(app)
        .delete(`/api/v1/admin/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);

      // Verify deletion
      const verifyResponse = await request(app).get(
        `/api/v1/products/${product.id}`,
      );
      expect(verifyResponse.status).toBe(404);

      // Verify third-party deletion was called
      expect(StorageService.bulkDeleteImages).toHaveBeenCalledWith([publicId]);
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
