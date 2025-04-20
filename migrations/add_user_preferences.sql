-- Create user_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS "user_preferences" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "preferences" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add index on user_id
CREATE INDEX IF NOT EXISTS "user_preferences_user_id_idx" ON "user_preferences"("user_id");
