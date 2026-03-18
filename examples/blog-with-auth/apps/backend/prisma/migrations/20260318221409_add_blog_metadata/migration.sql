-- AlterTable
ALTER TABLE "blog_post" ADD COLUMN     "metadata" JSONB;

-- CreateTable
CREATE TABLE "article" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_pkey" PRIMARY KEY ("id")
);
