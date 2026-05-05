import { BrevoClient } from "@getbrevo/brevo";
import { IEmailProvider, IMailOptions } from "./email-provider.interface";
import { getConfig } from "../../config/env";

const config = getConfig();

export class BrevoProvider implements IEmailProvider {
  private client: BrevoClient;

  constructor() {
    this.client = new BrevoClient({
      apiKey: config.BREVO_API_KEY,
    });
  }

  async send(options: IMailOptions): Promise<void> {
    const config = getConfig();
    const fromEmail = config.EMAIL_FROM_ADDRESS;
    const fromName = config.EMAIL_FROM_NAME;

    await this.client.transactionalEmails.sendTransacEmail({
      subject: options.subject,
      htmlContent: options.html,
      sender: { name: fromName, email: fromEmail },
      to: [{ email: options.to }],
    });
  }
}
