import "dotenv/config";
import cors from "cors";
import express from "express";
import { apiErrorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { initSupabaseJwks, supabaseAuthMiddleware } from './middleware/supabaseAuth.js';
import workspaceRoutes from "./routes/workspaceRoutes.js";
import { router as boardRoutes } from "./routes/boardRoutes.js";
import { router as listRoutes } from "./routes/listRoutes.js";
import { router as taskRoutes } from "./routes/taskRoutes.js";
import { router as taskCommentRoutes } from "./routes/taskCommentRoutes.js";
import { router as announcementRoutes } from "./routes/announcementRoutes.js";
import { router as chatRoutes } from "./routes/chatRoutes.js";
import invitationRoutes from "./routes/invitationRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

const corsOrigin = process.env.NODE_ENV === "production" ? process.env.CORS_ORIGIN : process.env.CORS_ORIGIN || "http://localhost:5173";

if (!corsOrigin) {
  console.error('CORS_ORIGIN is required in production. Aborting startup.');
  process.exit(1);
}

app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

app.use(express.json());

// Initialize Supabase JWKS once on startup (used by the auth middleware)
if (!process.env.SUPABASE_URL) {
  console.error('SUPABASE_URL is required and was not provided. Aborting startup.');
  process.exit(1);
}

initSupabaseJwks(process.env.SUPABASE_URL);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.use('/api/workspaces', supabaseAuthMiddleware({ audience: process.env.SUPABASE_AUD }), workspaceRoutes);
app.use('/api/boards', supabaseAuthMiddleware({ audience: process.env.SUPABASE_AUD }), boardRoutes);
app.use('/api/lists', supabaseAuthMiddleware({ audience: process.env.SUPABASE_AUD }), listRoutes);
app.use('/api/tasks', supabaseAuthMiddleware({ audience: process.env.SUPABASE_AUD }), taskRoutes);
app.use('/api/comments', supabaseAuthMiddleware({ audience: process.env.SUPABASE_AUD }), taskCommentRoutes);
app.use('/api/announcements', supabaseAuthMiddleware({ audience: process.env.SUPABASE_AUD }), announcementRoutes);
app.use('/api/chat', supabaseAuthMiddleware({ audience: process.env.SUPABASE_AUD }), chatRoutes);
app.use('/api/users', supabaseAuthMiddleware({ audience: process.env.SUPABASE_AUD }), userRoutes);
app.use('/api/invitations', supabaseAuthMiddleware({ audience: process.env.SUPABASE_AUD }), invitationRoutes);

app.use(notFoundHandler);
app.use(apiErrorHandler);

export default app;
