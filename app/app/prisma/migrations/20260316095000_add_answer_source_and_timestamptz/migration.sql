ALTER TABLE "Answer"
ADD COLUMN "source" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN "source_detail" TEXT;

UPDATE "Answer"
SET "source" = 'legacy'
WHERE "source" = 'unknown';

ALTER TABLE "User"
ALTER COLUMN "email_verified_at" TYPE TIMESTAMPTZ(3) USING "email_verified_at" AT TIME ZONE 'UTC',
ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "Answer"
ALTER COLUMN "answered_at" TYPE TIMESTAMPTZ(3) USING "answered_at" AT TIME ZONE 'UTC';

ALTER TABLE "DailyDelivery"
ALTER COLUMN "sent_at" TYPE TIMESTAMPTZ(3) USING "sent_at" AT TIME ZONE 'UTC';

ALTER TABLE "Session"
ALTER COLUMN "expires_at" TYPE TIMESTAMPTZ(3) USING "expires_at" AT TIME ZONE 'UTC',
ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "VerificationToken"
ALTER COLUMN "expires_at" TYPE TIMESTAMPTZ(3) USING "expires_at" AT TIME ZONE 'UTC',
ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';
