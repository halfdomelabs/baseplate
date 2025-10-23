/*
  Warnings:

  - You are about to drop the column `is_used` on the `file` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `file` table. All the data in the column will be lost.
  - You are about to drop the column `path` on the `file` table. All the data in the column will be lost.
  - You are about to drop the column `should_delete` on the `file` table. All the data in the column will be lost.
  - Added the required column `filename` to the `file` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storage_path` to the `file` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "file" DROP COLUMN "is_used",
DROP COLUMN "name",
DROP COLUMN "path",
DROP COLUMN "should_delete",
ADD COLUMN     "encoding" TEXT,
ADD COLUMN     "expired_at" TIMESTAMPTZ(3),
ADD COLUMN     "filename" TEXT NOT NULL,
ADD COLUMN     "referenced_at" TIMESTAMPTZ(3),
ADD COLUMN     "storage_path" TEXT NOT NULL;
