import express, { type Express } from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app: Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

app.use(express.json());

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

// --- Routes placeholder ---
// TODO: Implement /api/messages/* and /api/moderation/* endpoints
// TODO: Implement Socket.io event handlers
// See: docs/api-specs/message-service.yaml

io.on("connection", (socket) => {
  console.log(`[socket.io] client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`[socket.io] client disconnected: ${socket.id}`);
  });
});

export { app, httpServer, io };
