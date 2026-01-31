import dotenv from "dotenv";
dotenv.config({ path: ".env" });

interface IConfig {
  port: number;
  env: "development" | "production";
  jwtSecret: string;
}

export const getConfig = (): IConfig => {
  const { PORT, NODE_ENV, JWT_SECRET } = process.env;

  if (!PORT || !NODE_ENV || !JWT_SECRET) {
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
    jwtSecret: JWT_SECRET,
  };
};
