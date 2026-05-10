export const EVENT_NAMES = {
  USER: {
    SIGNUP: "user.signup",
    REQUEST_VERIFY: "user.request_verify",
    FORGOT_PASSWORD: "user.forgot_password",
    PASSWORD_CHANGED: "user.password_changed",
  },
  PAYMENT: {
    COMPLETED: "payment.completed",
  },
  PRODUCT: {
    IMAGE_REMOVED: "product.image_removed",
    DELETED: "product.deleted",
  },
  ORDER: {
    CREATED: "order.created",
    CANCELLED: "order.cancelled",
  },
} as const;
