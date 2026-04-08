import { prisma } from "../../lib/prisma";
import { buildPrismaArgs } from "../../common/query/query.engine";
import { productQuery } from "./product.query";
import { CreateProductInput, UpdateProductInput } from "./product.validator";
import { Prisma } from "@prisma/client";

const productAdminSelect: Prisma.ProductSelect = {
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
  productImages: {
    select: { id: true, url: true, publicId: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  },
  createdAt: true,
  updatedAt: true,
} as const;

const productDetailsSelect: Prisma.ProductSelect = {
  id: true,
  name: true,
  description: true,
  ratingAvg: true,
  ratingCount: true,
  summary: true,
  price: true,
  stock: true,
  category: { select: { id: true, name: true } },
  productImages: {
    select: { id: true, url: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  },
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
} as const;

export class ProductRepo {
  public findCategoryById(categoryId: string) {
    return prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
  }

  public async createProductWithImages(data: CreateProductInput) {
    return prisma.product.create({
      data: {
        name: data.name,
        summary: data.summary,
        description: data.description,
        price: data.price,
        stock: data.stock,
        categoryId: data.categoryId,
        isHidden: data.isHidden ?? false,
        productImages: {
          createMany: {
            data: data.images.map((img) => ({
              url: img.url,
              publicId: img.publicId,
              sortOrder: img.sortOrder,
            })),
          },
        },
      },
      select: productAdminSelect,
    });
  }

  public async findProducts(
    reqQuery: Record<string, any>,
    includeHidden = false,
  ) {
    const args = buildPrismaArgs(reqQuery, productQuery);
    const categoryValue = reqQuery?.filter?.category;

    const extraWhere: Prisma.ProductWhereInput = includeHidden
      ? {}
      : {
          isHidden: false,
          category: {
            isHidden: false,
          },
        };

    if (typeof categoryValue === "string" && categoryValue.trim()) {
      extraWhere.category = {
        ...(extraWhere.category as Prisma.CategoryWhereInput),
        slug: categoryValue.trim(),
      };
    }

    const finalWhere: Prisma.ProductWhereInput = args.where
      ? { AND: [args.where, extraWhere] }
      : extraWhere;

    const productImagesQuery = {
      where: { sortOrder: 0 },
      select: { url: true },
      take: 1,
    };

    if (args.select) {
      (args.select as any).productImages = productImagesQuery;
    } else {
      (args as any).include = {
        ...(args as any).include,
        productImages: productImagesQuery,
      };
    }

    const [totalItems, products] = await prisma.$transaction([
      prisma.product.count({ where: finalWhere }),
      prisma.product.findMany({
        ...args,
        where: finalWhere,
      }),
    ]);

    return {
      totalItems,
      products,
      limit: args.take ?? 20,
      skip: args.skip ?? 0,
    };
  }

  public findProductIdById(productId: string) {
    return prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
  }

  public updateProduct(productId: string, data: UpdateProductInput) {
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
        ...(data.images !== undefined && {
          productImages: {
            deleteMany: {},
            createMany: {
              data: data.images.map((img) => ({
                url: img.url,
                publicId: img.publicId,
                sortOrder: img.sortOrder,
              })),
            },
          },
        }),
      },
      select: productAdminSelect,
    });
  }

  public findProductImagesByProductId(productId: string) {
    return prisma.productImage.findMany({
      where: { productId },
      select: { id: true, publicId: true },
    });
  }

  public deleteProductImages(imageIds: string[]) {
    if (!imageIds.length) return Promise.resolve({ count: 0 });
    return prisma.productImage.deleteMany({
      where: { id: { in: imageIds } },
    });
  }

  public deleteProduct(productId: string) {
    return prisma.product.delete({ where: { id: productId } });
  }

  public findProductDetailsById(productId: string, includeHidden = false) {
    return prisma.product.findFirst({
      where: {
        id: productId,
        ...(includeHidden
          ? {}
          : { isHidden: false, category: { isHidden: false } }),
      },
      select: includeHidden
        ? { ...productDetailsSelect, isHidden: true }
        : productDetailsSelect,
    });
  }
}
