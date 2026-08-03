-- CreateTable
CREATE TABLE "blog_post_like" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_post_like_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blog_post_like_post_id_created_at_idx" ON "blog_post_like"("post_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "blog_post_like_post_id_user_id_key" ON "blog_post_like"("post_id", "user_id");

-- AddForeignKey
ALTER TABLE "blog_post_like" ADD CONSTRAINT "blog_post_like_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_post"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "blog_post_like" ADD CONSTRAINT "blog_post_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE RESTRICT;
