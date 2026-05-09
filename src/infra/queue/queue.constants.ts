export enum QUEUE_NAMES {
  EMAIL = "EMAIL",
  IMAGE = "IMAGE",
  ORDER = "ORDER",
  SCHEDULER = "SCHEDULER",
  NOTIFICATION = "NOTIFICATION",
}

export const JOB_NAMES = {
  EMAIL: {
    WELCOME_VERIFY: "welcome_verify",
    VERIFICATION: "verification",
    FORGOT_PASSWORD: "forgot_password",
    INVOICE: "invoice",
    ORDER_CANCELLED: "order_cancelled",
    PASSWORD_CHANGED: "password_changed",
  },
  IMAGE: {
    DELETE: "delete",
    BULK_DELETE: "bulk_delete",
  },
  ORDER: {
    EXPIRE: "expire",
  },
  SCHEDULER: {
    CLEANUP_CARTS: "cleanup_carts",
    CLEANUP_ORDERS: "cleanup_orders",
    CLEANUP_ORPHAN_IMAGES: "cleanup_orphan_images",
    CLEANUP_TOKENS: "cleanup_tokens",
    CLEANUP_USERS: "cleanup_users",
    SIMULATE_SHIPPING: "simulate_shipping",
  },
} as const;
