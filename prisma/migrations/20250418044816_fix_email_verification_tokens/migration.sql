/*
  Warnings:

  - The primary key for the `email_verification_tokens` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `email_verification_tokens` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "email_verification_tokens" DROP CONSTRAINT "email_verification_tokens_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "idx_email_verification_tokens_user_id" ON "email_verification_tokens"("user_id");
