import { useState, useEffect, type FormEvent } from "react";
import api from "../api/client";
import type { BannedWord } from "../types";

export default function AdminPage() {
  const [words, setWords] = useState<BannedWord[]>([]);
  const [newWord, setNewWord] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBannedWords();
  }, []);

  const loadBannedWords = async () => {
    try {
      const { data } = await api.get("/api/moderation/banned-words");
      setWords(data);
    } catch (err) {
      console.error("Failed to load banned words", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newWord.trim()) return;

    try {
      await api.post("/api/moderation/banned-words", {
        word: newWord.trim(),
      });
      setNewWord("");
      await loadBannedWords();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Thêm từ cấm thất bại";
      setError(msg);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/moderation/banned-words/${id}`);
      await loadBannedWords();
    } catch (err) {
      console.error("Failed to delete banned word", err);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="px-8 py-6 border-b border-gray-800/50">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>🛡️</span> Quản lý từ cấm
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Thêm, xóa từ cấm để lọc nội dung tin nhắn
        </p>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        {/* Add word form */}
        <form onSubmit={handleAdd} className="flex gap-3 mb-8">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Nhập từ cần cấm..."
            className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl transition-all duration-200"
          >
            Thêm
          </button>
        </form>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Word list */}
        {loading ? (
          <p className="text-gray-500 text-center py-8">Đang tải...</p>
        ) : words.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-2">
              Chưa có từ cấm nào
            </p>
            <p className="text-gray-600 text-sm">
              Thêm từ cấm để tự động lọc nội dung tin nhắn
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {words.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800/50 rounded-xl"
              >
                <div>
                  <p className="text-gray-200 font-medium">{w.word}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(w.created_at).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(w.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                  title="Xóa"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
