import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import crypto from "crypto";
import app from "../../src/app";
import { resetDatabase, seedUser } from "../utils/testHelpers";

describe("Auth Integration Tests", () => {
  const standardPassword = "StrongPassword123#";

  beforeEach(async () => {
    await resetDatabase();
  });

  // ─── Register ──────────────────────────────────────────────────────────────

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        name: "Auth New User",
        email: `auth-register@example.com`,
        password: "MySecurePassword123#",
        passwordConfirm: "MySecurePassword123#",
      });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).not.toHaveProperty("password");
    });

    it("should fail validation if password is not strong", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        name: "Weak Password User",
        email: "weak@example.com",
        password: "password123",
        passwordConfirm: "password123",
      });

      expect(response.status).toBe(400);
    });

    it("should fail validation if passwords do not match", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        name: "Mismatched Password User",
        email: "mismatched@example.com",
        password: "MySecurePassword123#",
        passwordConfirm: "NotMatching123!",
      });

      expect(response.status).toBe(400);
    });
  });

  // ─── Login ─────────────────────────────────────────────────────────────────

  describe("POST /api/v1/auth/login", () => {
    it("should login successfully with correct credentials and set cookies", async () => {
      const { user } = await seedUser({ password: standardPassword });

      const response = await request(app).post("/api/v1/auth/login").send({
        email: user.email,
        password: standardPassword,
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.accessToken).toBeDefined();

      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
    });

    it("should fail for missing password", async () => {
      const { user } = await seedUser({ password: standardPassword });
      const response = await request(app).post("/api/v1/auth/login").send({
        email: user.email,
      });

      expect(response.status).toBe(400);
    });

    it("should return 401 for incorrect password", async () => {
      const { user } = await seedUser({ password: standardPassword });
      const response = await request(app).post("/api/v1/auth/login").send({
        email: user.email,
        password: "WrongPassword999$",
      });

      expect(response.status).toBe(401);
    });

    it("should return 401 for non-existent user", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "nobody@example.com",
        password: standardPassword,
      });

      expect(response.status).toBe(401);
    });
  });

  // ─── Logout ────────────────────────────────────────────────────────────────

  describe("POST /api/v1/auth/logout", () => {
    it("should successfully logout the user and clear cookies", async () => {
      const { user, token } = await seedUser({ password: standardPassword });

      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: user.email, password: standardPassword });

      const loginCookies = loginRes.headers["set-cookie"];

      const response = await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${token}`)
        .set("Cookie", loginCookies);

      expect(response.status).toBe(204);

      const cookiesRaw = response.headers["set-cookie"];
      const cookies = Array.isArray(cookiesRaw)
        ? cookiesRaw
        : cookiesRaw
          ? [cookiesRaw]
          : [];
      expect(cookies.length).toBeGreaterThan(0);
      expect(cookies.some((c) => c.includes("refreshToken=;"))).toBe(true);
    });

    it("should block unauthenticated users", async () => {
      const response = await request(app).post("/api/v1/auth/logout");
      expect(response.status).toBe(401);
    });
  });

  // ─── Logout From All Devices ───────────────────────────────────────────────

  describe("POST /api/v1/auth/logout-all", () => {
    it("should successfully logout the user from all devices", async () => {
      const { user, token } = await seedUser({ password: standardPassword });

      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: user.email, password: standardPassword });

      const response = await request(app)
        .post("/api/v1/auth/logout-all")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("should block unauthenticated users", async () => {
      const response = await request(app).post("/api/v1/auth/logout-all");
      expect(response.status).toBe(401);
    });
  });

  // ─── Refresh Token ─────────────────────────────────────────────────────────

  describe("POST /api/v1/auth/refresh", () => {
    it("should return 400 if refreshToken cookie is missing", async () => {
      const response = await request(app).post("/api/v1/auth/refresh");
      expect(response.status).toBe(400);
    });

    it("should return 401 if invalid refreshToken cookie", async () => {
      const fakeToken = crypto.randomBytes(32).toString("hex");
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", `refreshToken=${fakeToken}`);

      expect(response.status).toBe(401);
    });
  });
});
