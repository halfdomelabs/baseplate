/*
  Warnings:

  - A unique constraint covering the columns `[auth0_id]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "user_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "user_auth0_id_key" ON "user"("auth0_id");
