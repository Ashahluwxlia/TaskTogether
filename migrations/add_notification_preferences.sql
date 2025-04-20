-- Add new notification preferences columns to user_preferences table
-- This is a safe migration as it only adds new JSON fields to the preferences column

-- First, ensure all users have a preferences record
INSERT INTO user_preferences (id, user_id, preferences, created_at, updated_at)
SELECT 
 gen_random_uuid(), 
 u.id, 
 '{}', 
 NOW(), 
 NOW()
FROM 
 users u
LEFT JOIN 
 user_preferences up ON u.id = up.user_id
WHERE 
 up.id IS NULL;

-- Update existing preferences to include the new fields if they don't exist
UPDATE user_preferences
SET preferences = preferences || 
 jsonb_build_object(
   'taskAssigned', COALESCE((preferences->>'taskAssigned')::boolean, true),
   'taskDueSoon', COALESCE((preferences->>'taskDueSoon')::boolean, true),
   'taskComments', COALESCE((preferences->>'taskComments')::boolean, true),
   'mentions', COALESCE((preferences->>'mentions')::boolean, true),
   'teamInvitations', COALESCE((preferences->>'teamInvitations')::boolean, true),
   'boardShared', COALESCE((preferences->>'boardShared')::boolean, true)
 );
