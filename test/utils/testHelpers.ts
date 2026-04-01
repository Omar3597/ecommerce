import { Role } from "@prisma/client";
import { prisma } from "../../src/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getConfig } from "../../src/config/env";

const config = getConfig();

// ─── Database Reset ────────────────────────────────────────────────────────────

/**
 * Truncates all tables in the database (except Prisma migrations) to ensure a clean state.
 * Uses CASCADE to handle foreign key constraints seamlessly.
 */
export const resetDatabase = async () => {
  const tables = await prisma.$queryRaw<
    { tablename: string }[]
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tableNames = tables
    .map((t) => t.tablename)
    .filter((name) => name !== "_prisma_migrations")
    .map((name) => `"${name}"`)
    .join(", ");

  if (tableNames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} CASCADE;`);
  }
};

// ─── User Factory ──────────────────────────────────────────────────────────────

/**
 * Seeds a single user and generates their JWT authentication token.
 * Returns the user record, token, and the plaintext password.
 */
export const seedUser = async (overrides: Partial<{
  name: string;
  email: string;
  password: string;
  role: Role;
  isVerified: boolean;
  isBanned: boolean;
  isDeleted: boolean;
}> = {}) => {
  const password = overrides.password || "StrongPassword123#";
  const hashedPassword = await bcrypt.hash(password, 1);

  const user = await prisma.user.create({
    data: {
      name: overrides.name || "Test User",
      email: overrides.email || `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      password: hashedPassword,
      role: overrides.role || Role.USER,
      isVerified: overrides.isVerified ?? true,
      isBanned: overrides.isBanned ?? false,
      isDeleted: overrides.isDeleted ?? false,
    },
  });

  const token = jwt.sign({ id: user.id, role: user.role }, config.JWT_SECRET, {
    expiresIn: "1h",
  });

  return { user, token, password };
};

// ─── Category Factory ──────────────────────────────────────────────────────────

/**
 * Seeds a standalone category. Use this when you need a category without a product.
 */
export const seedCategory = async (overrides: Partial<{
  name: string;
  slug: string;
  isHidden: boolean;
}> = {}) => {
  const suffix = Date.now() + "-" + Math.random().toString(36).slice(2);
  const category = await prisma.category.create({
    data: {
      name: overrides.name || `Test Category ${suffix}`,
      slug: overrides.slug || `test-category-${suffix}`,
      isHidden: overrides.isHidden ?? false,
    },
  });

  return { category };
};

// ─── Category + Product Factory ────────────────────────────────────────────────

/**
 * Seeds a category and one product belonging to it.
 */
export const seedCategoryAndProduct = async (overrides: Partial<{
  name: string;
  summary: string;
  description: string;
  price: number;
  stock: number;
  isHidden: boolean;
  categoryName: string;
  categorySlug: string;
}> = {}) => {
  const { category } = await seedCategory({
    name: overrides.categoryName,
    slug: overrides.categorySlug,
  });

  const product = await prisma.product.create({
    data: {
      name: overrides.name || "Test Product",
      summary: overrides.summary || "A test product",
      description: overrides.description,
      price: overrides.price ?? 150000,
      stock: overrides.stock ?? 10,
      isHidden: overrides.isHidden ?? false,
      categoryId: category.id,
    },
  });

  return { category, product };
};

// ─── Cart Factory ──────────────────────────────────────────────────────────────

/**
 * Seeds a cart with a single item for a given user.
 */
export const seedCartWithItem = async (
  userId: string,
  productId: string,
  quantity: number = 1,
) => {
  const cart = await prisma.cart.create({
    data: { userId },
  });

  const cartItem = await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId,
      quantity,
    },
  });

  return { cart, cartItem };
};

// ─── Address Factory ───────────────────────────────────────────────────────────

/**
 * Seeds an address for a given user.
 */
export const seedAddress = async (
  userId: string,
  overrides: Partial<{
    fullName: string;
    phone: string;
    city: string;
    street: string;
    building: string;
  }> = {},
) => {
  const address = await prisma.address.create({
    data: {
      userId,
      fullName: overrides.fullName || "John Doe",
      phone: overrides.phone || "+1234567890",
      city: overrides.city || "Test City",
      street: overrides.street || "123 Test St",
      building: overrides.building,
    },
  });

  return { address };
};

// ─── Order Factory ─────────────────────────────────────────────────────────────

/**
 * Creates a complete Order with address snapshot and product snapshots + order items.
 * This uses direct Prisma inserts (not going through the API).
 *
 * `items` is an array of { productId, productName, productSummary, productPrice, quantity }.
 */
export const seedOrder = async (
  userId: string,
  addressId: string,
  items: {
    productId: string;
    productName: string;
    productSummary?: string;
    productPrice: number;
    quantity: number;
  }[],
  overrides: Partial<{
    status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  }> = {},
) => {
  // Load address for snapshot
  const address = await prisma.address.findUniqueOrThrow({ where: { id: addressId } });

  const subtotal = items.reduce((sum, i) => sum + i.productPrice * i.quantity, 0);
  const shippingFee = 0;
  const total = subtotal + shippingFee;

  const order = await prisma.order.create({
    data: {
      userId,
      subtotal,
      shippingFee,
      total,
      status: overrides.status || "PENDING",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      addressSnapshot: {
        create: {
          fullName: address.fullName,
          phone: address.phone,
          city: address.city,
          street: address.street,
          building: address.building,
        },
      },
    },
  });

  // Create product snapshots + order items
  for (const item of items) {
    const snapshot = await prisma.orderedProductSnapshot.create({
      data: {
        name: item.productName,
        summary: item.productSummary || "Snapshot summary",
        price: item.productPrice,
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: item.productId,
        productSnapshotId: snapshot.id,
        quantity: item.quantity,
      },
    });
  }

  return { order };
};

// ─── Review Factory ────────────────────────────────────────────────────────────

/**
 * Seeds a review for a given user and product.
 */
export const seedReview = async (
  userId: string,
  productId: string,
  overrides: Partial<{
    rating: number;
    comment: string;
  }> = {},
) => {
  const review = await prisma.review.create({
    data: {
      userId,
      productId,
      rating: overrides.rating ?? 4,
      comment: overrides.comment ?? "Great product!",
    },
  });

  return { review };
};
