import { prisma } from "../../lib/prisma";
import AppError from "../../common/utils/appError";
import { ProductFeatures } from "./product.features";
import { getConfig } from "../../config/env";
import { CreateProductInput, UpdateProductInput } from "./product.validator";

const config = getConfig();

const productAdminSelect = {
  id: true,
  name: true,
  summary: true,
  description: true,
  price: true,
  stock: true,
  isHidden: true,
  category: {
    select: { id: true, name: true, slug: true },
  },
  createdAt: true,
  updatedAt: true,
} as const;

export class ProductService {
  private toNumber(value: unknown): number {
    if (typeof value === "number") return value;
    if (typeof value === "object" && value !== null && "toNumber" in value) {
      return (value as { toNumber: () => number }).toNumber();
    }

    return Number(value);
  }

  async createProduct(data: CreateProductInput) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new AppError(404, "Category is not found");
    }

    return prisma.product.create({
      data: {
        name: data.name,
        summary: data.summary,
        description: data.description,
        price: data.price,
        stock: data.stock,
        categoryId: data.categoryId,
        isHidden: data.isHidden ?? false,
      },
      select: productAdminSelect,
    });
  }

  async getAllProducts(query: Record<string, any>, includeHidden = false) {
    const pf = new ProductFeatures(query).filter(includeHidden).limitFields();
    const { where, select, orderBy, skip, take } = pf.build();

    if (!includeHidden) {
      where.category = {
        ...(query.category ? { slug: query.category } : {}),
        isHidden: false,
      };
    } else if (query.category) {
      where.category = { slug: query.category };
    }

    const products = await prisma.product.findMany({
      where,
      select: Object.keys(select || {}).length ? select : {},
      orderBy,
      skip,
      take,
    });

    if (!includeHidden) {
      products.forEach(
        (product) =>
          (product.stock = Math.min(product.stock, config.maxCartQuantity)),
      );
    }

    products.forEach((product: Record<string, any>) => {
      if (product.ratingAvg !== undefined) {
        product.ratingAvg = this.toNumber(product.ratingAvg);
      }
    });

    return products;
  }

  async updateProduct(productId: string, data: UpdateProductInput) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new AppError(404, "Product is not found");
    }

    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
        select: { id: true },
      });

      if (!category) {
        throw new AppError(404, "Category is not found");
      }
    }

    return prisma.product.update({
      where: { id: productId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.summary !== undefined && { summary: data.summary }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.isHidden !== undefined && { isHidden: data.isHidden }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      },
      select: productAdminSelect,
    });
  }

  async deleteProduct(productId: string) {
    const [, deletedProduct] = await prisma.$transaction([
      prisma.review.deleteMany({
        where: { productId },
      }),
      prisma.product.deleteMany({
        where: { id: productId },
      }),
    ]);

    if (deletedProduct.count === 0) {
      throw new AppError(404, "Product is not found");
    }
  }

  async getProductById(productId: string, includeHidden = false) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        ...(includeHidden ? {} : { isHidden: false, category: { isHidden: false } }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        ratingAvg: true,
        ratingCount: true,
        summary: true,
        price: true,
        stock: true,
        category: { select: { id: true, name: true } },
        reviews: {
          select: {
            id: true,
            comment: true,
            rating: true,
            createdAt: true,
            updatedAt: true,
            user: { select: { id: true, name: true } },
          },
          take: 5,
        },
      },
    });

    if (!product) {
      throw new AppError(404, "Product is not found");
    }

    if (!includeHidden) {
      product.stock = Math.min(product.stock, config.maxCartQuantity);
    }

    return {
      ...product,
      ratingAvg: this.toNumber(product.ratingAvg),
      reviews: product.reviews.map((review) => ({
        ...review,
        rating: this.toNumber(review.rating),
      })),
    };
  }
}
