import express from "express";
import cors from "cors";
import crypto from "crypto";
import pinoHttp from "pino-http";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import logger, { requestContext } from "./config/logger";
import { errHandler } from "./common/errors/errHandler";
import { paymentWebhookHandler } from "./modules/payment/payment.routes";
import rootRouter from "./routes";

const app = express();

const httpLogger = pinoHttp({
  logger,
  customLogLevel: function (req, res, err) {
    return "info";
  },
  customSuccessMessage: function (req, res) {
    return `[HTTP Traffic] ${req.method} ${req.url} - Status: ${res.statusCode}`;
  },
  customErrorMessage: function (req, res, err) {
    return `[HTTP Traffic] ${req.method} ${req.url} - Status: ${res.statusCode}`;
  },
  serializers: {
    req: (req) => {
      return {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        params: req.params,
      };
    },
    res: (res) => {
      return {
        statusCode: res.statusCode,
        headers: res.getHeaders,
      };
    },
  },
});

app.use((req, res, next) => {
  const requestId = crypto.randomUUID();
  req.id = requestId;
  requestContext.run({ requestId }, () => {
    httpLogger(req, res, next);
  });
});

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(cookieParser());

app.post(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentWebhookHandler,
);

app.use(express.json());

app.use(hpp());

app.use("/api/v1", rootRouter);

app.use("*", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `canot find ${req.originalUrl} on server!`,
  });
});

app.use(errHandler);

export default app;
