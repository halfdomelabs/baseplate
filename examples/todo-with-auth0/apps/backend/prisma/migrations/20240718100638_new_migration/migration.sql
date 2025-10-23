-- AlterTable
ALTER TABLE "todo_list" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "todo_list_share" (
    "todo_list_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "todo_list_share_pkey" PRIMARY KEY ("todo_list_id","user_id")
);

-- CreateTable
CREATE TABLE "user_image" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "caption" TEXT NOT NULL,

    CONSTRAINT "user_image_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "todo_list_share" ADD CONSTRAINT "todo_list_share_todo_list_id_fkey" FOREIGN KEY ("todo_list_id") REFERENCES "todo_list"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "todo_list_share" ADD CONSTRAINT "todo_list_share_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "user_image" ADD CONSTRAINT "user_image_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "user_image" ADD CONSTRAINT "user_image_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE RESTRICT;
