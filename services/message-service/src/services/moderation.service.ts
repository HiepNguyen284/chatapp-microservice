import pool from "../config/db.js";

export interface BannedWord {
  id: number;
  word: string;
  created_at: Date;
}

let bannedWordsCache: string[] = [];

export async function loadBannedWords(): Promise<void> {
  const result = await pool.query("SELECT word FROM banned_words");
  bannedWordsCache = result.rows.map((r) => r.word.toLowerCase());
  console.log(`[moderation] loaded ${bannedWordsCache.length} banned words`);
}

export function filterContent(content: string): string {
  let filtered = content;
  for (const word of bannedWordsCache) {
    const regex = new RegExp(word, "gi");
    filtered = filtered.replace(regex, "***");
  }
  return filtered;
}

export function containsBannedWord(content: string): boolean {
  const lower = content.toLowerCase();
  return bannedWordsCache.some((word) => lower.includes(word));
}

export async function getAllBannedWords(): Promise<BannedWord[]> {
  const result = await pool.query(
    "SELECT * FROM banned_words ORDER BY created_at DESC",
  );
  return result.rows as BannedWord[];
}

export async function addBannedWord(word: string): Promise<BannedWord> {
  // Check duplicate
  const existing = await pool.query(
    "SELECT id FROM banned_words WHERE LOWER(word) = LOWER($1)",
    [word],
  );

  if (existing.rows.length > 0) {
    throw new Error("Word already banned");
  }

  const result = await pool.query(
    "INSERT INTO banned_words (word) VALUES ($1) RETURNING *",
    [word],
  );

  // Reload cache
  await loadBannedWords();

  return result.rows[0] as BannedWord;
}

export async function removeBannedWord(id: number): Promise<void> {
  const result = await pool.query(
    "DELETE FROM banned_words WHERE id = $1 RETURNING id",
    [id],
  );

  if (result.rows.length === 0) {
    throw new Error("Banned word not found");
  }

  // Reload cache
  await loadBannedWords();
}
