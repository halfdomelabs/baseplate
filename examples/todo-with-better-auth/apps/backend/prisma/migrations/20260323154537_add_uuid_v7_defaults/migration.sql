-- AlterTable
ALTER TABLE "account" ALTER COLUMN "id" SET DEFAULT uuidv7();

-- AlterTable
ALTER TABLE "billing_account" ALTER COLUMN "id" SET DEFAULT uuidv7();

-- AlterTable
ALTER TABLE "billing_subscription" ALTER COLUMN "id" SET DEFAULT uuidv7();

-- AlterTable
ALTER TABLE "file" ALTER COLUMN "id" SET DEFAULT uuidv7();

-- AlterTable
ALTER TABLE "session" ALTER COLUMN "id" SET DEFAULT uuidv7();

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "id" SET DEFAULT uuidv7();
