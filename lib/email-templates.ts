/**
 * Creates a welcome email for a new user
 * @param name The user's name
 * @param loginUrl The URL to the login page
 * @returns HTML content for the email
 */
export function createWelcomeEmail(name: string, loginUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h1 style="color: #2563eb;">Welcome to TaskTogether!</h1>
      <p>Hello ${name},</p>
      <p>Thank you for joining TaskTogether! We're excited to have you on board.</p>
      <p>With TaskTogether, you can:</p>
      <ul>
        <li>Create and manage tasks</li>
        <li>Collaborate with team members</li>
        <li>Track progress on your projects</li>
        <li>Stay organized and productive</li>
      </ul>
      <p>To get started, simply <a href="${loginUrl}" style="color: #2563eb; text-decoration: none; font-weight: bold;">log in to your account</a>.</p>
      <p>If you have any questions or need assistance, feel free to reply to this email.</p>
      <p>Best regards,<br>The TaskTogether Team</p>
    </div>
  `
}

/**
 * Creates a password reset email
 * @param name The user's name
 * @param resetUrl The URL to reset the password
 * @returns HTML content for the email
 */
export function createPasswordResetEmail(name: string, resetUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h1 style="color: #2563eb;">Reset Your Password</h1>
      <p>Hello ${name},</p>
      <p>We received a request to reset your password for your TaskTogether account. If you didn't make this request, you can safely ignore this email.</p>
      <p>To reset your password, click the button below:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
      </p>
      <p>This link will expire in 1 hour for security reasons.</p>
      <p>If the button above doesn't work, you can copy and paste the following URL into your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetUrl}</p>
      <p>Best regards,<br>The TaskTogether Team</p>
    </div>
  `
}

/**
 * Creates an email for task assignment notification
 * @param name The assignee's name
 * @param taskTitle The title of the task
 * @param boardName The name of the board
 * @param taskUrl The URL to the task
 * @returns HTML content for the email
 */
export function createTaskAssignedEmail(name: string, taskTitle: string, boardName: string, taskUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h1 style="color: #2563eb;">New Task Assignment</h1>
      <p>Hello ${name},</p>
      <p>You have been assigned a new task in TaskTogether:</p>
      <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold;">${taskTitle}</p>
        <p style="margin: 5px 0 0; color: #64748b;">Board: ${boardName}</p>
      </div>
      <p>To view the task details and start working on it, click the button below:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${taskUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Task</a>
      </p>
      <p>If the button above doesn't work, you can copy and paste the following URL into your browser:</p>
      <p style="word-break: break-all; color: #666;">${taskUrl}</p>
      <p>Best regards,<br>The TaskTogether Team</p>
    </div>
  `
}

/**
 * Creates an email for comment notification
 * @param name The recipient's name
 * @param commenterName The name of the person who commented
 * @param taskTitle The title of the task
 * @param commentContent The content of the comment
 * @param taskUrl The URL to the task
 * @returns HTML content for the email
 */
export function createCommentNotificationEmail(
  name: string,
  commenterName: string,
  taskTitle: string,
  commentContent: string,
  taskUrl: string,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h1 style="color: #2563eb;">New Comment on Task</h1>
      <p>Hello ${name},</p>
      <p>${commenterName} has commented on the task "${taskTitle}":</p>
      <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #64748b;">${commentContent}</p>
      </div>
      <p>To view the comment and respond, click the button below:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${taskUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Comment</a>
      </p>
      <p>If the button above doesn't work, you can copy and paste the following URL into your browser:</p>
      <p style="word-break: break-all; color: #666;">${taskUrl}</p>
      <p>Best regards,<br>The TaskTogether Team</p>
    </div>
  `
}

/**
 * Creates an email for team invitation
 * @param name The recipient's name
 * @param inviterName The name of the person who sent the invitation
 * @param teamName The name of the team
 * @param inviteUrl The URL to accept the invitation
 * @param message Optional message from the inviter
 * @returns HTML content for the email
 */
export function createTeamInvitationEmail(
  name: string,
  inviterName: string,
  teamName: string,
  inviteUrl: string,
  message?: string,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h1 style="color: #2563eb;">Team Invitation</h1>
      <p>Hello ${name},</p>
      <p>${inviterName} has invited you to join the team "${teamName}" on TaskTogether.</p>
      ${
        message
          ? `
      <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #64748b;">${message}</p>
      </div>
      `
          : ""
      }
      <p>To accept this invitation and join the team, click the button below:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${inviteUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Accept Invitation</a>
      </p>
      <p>If the button above doesn't work, you can copy and paste the following URL into your browser:</p>
      <p style="word-break: break-all; color: #666;">${inviteUrl}</p>
      <p>Best regards,<br>The TaskTogether Team</p>
    </div>
  `
}

/**
 * Creates an email for email verification
 * @param name The user's name
 * @param verificationUrl The URL to verify the email
 * @returns HTML content for the email
 */
export function createEmailVerificationEmail(name: string, verificationUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h1 style="color: #2563eb;">Verify Your Email Address</h1>
      <p>Hello ${name},</p>
      <p>Thank you for registering with TaskTogether. To complete your registration and verify your email address, please click the button below:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email Address</a>
      </p>
      <p>If the button above doesn't work, you can copy and paste the following URL into your browser:</p>
      <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
      <p>This link will expire in 24 hours for security reasons.</p>
      <p>If you did not create an account with TaskTogether, you can safely ignore this email.</p>
      <p>Best regards,<br>The TaskTogether Team</p>
    </div>
  `
}

/**
 * Creates an email for board invitation
 * @param name The recipient's name
 * @param inviterName The name of the person who sent the invitation
 * @param boardName The name of the board
 * @param inviteUrl The URL to accept the invitation
 * @param message Optional message from the inviter
 * @returns HTML content for the email
 */
export function createBoardInvitationEmail(
  name: string,
  inviterName: string,
  boardName: string,
  inviteUrl: string,
  message?: string,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h1 style="color: #2563eb;">Board Invitation</h1>
      <p>Hello ${name},</p>
      <p>${inviterName} has invited you to join the board "${boardName}" on TaskTogether.</p>
      ${
        message
          ? `
      <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #64748b;">${message}</p>
      </div>
      `
          : ""
      }
      <p>To accept this invitation and join the board, click the button below:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${inviteUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Accept Invitation</a>
      </p>
      <p>If the button above doesn't work, you can copy and paste the following URL into your browser:</p>
      <p style="word-break: break-all; color: #666;">${inviteUrl}</p>
      <p>Best regards,<br>The TaskTogether Team</p>
    </div>
  `
}
