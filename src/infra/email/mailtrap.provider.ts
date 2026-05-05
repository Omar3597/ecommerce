import nodemailer from "nodemailer";
import { IEmailProvider, IMailOptions } from "./email-provider.interface";
import { getConfig } from "../../config/env";

export class MailtrapProvider implements IEmailProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    const config = getConfig();
    this.transporter = nodemailer.createTransport({
      host: config.MAILTRAP_HOST,
      port: config.MAILTRAP_PORT,
      auth: {
        user: config.MAILTRAP_USER,
        pass: config.MAILTRAP_PASS,
      },
    });
  }

  async send(options: IMailOptions): Promise<void> {
    const config = getConfig();
    const fromStr = options.from || `"${config.EMAIL_FROM_NAME}" <${config.EMAIL_FROM_ADDRESS}>`;

    await this.transporter.sendMail({
      from: fromStr,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }
}
