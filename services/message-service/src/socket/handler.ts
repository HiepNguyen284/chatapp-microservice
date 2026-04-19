import type { Server } from "socket.io";
import { verifyToken } from "../middleware/auth.js";

export function setupSocketHandlers(io: Server): void {
  // Socket.io auth middleware — verify JWT on connection
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      next(new Error("Authentication required"));
      return;
    }

    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as number;
    console.log(`[socket.io] user ${userId} connected (${socket.id})`);

    // Join personal room for direct messaging
    socket.join(`user:${userId}`);

    socket.on("disconnect", () => {
      console.log(`[socket.io] user ${userId} disconnected (${socket.id})`);
    });
  });
}
