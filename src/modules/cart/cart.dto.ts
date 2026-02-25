import { getConfig } from "../../config/env";

const config = getConfig();

export const getCartDto = (cart: any) => {
  if (!cart) return null;

  return {
    id: cart.id,
    items: cart.items.map((item: any) => {
      const product = item.product;

      const status =
        !product.isHidden && product.stock > 0 ? "in_stock" : "out_of_stock";
      const maxQuantity = Math.min(product.stock, config.maxCartQuantity);

      return {
        id: item.id,
        quantity: item.quantity,
        availability: {
          status,
          maxQuantity,
        },
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
  const status = !data.isHidden && data.stock > 0 ? "in_stock" : "out_of_stock";
  const maxQuantity = Math.min(data.stock, config.maxCartQuantity);

  return {
    id: data.id,
    quantity: data.quantity,
    availability: {
      status,
      maxQuantity,
    },
  };
};
