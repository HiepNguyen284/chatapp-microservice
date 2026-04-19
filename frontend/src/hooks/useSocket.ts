import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";
import type { Message } from "../types";

export function useSocket(onNewMessage?: (message: Message) => void) {
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  const connectSocket = useCallback(() => {
    if (!isAuthenticated || !token) return;

    // Disconnect existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io("/", {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("[socket] connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("[socket] disconnected");
    });

    socket.on("connect_error", (err) => {
      console.error("[socket] connection error:", err.message);
    });

    socketRef.current = socket;
  }, [token, isAuthenticated]);

  useEffect(() => {
    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [connectSocket]);

  // Listen for new messages
  useEffect(() => {
    if (!socketRef.current || !onNewMessage) return;

    socketRef.current.on("new_message", onNewMessage);

    return () => {
      socketRef.current?.off("new_message", onNewMessage);
    };
  }, [onNewMessage]);

  return socketRef;
}
