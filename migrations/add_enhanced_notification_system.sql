-- Add new fields to the notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS action_taken BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for is_deleted field
CREATE INDEX IF NOT EXISTS idx_notifications_is_deleted ON notifications(is_deleted);

-- Create team chat messages table
CREATE TABLE IF NOT EXISTS team_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create indexes for team chat messages
CREATE INDEX IF NOT EXISTS idx_team_chat_messages_team_id ON team_chat_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_messages_sender_id ON team_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_messages_created_at ON team_chat_messages(created_at);

-- Create board invitations table
CREATE TABLE IF NOT EXISTS board_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'VIEWER',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(board_id, recipient_id, status)
);

-- Create indexes for board invitations
CREATE INDEX IF NOT EXISTS idx_board_invitations_board_id ON board_invitations(board_id);
CREATE INDEX IF NOT EXISTS idx_board_invitations_recipient_id ON board_invitations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_board_invitations_status ON board_invitations(status);

-- Create team invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, recipient_id, status)
);

-- Create indexes for team invitations
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_recipient_id ON team_invitations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);

-- Update user_preferences to ensure it has the necessary fields for notification preferences
-- This is a safe operation as the preferences column is JSONB and can store any structure
COMMENT ON TABLE user_preferences IS 'Stores user preferences including notification settings';
