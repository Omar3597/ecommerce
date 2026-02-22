import { getConfig } from "../../config/env";

const config = getConfig();

export const getCartDto = (cart: any) => {
  if (!cart) return null;

  return {
    id: cart.id,
    items: cart.items.map((item: any) => {
      const product = item.product;

      const isAvailable = !product.isHidden && product.stock > 0;
      const maxAllowedQuantity = Math.min(
        product.stock,
        config.maxCartQuantity,
      );

      return {
        id: item.id,
        quantity: item.quantity,
        isAvailable,
        maxAllowedQuantity,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
        },
      };
    }),
  };
};

export const updateCartItemDto = (data: any) => {
  const isAvailable = !data.isHidden && data.stock > 0;

  return {
    id: data.id,
    quantity: data.quantity,
    isAvailable,
    maxAllowedQuantity: isAvailable
      ? Math.min(data.stock, config.maxCartQuantity)
      : 0,
  };
};
