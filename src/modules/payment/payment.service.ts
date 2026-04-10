import AppError from "../../common/utils/appError";
import { getConfig } from "../../config/env";
import Stripe from "stripe";
import { PaymentRepo } from "./payment.repo";
import baseLogger from "../../config/logger";
import { log } from "node:console";

const config = getConfig();
const stripe = new Stripe(config.STRIPE_SECRET_KEY);

export class PaymentService {
  private logger = baseLogger.child({ module: "payment" });

  constructor(private readonly paymentRepo: PaymentRepo = new PaymentRepo()) {}

  async createCheckoutSessionForOrder(userId: string, orderId: string) {
    const order = await this.getPendingOrderOrThrow(userId, orderId);
    const lineItems = this.buildStripeLineItems(order);

    const { STRIPE_SUCCESS_URL, STRIPE_CANCEL_URL } = config;

    const session = await this.createCheckoutSession({
      orderId: order.id,
      userId,
      successUrl: STRIPE_SUCCESS_URL,
      cancelUrl: STRIPE_CANCEL_URL,
      lineItems,
    });

    if (!session.id) {
      throw new AppError(502, "Stripe session ID is missing");
    }

    await this.paymentRepo.updateOrderTransactionId(order.id, session.id);

    this.logger.info(
      {
        action: "PAYMENT_SESSION_CREATED",
        service: "stripe",
        sessionId: session.id,
        orderId: order.id,
        userId,
      },
      "Payment session created",
    );

    return session.id;
  }

  constructWebhookEvent(payload: Buffer, signature: string) {
    try {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        config.STRIPE_WEBHOOK_SECRET,
      );
    } catch {
      this.logger.warn("Invalid Stripe webhook signature");
      throw new AppError(400, "Invalid Stripe webhook signature");
    }
  }

  async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.markOrderAsPaid(session);

        this.logger.info(
          {
            action: "PAYMENT_SUCCESS",
            service: "stripe",
            eventId: event.id,
            sessionId: session.id,
            orderId: session.metadata?.orderId,
            userId: session.metadata?.userId,
          },
          "Payment successful",
        );
        break;
      }
      default:
        break;
    }
  }

  private async getPendingOrderOrThrow(userId: string, orderId: string) {
    const order = await this.paymentRepo.findOrderForPayment(orderId, userId);

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    if (order.status !== "PENDING") {
      throw new AppError(400, "Only pending orders can be paid");
    }

    if (order.items.length === 0) {
      throw new AppError(400, "Order has no items");
    }

    return order;
  }

  private buildStripeLineItems(order: {
    shippingFee: number;
    items: {
      quantity: number;
      productSnapshot: { price: number; name: string };
    }[];
  }): Stripe.Checkout.SessionCreateParams.LineItem[] {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      order.items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.productSnapshot.name,
          },
          unit_amount: item.productSnapshot.price,
        },
        quantity: item.quantity,
      }));

    const shippingFeeAmount = order.shippingFee;
    if (shippingFeeAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Shipping Fee",
          },
          unit_amount: shippingFeeAmount,
        },
        quantity: 1,
      });
    }

    return lineItems;
  }

  private async createCheckoutSession({
    orderId,
    userId,
    successUrl,
    cancelUrl,
    lineItems,
    context,
  }: {
    orderId: string;
    userId: string;
    successUrl: string;
    cancelUrl: string;
    lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
    context?: { requestId?: string };
  }) {
    const start = performance.now();
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: orderId,
        metadata: {
          orderId,
          userId,
        },
        line_items: lineItems,
      });

      this.logger.info(
        {
          action: "THIRD_PARTY_CALL",
          service: "stripe",
          duration: performance.now() - start,
          requestId: context?.requestId,
          userId,
        },
        "Third-party success",
      );

      return session;
    } catch (err) {
      this.logger.error(
        {
          action: "THIRD_PARTY_CALL_FAILED",
          service: "stripe",
          duration: performance.now() - start,
          requestId: context?.requestId,
          userId,
          err,
        },
        "Third-party failed",
      );

      if (err instanceof Stripe.errors.StripeError && err.message) {
        throw new AppError(502, err.message);
      }
      throw new AppError(502, "Failed to create Stripe payment session");
    }
  }

  private async markOrderAsPaid(session: Stripe.Checkout.Session) {
    if (session.payment_status !== "paid") {
      return;
    }

    const orderIdFromMeta = session.metadata?.orderId;
    const orderId =
      typeof orderIdFromMeta === "string" && orderIdFromMeta.length > 0
        ? orderIdFromMeta
        : null;

    await this.paymentRepo.markOrderAsPaidBySessionId(session.id, orderId);
  }
}
