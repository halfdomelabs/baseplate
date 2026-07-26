-- CreateTable
CREATE TABLE "blog_user_note" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "blog_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_user_note_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "blog_user_note" ADD CONSTRAINT "blog_user_note_blog_id_user_id_fkey" FOREIGN KEY ("blog_id", "user_id") REFERENCES "blog_user"("blog_id", "user_id") ON DELETE CASCADE ON UPDATE RESTRICT;
