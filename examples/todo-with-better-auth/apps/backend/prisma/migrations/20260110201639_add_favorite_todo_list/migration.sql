-- AlterTable
ALTER TABLE "user_profile" ADD COLUMN     "favorite_todo_list_id" UUID;

-- AddForeignKey
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_favorite_todo_list_id_fkey" FOREIGN KEY ("favorite_todo_list_id") REFERENCES "todo_list"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
