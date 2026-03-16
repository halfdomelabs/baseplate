/*
  Warnings:

  - A unique constraint covering the columns `[billing_account_id]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "BillingSubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'UNPAID', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'PAUSED');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "billing_account_id" UUID;

-- CreateTable
CREATE TABLE "billing_account" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stripe_customer_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_subscription" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "billing_account_id" UUID NOT NULL,
    "plan_key" TEXT NOT NULL,
    "status" "BillingSubscriptionStatus" NOT NULL,
    "stripe_subscription_id" TEXT NOT NULL,
    "current_period_start" TIMESTAMPTZ(3) NOT NULL,
    "current_period_end" TIMESTAMPTZ(3) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_account_stripe_customer_id_key" ON "billing_account"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_subscription_stripe_subscription_id_key" ON "billing_subscription"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_billing_account_id_key" ON "user"("billing_account_id");

-- AddForeignKey
ALTER TABLE "billing_subscription" ADD CONSTRAINT "billing_subscription_billing_account_id_fkey" FOREIGN KEY ("billing_account_id") REFERENCES "billing_account"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_billing_account_id_fkey" FOREIGN KEY ("billing_account_id") REFERENCES "billing_account"("id") ON DELETE SET NULL ON UPDATE RESTRICT;
