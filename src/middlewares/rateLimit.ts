import { rateLimit, type Options } from "express-rate-limit";

type LimiterConfig = {
  windowMinutes: number;
  maxRequests: number;
  message: string;
};

function createRateLimiter(config: LimiterConfig) {
  return rateLimit({
    windowMs: config.windowMinutes * 60 * 1000,
    limit: config.maxRequests,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler(req, res, _next, options: Options) {
      res.set("Retry-After", String(options.windowMs / 1000));
      res.status(options.statusCode).json({
        status: "fail",
        message: config.message,
      });
    },
  });
}

/**
 * Tight limiter for credential / identity endpoints:
 * login, register, forgot-password, reset-password, verify-email, refresh.
 * 10 requests per 15 minutes per IP.
 */
export const authLimiter = createRateLimiter({
  windowMinutes: 15,
  maxRequests: 10,
  message: "Too many attempts from this IP, please try again after 15 minutes.",
});

/**
 * Relaxed limiter for public read-only browsing routes:
 * product listing, category listing, product detail, product reviews.
 * 120 requests per minute per IP.
 */
export const browseLimiter = createRateLimiter({
  windowMinutes: 1,
  maxRequests: 120,
  message: "Too many requests, please try again later.",
});

/**
 * General limiter applied to all /api/v1 routes as a baseline.
 * 200 requests per 15 minutes per IP.
 */
export const apiLimiter = createRateLimiter({
  windowMinutes: 15,
  maxRequests: 200,
  message: "Too many requests, please try again later.",
});

/**
 * Standard limiter for authenticated user actions:
 * cart, order reads, review mutations, address CRUD, profile reads.
 * 60 requests per 15 minutes per IP.
 */
export const userLimiter = createRateLimiter({
  windowMinutes: 15,
  maxRequests: 60,
  message: "Too many requests, please try again later.",
});

/**
 * Strict limiter for order creation to prevent fraud and spam.
 * 20 requests per 15 minutes per IP.
 */
export const orderLimiter = createRateLimiter({
  windowMinutes: 15,
  maxRequests: 20,
  message: "Too many order requests, please try again after 15 minutes.",
});

/**
 * Generous limiter for admin panel routes.
 * Already role-gated; this is a safety net against runaway scripts.
 * 300 requests per 15 minutes per IP.
 */
export const adminLimiter = createRateLimiter({
  windowMinutes: 15,
  maxRequests: 300,
  message: "Too many admin requests, please try again later.",
});
