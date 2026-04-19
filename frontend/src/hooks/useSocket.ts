import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../contexts/useAuth";
import type { Message } from "../types";

interface UseSocketOptions {
  onNewMessage?: (message: Message) => void;
  onFriendRequestReceived?: (data: { request: unknown }) => void;
  onFriendRequestAccepted?: (data: { request: unknown }) => void;
  onFriendRequestRejected?: (data: { requestId: number }) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

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
    const socket = socketRef.current;
    if (!socket) return;

    const onMsg = (msg: Message) => optionsRef.current.onNewMessage?.(msg);
    socket.on("new_message", onMsg);

    return () => {
      socket.off("new_message", onMsg);
    };
  }, [token, isAuthenticated]);

  // Listen for friend request events
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onReceived = (data: { request: unknown }) =>
      optionsRef.current.onFriendRequestReceived?.(data);

    const onAccepted = (data: { request: unknown }) =>
      optionsRef.current.onFriendRequestAccepted?.(data);

    const onRejected = (data: { requestId: number }) =>
      optionsRef.current.onFriendRequestRejected?.(data);

    socket.on("friend_request_received", onReceived);
    socket.on("friend_request_accepted", onAccepted);
    socket.on("friend_request_rejected", onRejected);

    return () => {
      socket.off("friend_request_received", onReceived);
      socket.off("friend_request_accepted", onAccepted);
      socket.off("friend_request_rejected", onRejected);
    };
  }, [token, isAuthenticated]);

  // Emit helper
  const emit = useCallback((event: string, data: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return { socketRef, emit };
}
