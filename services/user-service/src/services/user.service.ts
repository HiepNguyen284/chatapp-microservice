import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-jwt-secret";
const SALT_ROUNDS = 10;

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: Date;
}

export async function registerUser(
  username: string,
  email: string,
  password: string,
): Promise<User> {
  // Check duplicate username or email
  const existing = await pool.query(
    "SELECT id FROM users WHERE username = $1 OR email = $2",
    [username, email],
  );

  if (existing.rows.length > 0) {
    throw new Error("Username or email already exists");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, username, email, role, created_at`,
    [username, email, passwordHash],
  );

  return result.rows[0] as User;
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ user: User; token: string }> {
  const result = await pool.query(
    "SELECT id, username, email, password_hash, role, created_at FROM users WHERE email = $1",
    [email],
  );

  if (result.rows.length === 0) {
    throw new Error("Invalid email or password");
  }

  const row = result.rows[0];
  const isValid = await bcrypt.compare(password, row.password_hash);

  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    { userId: row.id, role: row.role },
    JWT_SECRET,
    { expiresIn: "24h" },
  );

  const user: User = {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    created_at: row.created_at,
  };

  return { user, token };
}

export async function getUserById(id: number): Promise<User | null> {
  const result = await pool.query(
    "SELECT id, username, email, role, created_at FROM users WHERE id = $1",
    [id],
  );

  return (result.rows[0] as User) ?? null;
}

export async function searchUsers(
  query: string,
  currentUserId: number,
): Promise<User[]> {
  const result = await pool.query(
    `SELECT id, username, email, role, created_at FROM users
     WHERE (username ILIKE $1 OR email ILIKE $1) AND id != $2
     LIMIT 20`,
    [`%${query}%`, currentUserId],
  );

  return result.rows as User[];
}
