import { Queue } from "bullmq";
import { IEventBus } from "../../infra/event-bus";
import { EVENT_NAMES } from "../event.constants";
import { JOB_NAMES } from "../../infra/queue";
import {
  UserSignupPayload,
  UserRequestVerifyPayload,
  UserForgotPasswordPayload,
  UserPasswordChangedPayload,
} from "../event.types";

export class UserSubscriber {
  constructor(
    private eventBus: IEventBus,
    private emailQueue: Queue,
  ) {}

  public register(): void {
    this.eventBus.on(
      EVENT_NAMES.USER.SIGNUP,
      async (payload: UserSignupPayload) => {
        await this.emailQueue.add(JOB_NAMES.EMAIL.WELCOME_VERIFY, payload);
      },
    );

    this.eventBus.on(
      EVENT_NAMES.USER.REQUEST_VERIFY,
      async (payload: UserRequestVerifyPayload) => {
        await this.emailQueue.add(JOB_NAMES.EMAIL.VERIFICATION, payload);
      },
    );

    this.eventBus.on(
      EVENT_NAMES.USER.FORGOT_PASSWORD,
      async (payload: UserForgotPasswordPayload) => {
        await this.emailQueue.add(JOB_NAMES.EMAIL.FORGOT_PASSWORD, payload);
      },
    );

    this.eventBus.on(
      EVENT_NAMES.USER.PASSWORD_CHANGED,
      async (payload: UserPasswordChangedPayload) => {
        await this.emailQueue.add(JOB_NAMES.EMAIL.PASSWORD_CHANGED, payload);
      },
    );
  }
}
