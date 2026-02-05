import { Request, Response } from "express";
import { ProductService } from "./product.service";
import { catchAsync } from "../../common/middlewares/catchAsync";
import { getProductSchema } from "./product.validator";

export class ProductController {
  constructor(private readonly productService: ProductService) {}

  public getAllProducts = catchAsync(async (req: Request, res: Response) => {
    const products = await this.productService.getAllProducts(req.query);

    res.status(200).json({
      status: "success",
      results: products.length,
      data: { products },
    });
  });

  public getOneProduct = catchAsync(async (req: Request, res: Response) => {
    const validatedData = getProductSchema.parse(req);
    const { productId } = validatedData.params;

    const product = await this.productService.getProductById(productId);

    res.status(200).json({
      status: "success",
      data: { product },
    });
  });
}
