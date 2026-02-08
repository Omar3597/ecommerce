-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "fullName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "street" VARCHAR(200) NOT NULL,
    "building" VARCHAR(100),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_address_snapshots" (
    "id" TEXT NOT NULL,
    "fullName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "street" VARCHAR(200) NOT NULL,
    "building" VARCHAR(100),
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_address_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "addresses_userId_idx" ON "addresses"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "order_address_snapshots_orderId_key" ON "order_address_snapshots"("orderId");

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_address_snapshots" ADD CONSTRAINT "order_address_snapshots_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
