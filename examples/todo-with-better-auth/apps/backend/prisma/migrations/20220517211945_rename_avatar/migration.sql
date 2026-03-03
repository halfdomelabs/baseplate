-- AlterTable
ALTER TABLE "user_profile" ADD COLUMN     "avatar_id" UUID;

-- CreateTable
CREATE TABLE "file" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category" TEXT NOT NULL,
    "adapter" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "should_delete" BOOLEAN NOT NULL,
    "is_used" BOOLEAN NOT NULL,
    "uploader_id" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_avatar_id_fkey" FOREIGN KEY ("avatar_id") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE RESTRICT;
