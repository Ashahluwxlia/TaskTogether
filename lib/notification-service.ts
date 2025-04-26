import { prisma } from "./prisma"
import { sendEmail } from "./email"
import {
  createWelcomeEmail,
  createPasswordResetEmail,
  createTaskAssignedEmail,
  createCommentNotificationEmail,
  createTeamInvitationEmail,
  createEmailVerificationEmail,
  createBoardInvitationEmail,
} from "./email-templates"
import { createNotification } from "./notifications"
import { executeQuery } from "./db"
import { getUserNotificationPreferences } from "./user-preferences"

// Add this function to check if a notification should be sent based on user preferences
async function shouldSendNotification(userId: string, notificationType: string): Promise<boolean> {
  try {
    const preferences = await getUserNotificationPreferences(userId)

    switch (notificationType) {
      case "TASK_ASSIGNED":
        return preferences.taskAssigned
      case "TASK_DUE_SOON":
      case "TASK_OVERDUE":
        return preferences.taskDueSoon
      case "COMMENT":
      case "MENTION":
        return preferences.taskComments
      case "TEAM_INVITATION":
        return preferences.teamInvitations
      case "BOARD_INVITATION":
        return preferences.boardShared
      default:
        return true
    }
  } catch (error) {
    console.error("Error checking notification preferences:", error)
    return true // Default to sending if there's an error
  }
}

/**
 * Sends a password reset email to the specified email address
 * @param email The email address to send the reset link to
 * @param token The reset token
 * @returns Result of the email sending operation
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const resetUrl = `${appUrl}/reset-password/${token}`

    // We don't know the user's name at this point, so we'll use a generic greeting
    const html = createPasswordResetEmail("User", resetUrl)

    return await sendEmail({
      to: email,
      subject: "Reset Your Password",
      html,
    })
  } catch (error) {
    console.error("Error sending password reset email:", error)
    return { success: false, error }
  }
}

/**
 * Sends a welcome email to a newly registered user
 * @param userId The ID of the user to send the welcome email to
 * @returns Result of the email sending operation
 */
export async function sendWelcomeEmail(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || !user.email) return { success: false, error: "User not found" }

    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`
    const html = createWelcomeEmail(user.name || "there", loginUrl)

    return await sendEmail({
      to: user.email,
      subject: "Welcome to TaskTogether!",
      html,
    })
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return { success: false, error }
  }
}

/**
 * Sends an email notification when a user is assigned to a task
 * @param taskId The ID of the task
 * @param assigneeId The ID of the user assigned to the task
 * @returns Result of the email sending operation
 */
export async function sendTaskAssignmentEmail(taskId: string, assigneeId: string) {
  try {
    // Check if the user wants to receive task assignment notifications
    if (!(await shouldSendNotification(assigneeId, "TASK_ASSIGNED"))) {
      console.log(`User ${assigneeId} has disabled task assignment notifications`)
      return { success: true, message: "Notification disabled by user preferences" }
    }

    // First, get the assignee to get their email
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
    })

    if (!assignee || !assignee.email) {
      return { success: false, error: "Assignee not found or has no email" }
    }

    // Then get the task with its list and board
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        list: {
          include: {
            board: true,
          },
        },
      },
    })

    if (!task) {
      return { success: false, error: "Task not found" }
    }

    const boardName = task.list?.board?.title || "Unknown Board"
    const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL}/tasks/${taskId}`

    const html = createTaskAssignedEmail(assignee.name || "there", task.title, boardName, taskUrl)

    return await sendEmail({
      to: assignee.email,
      subject: "New Task Assignment",
      html,
    })
  } catch (error) {
    console.error("Error sending task assignment email:", error)
    return { success: false, error }
  }
}

/**
 * Sends an email notification when a comment is added to a task
 * @param commentId The ID of the comment
 * @returns Result of the email sending operation
 */
