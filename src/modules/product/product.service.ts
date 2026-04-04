import AppError from "../../common/utils/appError";
import { CreateProductInput, UpdateProductInput } from "./product.validator";
import { ProductRepo } from "./product.repo";

export class ProductService {
  constructor(private readonly productRepo: ProductRepo = new ProductRepo()) {}

  async createProduct(data: CreateProductInput) {
    const category = await this.productRepo.findCategoryById(data.categoryId);

    if (!category) {
      throw new AppError(404, "Category is not found");
    }

    return this.productRepo.createProduct(data);
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
    const deletedProduct =
      await this.productRepo.deleteProductAndReviews(productId);

    if (!deletedProduct) {
      throw new AppError(404, "Product is not found");
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
