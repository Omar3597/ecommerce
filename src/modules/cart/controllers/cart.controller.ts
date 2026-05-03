import { Response } from "express";
import { CartService } from "../services/cart.service";
import { catchAsync } from "../../../middlewares/catchAsync";
import { AuthRequest } from "../../../shared/types/auth.types";
import { getCartDto, updateCartItemDto } from "../dtos/cart.dto";
import {
  addProductToCartSchema,
  removeCartItemSchema,
  updateCartItemSchema,
} from "../validators/cart.validator";

export class CartController {
  constructor(private readonly cartService: CartService) {}

  public getCart = catchAsync(async (req: AuthRequest, res: Response) => {
    const cart = await this.cartService.getCart(req.user.id);

    res.status(200).json({
      status: "success",
      data: getCartDto(cart),
    });
  });

  public addItem = catchAsync(async (req: AuthRequest, res: Response) => {
    const validatedData = addProductToCartSchema.parse(req);
    const { productId } = validatedData.body;

    const cartItem = await this.cartService.addToCart(req.user.id, productId);

    res.status(201).json({
      status: "success",
      data: { cartItem },
    });
  });

  public updateItem = catchAsync(async (req: AuthRequest, res: Response) => {
    const validated = updateCartItemSchema.parse(req);
    const { itemId } = validated.params;
    const { quantity } = validated.body;

    const updatedItem = await this.cartService.updateItemQuantity(
      req.user.id,
      itemId,
      quantity,
    );

    res.status(200).json({
      status: "success",
      data: { item: updateCartItemDto(updatedItem) },
    });
  });

  public removeItem = catchAsync(async (req: AuthRequest, res: Response) => {
    const validatedData = removeCartItemSchema.parse(req);
    const { itemId } = validatedData.params;

    await this.cartService.removeItem(req.user.id, itemId);

    res.status(204).send();
  });

  public clearCart = catchAsync(async (req: AuthRequest, res: Response) => {
    await this.cartService.clearCart(req.user.id);
    res.status(204).send();
  });
}
