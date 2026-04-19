import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../contexts/useAuth";
import { useSocket } from "../hooks/useSocket";
import type { User, FriendRequest } from "../types";

export default function FriendsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<number>>(new Set());

  // Friends & Requests
  const [friends, setFriends] = useState<FriendRequest[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "search">(
    "friends",
  );

  // User info cache: id → User
  const [userMap, setUserMap] = useState<Record<number, User>>({});

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ─── Fetch user details by IDs ──────────

  const fetchUserDetails = useCallback(async (ids: number[]) => {
    // Filter out already-known IDs and self
    const unknownIds = ids.filter((id) => !userMap[id] && id !== user?.id);
    if (unknownIds.length === 0) return;

    try {
      const { data } = await api.post("/api/users/batch", { ids: unknownIds });
      const map: Record<number, User> = {};
      for (const u of data as User[]) {
        map[u.id] = u;
      }
      setUserMap((prev) => ({ ...prev, ...map }));
    } catch (err) {
      console.error("Failed to fetch user details", err);
    }
  }, [userMap, user?.id]);

  const getUserName = (id: number): string => {
    if (id === user?.id) return user?.username ?? `User #${id}`;
    return userMap[id]?.username ?? `User #${id}`;
  };

  const getUserInitial = (id: number): string => {
    const name = getUserName(id);
    return name.charAt(0).toUpperCase();
  };

  // ─── Socket.io — Real-time friend notifications ──────────

  const loadFriends = useCallback(async () => {
    try {
      const { data } = await api.get("/api/friends");
      setFriends(data);

      // Fetch usernames for friend IDs
      const ids = (data as FriendRequest[]).map((fr) =>
        fr.sender_id === user?.id ? fr.receiver_id : fr.sender_id,
      );
      if (ids.length > 0) fetchUserDetails(ids);
    } catch (err) {
      console.error("Failed to load friends", err);
    }
  }, [fetchUserDetails, user?.id]);

  const loadRequests = useCallback(async () => {
    try {
      const { data } = await api.get("/api/friends/requests/received");
      setRequests(data);

      // Fetch usernames for sender IDs
      const ids = (data as FriendRequest[]).map((r) => r.sender_id);
      if (ids.length > 0) fetchUserDetails(ids);
    } catch (err) {
      console.error("Failed to load requests", err);
    }
  }, [fetchUserDetails]);

  const onFriendRequestReceived = useCallback(() => {
    void loadRequests();
    showToast("📩 Bạn nhận được lời mời kết bạn mới!");
  }, [loadRequests, showToast]);

  const onFriendRequestAccepted = useCallback(() => {
    void loadFriends();
    void loadRequests();
    showToast("🎉 Lời mời kết bạn đã được chấp nhận!");
  }, [loadFriends, loadRequests, showToast]);

  const onFriendRequestRejected = useCallback(() => {
    showToast("😢 Lời mời kết bạn đã bị từ chối.");
  }, [showToast]);

  const { emit } = useSocket({
    onFriendRequestReceived,
    onFriendRequestAccepted,
    onFriendRequestRejected,
  });

  // ─── API calls ──────────

  useEffect(() => {
    void loadFriends();
    void loadRequests();
  }, [loadFriends, loadRequests]);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const { data } = await api.get(
        `/api/users/search?q=${encodeURIComponent(searchQuery)}`,
      );
      setSearchResults(data);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setSearching(false);
    }
  };

  const sendRequest = async (receiverId: number) => {
    try {
      const { data } = await api.post("/api/friends/requests", { receiverId });
      // Notify receiver via Socket.io in real time
      emit("friend_request_sent", { receiverId, request: data });
      // Mark as sent (changes button state)
      setSentRequests((prev) => new Set(prev).add(receiverId));
      showToast("✅ Đã gửi lời mời kết bạn!");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      showToast(`❌ ${msg ?? "Gửi lời mời thất bại"}`);
    }
  };

  const acceptRequest = async (requestId: number, senderId: number) => {
    try {
      const { data } = await api.put(`/api/friends/requests/${requestId}/accept`);
      // Notify sender via Socket.io in real time
      emit("friend_request_accepted", { senderId, request: data });
      await loadRequests();
      await loadFriends();
      showToast("✅ Đã chấp nhận lời mời kết bạn!");
    } catch (err) {
      console.error("Failed to accept request", err);
    }
  };

  const rejectRequest = async (requestId: number, senderId: number) => {
    try {
      await api.put(`/api/friends/requests/${requestId}/reject`);
      // Notify sender via Socket.io in real time
      emit("friend_request_rejected", { senderId, requestId });
      await loadRequests();
      showToast("Đã từ chối lời mời kết bạn.");
    } catch (err) {
      console.error("Failed to reject request", err);
    }
  };

  const getFriendId = (fr: FriendRequest) => {
    return fr.sender_id === user?.id ? fr.receiver_id : fr.sender_id;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="px-5 py-3 bg-gray-800/90 backdrop-blur-sm border border-violet-500/30 rounded-xl text-gray-200 text-sm shadow-2xl shadow-violet-500/10">
            {toast}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-8 py-6 border-b border-gray-800/50">
        <h2 className="text-2xl font-bold text-white">Bạn bè</h2>
        <p className="text-gray-500 text-sm mt-1">
          Quản lý danh sách bạn bè và lời mời
        </p>
      </header>

      {/* Tabs */}
      <div className="px-8 pt-4 flex gap-2">
        {(
          [
            { key: "friends", label: "Danh sách bạn bè", count: friends.length },
            { key: "requests", label: "Lời mời", count: requests.length },
            { key: "search", label: "Tìm kiếm", count: null },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? "bg-violet-500/20 text-violet-300"
                : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
            }`}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-violet-500/30 text-violet-300 rounded-full text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* Search tab */}
        {activeTab === "search" && (
          <div>
            <form onSubmit={handleSearch} className="flex gap-3 mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo username hoặc email..."
                className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all duration-200"
              />
              <button
                type="submit"
                disabled={searching}
                className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                {searching ? "..." : "Tìm"}
              </button>
            </form>

            <div className="space-y-3">
              {searchResults.map((u) => {
                const alreadySent = sentRequests.has(u.id);
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800/50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-gray-200 font-medium">{u.username}</p>
                        <p className="text-gray-500 text-xs">{u.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => !alreadySent && sendRequest(u.id)}
                      disabled={alreadySent}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        alreadySent
                          ? "bg-gray-700/30 text-gray-500 cursor-default"
                          : "bg-violet-600/20 text-violet-300 hover:bg-violet-600/30"
                      }`}
                    >
                      {alreadySent ? "✓ Đã gửi" : "Kết bạn"}
                    </button>
                  </div>
                );
              })}
              {searchResults.length === 0 && searchQuery && !searching && (
                <p className="text-gray-500 text-center py-8">
                  Không tìm thấy kết quả
                </p>
              )}
            </div>
          </div>
        )}

        {/* Requests tab */}
        {activeTab === "requests" && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Không có lời mời kết bạn
              </p>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800/50 rounded-xl animate-fade-in"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                      {getUserInitial(req.sender_id)}
                    </div>
                    <div>
                      <p className="text-gray-200 font-medium">
                        {getUserName(req.sender_id)}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(req.created_at).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptRequest(req.id, req.sender_id)}
                      className="px-4 py-2 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 rounded-lg text-sm font-medium transition-all duration-200"
                    >
                      Chấp nhận
                    </button>
                    <button
                      onClick={() => rejectRequest(req.id, req.sender_id)}
                      className="px-4 py-2 bg-red-600/20 text-red-300 hover:bg-red-600/30 rounded-lg text-sm font-medium transition-all duration-200"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Friends tab */}
        {activeTab === "friends" && (
          <div className="space-y-3">
            {friends.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-2">
                  Chưa có bạn bè nào
                </p>
                <p className="text-gray-600 text-sm">
                  Hãy tìm kiếm và gửi lời mời kết bạn!
                </p>
              </div>
            ) : (
              friends.map((fr) => {
                const friendId = getFriendId(fr);
                return (
                  <div
                    key={fr.id}
                    className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800/50 rounded-xl hover:bg-gray-800/30 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
                        {getUserInitial(friendId)}
                      </div>
                      <div>
                        <p className="text-gray-200 font-medium">
                          {getUserName(friendId)}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Bạn bè từ{" "}
                          {new Date(fr.updated_at).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/chat/${friendId}`)}
                      className="px-4 py-2 bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 rounded-lg text-sm font-medium transition-all duration-200"
                    >
                      💬 Nhắn tin
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
