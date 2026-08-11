-- Failed-guess counter for short emailed sign-in codes.
--
-- Previously tracked inside the `metadata` JSON column, which had to be read
-- and rewritten in two statements; simultaneous guesses could then read the
-- same value and collapse into a single increment. A real column can be
-- incremented in the database, so every guess costs a point.
--
-- Defaulted rather than nullable: rows written before this migration are
-- split-token verifications, which have no attempt budget at all — a single
-- wrong verifier deletes them — so 0 is accurate for every existing row.

-- AlterTable
ALTER TABLE "auth_verification" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
