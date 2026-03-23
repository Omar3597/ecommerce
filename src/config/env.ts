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
  MAIL_HOST: string;
  MAIL_PORT: number;
  MAIL_USER: string;
  MAIL_PASSWORD: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_SUCCESS_URL: string;
  STRIPE_CANCEL_URL: string;
  MAX_CART_QUANTITY: number;
  MAX_ACTIVE_SESSIONS: number;
}

export const getConfig = (): IConfig => {
  const {
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    DATABASE_URL,
    NODE_ENV,
    APP_PORT,
    BASE_URL,
    JWT_SECRET,
    REFRESH_TOKEN_SECRET,
    MAIL_HOST,
    MAIL_PORT,
    MAIL_USER,
    MAIL_PASSWORD,
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    STRIPE_SUCCESS_URL,
    STRIPE_CANCEL_URL,
    MAX_CART_QUANTITY,
    MAX_ACTIVE_SESSIONS,
  } = process.env;

  if (
    !DB_HOST ||
    !DB_PORT ||
    !DB_USER ||
    !DB_PASSWORD ||
    !DB_NAME ||
    !DATABASE_URL ||
    !NODE_ENV ||
    !APP_PORT ||
    !BASE_URL ||
    !JWT_SECRET ||
    !REFRESH_TOKEN_SECRET ||
    !MAIL_HOST ||
    !MAIL_PORT ||
    !MAIL_USER ||
    !MAIL_PASSWORD ||
    !STRIPE_SECRET_KEY ||
    !STRIPE_WEBHOOK_SECRET ||
    !STRIPE_SUCCESS_URL ||
    !STRIPE_CANCEL_URL ||
    !MAX_CART_QUANTITY ||
    !MAX_ACTIVE_SESSIONS
  ) {
    throw new Error("Missing required environment variables");
  }

  const isValidEnv = (env: string): env is IConfig["env"] => {
    return env === "development" || env === "production" || env === "test";
  };

  if (!isValidEnv(NODE_ENV)) {
    throw new Error(`Invalid NODE_ENV: ${NODE_ENV}`);
  }

  return {
    DB_HOST,
    DB_PORT: parseInt(DB_PORT, 10),
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    DATABASE_URL,
    env: NODE_ENV,
    APP_PORT: parseInt(APP_PORT, 10),
    BASE_URL,
    JWT_SECRET,
    REFRESH_TOKEN_SECRET,
    MAIL_HOST,
    MAIL_PORT: parseInt(MAIL_PORT, 10),
    MAIL_USER,
    MAIL_PASSWORD,
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    STRIPE_SUCCESS_URL,
    STRIPE_CANCEL_URL,
    MAX_CART_QUANTITY: parseInt(MAX_CART_QUANTITY, 10),
    MAX_ACTIVE_SESSIONS: parseInt(MAX_ACTIVE_SESSIONS, 10),
  };
};
