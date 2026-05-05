export interface IMailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface IEmailProvider {
  send(options: IMailOptions): Promise<void>;
}
