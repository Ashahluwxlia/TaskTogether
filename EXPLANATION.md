1. Project Overview

TaskTogether is a Trello-like web application built with Next.js, React, and PostgreSQL. It provides a collaborative platform for project management with features like kanban boards, task management, team collaboration, and real-time notifications. The application follows a modern web architecture using the Next.js App Router pattern with a mix of server and client components.

2. Architecture

2.1 Technology Stack
	•	Frontend: Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui
	•	Backend: Next.js API Routes, PostgreSQL (local instance)
	•	Authentication: Custom JWT-based authentication
	•	State Management: React Context API, React Hooks
	•	UI/UX: Responsive design with Tailwind CSS, DnD-kit for drag-and-drop
    

3. Key Features

3.1 Kanban Board System

The core of the application is the kanban board system, implemented with a drag-and-drop interface. Users can:
	•	Create boards, lists, and tasks
	•	Move tasks between lists
	•	Reorder tasks within lists
	•	Set task properties (due dates, labels, assignees)

Implemented using DnD-kit with custom logic to handle drag scenarios across and within lists.

3.2 Authentication & Authorization

The app uses custom JWT-based authentication:
	•	JWT tokens stored in HTTP-only cookies
	•	Role-based access for teams and boards
	•	API-level and UI-level permission checks

3.3 Team Collaboration
	•	Teams with owner/admin/member roles
	•	Controlled access to boards and tasks
	•	Invitation and member management features

3.4 Notification System
	•	In-app notifications
	•	Configurable email notifications
	•	User preference controls

4. Technical Implementation

4.1 Database Layer

The application uses a locally hosted PostgreSQL database. Two approaches are used for database operations:
	1.	Raw SQL queries via executeQuery in lib/db.ts
	2.	Prisma ORM for complex operations

This hybrid setup allowed better performance where needed and easier development using Prisma’s type safety.

4.2 API Layer

RESTful API routes using Next.js API handlers:
	•	Resource-based endpoints (/api/boards, /api/tasks, etc.)
	•	CRUD operations
	•	JWT middleware for authentication

4.3 UI Components

Built using:
	•	shadcn/ui for UI base components
	•	Custom components for app-specific interactions
	•	Tailwind CSS for styling

4.4 State Management
	•	React Context for global state (e.g., user info, UI layout)
	•	React Query for async data fetching
	•	Local component state for isolated UI logic

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

6. Known Inconsistencies

6.1 Mixed Data Access Methods

Used both Prisma and raw SQL depending on complexity/performance needs.

6.2 File Structure Variance

UI components exist in both /components and /app/ui, making structure slightly inconsistent. Will refactor for clarity.

6.3 Authentication Logic Duplication

Some repeated logic between lib/auth.ts, auth-utils.ts, and auth-actions.ts. Could be consolidated later.

6.4 Inconsistent API Error Handling

Different patterns used across routes; requires standardization.

6.5 Mixed Responsibility in Components

Some UI components manage both view logic and business logic — noted for future refactor.

6.6 Inconsistent State Handling

Mix of context, prop-drilling, and hooks depending on component depth. Could be unified using a clearer pattern.

7. References and Resources

7.1 AI Tools
	•	GitHub Copilot: Used for suggestions and automation
	•	ChatGPT: Helped structure components, fix bugs
	•	v0: Used to scaffold initial UI layouts

7.2 Libraries and Frameworks
	•	Next.js 
	•	React
	•	Tailwind CSS
	•	shadcn/ui
	•	DnD Kit
	•	PostgreSQL
	•	Jose JWT

7.3 Development Summary

The entire project structure, functionality, and logic were built iteratively with help from AI tools and manual customization. While AI helped speed up the process, all code was reviewed, understood, and integrated in a way that fit the needs of the application and its complexity.





