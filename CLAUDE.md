# CLAUDE.md — Instructions for Claude Code
# Docs: https://docs.anthropic.com/en/docs/claude-code
#
# Full project rules and context: .ai/AGENTS.md
# This file contains a summary for Claude. Edit .ai/AGENTS.md for the source of truth.

## Project

ChatApp Microservice — university assignment.
Tech stack: ReactJS (Vite + TailwindCSS) + ExpressJS + PostgreSQL + Redis + Traefik + Socket.io
Run with: `docker compose up --build`

## Architecture

- **Frontend**: Vite + React + TailwindCSS → Caddy (port 3000)
- **Gateway**: Traefik v3 Docker provider (port 8080)
- **user-service**: ExpressJS (port 5001) — auth, user management
- **friend-service**: ExpressJS (port 5002) — friend requests, friend list
- **message-service**: ExpressJS + Socket.io (port 5003) — messaging, moderation, WebSocket
- **postgres**: PostgreSQL 16 — 3 databases (chatapp_user, chatapp_friend, chatapp_message)
- **redis**: Redis 7 — Socket.io adapter for horizontal scaling

## Key Rules

- Every service exposes `GET /health` → `{"status": "ok"}`
- Services communicate via Docker Compose DNS (service names, not localhost)
- API specs in `docs/api-specs/*.yaml` (OpenAPI 3.0)
- Use environment variables for config — never hardcode secrets
- Code runs inside Docker containers
- Package manager: pnpm

## When Making Changes

1. Check `docs/api-specs/` before implementing endpoints
2. Update OpenAPI specs when adding/modifying endpoints
3. Use service names for inter-service calls (e.g., `http://friend-service:5002`)
4. Update the service's readme when changing behavior
5. Run `docker compose build` to verify changes
