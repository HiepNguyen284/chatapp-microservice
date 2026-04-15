# AGENTS.md — Universal Agent Instructions
# Compatible with: OpenAI Codex, Claude Code, Copilot Agent, Cursor Composer, etc.

## Identity

You are a software engineering assistant working on a microservices chat application (university assignment).
You help build, debug, test, document, and deploy a multi-service application.

## Project Architecture

```
frontend/                → Vite + React + TailwindCSS v4 → Caddy (:3000)
gateway/                 → Traefik v3 Docker provider (:8080)
services/
  user-service/          → ExpressJS 5 + TypeScript (:5001) — auth, user management
  friend-service/        → ExpressJS 5 + TypeScript (:5002) — friend requests, friend list
  message-service/       → ExpressJS 5 + Socket.io + TypeScript (:5003) — messaging, moderation, WebSocket
docs/
  api-specs/             → OpenAPI 3.0 YAML specifications
  architecture.md        → System architecture documentation
  analysis-and-design.md → Service analysis and design
compose.yml              → Container orchestration
.env.example             → Environment variable template
```

## Tech Stack

- **Package manager**: pnpm
- **Backend**: ExpressJS 5 + TypeScript (tsdown bundler)
- **Frontend**: Vite + React 19 + TailwindCSS v4
- **Database**: PostgreSQL 18-alpine (3 databases: chatapp_user, chatapp_friend, chatapp_message)
- **Cache/Broker**: Redis 8-alpine (@socket.io/redis-adapter)
- **Gateway**: Traefik v3 (Docker provider, auto-discovery via labels)
- **Serving**: Caddy (frontend static files)

## Core Constraints

1. **Docker-first**: All code runs inside Docker containers. Never suggest running directly on the host.
2. **Single command deploy**: `docker compose up --build` must start the entire system.
3. **Database per service**: Each service owns its data. No shared databases.
4. **Gateway routing**: Client → Traefik → Services. Never bypass the gateway.
5. **Health checks**: Every service implements `GET /health` → `{"status": "ok"}`.
6. **Environment variables**: Use `.env` for config. Never hardcode secrets.
7. **OpenAPI specs**: All APIs documented in `docs/api-specs/` (OpenAPI 3.0 YAML).

## Testing

**Every change MUST include tests.** Follow these rules:

1. **Run tests before committing**: `pnpm test -- --run` in the affected service directory.
2. **Run lint before committing**: `pnpm lint` in the affected service directory.
3. **Run format check**: `pnpm format:check` in the affected service directory.
4. **Write tests for new code**: Every new function, endpoint, or module must have corresponding test(s).
5. **Test framework**: Vitest — files go in `src/` with `.test.ts` extension.
6. **Test naming**: Use descriptive names — `describe("<module>")` and `it("should <behavior>")`.
7. **Test coverage**: At minimum, test happy path + one error case per endpoint.
8. **Do NOT skip failing tests** — fix the code or the test.

### Test Commands

```bash
# Run tests for a specific service
cd services/user-service && pnpm test -- --run

# Run lint
cd services/user-service && pnpm lint

# Run format check
cd services/user-service && pnpm format:check

# Run all checks (what CI does)
pnpm lint && pnpm format:check && pnpm run build && pnpm test -- --run
```

## Coding Standards

- Follow idiomatic TypeScript conventions
- Include proper error handling with meaningful error messages
- Add input validation on all endpoints
- Use strict TypeScript (`"strict": true`)
- Keep functions small, focused, and well-named
- Comments explain "why", not "what"

## When Creating/Modifying Services

1. Check `docs/api-specs/` for existing API contracts
2. Implement/update the `GET /health` endpoint
3. Use Docker Compose service names for inter-service calls (e.g., `http://friend-service:5002`)
4. Update the OpenAPI spec when adding/changing endpoints
5. **Write or update tests**
6. Run `pnpm lint && pnpm test -- --run` to verify
7. Verify the Dockerfile builds correctly

## When Debugging

1. Check Docker logs: `docker compose logs <service-name>`
2. Verify network connectivity between services
3. Check environment variables are properly loaded
4. Verify port mappings in compose.yml
5. Test health endpoints first

## File Conventions

| Purpose | Location | Format |
|---------|----------|--------|
| API specs | `docs/api-specs/<service>.yaml` | OpenAPI 3.0 |
| Architecture | `docs/architecture.md` | Markdown |
| Service docs | `<service>/readme.md` | Markdown |
| Tests | `<service>/src/*.test.ts` | Vitest |
| Env config | `.env.example` → `.env` | KEY=VALUE |
| Diagrams | `docs/asset/` | PNG/SVG/Mermaid |

## Response Format

- Be concise and actionable
- Show code changes with file paths
- Always run tests after making changes
- Suggest next steps after completing a task
