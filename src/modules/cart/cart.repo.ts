import { prisma } from "../../lib/prisma";

export class CartRepo {
  getOrCreateCart(userId: string) {
    return prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  findCartByUserId(userId: string) {
    return prisma.cart.findUnique({
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
  }

  findProductForCart(productId: string) {
    return prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isHidden: true, stock: true },
    });
  }

  createCartItem(cartId: string, productId: string, quantity: number) {
    return prisma.cartItem.create({
      data: {
        cartId,
        productId,
        quantity,
      },
    });
  }

  findCartItemForUser(userId: string, itemId: string) {
    return prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId } },
      select: {
        id: true,
        product: {
          select: { stock: true, isHidden: true },
        },
      },
    });
  }

  updateCartItemQuantity(itemId: string, quantity: number) {
    return prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      select: { id: true, quantity: true },
    });
  }

  findCartIdByUserId(userId: string) {
    return prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });
  }

  deleteCartItemByCartId(itemId: string, cartId: string) {
    return prisma.cartItem.deleteMany({
      where: { id: itemId, cartId },
    });
  }

  deleteCartItemsByCartId(cartId: string) {
    return prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }
}
