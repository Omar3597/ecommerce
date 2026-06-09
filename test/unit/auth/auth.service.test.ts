import { vi, describe, it, expect, beforeEach } from "vitest";
import { IdentityService } from "../../../src/modules/auth/services/identity.service";
import { PasswordService } from "../../../src/modules/auth/services/password.service";
import { AuthRepo } from "../../../src/modules/auth/repositories/auth.repo";
import { prisma } from "../../../src/lib/prisma";
import { cacheRedis } from "../../../src/infra/cache/cache.client";
import { EVENT_NAMES } from "../../../src/events";
import crypto from "crypto";
import AppError from "../../../src/shared/errors/appError";

// Mock Prisma client completely
vi.mock("../../../src/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(async (promises) => Promise.all(promises)),
  },
}));

// Mock Redis client completely
vi.mock("../../../src/infra/cache/cache.client", () => ({
  cacheRedis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    scan: vi.fn(),
  },
  queueRedis: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Shared EventBus mock instance
const mockEventBus = {
  emit: vi.fn(),
  on: vi.fn(),
};

// Mock EventBus
vi.mock("../../../src/infra/event-bus", () => ({
  EventBus: {
    getInstance: () => mockEventBus,
  },
}));

// Mock bcrypt
vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("mocked-hashed-password"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

describe("IdentityService & PasswordService PURE Unit Tests", () => {
  let authRepo: AuthRepo;
  let identityService: IdentityService;
  let passwordService: PasswordService;

  beforeEach(() => {
    vi.clearAllMocks();
    authRepo = new AuthRepo();
    identityService = new IdentityService(authRepo);
    passwordService = new PasswordService(authRepo);
  });

  // ─── IdentityService.verifyEmail ───────────────────────────────────────────
  describe("IdentityService.verifyEmail", () => {
    const rawToken = "a".repeat(64);
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    it("should successfully verify email when token is valid (Cache Hit)", async () => {
      const mockPayload = {
        userId: "user-123",
        name: "Test User",
        email: "test@example.com",
      };

      // Mock Redis Cache Hit
      vi.mocked(cacheRedis.get).mockResolvedValue(JSON.stringify(mockPayload));
      // Mock database write
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      await expect(identityService.verifyEmail(rawToken)).resolves.not.toThrow();

      // Assert Redis client was read with correct key
      expect(cacheRedis.get).toHaveBeenCalledWith(`action_token:VERIFICATION:${hashedToken}`);
      // Assert Redis token was consumed
      expect(cacheRedis.del).toHaveBeenCalledWith(`action_token:VERIFICATION:${hashedToken}`);
      // Assert database write
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { isVerified: true },
      });
    });

    it("should throw AppError when token has expired or is invalid (Cache Miss)", async () => {
      // Mock Redis Cache Miss
      vi.mocked(cacheRedis.get).mockResolvedValue(null);

      await expect(identityService.verifyEmail(rawToken)).rejects.toThrow(
        new AppError(400, "Verification token is invalid or has expired"),
      );

      // Verify no DB write occurred
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ─── PasswordService.forgotPassword ────────────────────────────────────────
  describe("PasswordService.forgotPassword", () => {
    it("should trigger password reset event when user is active", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        isBanned: false,
        isDeleted: false,
        isVerified: true,
      };

      // Mock database lookup for user
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as any);

      await expect(passwordService.forgotPassword({ email: "test@example.com" })).resolves.not.toThrow();

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: "test@example.com",
          isBanned: false,
          isDeleted: false,
          isVerified: true,
        },
      });
      // Assert event was emitted to trigger notification email
      expect(mockEventBus.emit).toHaveBeenCalledWith(EVENT_NAMES.USER.FORGOT_PASSWORD, {
        userId: "user-123",
        email: "test@example.com",
        name: "Test User",
        expiresInMinutes: 10,
      });
    });

    it("should return early without event emission when user is inactive or not found", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      await expect(passwordService.forgotPassword({ email: "notfound@example.com" })).resolves.not.toThrow();

      expect(prisma.user.findFirst).toHaveBeenCalledTimes(1);
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });
  });

  // ─── PasswordService.resetPassword ─────────────────────────────────────────
  describe("PasswordService.resetPassword", () => {
    const rawToken = "b".repeat(64);
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    it("should successfully reset password when token is valid (Cache Hit)", async () => {
      const mockPayload = {
        userId: "user-123",
        name: "Test User",
        email: "test@example.com",
      };

      // Mock Redis Cache Hit
      vi.mocked(cacheRedis.get).mockResolvedValue(JSON.stringify(mockPayload));
      // Mock DB updates
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);
      vi.mocked(prisma.refreshToken.deleteMany).mockResolvedValue({ count: 1 });

      await expect(passwordService.resetPassword(rawToken, "NewSecurePassword123#")).resolves.not.toThrow();

      // Assert Redis token check & delete
      expect(cacheRedis.get).toHaveBeenCalledWith(`action_token:PASSWORD_RESET:${hashedToken}`);
      expect(cacheRedis.del).toHaveBeenCalledWith(`action_token:PASSWORD_RESET:${hashedToken}`);
      // Assert DB transactions
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-123" },
          data: expect.objectContaining({
            password: "mocked-hashed-password",
          }),
        }),
      );
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-123" },
      });
    });

    it("should throw AppError when token has expired or is invalid (Cache Miss)", async () => {
      // Mock Redis Cache Miss
      vi.mocked(cacheRedis.get).mockResolvedValue(null);

      await expect(passwordService.resetPassword(rawToken, "NewSecurePassword123#")).rejects.toThrow(
        new AppError(400, "Token is invalid or has expired"),
      );

      // Verify no DB update occurred
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
