-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aiAutoTrade" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aiMinConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7;

-- CreateTable
CREATE TABLE "AiTradeLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "marketRegime" TEXT,
    "keyRisks" TEXT,
    "entryLow" DOUBLE PRECISION,
    "entryHigh" DOUBLE PRECISION,
    "stopLoss" DOUBLE PRECISION,
    "riskReward" DOUBLE PRECISION,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "txHash" TEXT,
    "executionError" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "technicalData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiTradeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiTradeLog_userId_idx" ON "AiTradeLog"("userId");

-- CreateIndex
CREATE INDEX "AiTradeLog_pair_idx" ON "AiTradeLog"("pair");

-- CreateIndex
CREATE INDEX "AiTradeLog_createdAt_idx" ON "AiTradeLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AiTradeLog" ADD CONSTRAINT "AiTradeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
