-- AlterTable
ALTER TABLE "user" ALTER COLUMN "id" SET DEFAULT uuidv7();

-- AlterTable
ALTER TABLE "user_account" ALTER COLUMN "id" SET DEFAULT uuidv7();

-- AlterTable
ALTER TABLE "user_session" ALTER COLUMN "id" SET DEFAULT uuidv7();
