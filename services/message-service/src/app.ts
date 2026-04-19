import express, { type Express } from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import messageRoutes from "./routes/message.routes.js";
import moderationRoutes from "./routes/moderation.routes.js";

const app: Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

app.use(express.json());

// Health check
app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api/messages", messageRoutes);
app.use("/api/moderation", moderationRoutes);

export { app, httpServer, io };
