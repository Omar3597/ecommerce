import AppError from "../../common/utils/appError";
import { getConfig } from "../../config/env";
import { CartRepo } from "./cart.repo";

const config = getConfig();

export class CartService {
  constructor(private readonly cartRepo: CartRepo) {}

  async getCart(userId: string) {
    return this.cartRepo.findCartByUserId(userId);
  }

  async addToCart(userId: string, productId: string) {
    const cart = await this.cartRepo.getOrCreateCart(userId);

    const product = await this.cartRepo.findProductForCart(productId);
    if (!product || product.isHidden || product.stock < 1)
      throw new AppError(404, "Product is not found");

    return this.cartRepo.createCartItem(cart.id, productId, 1);
  }

  async updateItemQuantity(userId: string, itemId: string, quantity: number) {
    const item = await this.cartRepo.findCartItemForUser(userId, itemId);

    if (!item) throw new AppError(404, "Cart item not found");

    const { stock, isHidden } = item.product;

    if (isHidden || stock === 0) {
      return {
        id: item.id,
        quantity: 0,
        stock,
        isHidden,
      };
    }

    const maxAllowed = Math.min(stock, config.maxCartQuantity);

    if (quantity > maxAllowed)
      throw new AppError(400, "Quantity exceeds allowed limit");

    const updatedItem = await this.cartRepo.updateCartItemQuantity(
      item.id,
      quantity,
    );

    return {
      id: updatedItem.id,
      quantity: updatedItem.quantity,
      stock,
      isHidden,
    };
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.cartRepo.findCartIdByUserId(userId);
    if (!cart) return;

    await this.cartRepo.deleteCartItemByCartId(itemId, cart.id);
  }

  async clearCart(userId: string) {
    const cart = await this.cartRepo.findCartIdByUserId(userId);
    if (!cart) return;

    await this.cartRepo.deleteCartItemsByCartId(cart.id);
  }
}
