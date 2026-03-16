import { Router } from "express";
import { PaymentController } from "./payment.controller";
import { PaymentRepo } from "./payment.repo";
import { PaymentService } from "./payment.service";

const router = Router({ mergeParams: true });

const paymentRepo = new PaymentRepo();
const paymentService = new PaymentService(paymentRepo);
const paymentController = new PaymentController(paymentService);

router.post("/", paymentController.createPaymentSession);

export const paymentWebhookHandler = paymentController.handleStripeWebhook;

export default router;
