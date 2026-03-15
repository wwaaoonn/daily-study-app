ALTER TABLE "DailyDelivery"
ADD COLUMN "answer_token_hash" TEXT;

CREATE UNIQUE INDEX "DailyDelivery_answer_token_hash_key"
ON "DailyDelivery"("answer_token_hash");
