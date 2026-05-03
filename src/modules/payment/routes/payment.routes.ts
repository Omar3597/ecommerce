import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { PaymentRepo } from "../repositories/payment.repo";
import { PaymentService } from "../services/payment.service";

const paymentRouter = Router({ mergeParams: true });

const paymentRepo = new PaymentRepo();
const paymentService = new PaymentService(paymentRepo);
const paymentController = new PaymentController(paymentService);

paymentRouter.post("/", paymentController.createPaymentSession);

export const paymentWebhookHandler = paymentController.handleStripeWebhook;

export default paymentRouter;
