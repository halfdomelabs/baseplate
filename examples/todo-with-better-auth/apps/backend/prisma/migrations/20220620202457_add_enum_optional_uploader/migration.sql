-- CreateEnum
CREATE TYPE "TodoListStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "file" ALTER COLUMN "uploader_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "todo_list" ADD COLUMN     "status" "TodoListStatus";
