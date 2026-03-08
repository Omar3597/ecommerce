/*
  Warnings:

  - A unique constraint covering the columns `[userId,type]` on the table `short_tokens` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "refresh_token_expiresAt_idx";

-- DropIndex
DROP INDEX "refresh_token_token_key";

-- DropIndex
DROP INDEX "refresh_token_userId_idx";

-- DropIndex
DROP INDEX "refresh_token_userId_key";

-- CreateIndex
CREATE INDEX "refresh_token_userId_expiresAt_idx" ON "refresh_token"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "short_tokens_userId_type_key" ON "short_tokens"("userId", "type");
