"use server"

import { executeQuery } from "@/lib/db"
import { logout } from "@/lib/auth"

export async function deleteAccount(userId: string) {
  try {
    // Start a transaction to ensure all related data is deleted
    await executeQuery("BEGIN", [])

    try {
      console.log("Deleting account for user ID:", userId)

      // Delete user preferences
      await executeQuery("DELETE FROM user_preferences WHERE user_id = $1", [userId])

      // Delete email verification tokens
      await executeQuery("DELETE FROM email_verification_tokens WHERE user_id = $1", [userId])

      // Delete password reset tokens
      await executeQuery("DELETE FROM password_reset_tokens WHERE user_id = $1", [userId])

      // Delete notifications
      await executeQuery("DELETE FROM notifications WHERE user_id = $1", [userId])

      // Delete team memberships
      await executeQuery("DELETE FROM team_members WHERE user_id = $1", [userId])

      // Delete board memberships
      await executeQuery("DELETE FROM board_members WHERE user_id = $1", [userId])

      // Delete comments
      await executeQuery("DELETE FROM comments WHERE author_id = $1", [userId])

      // Handle tasks created by user - archive instead of delete
      // Reassign tasks to system user before archiving
      // Ensure system user exists
      await executeQuery("INSERT INTO users (id, email, name, password) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING", ['00000000-0000-0000-0000-000000000000', 'system@TaskTogether.com', 'System User', 'SystemPassword123!'])

      // Reassign tasks to system user and archive them
      await executeQuery("UPDATE tasks SET created_by = $1 WHERE created_by = $2", ['00000000-0000-0000-0000-000000000000', userId])
      await executeQuery("UPDATE tasks SET is_archived = true WHERE created_by = $1", ['00000000-0000-0000-0000-000000000000'])

      // For categories with NOT NULL created_by column, we need to delete them entirely
      // First, check if any categories exist for this user
      const categories = await executeQuery("SELECT id FROM categories WHERE created_by = $1", [userId])

      if (categories.length > 0) {
        // Delete categories created by the user
        await executeQuery("DELETE FROM categories WHERE created_by = $1", [userId])
      }

      // Handle other references that may or may not have NOT NULL constraints
      // Try to update them safely with conditional logic

      // For boards, try to set created_by to NULL if allowed
      await executeQuery(
        `UPDATE boards 
         SET created_by = CASE 
                          WHEN (SELECT column_default IS NULL AND is_nullable = 'YES' 
                                FROM information_schema.columns 
                                WHERE table_name = 'boards' AND column_name = 'created_by') 
                          THEN NULL 
                          ELSE created_by 
                          END
         WHERE created_by = $1`,
        [userId],
      )

      // If still have boards with this user as created_by, delete them
      await executeQuery("DELETE FROM boards WHERE created_by = $1", [userId])

      // Similar approach for teams
      await executeQuery(
        `UPDATE teams 
         SET created_by = CASE 
                          WHEN (SELECT column_default IS NULL AND is_nullable = 'YES' 
                                FROM information_schema.columns 
                                WHERE table_name = 'teams' AND column_name = 'created_by') 
                          THEN NULL 
                          ELSE created_by 
                          END,
             owner_id = CASE 
                        WHEN (SELECT column_default IS NULL AND is_nullable = 'YES' 
                              FROM information_schema.columns 
                              WHERE table_name = 'teams' AND column_name = 'owner_id') 
                        THEN NULL 
                        ELSE owner_id 
                        END
         WHERE created_by = $1 OR owner_id = $1`,
        [userId],
      )

      // Delete remaining teams referencing the user
      await executeQuery("DELETE FROM teams WHERE created_by = $1 OR owner_id = $1", [userId])

      // Handle labels
      await executeQuery("DELETE FROM labels WHERE created_by = $1", [userId])

      // Handle custom_fields
      await executeQuery("DELETE FROM custom_fields WHERE created_by = $1", [userId])

      // Finally, delete the user
      await executeQuery("DELETE FROM users WHERE id = $1", [userId])

      // Commit the transaction
      await executeQuery("COMMIT", [])

      // Log the user out
      await logout()

      return { success: true }
    } catch (error) {
      // Rollback in case of error
      await executeQuery("ROLLBACK", [])
      console.error("Error deleting account:", error)
      throw error
    }
  } catch (error) {
    console.error("Error in deleteAccount:", error)
    return {
      success: false,
      error: "Failed to delete account. Please try again later.",
    }
  }
}
