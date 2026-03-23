-- DropForeignKey
ALTER TABLE "file" DROP CONSTRAINT "file_uploader_id_fkey";

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE RESTRICT;
