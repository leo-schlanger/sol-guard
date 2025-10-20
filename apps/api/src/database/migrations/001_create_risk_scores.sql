-- CreateTable
CREATE TABLE "RiskScores" (
  "id" SERIAL PRIMARY KEY,
  "tokenAddress" TEXT NOT NULL,
  "score" DECIMAL(5,2) NOT NULL,
  "timestamp" TIMESTAMP NOT NULL,
  "breakdown" JSONB NOT NULL
);

-- CreateIndex
CREATE INDEX "RiskScores_tokenAddress_idx" ON "RiskScores"("tokenAddress");
CREATE INDEX "RiskScores_timestamp_idx" ON "RiskScores"("timestamp");

-- Add constraints
ALTER TABLE "RiskScores" ADD CONSTRAINT "RiskScores_tokenAddress_check" 
  CHECK (length("tokenAddress") >= 32 AND length("tokenAddress") <= 44);
ALTER TABLE "RiskScores" ADD CONSTRAINT "RiskScores_score_check" 
  CHECK ("score" >= 0 AND "score" <= 100);
