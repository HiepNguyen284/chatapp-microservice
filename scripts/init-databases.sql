-- ==============================================
-- ChatApp Microservice — Database Init Script
-- Executed by PostgreSQL on first container start
-- ==============================================

-- Create databases for each microservice
CREATE DATABASE chatapp_user;
CREATE DATABASE chatapp_friend;
CREATE DATABASE chatapp_message;

-- ==============================================
-- chatapp_user — User accounts & authentication
-- ==============================================
\c chatapp_user;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(30) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(10) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- chatapp_friend — Friend requests & relationships
-- ==============================================
\c chatapp_friend;

CREATE TABLE friend_requests (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  status VARCHAR(10) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- Index for fast lookup by receiver (pending requests)
CREATE INDEX idx_friend_requests_receiver ON friend_requests(receiver_id, status);
-- Index for fast lookup by sender or receiver (friend list)
CREATE INDEX idx_friend_requests_sender ON friend_requests(sender_id, status);

-- ==============================================
-- chatapp_message — Messages & moderation
-- ==============================================
\c chatapp_message;

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast conversation lookup
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX idx_messages_receiver ON messages(receiver_id, sender_id, created_at DESC);

CREATE TABLE banned_words (
  id SERIAL PRIMARY KEY,
  word VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
