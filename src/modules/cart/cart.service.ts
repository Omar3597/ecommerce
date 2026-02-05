import { prisma } from "../../lib/prisma";
import AppError from "../../common/utils/appError";
import { getConfig } from "../../config/config";

const config = getConfig();

export class CartService {
  private async getOrCreateCart(userId: string) {
    return prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async getCart(userId: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: {
        id: true,
        items: {
          select: {
            id: true,
            quantity: true,
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                isHidden: true,
              },
            },
          },
          orderBy: { product: { name: "asc" } },
        },
      },
    });
    return cart;
  }

  async addToCart(userId: string, productId: string) {
    const cart = await this.getOrCreateCart(userId);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isHidden: true, stock: true },
    });
    if (!product || product.isHidden || product.stock < 1)
      throw new AppError(404, "Product is not found");

    return prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity: 1,
      },
    });
  }

  async updateItemQuantity(userId: string, itemId: string, quantity: number) {
    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId } },
      select: {
        id: true,
        product: {
          select: { stock: true, isHidden: true },
        },
      },
    });

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

    const updatedItem = await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
      select: { id: true, quantity: true },
    });

    return {
      id: updatedItem.id,
      quantity: updatedItem.quantity,
      stock,
      isHidden,
    };
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return;

    await prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    });
  }

  async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return;

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }
}
