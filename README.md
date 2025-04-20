# TaskTogether

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
3. Create a `.env.local` file with the following variables:
   \`\`\`
   DATABASE_URL=your_postgres_connection_string
   JWT_SECRET=your_secure_random_string
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   \`\`\`
4. Initialize the database:
   \`\`\`bash
   npx prisma migrate dev
   \`\`\`


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
