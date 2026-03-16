import { prisma } from "../../lib/prisma";

export class PaymentRepo {
  public findOrderForPayment(orderId: string, userId: string) {
    return prisma.order.findFirst({
      where: { id: orderId, userId },
      select: {
        id: true,
        status: true,
        shippingFee: true,
        items: {
          select: {
            quantity: true,
            productSnapshot: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });
  }

  public updateOrderTransactionId(orderId: string, transactionId: string) {
    return prisma.order.update({
      where: { id: orderId },
      data: { transactionId },
    });
  }

  public markOrderAsPaidBySessionId(
    sessionId: string,
    orderId?: string | null,
  ) {
    return prisma.order.updateMany({
      where: {
        status: "PENDING",
        transactionId: sessionId,
        ...(orderId ? { id: orderId } : {}),
      },
      data: {
        status: "PAID",
        transactionId: sessionId,
      },
    });
  }
}
