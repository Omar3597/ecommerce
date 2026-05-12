export interface UserSignupPayload {
  userId: string;
  email: string;
  name: string;
  expiresInMinutes: number;
}

export interface UserRequestVerifyPayload {
  userId: string;
  email: string;
  name: string;
  expiresInMinutes: number;
}

export interface UserForgotPasswordPayload {
  userId: string;
  email: string;
  name: string;
  expiresInMinutes: number;
}

export interface UserPasswordChangedPayload {
  userId: string;
  email: string;
  name: string;
  changedAt: string;
  supportUrl: string;
}

export interface UserChangeEmailPayload {
  userId: string;
  email: string;
  name: string;
}

export interface OrderCreatedPayload {
  orderId: string;
  userId: string;
  email: string;
  name: string;
  totalAmount: number;
  items: any[];
}

export interface OrderConfirmedPayload {
  orderId: string;
  userId: string;
}

export interface OrderCancelledPayload {
  orderId: string;
  userId: string;
  email: string;
  name: string;
}

export interface OrderExpirePayload {
  orderId: string;
}

export interface PaymentCompletedPayload {
  paymentId: string;
  orderId: string;
  userId: string;
  email: string;
  name: string;
  amount: number;
  currency: string;
  invoiceUrl?: string;
}

export interface ProductImageRemovedPayload {
  publicId: string;
}

export interface ProductDeletedPayload {
  publicIds: string[];
}
