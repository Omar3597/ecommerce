export interface WelcomeVerifyEmailData {
  name: string;
  email: string;
  verifyUrl: string;
  expiresInMinutes: number;
}

export interface VerifyEmailData {
  name: string;
  email: string;
  verifyUrl: string;
  expiresInMinutes: number;
}

export interface ForgotPasswordEmailData {
  name: string;
  email: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export interface InvoiceEmailData {
  name: string;
  email: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  invoiceUrl?: string;
}

export interface OrderCancelledEmailData {
  name: string;
  email: string;
  orderId: string;
}

export interface PasswordChangedEmailData {
  name: string;
  email: string;
  changedAt: string;
  supportUrl: string;
}
