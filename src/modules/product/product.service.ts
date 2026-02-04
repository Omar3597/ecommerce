import { prisma } from "../../lib/prisma";
import AppError from "../../common/utils/appError";
import { ProductFeatures } from "./product.features";

export class ProductService {
  async getAllProducts(query: Record<string, any>) {
    const pf = new ProductFeatures(query).filter().limitFields();
    const { where, select, orderBy, skip, take } = pf.build();

    if (query.category) where.category = { slug: query.category };

    return prisma.product.findMany({
      where,
      select: Object.keys(select || {}).length ? select : {},
      orderBy,
      skip,
      take,
    });
  }

  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id, isHidden: false },
      select: {
        id: true,
        name: true,
        description: true,
        ratingAvg: true,
        ratingCount: true,
        summary: true,
        price: true,
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
      throw new AppError(404, "Product not found");
    }

    return product;
  }
}
