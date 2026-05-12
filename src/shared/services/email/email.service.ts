import ejs from "ejs";
import path from "path";
import { IEmailProvider } from "../../../infra/email/email-provider.interface";
import {
  WelcomeVerifyEmailData,
  VerifyEmailData,
  ForgotPasswordEmailData,
  InvoiceEmailData,
  OrderCancelledEmailData,
  PasswordChangedEmailData,
  ChangeEmailData,
} from "./email.types";

export class EmailService {
  constructor(private provider: IEmailProvider) {}

  private getTemplatePath(name: string): string {
    return path.join(__dirname, "templates", name);
  }

  private async compile(template: string, data: object): Promise<string> {
    const templatePath = this.getTemplatePath(template);
    return ejs.renderFile(templatePath, data);
  }

  async sendWelcomeVerify(data: WelcomeVerifyEmailData): Promise<void> {
    const html = await this.compile("welcome-verify.ejs", data);
    await this.provider.send({
      to: data.email,
      subject: "Welcome — please verify your email",
      html,
    });
  }

  async sendVerification(data: VerifyEmailData): Promise<void> {
    const html = await this.compile("verify-email.ejs", data);
    await this.provider.send({
      to: data.email,
      subject: "Verify your email address",
      html,
    });
  }

  async sendEmailChange(data: ChangeEmailData): Promise<void> {
    const html = await this.compile("change-email.ejs", data);
    await this.provider.send({
      to: data.email,
      subject: "Verify your new email address",
      html,
    });
  }

  async sendForgotPassword(data: ForgotPasswordEmailData): Promise<void> {
    const html = await this.compile("forgot-password.ejs", data);
    await this.provider.send({
      to: data.email,
      subject: "Reset your password",
      html,
    });
  }

  async sendInvoice(data: InvoiceEmailData): Promise<void> {
    const html = await this.compile("invoice.ejs", data);
    await this.provider.send({
      to: data.email,
      subject: `Your invoice for order #${data.orderId}`,
      html,
    });
  }

  async sendOrderCancelled(data: OrderCancelledEmailData): Promise<void> {
    const html = await this.compile("order-cancelled.ejs", data);
    await this.provider.send({
      to: data.email,
      subject: `Your order #${data.orderId} has been cancelled`,
      html,
    });
  }

  async sendPasswordChanged(data: PasswordChangedEmailData): Promise<void> {
    const html = await this.compile("password-changed.ejs", data);
    await this.provider.send({
      to: data.email,
      subject: "Your password was changed",
      html,
    });
  }
}
