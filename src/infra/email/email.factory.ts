import { IEmailProvider } from "./email-provider.interface";
import { BrevoProvider } from "./brevo.provider";
import { MailtrapProvider } from "./mailtrap.provider";
import { getConfig } from "../../config/env";

export class EmailProviderFactory {
  static create(): IEmailProvider {
    const config = getConfig();

    if (config.EMAIL_PROVIDER === "brevo") {
      return new BrevoProvider();
    } else if (config.EMAIL_PROVIDER === "mailtrap") {
      return new MailtrapProvider();
    }

    throw new Error(`Unknown email provider: ${config.EMAIL_PROVIDER}`);
  }
}
