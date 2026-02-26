import AppError from "../../common/utils/appError";
import { getConfig } from "../../config/env";
import { prisma } from "../../lib/prisma";
import Stripe from "stripe";

const config = getConfig();
const stripe = new Stripe(config.stripeSecret);

export class PaymentService {
  async createCheckoutSessionForOrder(userId: string, orderId: string) {
    const order = await this.getPendingOrderOrThrow(userId, orderId);
    const lineItems = this.buildStripeLineItems(order);

    const { successUrl, cancelUrl } = config;

    const session = await this.createCheckoutSession({
      orderId: order.id,
      userId,
      successUrl,
      cancelUrl,
      lineItems,
    });

    if (!session.id) {
      throw new AppError(502, "Stripe session ID is missing");
    }

    await this.updateOrderTransactionId(order.id, session.id);

    return session.id;
  }

  constructWebhookEvent(payload: Buffer, signature: string) {
    try {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripeWebhookSecret,
      );
    } catch {
      throw new AppError(400, "Invalid Stripe webhook signature");
    }
  }

  async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.markOrderAsPaid(session);
        break;
      }
      default:
        break;
    }
  }

  private async getPendingOrderOrThrow(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      select: {
        id: true,
        status: true,
        shippingFee: true,
        items: {
          select: {
            quantity: true,
            priceSnapshot: true,
            nameSnapshot: true,
          },
          orderBy: { id: "asc" },
        },
      },
    });

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
    items: { quantity: number; priceSnapshot: number; nameSnapshot: string }[];
  }): Stripe.Checkout.SessionCreateParams.LineItem[] {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      order.items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.nameSnapshot,
          },
          unit_amount: item.priceSnapshot,
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
  }: {
    orderId: string;
    userId: string;
    successUrl: string;
    cancelUrl: string;
    lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  }) {
    try {
      return await stripe.checkout.sessions.create({
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
    } catch (err) {
      if (err instanceof Stripe.errors.StripeError && err.message) {
        throw new AppError(502, err.message);
      }
      throw new AppError(502, "Failed to create Stripe payment session");
    }
  }

  private async updateOrderTransactionId(
    orderId: string,
    transactionId: string,
  ) {
    await prisma.order.update({
      where: { id: orderId },
      data: { transactionId },
    });
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

    const where: Record<string, string> = {
      status: "PENDING",
      transactionId: session.id,
    };

    if (orderId) {
      where.id = orderId;
    }

    await prisma.order.updateMany({
      where,
      data: {
        status: "PAID",
        transactionId: session.id,
      },
    });
  }
}
