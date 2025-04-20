-- AlterTable
ALTER TABLE "labels" ADD COLUMN     "created_by" UUID;

-- CreateIndex
CREATE INDEX "idx_labels_created_by" ON "labels"("created_by");

-- AddForeignKey
ALTER TABLE "labels" ADD CONSTRAINT "labels_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
