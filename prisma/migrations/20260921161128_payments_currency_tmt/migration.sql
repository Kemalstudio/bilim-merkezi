-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'tmt';

-- Existing rows already hold manat since 20260921140000_prices_usd_to_tmt.
UPDATE "payments" SET "currency" = 'tmt' WHERE "currency" = 'usd';
