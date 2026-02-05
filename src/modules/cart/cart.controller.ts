import { Request, Response } from "express";
import { CartService } from "./cart.service";
import { catchAsync } from "../../common/middlewares/catchAsync";
import { assertAuth } from "../../common/guards/assert-auth";
import { getCartDto, updateCartItemDto } from "./cart.dto";
import { updateCartItemSchema } from "./cart.validator";

export class CartController {
  constructor(private readonly cartService: CartService) {}

  public getCart = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);
    const cart = await this.cartService.getCart(req.user.id);

    res.status(200).json({
      status: "success",
      data: getCartDto(cart),
    });
  });

  public addItem = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

    const { productId } = req.body;

    const cartItem = await this.cartService.addToCart(req.user.id, productId);

    res.status(200).json({
      status: "success",
      data: { cartItem },
    });
  });

  public updateItem = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

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

  public removeItem = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

    const itemId = Array.isArray(req.params.itemId)
      ? req.params.itemId[0]
      : req.params.itemId;

    await this.cartService.removeItem(req.user.id, itemId);

    res.status(204).send();
  });

  public clearCart = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

    await this.cartService.clearCart(req.user.id);
    res.status(204).send();
  });
}
