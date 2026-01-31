/*
  Warnings:

  - You are about to drop the column `isActive` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "isActive",
ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
