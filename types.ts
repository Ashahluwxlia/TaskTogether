export enum BoardMemberRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  EDITOR = "EDITOR",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER",
}

// Find the User interface and add the email_verified field
export interface User {
  id: string
  name: string
  email: string
  image?: string | null
  email_verified?: boolean
}

export type UserType = User

export interface Task {
  id: string
  title: string
  description: string | null
  due_date: string | null
  status?: string
  priority: string | null
  position?: number
  list_id: string
  list_title: string
  board_id: string
  board_title: string
  assigned_to: string | null
  assignee_name?: string | null
  assignee_image?: string | null
  comments: Comment[] // Required, not optional
  attachments: Attachment[] // Required, not optional
  labels: Label[] // Required, not optional
  creatorId: string // ADDED: Creator ID
  completed: boolean // ADDED: Completion status
  completed_at: string | null // ADDED: Completion timestamp
  _isDeleted?: boolean // ADDED: Client-side flag for deletion tracking
}

export interface Comment {
  id: string
  content: string
  created_at: string
  author_id: string
  author_name: string
  author_image: string | null
  task_id?: string
  task_title?: string
}

export interface Attachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  created_at: string
  uploaded_by: string
  uploader_name: string
  task_id?: string
  task_title?: string
}

export interface Label {
  id: string
  name: string
  color: string
  board_id?: string
  board_title?: string
  task_count?: number
}

export interface Board {
  id: string
  title: string
  description: string | null
  is_starred: boolean
  role?: string
  member_count?: number
  lists?: List[]
  members?: User[]
  labels?: Label[]
  creatorId: string // ADDED: Creator ID
  list_count?: number
  task_count?: number
}

export interface List {
  id: string
  title: string
  position: number
  board_id: string
  tasks?: Task[]
}

// Add or update the Notification interface
export interface Notification {
  id: string
  type: string
  content: string
  createdAt: string
  isRead?: boolean
  actor_name?: string
  actor_image?: string
  task_id?: string
  invitationId?: string
  entityType?: string
  entityId?: string
  userId?: string
  isDeleted?: boolean
  emailSent?: boolean
  actionTaken?: boolean
}

export interface NotificationPreferences {
  taskAssigned: boolean
  taskDueSoon: boolean
  taskComments: boolean
  mentions: boolean
  teamInvitations: boolean
  boardShared: boolean
  emailNotifications: boolean
}

// Add the ApiResponse type definition
export interface ApiResponse<T = any> {
  success?: boolean
  data?: T
  error?: string
  message?: string
}
// Add the Team interface
export interface Team {
  id: string
  name: string
  description: string | null
  owner_id: string
  member_count: number
  members: User[]
  boards: {
    id: string
    title: string
    description: string | null
  }[]
}

// Add SearchResults interface for the enhanced search functionality
export interface SearchResults {
  tasks: any[]
  boards: any[]
  labels: any[]
  users: any[]
  comments: any[]
  attachments: any[]
}

// Add SearchTask interface for task search results
export interface SearchTask {
  id: string
  title: string
  description: string | null
  due_date: string | null
  status?: string
  position?: number
  list_id: string
  list_title: string
  board_title: string
  assignee_name: string | null
  assignee_image: string | null
}
