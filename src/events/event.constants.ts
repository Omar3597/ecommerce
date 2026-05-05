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
    IMAGE_ADDED: "product.image_added",
    IMAGE_REMOVED: "product.image_removed",
    DELETED: "product.deleted",
  },
} as const;
