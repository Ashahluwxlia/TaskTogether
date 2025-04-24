# TaskTogether

## Backend Stack

- **Main language**: TypeScript/JavaScript
- **Framework**: Next.js (App Router)
- **API**: Next.js API Routes
- **Authentication**: Custom JWT (jose library)
- **DBMS**: PostgreSQL (Neon)


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
- **Hosting**: Local machine (with Neon compatibility)
- **ORM/Query**: Raw SQL with pg Pool and neon
- **Connection**: @neondatabase/serverless


## Authentication & Security

- **Auth Method**: JWT (jose library)
- **Password Hashing**: bcryptjs
- **Session Management**: Custom cookie-based sessions


## Other Tools & Libraries

- **HTTP Client**: Native fetch API
- **Date Handling**: Native JavaScript Date
- **File Upload**: Custom implementation
- **Email**: Nodemailer (implied from types)
- **Websockets**: ws (for development with Neon)


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

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [PostgreSQL]
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
