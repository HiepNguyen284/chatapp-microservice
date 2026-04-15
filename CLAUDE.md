# CLAUDE.md — Instructions for Claude Code

> **Single source of truth: [`.ai/AGENTS.md`](.ai/AGENTS.md)**
> This file is a summary. See `.ai/AGENTS.md` for full project rules, architecture, and testing requirements.

## Project

ChatApp Microservice — university assignment.
Tech stack: ReactJS (Vite + TailwindCSS) + ExpressJS + PostgreSQL + Redis + Traefik + Socket.io
Package manager: pnpm
Run with: `docker compose up --build`

## Architecture

- **Frontend**: Vite + React + TailwindCSS → Caddy (port 3000)
- **Gateway**: Traefik v3 Docker provider (port 8080)
- **user-service**: ExpressJS (port 5001) — auth, user management
- **friend-service**: ExpressJS (port 5002) — friend requests, friend list
- **message-service**: ExpressJS + Socket.io (port 5003) — messaging, moderation, WebSocket
- **postgres**: PostgreSQL 18 — 3 databases (chatapp_user, chatapp_friend, chatapp_message)
- **redis**: Redis 8 — Socket.io adapter for horizontal scaling

## Key Rules

- Every service exposes `GET /health` → `{"status": "ok"}`
- Services communicate via Docker Compose DNS (service names, not localhost)
- API specs in `docs/api-specs/*.yaml` (OpenAPI 3.0)
- Use environment variables for config — never hardcode secrets
- Code runs inside Docker containers

## Testing (MANDATORY)

- **Always run tests** after making changes: `pnpm test -- --run`
- **Always write tests** for new code — files in `src/*.test.ts` (Vitest)
- **Always run lint**: `pnpm lint`
- **Always run format check**: `pnpm format:check`
- Do NOT skip failing tests — fix them

## When Making Changes

1. Check `docs/api-specs/` before implementing endpoints
2. Write/update tests for the change
3. Run `pnpm lint && pnpm format:check && pnpm test -- --run`
4. Use service names for inter-service calls (e.g., `http://friend-service:5002`)
5. Update OpenAPI specs when adding/modifying endpoints
