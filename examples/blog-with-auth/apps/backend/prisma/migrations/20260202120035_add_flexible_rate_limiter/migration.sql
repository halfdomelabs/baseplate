-- CreateTable
CREATE TABLE "rate_limiter_flexible" (
    "key" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "expire" TIMESTAMP(3),

    CONSTRAINT "rate_limiter_flexible_pkey" PRIMARY KEY ("key")
);
