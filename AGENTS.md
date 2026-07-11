# Agents file for Domate

## Project structure

```
domate/
├── frontend/   # React 19 + Vite 8 SPA
│   ├── src/
│   │   ├── components/   # UI components grouped by domain
│   │   ├── context/      # React context providers
│   │   ├── hooks/        # Custom hooks (realtime, etc.)
│   │   ├── services/     # API client modules
│   │   └── lib/          # Supabase client
│   └── ...
├── backend/    # Express 5 REST API
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/       # Express routers
│   │   ├── schemas/      # Zod validation
│   │   ├── middleware/   # Auth, validation, error handling
│   │   └── services/     # Business logic
│   ├── prisma/
│   │   └── schema.prisma # Database model
│   └── sql/              # Supabase setup scripts
└── README.md
```

## Tech stack

- **Frontend**: React 19, Vite 8, Tailwind CSS v4, React Router 7, dnd-kit, Lucide React
- **Backend**: Express 5, Prisma 7, Zod, jose (JWT), pg
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth (JWT verified via JWKS)
- **Realtime**: Supabase Realtime (chat, presence)
- **Storage**: Supabase Storage (avatars, covers, attachments)

## Conventions

### Code style
- JavaScript (JSX), not TypeScript
- ESM modules (`import`/`export`)
- Semicolons required
- 2-space indentation
- No trailing commas
- Single quotes for strings

### Frontend conventions
- Use functional components with hooks
- Use Tailwind CSS utility classes (v4, configured via `@theme` in CSS)
- Use React Router v7 for navigation
- Context providers in `src/context/`, consumed via custom hooks
- API calls go through `src/services/` modules
- Supabase client singleton in `src/lib/supabaseClient.js`
- Real-time subscriptions go in `src/hooks/`

### Backend conventions
- Route → Middleware → Controller → Service(for complex logic) → Prisma layering
- All routes protected by `supabaseAuthMiddleware`
- Request validation via Zod schemas in `src/schemas/`
- Error handling via `asyncHandler` wrapper and `errorHandler` middleware
- Authorization checks in `src/services/authorizationService.js`
- Workspace membership required for most operations

### Database
- Prisma ORM with PostgreSQL
- UUID primary keys on all models
- Timestamps managed by Prisma (`@default(now())`)
- Position fields on List and Task for ordering
- Soft relations (nullable FKs) for Attachment model

## Commands

### Frontend
- `npm run dev` — Start Vite dev server (port 5173)
- `npm run build` — Production build
- `npm run lint` — ESLint

### Backend
- `npm run dev` — Start with nodemon + tsx (port 8000)
- `npm run db:init` — Run Supabase setup SQL scripts

## Useful patterns

### Adding a new API endpoint
1. Add Zod schema in `backend/src/schemas/`
2. Add controller in `backend/src/controllers/`
3. Add route in `backend/src/routes/`
4. Register route in `backend/src/server.js`

### Adding a new frontend page
1. Add component in `frontend/src/components/<domain>/`
2. Add route in `frontend/src/App.jsx`
3. Add service module in `frontend/src/services/` if API calls needed
