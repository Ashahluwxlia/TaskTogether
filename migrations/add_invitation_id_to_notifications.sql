-- Add invitation_id column to notifications table
ALTER TABLE notifications ADD COLUMN invitation_id UUID;

-- Add index for better performance
CREATE INDEX idx_notifications_invitation_id ON notifications(invitation_id);
