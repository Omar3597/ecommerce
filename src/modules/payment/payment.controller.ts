import { Request, Response } from "express";
import { assertAuth } from "../../common/guards/assert-auth";
import { catchAsync } from "../../common/middlewares/catchAsync";
import { createPaymentSessionSchema } from "./payment.validator";
import type { CreatePaymentSessionInput } from "./payment.validator";
import { PaymentService } from "./payment.service";

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  public createPaymentSession = catchAsync(
    async (req: Request, res: Response) => {
      assertAuth(req);

      const validatedData: CreatePaymentSessionInput =
        createPaymentSessionSchema.parse(req);
      const { orderId } = validatedData.params;

      const sessionId = await this.paymentService.createCheckoutSessionForOrder(
        req.user.id,
        orderId,
      );

      res.status(200).json({
        status: "success",
        data: { sessionId },
      });
    },
  );

  public handleStripeWebhook = catchAsync(
    async (req: Request, res: Response) => {
      const signature = req.headers["stripe-signature"];

      if (typeof signature !== "string") {
        throw new Error("Missing stripe-signature header");
      }

      if (!Buffer.isBuffer(req.body)) {
        throw new Error("Invalid webhook payload");
      }

      const event = this.paymentService.constructWebhookEvent(
        req.body,
        signature,
      );

      await this.paymentService.handleWebhookEvent(event);

      res.status(200).json({ received: true });
    },
  );
}
