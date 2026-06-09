import "dotenv/config";
import express from "express";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import { router as boardRoutes } from "./routes/boardRoutes.js";
import { router as listRoutes } from "./routes/listRoutes.js";
import { router as taskRoutes } from "./routes/taskRoutes.js";

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
});

app.use('/api/workspaces', workspaceRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/tasks', taskRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const status = err.status || 500;
  const response = {
    message: process.env.NODE_ENV === 'production' ? "Internal server error" : err.message
  };
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }
  res.status(status).json(response);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})