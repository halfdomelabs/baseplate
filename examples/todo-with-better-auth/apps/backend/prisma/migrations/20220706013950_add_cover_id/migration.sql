-- AlterTable
ALTER TABLE "todo_item" ADD COLUMN     "assignee_id" UUID;

-- AlterTable
ALTER TABLE "todo_list" ADD COLUMN     "cover_photo_id" UUID;

-- AddForeignKey
ALTER TABLE "todo_item" ADD CONSTRAINT "todo_item_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "todo_list" ADD CONSTRAINT "todo_list_cover_photo_id_fkey" FOREIGN KEY ("cover_photo_id") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE RESTRICT;
