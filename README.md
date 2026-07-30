# Domate

A real-time collaboration platform that seamlessly connects your team's work, conversations, and updates in one place.

## Features

- **Workspaces** — Create workspaces, invite members, and collaborate
- **Live Kanban Boards** — Full drag-and-drop boards, lists, and tasks with real-time sync across clients
- **Presence Tracking** — See who else is viewing a board in real time
- **Live Cursors & Item Locking** — Real-time peer cursor movement tracking and item locking during drag-and-drop board operations
- **Chat** — Workspace-scoped messaging with live updates and typing indicators
- **Announcements** — Post and pin team-wide updates instantly
- **Notifications** — Instant alerts for invitations, task assignments, and team updates
- **Cross-Workspace Task View** — See all your assigned tasks across every workspace in one place
- **Task Management** — Labels, due dates, assignments, real-time comments, and file attachments
- **Auth** — Email/password and OAuth (Google) authentication (Supabase Auth)
- **File Storage** — Avatars, workspace covers, and task attachments stored in Supabase Storage
- **Customization** — Workspace color themes and dark/light mode

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS v4, React Router 7 |
| Backend | Express 5, Prisma 7, Zod |
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth (JWT verified via JWKS) |
| Real-time | Supabase Realtime (chat, presence, live cursors, boards, announcements, notifications) |
| Storage | Supabase Storage (avatars, covers, attachments) |
| Drag & Drop | dnd-kit |

## Architecture

```
React SPA  ──HTTP──▶  Express REST API  ──Prisma──▶  PostgreSQL
     │                      │
     └── Supabase ──────────┘
         (Auth, Realtime, Storage)
```

The React frontend communicates with the Express backend via REST API calls. Supabase is used in two ways:

- **Frontend**: Direct Supabase client for auth flows, real-time subscriptions (chat, presence), and file uploads
- **Backend**: Verifies Supabase JWTs via JWKS, enforces authorization, and manages the database via Prisma

## Project Structure

```
domate/
├── frontend/                  # React SPA
│   ├── src/
│   │   ├── components/        # UI components grouped by domain
│   │   │   ├── auth/          # Login, signup, password reset
│   │   │   ├── board/         # Kanban board, lists, task cards
│   │   │   ├── chat/          # Workspace chat
│   │   │   ├── announcements/ # Team announcements
│   │   │   ├── dashboard/     # Home & task views
│   │   │   ├── workspace/     # Workspace management
│   │   │   ├── settings/      # User settings
│   │   │   └── common/        # Shared UI components
│   │   ├── context/           # Auth, theme, workspace providers
│   │   ├── hooks/             # Real-time chat, presence, & cursor hooks
│   │   ├── services/          # API client modules
│   │   └── lib/               # Supabase client
│   └── ...
├── backend/                   # Express REST API
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── routes/            # Route definitions
│   │   ├── schemas/           # Zod validation schemas
│   │   ├── middleware/        # Auth, validation, error handling
│   │   └── services/          # Business logic
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   └── sql/                   # Supabase setup scripts
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)

### Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env` with your Supabase credentials:

```env
PORT=8000
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_AUD=authenticated
CORS_ORIGIN=http://localhost:5173
NODE_ENV=dev
```

Initialize the database and Supabase resources:

```bash
npm run db:init
```

Start the dev server:

```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8000/api
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Environment Variables

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_API_URL` | Backend API base URL |

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 8000) |
| `DATABASE_URL` | PostgreSQL connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `SUPABASE_AUD` | JWT audience (default: `authenticated`) |
| `CORS_ORIGIN` | Allowed CORS origin |
| `NODE_ENV` | Environment (`dev`, `production`) |

## API Overview

All endpoints are prefixed with `/api` and require a Bearer JWT token.

| Route Group | Description |
|-------------|-------------|
| `/api/workspaces` | Workspace CRUD, members |
| `/api/boards` | Board CRUD within workspaces |
| `/api/lists` | List CRUD, reordering |
| `/api/tasks` | Task CRUD, reordering, labeling, assigning |
| `/api/comments` | Task comments |
| `/api/announcements` | Workspace announcements |
| `/api/chat` | Workspace chat messages |
| `/api/users` | User profiles, search |
| `/api/invitations` | Workspace invitations |
| `/api/notifications` | Real-time notifications and alerts |

## Database

The database schema (managed via Prisma) includes these models:

- **Workspace** / **WorkspaceMember** — Workspaces with role-based membership (OWNER, MEMBER)
- **Board** / **List** / **Task** — Kanban hierarchy with positional ordering
- **TaskAssignment** — User-task assignments
- **TaskComment** — Comments on tasks
- **BoardLabel** / **TaskLabel** — Label system scoped to boards
- **ChatMessage** — Workspace chat messages
- **Announcement** — Pinnable team announcements
- **Attachment** — File attachments (tasks, announcements)
- **Invitation** — Pending/accepted/declined/expired invitations
- **User** — Synced from Supabase Auth
- **Notification** — Live alerts and system notifications
- **RecentVisit** — Tracks recent navigation

## Real-time Features

- **Boards**: Task moves, edits, comments, and list changes sync instantly across all clients
- **Live Cursors & Item Locking**: Broadcast drag positions and view peer cursor movements with color-coded badges, alongside visual item locking to prevent simultaneous drag collisions
- **Chat**: Workspace messaging with real-time delivery and typing indicators via Supabase Realtime
- **Presence**: Active users on a board are tracked and displayed using Supabase Realtime presence
- **Announcements**: Team-wide announcements are broadcast immediately
- **Notifications**: Instant alerts for invitations, task assignments, and team updates

## License

MIT

