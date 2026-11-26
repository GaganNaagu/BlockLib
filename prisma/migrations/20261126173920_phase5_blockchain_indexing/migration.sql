-- CreateEnum
CREATE TYPE "TxStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "walletNonce" TEXT;

-- CreateTable
CREATE TABLE "BookCopy" (
    "id" TEXT NOT NULL,
    "chainCopyId" INTEGER NOT NULL,
    "bookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookCopy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockchainTransaction" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "fromAddress" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "TxStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockchainTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockchainEvent" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "eventName" TEXT NOT NULL,
    "entityId" TEXT,
    "blockNumber" INTEGER NOT NULL,
    "blockTimestamp" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockchainEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookCopy_chainCopyId_key" ON "BookCopy"("chainCopyId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainTransaction_txHash_key" ON "BlockchainTransaction"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainEvent_txHash_logIndex_key" ON "BlockchainEvent"("txHash", "logIndex");

-- AddForeignKey
ALTER TABLE "BookCopy" ADD CONSTRAINT "BookCopy_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
