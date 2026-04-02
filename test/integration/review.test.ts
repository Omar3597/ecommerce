import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import {
  resetDatabase,
  seedUser,
  seedCategoryAndProduct,
  seedReview,
  seedOrderForReview,
} from "../utils/testHelpers";

describe("Review Integration Tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  // ─── POST /products/:productId/reviews ─────────────────────────────────────

  describe("POST /api/v1/products/:productId/reviews", () => {
    it("should successfully create a review with a rating and comment", async () => {
      const { token, product } = await seedOrderForReview();

      const response = await request(app)
        .post(`/api/v1/products/${product.id}/reviews`)
        .set("Authorization", `Bearer ${token}`)
        .send({ rating: 4, comment: "This is a fantastic product!" });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data.review).toHaveProperty("id");
      expect(response.body.data.review.rating).toBe(4);
      expect(response.body.data.review.comment).toBe(
        "This is a fantastic product!",
      );
    });

    it("should fail validation if rating is out of bounds", async () => {
      const { token, product } = await seedOrderForReview();

      const response = await request(app)
        .post(`/api/v1/products/${product.id}/reviews`)
        .set("Authorization", `Bearer ${token}`)
        .send({ rating: 6, comment: "Impossible rating" });

      expect(response.status).toBe(400);
    });

    it("should return 401 if unauthenticated", async () => {
      const { product } = await seedOrderForReview();

      const response = await request(app)
        .post(`/api/v1/products/${product.id}/reviews`)
        .send({ rating: 5 });

      expect(response.status).toBe(401);
    });
  });

  // ─── GET /products/:productId/reviews ──────────────────────────────────────

  describe("GET /api/v1/products/:productId/reviews", () => {
    it("should fetch all reviews for a specific product", async () => {
      const { user } = await seedUser();
      const { product } = await seedCategoryAndProduct();
      const { review } = await seedReview(user.id, product.id);

      const response = await request(app).get(
        `/api/v1/products/${product.id}/reviews`,
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(Array.isArray(response.body.data.reviews)).toBe(true);
      expect(response.body.data.reviews.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.reviews[0].id).toBe(review.id);
    });
  });

  // ─── GET /reviews (User's own reviews) ─────────────────────────────────────

  describe("GET /api/v1/reviews", () => {
    it("should fetch all reviews authored by the authenticated user", async () => {
      const { user, token } = await seedUser();
      const { product } = await seedCategoryAndProduct();
      await seedReview(user.id, product.id);

      const response = await request(app)
        .get("/api/v1/reviews")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(Array.isArray(response.body.data.reviews)).toBe(true);
      expect(response.body.data.reviews.length).toBeGreaterThanOrEqual(1);
    });

    it("should return 401 if not authenticated", async () => {
      const response = await request(app).get("/api/v1/reviews");
      expect(response.status).toBe(401);
    });
  });

  // ─── PATCH /reviews/:reviewId ──────────────────────────────────────────────

  describe("PATCH /api/v1/reviews/:reviewId", () => {
    it("should update a review created by the user", async () => {
      const { user, token } = await seedUser();
      const { product } = await seedCategoryAndProduct();
      const { review } = await seedReview(user.id, product.id, { rating: 3 });

      const response = await request(app)
        .patch(`/api/v1/reviews/${review.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ rating: 5 });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.review.rating).toBe(5);
    });

    it("should fail validation if an empty payload is sent", async () => {
      const { user, token } = await seedUser();
      const { product } = await seedCategoryAndProduct();
      const { review } = await seedReview(user.id, product.id);

      const response = await request(app)
        .patch(`/api/v1/reviews/${review.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it("should fail when trying to update another user's review", async () => {
      const { token: token1 } = await seedUser();
      const { user: user2 } = await seedUser();
      const { product } = await seedCategoryAndProduct();
      const { review } = await seedReview(user2.id, product.id);

      const response = await request(app)
        .patch(`/api/v1/reviews/${review.id}`)
        .set("Authorization", `Bearer ${token1}`)
        .send({ rating: 1 });
      expect(response.status).toBe(403);
    });
  });

  // ─── DELETE /reviews/:reviewId ─────────────────────────────────────────────

  describe("DELETE /api/v1/reviews/:reviewId", () => {
    it("should successfully delete the review", async () => {
      const { user, token } = await seedUser();
      const { product } = await seedCategoryAndProduct();
      const { review } = await seedReview(user.id, product.id);

      const response = await request(app)
        .delete(`/api/v1/reviews/${review.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);

      // Verify it no longer exists
      const userReviewsRes = await request(app)
        .get("/api/v1/reviews")
        .set("Authorization", `Bearer ${token}`);

      const found = userReviewsRes.body.data.reviews.find(
        (r: any) => r.id === review.id,
      );
      expect(found).toBeUndefined();
    });

    it("should fail when trying to delete another user's review", async () => {
      const { token: token1 } = await seedUser();
      const { user: user2 } = await seedUser();
      const { product } = await seedCategoryAndProduct();
      const { review } = await seedReview(user2.id, product.id);

      const response = await request(app)
        .delete(`/api/v1/reviews/${review.id}`)
        .set("Authorization", `Bearer ${token1}`);

      expect(response.status).toBe(403);
    });
  });
});
