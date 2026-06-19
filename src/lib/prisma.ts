import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

// Heroku Postgres (RDS) requires SSL. node-postgres does not enable SSL
// automatically from the connection string, so we must set it explicitly.
// rejectUnauthorized: false is required because Heroku uses self-signed certs.
// In non-production environments (local Docker Compose) SSL is disabled.
const isProduction = process.env.NODE_ENV === "production";

const pool = new pg.Pool({
  connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export { prisma };
