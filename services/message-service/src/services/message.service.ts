import pool from "../config/db.js";

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: Date;
}

export async function saveMessage(
  senderId: number,
  receiverId: number,
  content: string,
): Promise<Message> {
  const result = await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [senderId, receiverId, content],
  );

  return result.rows[0] as Message;
}

export async function getConversation(
  userId1: number,
  userId2: number,
  limit: number = 50,
  offset: number = 0,
): Promise<Message[]> {
  const result = await pool.query(
    `SELECT * FROM messages
     WHERE (sender_id = $1 AND receiver_id = $2)
        OR (sender_id = $2 AND receiver_id = $1)
     ORDER BY created_at ASC
     LIMIT $3 OFFSET $4`,
    [userId1, userId2, limit, offset],
  );

  return result.rows as Message[];
}
