import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../hooks/useSocket";
import type { Message } from "../types";

export default function ChatPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const otherUserId = parseInt(userId ?? "0", 10);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle incoming real-time messages
  const handleNewMessage = useCallback(
    (message: Message) => {
      // Only add if it belongs to this conversation
      if (
        (message.sender_id === otherUserId &&
          message.receiver_id === user?.id) ||
        (message.sender_id === user?.id &&
          message.receiver_id === otherUserId)
      ) {
        setMessages((prev) => {
          // Avoid duplicate (in case we sent it and also received via socket)
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    },
    [otherUserId, user?.id],
  );

  useSocket(handleNewMessage);

  useEffect(() => {
    loadMessages();
  }, [otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data } = await api.get(`/api/messages/${otherUserId}`);
      setMessages(data);
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await api.post("/api/messages", {
        receiverId: otherUserId,
        content: newMessage.trim(),
      });
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat header */}
      <header className="px-6 py-4 border-b border-gray-800/50 flex items-center gap-4">
        <button
          onClick={() => navigate("/friends")}
          className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded-lg transition-all duration-200"
        >
          ←
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
            U
          </div>
          <div>
            <h3 className="text-gray-200 font-semibold">
              User #{otherUserId}
            </h3>
            <p className="text-xs text-gray-500">Đang trò chuyện</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 text-lg mb-2">
                Chưa có tin nhắn nào
              </p>
              <p className="text-gray-600 text-sm">
                Hãy gửi lời chào đầu tiên! 👋
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                    isMine
                      ? "bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-br-md"
                      : "bg-gray-800/70 text-gray-200 rounded-bl-md"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      isMine ? "text-violet-200/60" : "text-gray-500"
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form
        onSubmit={handleSend}
        className="px-6 py-4 border-t border-gray-800/50 flex gap-3"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all duration-200"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="px-6 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? "..." : "Gửi"}
        </button>
      </form>
    </div>
  );
}
