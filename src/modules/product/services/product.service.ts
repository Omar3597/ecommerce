import AppError from "../../../shared/errors/appError";
import {
  CreateProductInput,
  UpdateProductInput,
} from "../validators/product.validator";
import { ProductRepo } from "../repositories/product.repo";
import { StorageService } from "../../../shared/services/cloudStorage/services/cloudStorage.service";
import baseLogger from "../../../config/logger";
import type { ICacheService } from "../../../infra/cache";
import { EventBus } from "../../../infra/event-bus";
import { EVENT_NAMES } from "../../../events";

export class ProductService {
  private logger = baseLogger.child({ module: "product" });
  constructor(
    private readonly productRepo: ProductRepo,
    private readonly cache: ICacheService,
  ) {}

  static async restoreStock(
    items: { productId: string; quantity: number }[],
    tx: any,
  ) {
    for (const item of items) {
      await tx.product.updateMany({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          soldQuantity: { decrement: item.quantity },
        },
      });
    }
  }

  async getPublicProducts(reqQuery: Record<string, any>) {
    const { page = 1, limit = 20, sort, filter } = reqQuery;

    const isCacheable =
      Number(page) === 1 && Number(limit) === 20 && !filter && !sort;
    if (!isCacheable) return this.productRepo.findProducts(reqQuery, false);

    return this.cache.wrap(
      `products:page:${page}`,
      300, // 5 minutes
      () => this.productRepo.findProducts(reqQuery, false),
    );
  }

  async getAdminProducts(reqQuery: Record<string, any>) {
    return this.productRepo.findProducts(reqQuery, true);
  }

  async createProduct(
    data: CreateProductInput,
    context: { userId: string; role: string },
  ) {
    const category = await this.productRepo.findCategoryById(data.categoryId);

    if (!category) {
      throw new AppError(404, "Category is not found");
    }

    const product = await this.productRepo.createProductWithImages(data);

    this.logger.info(
      {
        action: "CREATE_PRODUCT",
        userId: context.userId,
        role: context.role,
        entityId: product.id,
      },
      "Product created",
    );

    return product;
  }

  async updateProduct(
    productId: string,
    data: UpdateProductInput,
    context: { userId: string; role: string },
  ) {
    const product = await this.productRepo.findProductIdById(productId);

    if (!product) {
      throw new AppError(404, "Product is not found");
    }

    if (data.categoryId) {
      const category = await this.productRepo.findCategoryById(data.categoryId);

      if (!category) {
        throw new AppError(404, "Category is not found");
      }
    }

    const updatedProduct = await this.productRepo.updateProduct(
      productId,
      data,
    );

    this.logger.info(
      {
        action: "UPDATE_PRODUCT",
        userId: context.userId,
        role: context.role,
        entityId: updatedProduct.id,
      },
      "product updated",
    );
    return updatedProduct;
  }

  async deleteProduct(
    productId: string,
    context: { userId?: string; role?: string; requestId?: string } = {},
  ) {
    const images =
      await this.productRepo.findProductImagesByProductId(productId);

    const deletedProduct = await this.productRepo.deleteProduct(productId);

    if (!deletedProduct) {
      throw new AppError(404, "Product is not found");
    }

    this.logger.warn(
      {
        action: "DELETE_PRODUCT",
        userId: context.userId,
        role: context.role,
        entityId: productId,
      },
      "Product deleted",
    );

    if (images.length > 0) {
      const publicIds = images.map((img) => img.publicId);
      EventBus.getInstance().emit(EVENT_NAMES.PRODUCT.DELETED, {
        publicIds,
      });
    }
  }

  async getPublicProductById(productId: string) {
    const product = await this.productRepo.findProductDetailsById(
      productId,
      false,
    );

    if (!product) {
      throw new AppError(404, "Product is not found");
    }

    return product;
  }

  async getAdminProductById(productId: string) {
    const product = await this.productRepo.findProductDetailsById(
      productId,
      true,
    );

    if (!product) {
      throw new AppError(404, "Product is not found");
    }

    return product;
  }

  async uploadImages(
    buffers: Buffer[],
    context: { userId: string; role: string },
  ) {
    const start = performance.now();
    const results = await StorageService.bulkUploadImages({
      fileBuffers: buffers,
      folderPath: "products",
      format: "webp",
      transformations: [
        { width: 800, height: 800, crop: "limit" },
        { width: 400, height: 400, crop: "limit", suffix: "_thumb" },
      ],
    });

    const duration = Math.round(performance.now() - start);

    this.logger.info(
      {
        action: "UPLOAD_PRODUCT_IMAGES",
        userId: context.userId,
        role: context.role,
        count: results.length,
        publicIds: results.map((r) => r.publicId),
        duration,
      },
      "Uploaded product images",
    );

    return results;
  }

  async deleteImage(
    publicId: string,
    context: { userId: string; role: string },
  ) {
    this.logger.info(
      {
        action: "DELETE_PRODUCT_IMAGE",
        userId: context.userId,
        role: context.role,
        publicId,
      },
      "Deleted product image",
    );

    EventBus.getInstance().emit(EVENT_NAMES.PRODUCT.IMAGE_REMOVED, {
      publicId,
    });
  }
}
