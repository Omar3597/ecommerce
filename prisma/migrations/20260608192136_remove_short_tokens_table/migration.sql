/*
  Warnings:

  - You are about to drop the `short_tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "short_tokens" DROP CONSTRAINT "short_tokens_userId_fkey";

-- DropTable
DROP TABLE "short_tokens";

-- DropEnum
DROP TYPE "TokenType";
