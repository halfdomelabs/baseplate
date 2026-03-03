-- CreateTable
CREATE TABLE "customer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stripe_customer_id" TEXT NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todo_item" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "todo_list_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "todo_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todo_item_attachment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "todo_item_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "todo_item_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todo_item_attachment_tag" (
    "todo_item_attachment_id" UUID NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "todo_item_attachment_tag_pkey" PRIMARY KEY ("todo_item_attachment_id","tag")
);

-- CreateTable
CREATE TABLE "todo_list" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "todo_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT,
    "email" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tokens_not_before" TIMESTAMPTZ(3),
    "password_hash" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "bio" TEXT,

    CONSTRAINT "user_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role" (
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("user_id","role")
);

-- CreateIndex
CREATE UNIQUE INDEX "todo_list_owner_id_name_key" ON "todo_list"("owner_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profile_user_id_key" ON "user_profile"("user_id");

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_id_fkey" FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "todo_item" ADD CONSTRAINT "todo_item_todo_list_id_fkey" FOREIGN KEY ("todo_list_id") REFERENCES "todo_list"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "todo_item_attachment" ADD CONSTRAINT "todo_item_attachment_todo_item_id_fkey" FOREIGN KEY ("todo_item_id") REFERENCES "todo_item"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "todo_item_attachment_tag" ADD CONSTRAINT "todo_item_attachment_tag_todo_item_attachment_id_fkey" FOREIGN KEY ("todo_item_attachment_id") REFERENCES "todo_item_attachment"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "todo_list" ADD CONSTRAINT "todo_list_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE RESTRICT;
