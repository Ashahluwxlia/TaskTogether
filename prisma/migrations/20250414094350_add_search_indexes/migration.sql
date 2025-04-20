-- CreateIndex
CREATE INDEX "idx_boards_name_search" ON "boards"("name");

-- CreateIndex
CREATE INDEX "idx_boards_description_search" ON "boards"("description");

-- CreateIndex
CREATE INDEX "idx_comments_content_search" ON "comments"("content");

-- CreateIndex
CREATE INDEX "idx_labels_name_search" ON "labels"("name");

-- CreateIndex
CREATE INDEX "idx_task_attachments_name_search" ON "task_attachments"("name");

-- CreateIndex
CREATE INDEX "idx_tasks_title_search" ON "tasks"("title");

-- CreateIndex
CREATE INDEX "idx_tasks_description_search" ON "tasks"("description");

-- CreateIndex
CREATE INDEX "idx_users_name_search" ON "users"("name");

-- CreateIndex
CREATE INDEX "idx_users_email_search" ON "users"("email");
