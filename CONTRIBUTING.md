# Contributing to Organizo

Thank you for considering contributing to Task Together! This document outlines the process for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/Task_Together.git`
3. Install dependencies: `npm install`
4. Set up environment variables: Copy `.env.example` to `.env.local` and fill in the values
5. Start the development server: `npm run dev`

## Development Workflow

1. Create a new branch for your feature or bugfix: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Run tests: `npm test`
4. Commit your changes: `git commit -m "Add your feature or fix"`
5. Push to your fork: `git push origin feature/your-feature-name`
6. Create a pull request

## Code Style

We use ESLint and Prettier to enforce code style. Please make sure your code passes the linting checks:

\`\`\`bash
npm run lint
\`\`\`

## Database Migrations

When making changes to the database schema:

1. Update the Prisma schema in `prisma/schema.prisma`
2. Generate a migration: `npx prisma migrate dev --name your-migration-name`
3. Apply the migration: `npx prisma migrate deploy`

## Testing

Please write tests for your changes. We use Jest for testing:

\`\`\`bash
npm test
\`\`\`

## Documentation

Please update the documentation when adding or changing features:

1. Update the README.md if necessary
2. Add or update JSDoc comments for functions and components
3. Update API documentation if you change any API endpoints

## Pull Request Process

1. Ensure your code passes all tests and linting checks
2. Update the README.md with details of changes if applicable
3. The PR should work for all supported Node.js versions
4. Your PR will be reviewed by maintainers, who may request changes

