import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { resetDatabase, seedUser, seedAddress } from "../utils/testHelpers";

describe("Address Integration Tests", () => {
  const baseUrl = "/api/v1/users/me/address";

  beforeEach(async () => {
    await resetDatabase();
  });

  // ─── POST ──────────────────────────────────────────────────────────────────

  describe("POST /api/v1/users/me/address", () => {
    it("should successfully create a new address", async () => {
      const { token } = await seedUser();

      const addressData = {
        fullName: "John Doe",
        phone: "+1234567890",
        city: "Test City",
        street: "123 Test Street",
        building: "Apt 4B",
      };

      const response = await request(app)
        .post(baseUrl)
        .set("Authorization", `Bearer ${token}`)
        .send(addressData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data.address).toHaveProperty("id");
      expect(response.body.data.address.fullName).toBe(addressData.fullName);
      expect(response.body.data.address.phone).toBe(addressData.phone);
    });

    it("should fail validation if required fields are missing", async () => {
      const { token } = await seedUser();

      const response = await request(app)
        .post(baseUrl)
        .set("Authorization", `Bearer ${token}`)
        .send({ fullName: "John" });

      expect(response.status).toBe(400);
    });

    it("should fail validation if phone number is invalid", async () => {
      const { token } = await seedUser();

      const response = await request(app)
        .post(baseUrl)
        .set("Authorization", `Bearer ${token}`)
        .send({
          fullName: "John Doe",
          phone: "123",
          city: "Test City",
          street: "123 Test Street",
        });

      expect(response.status).toBe(400);
    });

    it("should fail when unauthorized", async () => {
      const response = await request(app).post(baseUrl).send({
        fullName: "John Doe",
        phone: "+1234567890",
        city: "Test City",
        street: "123 Test Street",
      });

      expect(response.status).toBe(401);
    });
  });

  // ─── GET all ───────────────────────────────────────────────────────────────

  describe("GET /api/v1/users/me/address", () => {
    it("should get all addresses for the authenticated user", async () => {
      const { user, token } = await seedUser();
      await seedAddress(user.id);

      const response = await request(app)
        .get(baseUrl)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.results).toBe(1);
      expect(response.body.data.addresses[0].id).toBeDefined();
    });

    it("should fail when unauthorized", async () => {
      const response = await request(app).get(baseUrl);
      expect(response.status).toBe(401);
    });
  });

  // ─── GET /:addressId ──────────────────────────────────────────────────────

  describe("GET /api/v1/users/me/address/:addressId", () => {
    it("should get a single address by id", async () => {
      const { user, token } = await seedUser();
      const { address } = await seedAddress(user.id);

      const response = await request(app)
        .get(`${baseUrl}/${address.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.address.id).toBe(address.id);
    });

    it("should fail validation if addressId is not a valid UUID", async () => {
      const { token } = await seedUser();

      const response = await request(app)
        .get(`${baseUrl}/invalid-uuid`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it("should return a 404 error for a non-existent UUID", async () => {
      const { token } = await seedUser();
      const fakeUuid = "00000000-0000-0000-0000-000000000000";

      const response = await request(app)
        .get(`${baseUrl}/${fakeUuid}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it("should fail when unauthorized", async () => {
      const { user } = await seedUser();
      const { address } = await seedAddress(user.id);

      const response = await request(app).get(`${baseUrl}/${address.id}`);
      expect(response.status).toBe(401);
    });
  });

  // ─── PATCH /:addressId ─────────────────────────────────────────────────────

  describe("PATCH /api/v1/users/me/address/:addressId", () => {
    it("should successfully update an address field", async () => {
      const { user, token } = await seedUser();
      const { address } = await seedAddress(user.id);

      const response = await request(app)
        .patch(`${baseUrl}/${address.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ city: "Updated City" });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.address.city).toBe("Updated City");
    });

    it("should fail validation if no fields are provided", async () => {
      const { user, token } = await seedUser();
      const { address } = await seedAddress(user.id);

      const response = await request(app)
        .patch(`${baseUrl}/${address.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it("should fail when unauthorized", async () => {
      const { user } = await seedUser();
      const { address } = await seedAddress(user.id);

      const response = await request(app)
        .patch(`${baseUrl}/${address.id}`)
        .send({ city: "Hacked City" });

      expect(response.status).toBe(401);
    });
  });

  // ─── DELETE /:addressId ────────────────────────────────────────────────────

  describe("DELETE /api/v1/users/me/address/:addressId", () => {
    it("should successfully delete an address", async () => {
      const { user, token } = await seedUser();
      const { address } = await seedAddress(user.id);

      const response = await request(app)
        .delete(`${baseUrl}/${address.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);

      const checkResponse = await request(app)
        .get(baseUrl)
        .set("Authorization", `Bearer ${token}`);

      const addresses = checkResponse.body.data.addresses;
      expect(addresses.find((a: any) => a.id === address.id)).toBeUndefined();
    });

    it("should fail when unauthorized", async () => {
      const { user } = await seedUser();
      const { address } = await seedAddress(user.id);

      const response = await request(app).delete(`${baseUrl}/${address.id}`);
      expect(response.status).toBe(401);
    });
  });
});
