import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { getConfig } from "../config/env";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";

const config = getConfig();

const connectionString = `${config.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seedManager() {
  const managerPass = await bcrypt.hash("manager@1234", 12);
  await prisma.user.create({
    data: {
      name: "manager",
      email: "manager@example.com",
      password: managerPass,
      role: "MANAGER",
      isVerified: true,
    },
  });
}

async function seedUsers(minUsersNeeded: number) {
  await seedManager();

  const password = await bcrypt.hash("Test@1234", 12);

  await prisma.user.createMany({
    data: Array.from({ length: minUsersNeeded }, () => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();

      return {
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        password,
        isVerified: true,
      };
    }),
    skipDuplicates: true,
  });

  const users = await prisma.user.findMany({
    select: { id: true },
  });

  return users;
}

async function seedCategories() {
  const categories = [
    "Electronics",
    "Clothing",
    "Home & Kitchen",
    "Books",
    "Sports",
    "Toys",
    "Health",
  ];

  const data = categories.map((name) => ({
    name,
    slug: faker.helpers.slugify(name).toLowerCase(),
  }));

  await prisma.category.createMany({
    data,
    skipDuplicates: true,
  });

  return prisma.category.findMany({
    where: {
      name: { in: categories },
    },
    select: { id: true },
  });
}

async function seedProducts(count: number, categories: Array<{ id: string }>) {
  await prisma.product.createMany({
    data: Array.from({ length: count }, () => {
      const description = faker.commerce.productDescription();
      const randomCategory =
        categories[Math.floor(Math.random() * categories.length)];

      return {
        name: faker.commerce.productName(),
        summary: description.slice(0, 200),
        description,
        stock: faker.number.int({ min: 10, max: 200 }),
        price: faker.number.int({ min: 500, max: 999_999 }),
        categoryId: randomCategory.id,
        isHidden: Math.random() < 0.1,
      };
    }),
  });

  return prisma.product.findMany({
    select: { id: true },
  });
}

async function seedReviews(
  count: number,
  users: Array<{ id: string }>,
  products: Array<{ id: string }>,
) {
  const used = new Set<string>();
  const data = [];

  const maxPossible = users.length * products.length;
  if (count > maxPossible) {
    throw new Error("Too many reviews requested");
  }

  while (data.length < count) {
    const user = users[Math.floor(Math.random() * users.length)];
    const product = products[Math.floor(Math.random() * products.length)];

    const key = `${user.id}-${product.id}`;

    if (used.has(key)) continue;

    used.add(key);

    data.push({
      userId: user.id,
      productId: product.id,
      rating: faker.number.int({ min: 1, max: 5 }),
      comment: faker.lorem.sentences({ min: 1, max: 3 }),
    });
  }

  await prisma.review.createMany({
    data,
  });
}

async function seedAddresses(count: number, users: Array<{ id: string }>) {
  await prisma.address.createMany({
    data: Array.from({ length: count }, () => {
      const randomUser = users[Math.floor(Math.random() * users.length)];

      return {
        fullName: faker.person.fullName(),
        phone: faker.phone.number(),
        city: faker.location.city(),
        street: faker.location.streetAddress(),
        building: Math.random() < 0.5 ? faker.location.buildingNumber() : null,
        userId: randomUser.id,
      };
    }),
  });
}

async function updateProductRatings() {
  const productRatings = await prisma.review.groupBy({
    by: ["productId"],
    _avg: { rating: true },
    _count: { rating: true },
  });

  await Promise.all(
    productRatings.map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: {
          ratingAvg: item._avg.rating ?? 0,
          ratingCount: item._count.rating,
        },
      }),
    ),
  );
}

async function clearDB() {
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
}

async function seedDevData() {
  // --------------------------------------------- //
  const usersCount = 30;
  const addressesCount = 100;
  const productsCount = 250;
  const reviewsCount = 3000;
  // --------------------------------------------- //
  console.log("clear db...");
  await clearDB();

  console.log("Seeding users...");
  const users = await seedUsers(usersCount);

  console.log("Seeding addresses...");
  await seedAddresses(addressesCount, users);

  console.log("Seeding categories...");
  const categories = await seedCategories();

  console.log("Seeding products...");
  const products = await seedProducts(productsCount, categories);

  console.log("Seeding reviews...");
  await seedReviews(reviewsCount, users, products);

  console.log("Updating ratings...");
  await updateProductRatings();

  console.log("Seeding done ✅");
}

const main = async () => {
  if (config.env === "development") {
    console.time("seed");
    await seedDevData();
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
