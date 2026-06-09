import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { resetDatabase, seedUser } from "../utils/testHelpers";

describe("User Integration Tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  // ─── GET /users/me ─────────────────────────────────────────────────────────

  describe("GET /api/v1/users/me", () => {
    it("should successfully return the authenticated user's profile", async () => {
      const { user, token } = await seedUser({ name: "Test User Me" });

      const response = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.id).toBe(user.id);
      expect(response.body.data.user.name).toBe("Test User Me");
    });

    it("should reject the request if the token is missing", async () => {
      const response = await request(app).get("/api/v1/users/me");
      expect(response.status).toBe(401);
    });

    it("should handle unverified user appropriately", async () => {
      const { token } = await seedUser({ isVerified: false });

      const response = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
    });
  });

  // ─── PATCH /users/me/profile ───────────────────────────────────────────────

  describe("PATCH /api/v1/users/me/profile", () => {
    it("should update user profile successfully", async () => {
      const { token } = await seedUser();

      const response = await request(app)
        .patch("/api/v1/users/me/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Test User Me" });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.user.name).toBe("Updated Test User Me");
    });

    it("should fail validation if name is too short", async () => {
      const { token } = await seedUser();

      const response = await request(app)
        .patch("/api/v1/users/me/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "A" });

      expect(response.status).toBe(400);
    });

    it("should fail when unauthorized", async () => {
      const response = await request(app)
        .patch("/api/v1/users/me/profile")
        .send({ name: "Hacker" });

      expect(response.status).toBe(401);
    });
  });

  // ─── PATCH /users/me/password ──────────────────────────────────────────────

  describe("PATCH /api/v1/users/me/password", () => {
    it("should successfully change the password", async () => {
      const { token, password } = await seedUser();
      const newPasswordStr = "StrongPassword234!";

      const response = await request(app)
        .patch("/api/v1/users/me/password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: password,
          newPassword: newPasswordStr,
          newPasswordConfirm: newPasswordStr,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });

    it("should fail validation if current and new password are the same", async () => {
      const { token, password } = await seedUser();

      const response = await request(app)
        .patch("/api/v1/users/me/password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: password,
          newPassword: password,
          newPasswordConfirm: password,
        });

      expect(response.status).toBe(400);
    });

    it("should fail if passwords do not match", async () => {
      const { token, password } = await seedUser();

      const response = await request(app)
        .patch("/api/v1/users/me/password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: password,
          newPassword: "StrongPassword234!",
          newPasswordConfirm: "StrongPassword999!",
        });

      expect(response.status).toBe(400);
    });

    it("should fail if current password is incorrect", async () => {
      const { token } = await seedUser();

      const response = await request(app)
        .patch("/api/v1/users/me/password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "WrongPassword123!",
          newPassword: "StrongPassword234!",
          newPasswordConfirm: "StrongPassword234!",
        });

      expect(response.status).toBe(401);
    });
  });
});

