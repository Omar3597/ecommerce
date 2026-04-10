import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { getConfig } from "../config/env";
import bcrypt from "bcrypt";
import logger from "../config/logger";

const config = getConfig();

const adapter = new PrismaPg({ connectionString: config.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seedManager() {
  const managerPass = await bcrypt.hash("manager@1234", 12);
  await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      name: "manager",
      email: "manager@example.com",
      password: managerPass,
      role: "MANAGER",
      isVerified: true,
    },
  });
}

async function seedCategories() {
  const categories = [
    "Electronics",
    "Clothing",
    "Home & Kitchen",
    "Books",
    "Sports",
  ];

  const slugify = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");

  const categoryPromises = categories.map((name) => {
    const slug = slugify(name);
    return prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
  });

  await Promise.all(categoryPromises);
}

async function seedProdData() {
  logger.info(
    { action: "SEED_PRODUCTION_START" },
    "Starting production data seeding",
  );

  await seedManager();
  logger.info(
    { action: "SEED_PRODUCTION_STEP" },
    "Seeding manager user completed",
  );

  await seedCategories();
  logger.info(
    { action: "SEED_PRODUCTION_STEP" },
    "Seeding categories completed",
  );
}

const main = async () => {
  if (config.env === "production") {
    const start = performance.now();

    await seedProdData();

    const duration = Math.round(performance.now() - start);
    logger.info(
      {
        durationMs: duration,
        action: "SEED_PRODUCTION_SUCCESS",
      },
      `Production data seeding completed successfully in ${duration}ms`,
    );
  } else {
    logger.info(
      { action: "SEED_SKIPPED" },
      "Seeding skipped: Not in production environment",
    );
  }
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    logger.error(
      {
        error,
        action: "SEED_PRODUCTION_FAILED",
      },
      "Critical error occurred while seeding production data",
    );

    await prisma.$disconnect();
    process.exit(1);
  });
