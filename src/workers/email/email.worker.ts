import { Job, Worker } from "bullmq";
import { IWorker } from "../../infra/queue";
import { WorkerFactory } from "../../infra/queue";
import { QUEUE_NAMES, JOB_NAMES } from "../../infra/queue";
import { EmailService } from "../../shared/services/email/email.service";
import { IEmailStrategy } from "./email.strategy.interface";
import { WelcomeVerifyEmailStrategy } from "./strategies/welcome-verify.strategy";
import { VerifyEmailStrategy } from "./strategies/verify-email.strategy";
import { ForgotPasswordEmailStrategy } from "./strategies/forgot-password.strategy";
import { InvoiceEmailStrategy } from "./strategies/invoice.strategy";
import { OrderCancelledEmailStrategy } from "./strategies/order-cancelled.strategy";
import { PasswordChangedEmailStrategy } from "./strategies/password-changed.strategy";

export class EmailWorker implements IWorker {
  private worker?: Worker;
  private strategies: Map<string, IEmailStrategy> = new Map();

  constructor(
    private workerFactory: WorkerFactory,
    private emailService: EmailService,
  ) {
    this.strategies.set(
      JOB_NAMES.EMAIL.WELCOME_VERIFY,
      new WelcomeVerifyEmailStrategy(this.emailService),
    );
    this.strategies.set(
      JOB_NAMES.EMAIL.VERIFICATION,
      new VerifyEmailStrategy(this.emailService),
    );
    this.strategies.set(
      JOB_NAMES.EMAIL.FORGOT_PASSWORD,
      new ForgotPasswordEmailStrategy(this.emailService),
    );
    this.strategies.set(
      JOB_NAMES.EMAIL.INVOICE,
      new InvoiceEmailStrategy(this.emailService),
    );
    this.strategies.set(
      JOB_NAMES.EMAIL.ORDER_CANCELLED,
      new OrderCancelledEmailStrategy(this.emailService),
    );
    this.strategies.set(
      JOB_NAMES.EMAIL.PASSWORD_CHANGED,
      new PasswordChangedEmailStrategy(this.emailService),
    );
  }

  private async process(job: Job): Promise<void> {
    const strategy = this.strategies.get(job.name);
    if (!strategy) {
      throw new Error(`No strategy registered for job: ${job.name}`);
    }
    await strategy.execute(job);
  }

  public start(): void {
    this.worker = this.workerFactory.create(
      QUEUE_NAMES.EMAIL,
      this.process.bind(this),
    );
  }

  public async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