export async function sendCommentNotificationEmail(commentId: string) {
  try {
    // Get the comment with author and task
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: true,
        task: {
          include: {
            creator: true,
            assignee: true,
          },
        },
      },
    })

    if (!comment || !comment.task) {
      return { success: false, error: "Comment or task not found" }
    }

    // Determine recipients (task creator and assignee, excluding commenter)
    const recipients = []

    // Add task creator if not the commenter
    if (comment.task.creator && comment.task.creator.id !== comment.authorId) {
      recipients.push(comment.task.creator)
    }

    // Add task assignee if exists, not the commenter, and not the creator
    if (
      comment.task.assignee &&
      comment.task.assignedTo !== comment.authorId &&
      comment.task.assignedTo !== comment.task.creator?.id
    ) {
      recipients.push(comment.task.assignee)
    }

    if (recipients.length === 0) {
      return { success: true, message: "No recipients to notify" }
    }

    const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL}/tasks/${comment.taskId}`

    // Send email to each recipient
    const results = await Promise.all(
      recipients
        .filter((recipient) => recipient.email) // Ensure recipient has email
        .map((recipient) => {
          const html = createCommentNotificationEmail(
            recipient.name || "there",
            comment.author?.name || "Someone",
            comment.task?.title || "a task",
            comment.content,
            taskUrl,
          )

          return sendEmail({
            to: recipient.email!,
            subject: "New Comment on Task",
            html,
          })
        }),
    )

    return { success: true, results }
  } catch (error) {
    console.error("Error sending comment notification email:", error)
    return { success: false, error }
  }
}

// Update the sendTeamInvitationEmail function to use the correct URL format
export async function sendTeamInvitationEmail(invitationId: string) {
  try {
    // Get the invitation with team and sender details
    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: invitationId },
      include: {
        team: true,
        recipient: true,
        sender: true,
      },
    })

    if (!invitation || !invitation.recipient || !invitation.recipient.email) {
      return { success: false, error: "Invitation or recipient not found" }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    // Remove the type parameter from the URL to match the format used in notifications
    const inviteUrl = `${appUrl}/invitations/${invitationId}`

    const html = createTeamInvitationEmail(
      invitation.recipient.name || "there",
      invitation.sender?.name || "Someone",
      invitation.team?.name || "a team",
      inviteUrl,
      invitation.message || undefined,
    )

    return await sendEmail({
      to: invitation.recipient.email,
      subject: `Invitation to join ${invitation.team?.name || "a team"} on TaskTogether`,
      html,
    })
  } catch (error) {
    console.error("Error sending team invitation email:", error)
    return { success: false, error }
  }
}

// Update the sendBoardInvitationEmail function to use the correct URL format
export async function sendBoardInvitationEmail(invitationId: string) {
  try {
    // Get the invitation with board and sender details
    const invitation = await prisma.boardInvitation.findUnique({
      where: { id: invitationId },
      include: {
        board: true,
        recipient: true,
        sender: true,
      },
    })

    if (!invitation || !invitation.recipient || !invitation.recipient.email) {
      return { success: false, error: "Invitation or recipient not found" }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    // Remove the type parameter from the URL to match the format used in notifications
    const inviteUrl = `${appUrl}/invitations/${invitationId}`

    const html = createBoardInvitationEmail(
      invitation.recipient.name || "there",
      invitation.sender?.name || "Someone",
      invitation.board?.name || invitation.board?.title || "Untitled Board",
      inviteUrl,
      invitation.message || undefined,
    )

    return await sendEmail({
      to: invitation.recipient.email,
      subject: `Invitation to join ${invitation.board?.name || invitation.board?.title || "Untitled Board"} on TaskTogether`,
      html,
    })
  } catch (error) {
    console.error("Error sending board invitation email:", error)
    return { success: false, error }
  }
}

// Update the checkTasksDueSoon function to respect user preferences
export async function checkTasksDueSoon() {
  try {
    console.log("Checking for tasks due soon...")

    // Find tasks due within the next 24 hours that haven't had notifications sent
    const query = `
      SELECT t.id, t.title, t.due_date, t.assigned_to, u.email, u.name
      FROM tasks t
      JOIN users u ON t.assigned_to = u.id
      WHERE 
        t.due_date IS NOT NULL 
        AND t.due_date > NOW() 
        AND t.due_date <= NOW() + INTERVAL '24 hours'
        AND t.completed = false
        AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.entity_id = t.id 
          AND n.type = 'TASK_DUE_SOON'
          AND n.created_at > NOW() - INTERVAL '6 hours'
        )
    `

    const tasks = await executeQuery(query)
    console.log(`Found ${tasks.length} tasks due soon`)

    let notificationCount = 0

    // Create notifications for each task
    for (const task of tasks) {
      // Check user preferences
      if (await shouldSendNotification(task.assigned_to, "TASK_DUE_SOON")) {
        await createNotification({
          userId: task.assigned_to,
          type: "TASK_DUE_SOON",
          content: `Task "${task.title}" is due within 24 hours`,
          entityType: "TASK",
          entityId: task.id,
        })
        notificationCount++
        console.log(`Created due soon notification for task ${task.id} - ${task.title}`)
      } else {
        console.log(`Skipped due soon notification for task ${task.id} - user has disabled these notifications`)
      }
    }

    return notificationCount
  } catch (error) {
    console.error("Error checking for tasks due soon:", error)
    throw error
  }
}

// Update the checkTasksOverdue function to respect user preferences
export async function checkTasksOverdue() {
  try {
    console.log("Checking for overdue tasks...")

    // Find tasks that are overdue and haven't had notifications sent
    const query = `
      SELECT t.id, t.title, t.due_date, t.assigned_to, u.email, u.name
      FROM tasks t
      JOIN users u ON t.assigned_to = u.id
      WHERE 
        t.due_date IS NOT NULL 
        AND t.due_date < NOW() 
        AND t.completed = false
        AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.entity_id = t.id 
          AND n.type = 'TASK_OVERDUE'
          AND n.created_at > NOW() - INTERVAL '6 hours'
        )
    `

    const tasks = await executeQuery(query)
    console.log(`Found ${tasks.length} overdue tasks`)

    let notificationCount = 0

    // Create notifications for each task
    for (const task of tasks) {
      // Check user preferences
      if (await shouldSendNotification(task.assigned_to, "TASK_DUE_SOON")) {
        await createNotification({
          userId: task.assigned_to,
          type: "TASK_OVERDUE",
          content: `Task "${task.title}" is overdue`,
          entityType: "TASK",
          entityId: task.id,
        })
        notificationCount++
        console.log(`Created overdue notification for task ${task.id} - ${task.title}`)
      } else {
        console.log(`Skipped overdue notification for task ${task.id} - user has disabled these notifications`)
      }
    }

    return notificationCount
  } catch (error) {
    console.error("Error checking for overdue tasks:", error)
    throw error
  }
}

/**
 * Sends an email verification link to a newly registered user
 * @param userId The ID of the user to send the verification email to
 * @param token The verification token
 * @returns Result of the email sending operation
 */
export async function sendVerificationEmail(userId: string, token: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || !user.email) return { success: false, error: "User not found" }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const verificationUrl = `${appUrl}/verify-email/${token}`
    const html = createEmailVerificationEmail(user.name || "there", verificationUrl)

    return await sendEmail({
      to: user.email,
      subject: "Verify Your Email Address - TaskTogether",
      html,
    })
  } catch (error) {
    console.error("Error sending verification email:", error)
    return { success: false, error }
  }
}
