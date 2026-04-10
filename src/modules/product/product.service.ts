import AppError from "../../common/utils/appError";
import { CreateProductInput, UpdateProductInput } from "./product.validator";
import { ProductRepo } from "./product.repo";
import { StorageService } from "../../common/services/cloudinary.service";
import baseLogger from "../../config/logger";
export class ProductService {
  private logger = baseLogger.child({ module: "product" });
  constructor(private readonly productRepo: ProductRepo = new ProductRepo()) {}

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

  async getAllProducts(reqQuery: Record<string, any>, includeHidden = false) {
    return this.productRepo.findProducts(reqQuery, includeHidden);
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
    // Fetch image records before the product row is deleted
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

    // Clean up Cloudinary assets (fire-and-forget; DB row is already gone)
    if (images.length > 0) {
      const publicIds = images.map((img) => img.publicId);
      StorageService.bulkDeleteImages(publicIds).catch((err) =>
        console.error("Failed to delete product images from Cloudinary", err),
      );
    }
  }

  async getProductById(productId: string, includeHidden = false) {
    const product = await this.productRepo.findProductDetailsById(
      productId,
      includeHidden,
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
    const results = await StorageService.bulkUploadImages(buffers, "products");
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
    const start = performance.now();
    await StorageService.deleteImage(publicId);
    const duration = Math.round(performance.now() - start);

    this.logger.info(
      {
        action: "DELETE_PRODUCT_IMAGE",
        userId: context.userId,
        role: context.role,
        publicId,
        duration,
      },
      "Deleted product image",
    );
  }
}
