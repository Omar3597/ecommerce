import { vi } from "vitest";

vi.mock("../../src/common/utils/email", () => {
  const Email = vi.fn(function (this: any) {
    this.sendVerificationEmail = vi.fn().mockResolvedValue(undefined);
    this.sendPasswordReset = vi.fn().mockResolvedValue(undefined);
    this.sendReactivationEmail = vi.fn().mockResolvedValue(undefined);
    this.sendEmailChangeVerificationEmail = vi.fn().mockResolvedValue(undefined);
  });

  return { default: Email, Email };
});
