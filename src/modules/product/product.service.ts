import AppError from "../../common/utils/appError";
import { CreateProductInput, UpdateProductInput } from "./product.validator";
import { ProductRepo } from "./product.repo";
import { StorageService } from "../../common/services/cloudinary.service";

export class ProductService {
  constructor(private readonly productRepo: ProductRepo = new ProductRepo()) {}

  async createProduct(data: CreateProductInput) {
    const category = await this.productRepo.findCategoryById(data.categoryId);

    if (!category) {
      throw new AppError(404, "Category is not found");
    }

    return this.productRepo.createProductWithImages(data);
  }

  async getAllProducts(reqQuery: Record<string, any>, includeHidden = false) {
    return this.productRepo.findProducts(reqQuery, includeHidden);
  }

  async updateProduct(productId: string, data: UpdateProductInput) {
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

    return this.productRepo.updateProduct(productId, data);
  }

  async deleteProduct(productId: string) {
    // Fetch image records before the product row is deleted
    const images =
      await this.productRepo.findProductImagesByProductId(productId);

    const deletedProduct = await this.productRepo.deleteProduct(productId);

    if (!deletedProduct) {
      throw new AppError(404, "Product is not found");
    }

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
}
