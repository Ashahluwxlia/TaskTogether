# TaskTogether

## Backend Stack

- **Main language**: TypeScript/JavaScript
- **Framework**: Next.js (App Router)
- **API**: Next.js API Routes
- **Authentication**: Custom JWT (jose library)
- **DBMS**: PostgreSQL


## Frontend Stack

- **Main language**: TypeScript
- **Framework**: React with Next.js
- **Build Tool**: Next.js build system


## Frontend Libraries

- **Routing**: Next.js App Router
- **UI Component Library**: shadcn/ui
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Form Handling**: React Hook Form (implied from shadcn/ui usage)


## Database

- **Type**: PostgreSQL
- **Hosting**: Local machine
- **ORM/Query**: Raw SQL with pg Pool 
- **Connection**: Local machine


## Authentication & Security

- **Auth Method**: JWT (jose library)
- **Password Hashing**: bcryptjs
- **Session Management**: Custom cookie-based sessions


## Other Tools & Libraries

- **HTTP Client**: Native fetch API
- **Date Handling**: Native JavaScript Date
- **File Upload**: Custom implementation
- **Email**: Nodemailer (implied from types)



## Development Tools

- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Version Control**: Git


A collaborative task management application built with Next.js.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   pnpm install
   \`\`\`
3. Create a `.env` file with the following variables:
   \`\`\`
   # Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
WS_PORT=3001

# Authentication
JWT_SECRET=your_secure_random_string
NEXTAUTH_SECRET=your_secure_random_string
NEXTAUTH_URL=http://localhost:3000

# API
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Database
DATABASE_URL=postgresql://username:password@hostname:port/database
POSTGRES_USER=your_db_username
POSTGRES_HOST=your_db_host
POSTGRES_PASSWORD=your_db_password
POSTGRES_DATABASE=your_db_name

# SMTP Email Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=Your App Name <your_email@example.com>

# Environment
NODE_ENV=development
ENABLE_BACKGROUND_SERVICES=true
   \`\`\`
4. Initialize the database:
   \`\`\`bash
   npx prisma migrate dev
   \`\`\`

## Database Schema

The application uses a PostgreSQL database with the following main tables:
- Users
- Teams
- Boards
- Lists
- Tasks
- Comments
- Attachments
- Notifications
- Invitations

For a complete schema, refer to the Prisma schema in `prisma/schema.prisma`.

### Development

Run the development server:
\`\`\`bash
npm run dev
\`\`\`

### Fixing Linting Issues

The project includes a script to automatically fix common linting issues:

\`\`\`bash
npm run lint:fix or use npx tsc --noEmit - great choice for checking errors
\`\`\`

This will:
1. Fix unescaped entities in JSX
2. Prefix unused variables with underscore
3. Replace `any` types with `unknown`

Some warnings may remain after running this script, but they won't prevent the application from running.

## Features

- Task management with boards, lists, and cards
- Team collaboration
- Comments and notifications
- Time tracking
- File attachments
- Search functionality
- User profiles and settings

With these changes, you can run `npm run lint:fix` to automatically fix most of the linting errors. The remaining warnings won't prevent the application from running, and you can address them gradually as you work on the project.

The application will be available at http://localhost:3000.

## Key Features

## Kanban Board System

The core of the application is the kanban board system, implemented with a drag-and-drop interface. Users can:
	•	Create boards, lists, and tasks
	•	Move tasks between lists
	•	Reorder tasks within lists
	•	Set task properties (due dates, labels, assignees)

Implemented using DnD-kit with custom logic to handle drag scenarios across and within lists.

## Authentication & Authorization

The app uses custom JWT-based authentication:
	•	JWT tokens stored in HTTP-only cookies
	•	Role-based access for teams and boards
	•	API-level and UI-level permission checks

## Team Collaboration
	•	Teams with owner/admin/member roles
	•	Controlled access to boards and tasks
	•	Invitation and member management features

## Notification System
	•	In-app notifications
	•	Configurable email notifications
	•	User preference controls


## Project Structure

\`\`\`
TaskTogether/
├── app/                  # Next.js app directory
│   ├── (dashboard)/      # Dashboard routes
│   ├── api/              # API routes
│   ├── ui/               # UI components
│   └── ...
├── components/           # Shared React components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and services
├── migrations/           # Database migrations
├── prisma/               # Prisma ORM configuration
├── public/               # Static assets
├── scripts/              # Utility scripts
└── ...
\`\`\`


### Running Tests

\`\`\`bash
npm run test

## Acknowledgements

- [Next.js](https://nextjs.org)
- [React](https://react.dev)
- [PostgreSQL](https://www.postgresql.org)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
-[DnD Kit](https://dndkit.com)
-[jose](https://github.com/panva/jose)

- AI Tools
	•	ChatGPT: Helped structure components, fix bugs
	•	v0: Used to scaffold initial UI layouts

## Technical Implementation

## Database Layer

The application uses a locally hosted PostgreSQL database. Two approaches are used for database operations:
	1.	Raw SQL queries via executeQuery in lib/db.ts
	2.	Prisma ORM for complex operations

This hybrid setup allowed better performance where needed and easier development using Prisma’s type safety.

## API Layer

RESTful API routes using Next.js API handlers:
	•	Resource-based endpoints (/api/boards, /api/tasks, etc.)
	•	CRUD operations
	•	JWT middleware for authentication

## UI Components

Built using:
	•	shadcn/ui for UI base components
	•	Custom components for app-specific interactions
	•	Tailwind CSS for styling

## State Management
	•	React Context for global state (e.g., user info, UI layout)
	•	React Query for async data fetching
	•	Local component state for isolated UI logic

### Data Flow Documentation

## Authentication Flow

1. User submits credentials to `/api/auth/login`
2. Server validates credentials against database using bcrypt
3. If valid, server generates JWT token using jose library
4. JWT stored in HTTP-only cookie with 7-day expiration
5. Client uses `useAuth()` hook from `contexts/auth-context.tsx` to access current user
6. Protected routes check authentication status via middleware
7. Token refresh happens automatically on page load via `refreshUser()` function


## Task Management Flow

1. Tasks are fetched via `/api/tasks` or `/api/boards/[boardId]/lists` endpoints
2. Task state is managed in the `BoardView` component using React useState
3. Creating a task sends POST request to `/api/tasks` with list ID and task details
4. Updates are sent to the server via PATCH requests to `/api/tasks/[taskId]`
5. Task deletion triggers DELETE request to `/api/tasks/[taskId]`
6. Activity logs are created for all task actions via database triggers
7. Optimistic UI updates are implemented for better user experience


## Board Management Flow

1. Boards are fetched from `/api/boards` endpoint on dashboard load
2. Board details are loaded from `/api/boards/[boardId]` when viewing a specific board
3. Board state (lists, tasks) is managed in the `BoardView` component
4. Lists are created via POST to `/api/boards/[boardId]/lists`
5. List reordering updates are sent to `/api/lists/[id]` with new position values
6. Board settings updates are sent to `/api/boards/[boardId]` endpoint
7. Board deletion triggers cascading deletion of all associated lists and tasks


## Drag and Drop Flow

1. User initiates drag action on a task or list
2. `DndContext` from `@dnd-kit/core` captures the drag start event
3. `handleDragStart` sets active item and stores original position
4. During drag, `handleDragOver` provides visual feedback and temporary state updates
5. On drop, `handleDragEnd` determines the type of drop (same list, different list)
6. Local state is updated immediately for responsive UI
7. API calls are made to update positions in the database:

1. Same list: Update task positions within the list
2. Different list: Update task's list_id and position



8. If API calls fail, state is reverted to maintain consistency


## Team Collaboration Flow

1. Teams are created via POST to `/api/teams` endpoint
2. Team members are invited through `/api/teams/[teamId]/invitations`
3. Invitations generate notification records and send emails
4. Users accept/decline invitations via `/api/invitations/[id]/accept` or `/api/invitations/[id]/decline`
5. Team boards are created via `/api/teams/[teamId]/boards`
6. Team chat messages flow through `/api/teams/[teamId]/chat`
7. Permission checks occur at both API and UI levels using role-based access control


## Notification System Flow

1. Actions that generate notifications (task assignment, mentions, etc.) create records in notifications table
2. Notifications are fetched via `/api/notifications` endpoint
3. Real-time notification count is managed by `useNotifications` hook
4. Notification preferences control which notifications are generated
5. Email notifications are sent asynchronously based on user preferences
6. Notifications are marked as read via `/api/notifications/[id]/read`
7. Bulk actions are available for clearing all notifications


## Comment and Attachment Flow

1. Comments are added to tasks via POST to `/api/comments`
2. Comments are fetched for a specific task via `/api/tasks/[taskId]/comments`
3. File uploads are processed through `/api/upload` endpoint
4. Attachments are associated with tasks via `/api/tasks/[taskId]/attachments`
5. Attachment previews are generated based on file type
6. Comments and attachments appear in activity logs
7. Mentions in comments trigger notifications to mentioned users


## Label Management Flow

1. Labels are created at the board level via `/api/labels`
2. Labels are fetched as part of board data or via `/api/boards/[boardId]/labels`
3. Labels are assigned to tasks via `/api/tasks/[taskId]/labels`
4. Label assignments are stored in the task_labels junction table
5. Label colors and names can be updated via `/api/labels/[labelId]`
6. Labels can be filtered and searched across the board
7. Label deletion removes all associations with tasks


## User Settings Flow

1. User profile data is fetched from `/api/user/profile`
2. Profile updates are sent via PATCH to `/api/user/profile`
3. Password changes flow through `/api/user/password`
4. Email verification status is checked via `isEmailVerified` function
5. Notification preferences are managed via `/api/user/preferences`
6. Theme preferences are stored in local storage
7. Account deletion is handled via server action in `delete-account.ts`


## Error Handling Flow

1. API errors are captured and formatted consistently
2. Client-side error boundaries catch and display UI errors
3. Form validation occurs at both client and server levels
4. Network errors trigger retry mechanisms or fallback UI
5. Authentication errors redirect to login page
6. Permission errors show appropriate messaging
7. Database errors are logged and sanitized before client response

5. Development Approach

5.1 AI-Assisted Development

As the sole developer, I used AI tools like ChatGPT, GitHub Copilot, and v0 to support:
	•	Fast boilerplate generation
	•	UI layout and logic suggestions
	•	Debugging and architectural advice

5.2 Process
	•	Iterative feature rollout
	•	Reusable component architecture
	•	Regular refactoring and testing