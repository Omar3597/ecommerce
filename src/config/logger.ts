import pino from "pino";
import { AsyncLocalStorage } from "async_hooks";
import { getConfig } from "./env";

const config = getConfig();

export const requestContext = new AsyncLocalStorage<{ requestId: string }>();

const isDevelopment = config.env === "development";

const logger = pino({
  level: config.env === "test" ? "silent" : "info",

  // Securely obscure sensitive data from logs
  redact: {
    paths: [
      "password",
      "*.password",
      "passwordConfirm",
      "token",
      "authorization",
      "req.headers.authorization",
      "req.headers.cookie",
      'res.headers["set-cookie"]',
      "cookie",
      "email",
      "*.email",
      "phone",
      "*.phone",
    ],
    censor: "[REDACTED]",
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  // Automatically append tracking id if within a managed request context
  mixin() {
    const store = requestContext.getStore();
    return store ? { requestId: store.requestId } : {};
  },

  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
    // Remove pid and hostname to reduce noise unless strictly needed
    bindings: () => ({}),
  },

  serializers: {
    err: pino.stdSerializers.err, // proper stack trace serialization
    error: pino.stdSerializers.err,
  },

  // User-friendly logging in development environment
  ...(isDevelopment && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),
});

export default logger;
