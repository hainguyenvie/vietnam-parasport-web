-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_slug_key" ON "Lesson"("slug");
