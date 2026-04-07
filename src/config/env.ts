import dotenv from "dotenv";

const env = process.env.NODE_ENV || "development";
const envFile = env === "development" ? ".env" : `.env.${env}`;
dotenv.config({ path: envFile });

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

  // Third-party
  MAIL_HOST: string;
  MAIL_PORT: number;
  MAIL_USER: string;
  MAIL_PASSWORD: string;
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
      "DB_HOST",
      "DB_PORT",
      "DB_USER",
      "DB_PASSWORD",
      "DB_NAME",
      "DATABASE_URL",
      "APP_PORT",
      "BASE_URL",
      "JWT_SECRET",
      "REFRESH_TOKEN_SECRET",
      "MAX_CART_QUANTITY",
      "MAX_ACTIVE_SESSIONS",
    ],
    "Core",
  );

  // 2. Third-party vars — required in prod/dev
  if (NODE_ENV !== "test") {
    checkMissingVars(
      [
        "MAIL_HOST",
        "MAIL_PORT",
        "MAIL_USER",
        "MAIL_PASSWORD",
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
    DB_HOST: processEnv.DB_HOST!,
    DB_PORT: parseInt(processEnv.DB_PORT!, 10),
    DB_USER: processEnv.DB_USER!,
    DB_PASSWORD: processEnv.DB_PASSWORD!,
    DB_NAME: processEnv.DB_NAME!,
    DATABASE_URL: processEnv.DATABASE_URL!,
    env: NODE_ENV,
    APP_PORT: parseInt(processEnv.APP_PORT!, 10),
    BASE_URL: processEnv.BASE_URL!,
    JWT_SECRET: processEnv.JWT_SECRET!,
    REFRESH_TOKEN_SECRET: processEnv.REFRESH_TOKEN_SECRET!,
    MAX_CART_QUANTITY: parseInt(processEnv.MAX_CART_QUANTITY!, 10),
    MAX_ACTIVE_SESSIONS: parseInt(processEnv.MAX_ACTIVE_SESSIONS!, 10),

    // Third-party with safe defaults for 'test'
    MAIL_HOST: processEnv.MAIL_HOST ?? "localhost",
    MAIL_PORT: parseInt(processEnv.MAIL_PORT ?? "1025", 10),
    MAIL_USER: processEnv.MAIL_USER ?? "",
    MAIL_PASSWORD: processEnv.MAIL_PASSWORD ?? "",

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
