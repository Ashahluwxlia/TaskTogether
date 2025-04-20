-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "action_taken" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "email_sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "team_chat_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "team_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "board_id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'VIEWER',
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "board_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_team_chat_messages_team_id" ON "team_chat_messages"("team_id");

-- CreateIndex
CREATE INDEX "idx_team_chat_messages_sender_id" ON "team_chat_messages"("sender_id");

-- CreateIndex
CREATE INDEX "idx_team_chat_messages_created_at" ON "team_chat_messages"("created_at");

-- CreateIndex
CREATE INDEX "idx_board_invitations_board_id" ON "board_invitations"("board_id");

-- CreateIndex
CREATE INDEX "idx_board_invitations_recipient_id" ON "board_invitations"("recipient_id");

-- CreateIndex
CREATE INDEX "idx_board_invitations_status" ON "board_invitations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "board_invitations_board_id_recipient_id_status_key" ON "board_invitations"("board_id", "recipient_id", "status");

-- CreateIndex
CREATE INDEX "idx_team_invitations_team_id" ON "team_invitations"("team_id");

-- CreateIndex
CREATE INDEX "idx_team_invitations_recipient_id" ON "team_invitations"("recipient_id");

-- CreateIndex
CREATE INDEX "idx_team_invitations_status" ON "team_invitations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "team_invitations_team_id_recipient_id_status_key" ON "team_invitations"("team_id", "recipient_id", "status");

-- CreateIndex
CREATE INDEX "idx_notifications_is_deleted" ON "notifications"("is_deleted");

-- AddForeignKey
ALTER TABLE "team_chat_messages" ADD CONSTRAINT "team_chat_messages_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_chat_messages" ADD CONSTRAINT "team_chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_invitations" ADD CONSTRAINT "board_invitations_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_invitations" ADD CONSTRAINT "board_invitations_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_invitations" ADD CONSTRAINT "board_invitations_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
