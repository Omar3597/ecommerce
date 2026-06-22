import dotenv from "dotenv";

const env = process.env.NODE_ENV || "development";
if (env !== "production") {
  const envFile = env === "development" ? ".env" : `.env.${env}`;
  dotenv.config({ path: envFile });
}

interface IConfig {
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DATABASE_URL: string;
  env: "development" | "production" | "test";
  APP_PORT: number;
  BASE_URL: string;
  JWT_SECRET: string;
  REFRESH_TOKEN_SECRET: string;
  MAX_CART_QUANTITY: number;
  MAX_ACTIVE_SESSIONS: number;

  //cache
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  REDIS_URL: string;

  // Email
  EMAIL_PROVIDER: "brevo" | "mailtrap";
  MAILTRAP_HOST: string;
  MAILTRAP_PORT: number;
  MAILTRAP_USER: string;
  MAILTRAP_PASS: string;
  BREVO_API_KEY: string;
  EMAIL_FROM_NAME: string;
  EMAIL_FROM_ADDRESS: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_SUCCESS_URL: string;
  STRIPE_CANCEL_URL: string;

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
}

export const getConfig = (): IConfig => {
  const NODE_ENV = process.env.NODE_ENV || "development";

  const isValidEnv = (env: string): env is IConfig["env"] => {
    return env === "development" || env === "production" || env === "test";
  };

  if (!isValidEnv(NODE_ENV)) {
    throw new Error(`Invalid NODE_ENV: ${NODE_ENV}`);
  }

  const checkMissingVars = (keys: string[], groupName: string) => {
    const missing = keys.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(
        `Missing ${groupName} environment variables: ${missing.join(", ")}`,
      );
    }
  };

  // 1. Core vars — always required
  checkMissingVars(
    [
      "DATABASE_URL",
      "BASE_URL",
      "JWT_SECRET",
      "REFRESH_TOKEN_SECRET",
      "MAX_CART_QUANTITY",
      "MAX_ACTIVE_SESSIONS",
    ],
    "Core",
  );

  // 2. Third-party and cache vars — required in prod/dev
  if (NODE_ENV !== "test") {
    checkMissingVars(
      [
        "REDIS_HOST",
        "REDIS_PORT",
        "REDIS_PASSWORD",
        "REDIS_URL",
        "EMAIL_PROVIDER",
        "MAILTRAP_HOST",
        "MAILTRAP_PORT",
        "MAILTRAP_USER",
        "MAILTRAP_PASS",
        "BREVO_API_KEY",
        "EMAIL_FROM_NAME",
        "EMAIL_FROM_ADDRESS",
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "STRIPE_SUCCESS_URL",
        "STRIPE_CANCEL_URL",
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET",
      ],
      "Third-Party",
    );
  }

  const { env: processEnv } = process;

  return {
    DB_HOST: processEnv.DB_HOST ?? "localhost",
    DB_PORT: processEnv.DB_PORT ? parseInt(processEnv.DB_PORT, 10) : 5432,
    DB_USER: processEnv.DB_USER ?? "postgres",
    DB_PASSWORD: processEnv.DB_PASSWORD ?? "",
    DB_NAME: processEnv.DB_NAME ?? "ecommerce_db",
    DATABASE_URL: processEnv.DATABASE_URL!,
    env: NODE_ENV,
    APP_PORT: parseInt(processEnv.PORT ?? processEnv.APP_PORT ?? "3000", 10),
    BASE_URL: processEnv.BASE_URL!,
    REDIS_HOST: processEnv.REDIS_HOST ?? "dummy_redis_host",
    REDIS_PORT: processEnv.REDIS_PORT ? parseInt(processEnv.REDIS_PORT, 10) : 0,
    REDIS_PASSWORD: processEnv.REDIS_PASSWORD ?? "dummy_redis_password",
    REDIS_URL: processEnv.REDIS_URL ?? "dummy_redis_url",
    JWT_SECRET: processEnv.JWT_SECRET!,
    REFRESH_TOKEN_SECRET: processEnv.REFRESH_TOKEN_SECRET!,
    MAX_CART_QUANTITY: parseInt(processEnv.MAX_CART_QUANTITY!, 10),
    MAX_ACTIVE_SESSIONS: parseInt(processEnv.MAX_ACTIVE_SESSIONS!, 10),

    // Email with safe defaults for 'test'
    EMAIL_PROVIDER:
      (processEnv.EMAIL_PROVIDER as "brevo" | "mailtrap") ?? "mailtrap",
    MAILTRAP_HOST: processEnv.MAILTRAP_HOST ?? "localhost",
    MAILTRAP_PORT: parseInt(processEnv.MAILTRAP_PORT ?? "1025", 10),
    MAILTRAP_USER: processEnv.MAILTRAP_USER ?? "",
    MAILTRAP_PASS: processEnv.MAILTRAP_PASS ?? "",
    BREVO_API_KEY: processEnv.BREVO_API_KEY ?? "",
    EMAIL_FROM_NAME: processEnv.EMAIL_FROM_NAME ?? "E-Commerce",
    EMAIL_FROM_ADDRESS:
      processEnv.EMAIL_FROM_ADDRESS ?? "noreply@ecommerce.com",

    STRIPE_SECRET_KEY: processEnv.STRIPE_SECRET_KEY ?? "sk_test_dummy",
    STRIPE_WEBHOOK_SECRET: processEnv.STRIPE_WEBHOOK_SECRET ?? "whsec_dummy",
    STRIPE_SUCCESS_URL:
      processEnv.STRIPE_SUCCESS_URL ?? "http://localhost/success",
    STRIPE_CANCEL_URL:
      processEnv.STRIPE_CANCEL_URL ?? "http://localhost/cancel",

    CLOUDINARY_CLOUD_NAME: processEnv.CLOUDINARY_CLOUD_NAME ?? "dummy_cloud",
    CLOUDINARY_API_KEY: processEnv.CLOUDINARY_API_KEY ?? "dummy_key",
    CLOUDINARY_API_SECRET: processEnv.CLOUDINARY_API_SECRET ?? "dummy_secret",
  };
};
