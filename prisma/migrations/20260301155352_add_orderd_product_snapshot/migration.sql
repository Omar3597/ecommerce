/*
  Warnings:

  - You are about to drop the column `nameSnapshot` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `priceSnapshot` on the `order_items` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productSnapshotId]` on the table `order_items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productSnapshotId` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_productId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_orderId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_categoryId_fkey";

-- DropIndex
DROP INDEX "order_items_productId_idx";

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "nameSnapshot",
DROP COLUMN "priceSnapshot",
ADD COLUMN     "productSnapshotId" TEXT NOT NULL,
ALTER COLUMN "productId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ordered_product_snapshot" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "summary" VARCHAR(200) NOT NULL,
    "price" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordered_product_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_items_productSnapshotId_key" ON "order_items"("productSnapshotId");

-- CreateIndex
CREATE INDEX "order_items_productSnapshotId_idx" ON "order_items"("productSnapshotId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productSnapshotId_fkey" FOREIGN KEY ("productSnapshotId") REFERENCES "ordered_product_snapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
