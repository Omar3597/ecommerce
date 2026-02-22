import dotenv from "dotenv";
dotenv.config({ path: ".env" });

interface IConfig {
  port: number;
  env: "development" | "production";
  baseURL: string;
  jwtSecret: string;
  refreshSecret: string;
  mailUser: string;
  mailPass: string;
  maxCartQuantity: number;
  dbUrl: string;
}

export const getConfig = (): IConfig => {
  const {
    PORT,
    NODE_ENV,
    JWT_SECRET,
    REFRESH_TOKEN_SECRET,
    BASE_URL,
    MAIL_USER,
    MAIL_PASS,
    MAX_CART_QUANTITY,
    DATABASE_URL,
  } = process.env;

  if (
    !PORT ||
    !NODE_ENV ||
    !JWT_SECRET ||
    !REFRESH_TOKEN_SECRET ||
    !BASE_URL ||
    !MAIL_USER ||
    !MAIL_PASS ||
    !MAX_CART_QUANTITY ||
    !DATABASE_URL
  ) {
    throw new Error("Missing required environment variables");
  }

  const isValidEnv = (env: string): env is IConfig["env"] => {
    return env === "development" || env === "production";
  };

  if (!isValidEnv(NODE_ENV)) {
    throw new Error(`Invalid NODE_ENV: ${NODE_ENV}`);
  }

  return {
    port: Number(PORT),
    env: NODE_ENV,
    baseURL: BASE_URL,
    jwtSecret: JWT_SECRET,
    refreshSecret: REFRESH_TOKEN_SECRET,
    mailUser: MAIL_USER,
    mailPass: MAIL_PASS,
    maxCartQuantity: Number(MAX_CART_QUANTITY),
    dbUrl: DATABASE_URL,
  };
};
