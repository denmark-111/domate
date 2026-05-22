# Board-Done Project Overview

Board-Done is a collaborative workspace application focused on lightweight project management, real-time collaboration, and a clean, minimal UI. It is designed to provide a focused experience for small teams.

## Product Vision

- **Lightweight Project Management:** Focused on essential features without unnecessary complexity.
- **Real-time Collaboration:** Instant updates for tasks and chat.
- **Minimal UI:** A clean, distraction-free interface.
- **Fast Task Management:** Optimized for speed and ease of use.

## Main Features

1. **Workspace:**
   - Personal and team workspaces.
   - Support for multiple boards.
   - Integrated chat and announcement channels for team workspaces.
2. **Kanban Style Board:**
   - Trello-style drag-and-drop interface.
   - Cross-board member assignments within the same workspace.
   - Real-time task syncing.
3. **Tasks:** Granular task management within boards.
4. **Chat:** Real-time communication within the workspace.
5. **Announcement:** Team-wide updates and broadcasts.
6. **Auth:** OAuth-based authentication.

## Tech Stack

- **Frontend:**
  - **Framework:** React 19 (using Vite 8)
  - **Styling:** Tailwind CSS (Intended/Primary framework)
  - **Icons:** SVG sprites (`public/icons.svg`)
- **Backend:**
  - **Runtime:** Node.js
  - **Framework:** Express 5.x
  - **Database:** PostgreSQL (Supabase)
  - **Real-time:** Socket.io (Planned for chat/syncing)
  - **Architecture:** Route-based structure in `backend/src/routes`

## Project Structure

```text
board-done/
├── backend/                # Node.js/Express server
│   ├── src/
│   │   ├── server.js       # Entry point
│   │   └── routes/         # API route definitions
│   └── package.json
└── frontend/               # React/Vite application
    ├── src/
    │   ├── App.jsx         # Main component
    │   ├── main.jsx        # Frontend entry point
    │   └── assets/         # Images and icons
    ├── public/             # Static assets
    └── package.json
```

## Getting Started

### Backend

1. Navigate to the `backend` directory: `cd backend`
2. Install dependencies: `npm install`
3. Start the server: `node src/server.js` (Runs on port 5000)

### Frontend

1. Navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## Backend Principles

- Keep route handlers thin
- Move reusable logic into services
- Use async/await consistently
- Validate all request input
- Keep database queries centralized

## Frontend Principles

- Prefer reusable UI components
- Avoid deeply nested component trees
- Keep state close to where it is used
- Use optimistic UI updates for realtime features
- Separate layout components from business logic

## Development Plan

### Phase 1: Frontend First (Core UI + UX)
- Build core layout (workspace, boards, tasks)
- Implement Kanban board (drag-and-drop)
- Create chat and announcement UI (mock data)
- Define frontend data models early (Workspace, Board, Task, Message)
- Focus on user flows and interaction design
- Use mock services instead of real API calls

### Phase 2: Supabase Auth Integration (Early Identity Layer)
- Integrate Supabase Auth (OAuth / email login)
- Implement login, signup, and session handling
- Store and access user session in frontend
- Attach auth token to future API requests
- Do NOT implement full backend authorization logic yet

### Phase 3: Backend API (Express)
- Build Express API based on frontend data models
- Implement JWT verification for Supabase Auth
- Create core routes:
  - workspaces
  - boards
  - tasks
  - messages
- Define database schema based on frontend needs
- Connect frontend to real API endpoints

### Phase 4: Real-time Features
- Integrate Socket.io
- Implement real-time task updates
- Add live chat functionality
- Sync announcements across workspace members

### Phase 5: Authorization + Roles
- Workspace membership system
- Role-based permissions (owner, admin, member)
- Protect API routes based on workspace access

### Phase 6: Polish + Enhancements
- UI/UX improvements
- Performance optimization
- Activity logs
- Notifications system
- Search and filtering
