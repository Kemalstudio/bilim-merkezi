-- Prices move from US dollars to Turkmen manat (TMT). Every amount in the database is now TMT;
-- Stripe is still charged in USD, converted at TMT_PER_USD (see src/lib/money.ts).
--
-- The old catalogue ran 45–249 USD. It is rescaled as price * 20 + 100, rounded to 50 TMT and
-- never below 1000 TMT, which keeps the courses in the same order and the same proportions:
-- 45 USD -> 1000 TMT, 90 USD -> 1900 TMT, 249 USD -> 5100 TMT.

UPDATE "courses"
SET "price" = GREATEST(1000, ROUND(("price" * 20 + 100) / 50) * 50);

UPDATE "courses"
SET "discountPrice" = GREATEST(1000, ROUND(("discountPrice" * 20 + 100) / 50) * 50)
WHERE "discountPrice" IS NOT NULL;

-- Past payments follow their courses, so revenue figures stay comparable. Free enrolments stay 0.
UPDATE "payments"
SET "amount" = GREATEST(1000, ROUND(("amount" * 20 + 100) / 50) * 50)
WHERE "amount" > 0;

-- A fixed promo discount was a dollar amount; a percentage needs no change.
UPDATE "promo_codes"
SET "discountValue" = ROUND("discountValue" * 20)
WHERE "discountType" = 'FIXED';
