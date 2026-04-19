import pool from "../config/db.js";

export interface FriendRequest {
  id: number;
  sender_id: number;
  receiver_id: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export async function sendFriendRequest(
  senderId: number,
  receiverId: number,
): Promise<FriendRequest> {
  if (senderId === receiverId) {
    throw new Error("Cannot send friend request to yourself");
  }

  // Check if a request already exists in either direction
  const existing = await pool.query(
    `SELECT id, status FROM friend_requests
     WHERE (sender_id = $1 AND receiver_id = $2)
        OR (sender_id = $2 AND receiver_id = $1)`,
    [senderId, receiverId],
  );

  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    if (row.status === "ACCEPTED") {
      throw new Error("Already friends");
    }
    if (row.status === "PENDING") {
      throw new Error("Friend request already pending");
    }
    // If REJECTED, allow re-sending by updating the existing row
    if (row.status === "REJECTED") {
      const result = await pool.query(
        `UPDATE friend_requests
         SET sender_id = $1, receiver_id = $2, status = 'PENDING', updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [senderId, receiverId, row.id],
      );
      return result.rows[0] as FriendRequest;
    }
  }

  const result = await pool.query(
    `INSERT INTO friend_requests (sender_id, receiver_id)
     VALUES ($1, $2)
     RETURNING *`,
    [senderId, receiverId],
  );

  return result.rows[0] as FriendRequest;
}

export async function getReceivedRequests(
  userId: number,
): Promise<FriendRequest[]> {
  const result = await pool.query(
    `SELECT * FROM friend_requests
     WHERE receiver_id = $1 AND status = 'PENDING'
     ORDER BY created_at DESC`,
    [userId],
  );

  return result.rows as FriendRequest[];
}

export async function acceptFriendRequest(
  requestId: number,
  userId: number,
): Promise<FriendRequest> {
  const existing = await pool.query(
    "SELECT * FROM friend_requests WHERE id = $1",
    [requestId],
  );

  if (existing.rows.length === 0) {
    throw new Error("Friend request not found");
  }

  const request = existing.rows[0];

  if (request.receiver_id !== userId) {
    throw new Error("Not authorized to accept this request");
  }

  if (request.status !== "PENDING") {
    throw new Error("Request is no longer pending");
  }

  const result = await pool.query(
    `UPDATE friend_requests
     SET status = 'ACCEPTED', updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [requestId],
  );

  return result.rows[0] as FriendRequest;
}

export async function rejectFriendRequest(
  requestId: number,
  userId: number,
): Promise<FriendRequest> {
  const existing = await pool.query(
    "SELECT * FROM friend_requests WHERE id = $1",
    [requestId],
  );

  if (existing.rows.length === 0) {
    throw new Error("Friend request not found");
  }

  const request = existing.rows[0];

  if (request.receiver_id !== userId) {
    throw new Error("Not authorized to reject this request");
  }

  if (request.status !== "PENDING") {
    throw new Error("Request is no longer pending");
  }

  const result = await pool.query(
    `UPDATE friend_requests
     SET status = 'REJECTED', updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [requestId],
  );

  return result.rows[0] as FriendRequest;
}

export async function getFriendList(userId: number): Promise<FriendRequest[]> {
  const result = await pool.query(
    `SELECT * FROM friend_requests
     WHERE status = 'ACCEPTED' AND (sender_id = $1 OR receiver_id = $1)
     ORDER BY updated_at DESC`,
    [userId],
  );

  return result.rows as FriendRequest[];
}

export async function checkFriendship(
  userId1: number,
  userId2: number,
): Promise<boolean> {
  const result = await pool.query(
    `SELECT id FROM friend_requests
     WHERE status = 'ACCEPTED'
       AND ((sender_id = $1 AND receiver_id = $2)
        OR  (sender_id = $2 AND receiver_id = $1))`,
    [userId1, userId2],
  );

  return result.rows.length > 0;
}
