/*
  Warnings:

  - You are about to drop the column `price` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `orders` table. All the data in the column will be lost.
  - Added the required column `nameSnapshot` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceSnapshot` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingFee` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "price",
ADD COLUMN     "nameSnapshot" VARCHAR(100) NOT NULL,
ADD COLUMN     "priceSnapshot" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "totalAmount",
ADD COLUMN     "shippingFee" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "subtotal" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "total" DECIMAL(10,2) NOT NULL;
