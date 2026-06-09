import { vi, describe, it, expect, beforeEach } from "vitest";
import { UserService } from "../../../src/modules/user/services/user.service";
import { UserRepo } from "../../../src/modules/user/repositories/user.repo";
import { prisma } from "../../../src/lib/prisma";
import { cacheRedis } from "../../../src/infra/cache/cache.client";
import { EVENT_NAMES } from "../../../src/events";
import crypto from "crypto";
import AppError from "../../../src/shared/errors/appError";
import type { User } from "@prisma/client";

// Mock Prisma client completely
vi.mock("../../../src/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
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

describe("UserService PURE Unit Tests", () => {
  let userRepo: UserRepo;
  let userService: UserService;
  let mockUser: User;

  beforeEach(() => {
    vi.clearAllMocks();
    userRepo = new UserRepo();
    userService = new UserService(userRepo);
    mockUser = {
      id: "user-123",
      email: "current@example.com",
      name: "Test User",
      pendingEmail: "new@example.com",
      role: "USER",
      isVerified: true,
      isBanned: false,
      isDeleted: false,
      password: "hashed-password",
      passwordChangedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  // ─── UserService.requestEmailChange ────────────────────────────────────────
  describe("UserService.requestEmailChange", () => {
    it("should successfully set pending email and emit event when valid", async () => {
      const targetEmail = "new-valid@example.com";

      // Mock isEmailTaken to be false
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      // Mock setPendingEmail
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: "user-123",
        name: "Test User",
        email: "current@example.com",
      } as any);

      await expect(
        userService.requestEmailChange(mockUser, { email: targetEmail }),
      ).resolves.not.toThrow();

      // Assert database check
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: targetEmail },
        select: { id: true },
      });
      // Assert database write
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { pendingEmail: targetEmail },
      });
      // Assert event emitted
      expect(mockEventBus.emit).toHaveBeenCalledWith(EVENT_NAMES.USER.CHANGE_EMAIL_REQUEST, {
        userId: "user-123",
        email: targetEmail,
        name: "Test User",
      });
    });

    it("should throw AppError when new email is same as current email", async () => {
      await expect(
        userService.requestEmailChange(mockUser, { email: "current@example.com" }),
      ).rejects.toThrow(
        new AppError(400, "New email must be different from current email"),
      );

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should throw AppError when the new email is already taken", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "another-user" } as any);

      await expect(
        userService.requestEmailChange(mockUser, { email: "taken@example.com" }),
      ).rejects.toThrow(new AppError(400, "Email already in use"));

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ─── UserService.verifyEmailChange ─────────────────────────────────────────
  describe("UserService.verifyEmailChange", () => {
    const rawToken = "c".repeat(64);
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    it("should successfully verify email change when token is valid and email not taken", async () => {
      const mockPayload = {
        userId: "user-123",
        name: "Test User",
        email: "new@example.com",
      };

      // Mock Redis Cache Hit
      vi.mocked(cacheRedis.get).mockResolvedValue(JSON.stringify(mockPayload));
      // Mock isEmailTaken to be false
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      // Mock updateEmailAndClearPending update
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      await expect(
        userService.verifyEmailChange(mockUser, { token: rawToken }),
      ).resolves.not.toThrow();

      // Assert Redis token verification & cleanup
      expect(cacheRedis.get).toHaveBeenCalledWith(`action_token:EMAIL_CHANGE:${hashedToken}`);
      expect(cacheRedis.del).toHaveBeenCalledWith(`action_token:EMAIL_CHANGE:${hashedToken}`);
      // Assert DB duplicate email check
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "new@example.com" },
        select: { id: true },
      });
      // Assert DB email update
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          email: "new@example.com",
          pendingEmail: null,
        },
      });
    });

    it("should throw AppError when verification token has expired or is invalid (Cache Miss)", async () => {
      // Mock Redis Cache Miss
      vi.mocked(cacheRedis.get).mockResolvedValue(null);

      await expect(
        userService.verifyEmailChange(mockUser, { token: rawToken }),
      ).rejects.toThrow(new AppError(400, "Token is invalid or has expired"));

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should throw AppError when the token belongs to a different user", async () => {
      const mockPayload = {
        userId: "different-user-456",
        name: "Different User",
        email: "new@example.com",
      };

      // Mock Redis Cache Hit with wrong user ID
      vi.mocked(cacheRedis.get).mockResolvedValue(JSON.stringify(mockPayload));

      await expect(
        userService.verifyEmailChange(mockUser, { token: rawToken }),
      ).rejects.toThrow(new AppError(400, "Token is invalid or has expired"));

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should throw AppError when the user has no pending email change request", async () => {
      const mockPayload = {
        userId: "user-123",
        name: "Test User",
        email: "new@example.com",
      };

      mockUser.pendingEmail = null;

      vi.mocked(cacheRedis.get).mockResolvedValue(JSON.stringify(mockPayload));

      await expect(
        userService.verifyEmailChange(mockUser, { token: rawToken }),
      ).rejects.toThrow(new AppError(400, "No pending email change request found"));

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should throw AppError when the pending email is already taken", async () => {
      const mockPayload = {
        userId: "user-123",
        name: "Test User",
        email: "new@example.com",
      };

      vi.mocked(cacheRedis.get).mockResolvedValue(JSON.stringify(mockPayload));
      // Mock isEmailTaken to be true (returns existing user id)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "another-user" } as any);

      await expect(
        userService.verifyEmailChange(mockUser, { token: rawToken }),
      ).rejects.toThrow(new AppError(400, "Email already in use"));

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
