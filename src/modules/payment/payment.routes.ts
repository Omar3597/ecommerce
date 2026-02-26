import { Router } from "express";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";

const router = Router({ mergeParams: true });

const paymentService = new PaymentService();
const paymentController = new PaymentController(paymentService);

router.post("/", paymentController.createPaymentSession);

export const paymentWebhookHandler = paymentController.handleStripeWebhook;

export default router;
