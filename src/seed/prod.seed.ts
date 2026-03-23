import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { getConfig } from "../config/env";
import bcrypt from "bcrypt";

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

  for (const name of categories) {
    const slug = slugify(name);

    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
      },
    });
  }
}

async function seedProdData() {
  console.log("Seeding production data...");

  await seedManager();
  await seedCategories();

  console.log("Production seed done ✅");
}

const main = async () => {
  if (config.env === "production") {
    console.time("seed");
    await seedProdData();
    console.timeEnd("seed");
  }
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
