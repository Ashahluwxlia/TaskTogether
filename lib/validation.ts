import { z } from "zod"

// User validation schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

// Board validation schemas
export const createBoardSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  teamId: z.string().optional(),
})

export const updateBoardSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  isStarred: z.boolean().optional(),
})

// List validation schemas
export const createListSchema = z.object({
  title: z.string().min(1, "Title is required"),
  boardId: z.string(),
  position: z.number().optional(),
})

export const updateListSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  position: z.number().optional(),
})

// Task validation schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  listId: z.string(),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  position: z.number().optional(),
})

export const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  listId: z.string().optional(),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  status: z.string().optional(),
  position: z.number().optional(),
})

// Comment validation schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  taskId: z.string(),
})

// Team validation schemas
export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional(),
})

export const updateTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").optional(),
  description: z.string().optional(),
})

// Team member validation schemas
export const inviteTeamMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
})

// Board member validation schemas
export const inviteBoardMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "EDITOR", "COMMENTER", "VIEWER"]),
})
