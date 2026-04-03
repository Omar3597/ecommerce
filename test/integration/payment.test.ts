import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import {
  resetDatabase,
  seedUser,
  seedCategoryAndProduct,
  seedAddress,
  seedOrder,
} from "../utils/testHelpers";

// Mock Stripe entirely so we don't hit the real API
vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: "cs_test_mock123",
            payment_status: "unpaid",
          }),
        },
      },
      webhooks: {
        constructEvent: vi.fn().mockImplementation((payload, signature, _secret) => {
          if (signature === "invalid-signature") {
            throw new Error("Invalid Stripe webhook signature");
          }
          // Default valid event
          return {
            type: "checkout.session.completed",
            data: {
              object: {
                id: "cs_test_mock123",
                payment_status: "paid",
                metadata: {
                  orderId: JSON.parse(payload.toString()).data?.object?.metadata?.orderId || "mocked-order-id",
                  userId: "mocked-user-id",
                },
              },
            },
          };
        }),
      },
    })),
  };
});

describe("Payment Integration Tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  /**
   * Seeds a complete order chain for payment testing.
   * Returns user, token, and orderId.
   */
  const seedPaymentPrerequisites = async () => {
    const { user, token } = await seedUser();
    const { address } = await seedAddress(user.id);
    const { product } = await seedCategoryAndProduct({ price: 1000, stock: 5 });

    const { order } = await seedOrder(user.id, address.id, [
      {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        quantity: 1,
      },
    ]);

    return { user, token, order };
  };

  // ─── POST /orders/:orderId/payment ─────────────────────────────────────────

  describe("POST /api/v1/orders/:orderId/payment", () => {
    it("should successfully generate a Stripe checkout session for a pending order", async () => {
      const { token, order } = await seedPaymentPrerequisites();

      const response = await request(app)
        .post(`/api/v1/orders/${order.id}/payment`)
        .set("Authorization", `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.sessionId).toBe("cs_test_mock123");

      // Verify the transactionId was written to the DB
      const dbOrder = await prisma.order.findUnique({ where: { id: order.id } });
      expect(dbOrder?.transactionId).toBe("cs_test_mock123");
    });

    it("should return an error for an order that doesn't exist", async () => {
      const { token } = await seedUser();

      const response = await request(app)
        .post("/api/v1/orders/11111111-1111-1111-1111-111111111111/payment")
        .set("Authorization", `Bearer ${token}`)
        .send();

      expect(response.status).toBe(404);
    });

    it("should fail when unauthorized", async () => {
      const response = await request(app)
        .post("/api/v1/orders/11111111-1111-1111-1111-111111111111/payment")
        .send();

      expect(response.status).toBe(401);
    });
  });

  // ─── POST /payments/webhook ────────────────────────────────────────────────

  describe("POST /api/v1/payments/webhook", () => {
    it("should process a valid Stripe webhook event and update order to PAID", async () => {
      const { order } = await seedPaymentPrerequisites();

      // First, write a transactionId so the webhook handler can match it
      await prisma.order.update({
        where: { id: order.id },
        data: { transactionId: "cs_test_mock123" },
      });

      const payload = {
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_mock123",
            payment_status: "paid",
            metadata: {
              orderId: order.id,
            },
          },
        },
      };

      const payloadBuffer = Buffer.from(JSON.stringify(payload));

      const response = await request(app)
        .post("/api/v1/payments/webhook")
        .set("stripe-signature", "valid-signature")
        .set("Content-Type", "application/json")
        .send(payloadBuffer);

      expect(response.status).toBe(200);

      // Verify DB Order state changed to PAID
      const dbOrder = await prisma.order.findUnique({ where: { id: order.id } });
      expect(dbOrder?.status).toBe("PAID");
    });

    it("should fail gracefully if the Stripe signature is invalid", async () => {
      const payload = Buffer.from(JSON.stringify({ some: "data" }));

      const response = await request(app)
        .post("/api/v1/payments/webhook")
        .set("stripe-signature", "invalid-signature")
        .set("Content-Type", "application/json")
        .send(payload);

      expect(response.status).toBe(400);
    });

    it("should fail if the stripe-signature header is missing", async () => {
      const payload = Buffer.from(JSON.stringify({ some: "data" }));

      const response = await request(app)
        .post("/api/v1/payments/webhook")
        .set("Content-Type", "application/json")
        .send(payload);

      expect([400, 500]).toContain(response.status);
    });
  });
});
