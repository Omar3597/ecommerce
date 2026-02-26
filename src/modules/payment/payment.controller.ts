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
}
