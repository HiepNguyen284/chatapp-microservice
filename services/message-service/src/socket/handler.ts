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

    // Join personal room for direct messaging & notifications
    socket.join(`user:${userId}`);

    // ─── Friend Request Events (relay to target user) ──────────

    // Someone sent a friend request → notify the receiver
    socket.on("friend_request_sent", (data: { receiverId: number; request: unknown }) => {
      io.to(`user:${data.receiverId}`).emit("friend_request_received", {
        request: data.request,
      });
      console.log(`[socket.io] friend request: user ${userId} → user ${data.receiverId}`);
    });

    // Friend request accepted → notify the original sender
    socket.on("friend_request_accepted", (data: { senderId: number; request: unknown }) => {
      io.to(`user:${data.senderId}`).emit("friend_request_accepted", {
        request: data.request,
      });
      console.log(`[socket.io] friend accepted: user ${userId} accepted user ${data.senderId}`);
    });

    // Friend request rejected → notify the original sender
    socket.on("friend_request_rejected", (data: { senderId: number; requestId: number }) => {
      io.to(`user:${data.senderId}`).emit("friend_request_rejected", {
        requestId: data.requestId,
      });
      console.log(`[socket.io] friend rejected: user ${userId} rejected user ${data.senderId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[socket.io] user ${userId} disconnected (${socket.id})`);
    });
  });
}
