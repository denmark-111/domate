import "dotenv/config";
import express from "express";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import { router as boardRoutes } from "./routes/boardRoutes.js";
import { router as listRoutes } from "./routes/listRoutes.js";

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})