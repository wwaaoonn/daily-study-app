ALTER TABLE "DailyDelivery"
ADD COLUMN "delivery_date" TEXT NOT NULL DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD'),
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN "error_message" TEXT;

CREATE UNIQUE INDEX "DailyDelivery_user_id_delivery_date_key"
ON "DailyDelivery"("user_id", "delivery_date");

CREATE INDEX "DailyDelivery_delivery_date_status_idx"
ON "DailyDelivery"("delivery_date", "status");
