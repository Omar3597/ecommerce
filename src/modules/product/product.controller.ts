import { Request, Response } from "express";
import { ProductService } from "./product.service";
import { catchAsync } from "../../common/middlewares/catchAsync";
import {
  createProductSchema,
  deleteProductSchema,
  getProductSchema,
  updateProductSchema,
} from "./product.validator";
import {
  toPaginatedAdminResponse,
  toPaginatedPublicResponse,
  toPublicProductDetails,
} from "./product.dto";
import { getConfig } from "../../config/env";

const config = getConfig();

export class ProductController {
  constructor(private readonly productService: ProductService) {}

  public createProduct = catchAsync(async (req: Request, res: Response) => {
    const validatedData = createProductSchema.parse(req);

    const product = await this.productService.createProduct(validatedData.body);

    res.status(201).json({
      status: "success",
      data: { product },
    });
  });

  public getAllProducts = catchAsync(async (req: Request, res: Response) => {
    const result = await this.productService.getAllProducts(req.query);
    const { pagination, products } = toPaginatedPublicResponse(
      result,
      config.MAX_CART_QUANTITY,
    );

    res.status(200).json({
      status: "success",
      results: result.products.length,
      pagination,
      data: { products },
    });
  });

  public getAllProductsAdmin = catchAsync(
    async (req: Request, res: Response) => {
      const result = await this.productService.getAllProducts(req.query, true);
      const { pagination, products } = toPaginatedAdminResponse(result);

      res.status(200).json({
        status: "success",
        results: result.products.length,
        pagination,
        data: { products },
      });
    },
  );

  public updateProduct = catchAsync(async (req: Request, res: Response) => {
    const validatedData = updateProductSchema.parse(req);
    const { productId } = validatedData.params;

    const product = await this.productService.updateProduct(
      productId,
      validatedData.body,
    );

    res.status(200).json({
      status: "success",
      data: { product },
    });
  });

  public deleteProduct = catchAsync(async (req: Request, res: Response) => {
    const validatedData = deleteProductSchema.parse(req);
    const { productId } = validatedData.params;

    await this.productService.deleteProduct(productId);

    res.status(204).send();
  });

  public getOneProduct = catchAsync(async (req: Request, res: Response) => {
    const validatedData = getProductSchema.parse(req);
    const { productId } = validatedData.params;

    const product = await this.productService.getProductById(productId);
    const publicProduct = toPublicProductDetails(
      product,
      config.MAX_CART_QUANTITY,
    );

    res.status(200).json({
      status: "success",
      data: { product: publicProduct },
    });
  });

  public getOneProductAdmin = catchAsync(
    async (req: Request, res: Response) => {
      const validatedData = getProductSchema.parse(req);
      const { productId } = validatedData.params;

      const product = await this.productService.getProductById(productId, true);

      res.status(200).json({
        status: "success",
        data: { product },
      });
    },
  );
}
