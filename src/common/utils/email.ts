import nodemailer from "nodemailer";
import mjml from "mjml";
import { htmlToText } from "html-to-text";
import { getConfig } from "../../config/env";

const config = getConfig();

export class Email {
  private readonly to: string;
  private readonly firstName: string;
  private readonly url: string;
  private readonly from: string;

  constructor(user: { firstName: string; email: string }, url: string) {
    this.to = user.email;
    this.firstName = user.firstName;
    this.url = url;
    this.from = `Omar Elgouhary <noreply@example.com>`;
  }

  private newTransport() {
    return nodemailer.createTransport({
      host: `${config.MAIL_HOST}`,
      port: config.MAIL_PORT,
      auth: {
        user: config.MAIL_USER,
        pass: config.MAIL_PASSWORD,
      },
    });
  }

  private async send(template: string, subject: string) {
    // This is important for email clients that don't support HTML and to improve spam scores
    const text = htmlToText(template, {
      wordwrap: 130,
    });

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html: template,
      text: text,
    };

    try {
      const transporter = this.newTransport();
      await transporter.sendMail(mailOptions);
    } catch (err) {
      throw new Error(`Error sending email: ${err}`);
    }
  }

  private generateStyledHTML(message: string, buttonText: string) {
    // Here we use MJML to create a responsive HTML template
    const mjmlTemplate = `
      <mjml>
        <mj-body background-color="#f4f4f4">
          <mj-section background-color="#ffffff" border-radius="8px" padding="20px">
            <mj-column>
              <mj-text font-size="24px" font-weight="bold" color="#333">
                Hi ${this.firstName},
              </mj-text>
              
              <mj-text font-size="16px" color="#555" line-height="24px" padding-top="15px">
                ${message}
              </mj-text>
              
              <mj-button
                href="${this.url}"
                background-color="#007bff"
                color="white"
                font-size="16px"
                border-radius="4px"
                padding="15px 25px"
                font-weight="bold"
                inner-padding="12px 25px"
              >
                ${buttonText}
              </mj-button>
              
              <mj-text font-size="14px" color="#777" padding-top="20px">
                If you didn't request this action, you can safely ignore this email.
              </mj-text>
              
              <mj-divider border-width="1px" border-color="#e0e0e0" padding="20px 0"></mj-divider>
              
              <mj-text font-size="12px" color="#999" align="center">
                &copy; 2025 ${this.from}. All rights reserved.
              </mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;

    // Convert MJML to HTML
    const { html, errors } = mjml(mjmlTemplate);

    if (errors && errors.length > 0) {
      console.error("MJML Errors:", errors);
    }

    return html;
  }

  async sendVerificationEmail() {
    const message =
      "Thanks for signing up. To activate your account and get started, please click the button below:";
    const buttonText = "Activate My Account";
    const html = this.generateStyledHTML(message, buttonText);
    await this.send(html, "Activate Your Account (Valid for 10 minutes)");
  }

  async sendPasswordReset() {
    const message =
      "You requested to reset your password. Click the button below to set a new password. (This link is valid for 10 minutes):";
    const buttonText = "Reset Password";
    const html = this.generateStyledHTML(message, buttonText);
    await this.send(html, "Password Reset Request");
  }

  async sendReactivationEmail() {
    const message =
      "You requested to reactivate your account. Click the button below to confirm this action:";
    const buttonText = "Reactivate Account";
    const html = this.generateStyledHTML(message, buttonText);
    await this.send(html, "Reactivate Your Account");
  }

  async sendEmailChangeVerificationEmail() {
    const message =
      "You requested to change your account email. Click the button below to verify your new email address:";
    const buttonText = "Verify New Email";
    const html = this.generateStyledHTML(message, buttonText);
    await this.send(html, "Verify Your New Email Address");
  }
}

export default Email;
