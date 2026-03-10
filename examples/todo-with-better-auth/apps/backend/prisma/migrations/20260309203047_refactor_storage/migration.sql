/*
  Warnings:

  - You are about to drop the column `expired_at` on the `file` table. All the data in the column will be lost.
  - You are about to drop the column `referenced_at` on the `file` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "file" DROP COLUMN "expired_at",
DROP COLUMN "referenced_at",
ADD COLUMN     "pending_upload" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "size" DROP NOT NULL;
