# AGENTS.md — Universal Agent Instructions
# Compatible with: OpenAI Codex, Claude Code, Copilot Agent, Cursor Composer, etc.

## Identity

You are a software engineering assistant working on a microservices chat application (university assignment).
You help build, debug, test, document, and deploy a multi-service application.

## Project Architecture

```
frontend/                → Vite + React + TailwindCSS v4 → Caddy (:3000)
gateway/
  traefik.yml            → Traefik v3 static config (Docker provider)
services/
  user-service/          → ExpressJS 5 + TypeScript (:5001) — auth, user management
  friend-service/        → ExpressJS 5 + TypeScript (:5002) — friend requests, friend list
  message-service/       → ExpressJS 5 + Socket.io + TypeScript (:5003) — messaging, moderation, WebSocket
docs/
  api-specs/             → OpenAPI 3.0 YAML specifications (user-service, friend-service, message-service)
  architecture.md        → System architecture documentation
  analysis-and-design.md → Service analysis and design
scripts/
  init-databases.sql     → Creates 3 PostgreSQL databases on first startup
compose.yml              → Container orchestration (Traefik + 3 services + PostgreSQL + Redis)
.env.example             → Environment variable template
.github/workflows/ci.yml → GitHub Actions CI (parallel jobs)
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Package manager | pnpm |
| Backend | ExpressJS 5 + TypeScript (tsdown bundler) |
| Frontend | Vite + React 18 + TailwindCSS v4 |
| Database | PostgreSQL 18-alpine (3 databases: chatapp_user, chatapp_friend, chatapp_message) |
| Cache/Broker | Redis 8-alpine (@socket.io/redis-adapter) |
| Gateway | Traefik v3 (Docker provider, auto-discovery via container labels) |
| Static serving | Caddy (frontend build output) |
| Linting | ESLint 10 + typescript-eslint |
| Formatting | Prettier 3 (config at root `.prettierrc`, ignore at `.prettierignore`) |
| Testing | Vitest |
| CI | GitHub Actions (parallel: frontend + 3 services → Docker build) |

## Traefik Routing

| Path | Target | Priority |
|------|--------|----------|
| `/api/auth/*` | user-service:5001 | 10 |
| `/api/users/*` | user-service:5001 | 10 |
| `/api/friends/*` | friend-service:5002 | 10 |
| `/api/messages/*` | message-service:5003 | 10 |
| `/api/moderation/*` | message-service:5003 | 10 |
| `/socket.io/*` | message-service:5003 | 10 |
| `/*` (catch-all) | frontend:3000 | 1 |

## Inter-Service Communication

- **message-service → friend-service**: HTTP REST call to verify friendship before sending messages (`FRIEND_SERVICE_URL=http://friend-service:5002`)
- All services → **postgres**: TCP via `DATABASE_URL`
- **message-service → redis**: Pub/Sub via `REDIS_URL` (Socket.io adapter)

## Core Constraints

1. **Container-first**: Prefer `podman compose` when Podman exists, otherwise use `docker compose`.
2. **Single command deploy**: Compose must start the entire system with one command.
3. **Database per service**: Each service owns its data. No shared databases.
4. **Gateway routing**: Client → Traefik → Services. Never bypass the gateway.
5. **Health checks**: Every service implements `GET /health` → `{"status": "ok"}`.
6. **Environment variables**: Use `.env` for config. Never hardcode secrets.
7. **OpenAPI specs**: All APIs documented in `docs/api-specs/` (OpenAPI 3.0 YAML).

## Testing (MANDATORY)

**Every change MUST include tests.** Follow these rules:

1. **Run tests before committing**: `pnpm test -- --run` in the affected service directory.
2. **Run lint before committing**: `pnpm lint` in the affected service directory.
3. **Run format check**: `pnpm format:check` in the affected service directory.
4. **Write tests for new code**: Every new function, endpoint, or module must have corresponding test(s).
5. **Test framework**: Vitest — files go in `src/` with `.test.ts` extension.
6. **Test naming**: Use descriptive names — `describe("<module>")` and `it("should <behavior>")`.
7. **Test coverage**: At minimum, test happy path + one error case per endpoint.
8. **Do NOT skip failing tests** — fix the code or the test.

### Commands

```bash
# In any service directory (e.g., services/user-service):
pnpm lint              # ESLint
pnpm format:check      # Prettier check
pnpm format            # Prettier auto-fix
pnpm run build         # tsdown build
pnpm test -- --run     # Vitest (single run, no watch)

# Full CI check (what GitHub Actions does):
pnpm lint && pnpm format:check && pnpm run build && pnpm test -- --run
```

## Coding Standards

- Follow idiomatic TypeScript conventions
- Include proper error handling with meaningful error messages
- Add input validation on all endpoints
- Use strict TypeScript (`"strict": true`)
- Keep functions small, focused, and well-named
- Comments explain "why", not "what"
- Run `pnpm format` before committing to ensure consistent formatting

## When Creating/Modifying Services

1. Check `docs/api-specs/` for existing API contracts
2. Implement/update the `GET /health` endpoint
3. Use Docker Compose service names for inter-service calls (e.g., `http://friend-service:5002`)
4. Update the OpenAPI spec when adding/changing endpoints
5. **Write or update tests**
6. Run `pnpm lint && pnpm format:check && pnpm test -- --run` to verify
7. Verify the Dockerfile builds correctly

## When Debugging

1. Detect engine first:

   ```bash
   if command -v podman >/dev/null 2>&1; then
     export COMPOSE_CMD="podman compose"
     export DOCKER_SOCKET_PATH="/run/user/1000/podman/podman.sock"
   else
     export COMPOSE_CMD="docker compose"
     unset DOCKER_SOCKET_PATH
   fi
   ```

2. Check container logs: `$COMPOSE_CMD logs <service-name>`
3. Verify network connectivity between services
4. Check environment variables are properly loaded
5. Verify port mappings and Traefik labels in compose.yml
6. Test health endpoints first: `curl http://localhost:8080/health/user`

## File Conventions

| Purpose | Location | Format |
|---------|----------|--------|
| API specs | `docs/api-specs/<service>.yaml` | OpenAPI 3.0 |
| Architecture | `docs/architecture.md` | Markdown |
| Tests | `services/<service>/src/*.test.ts` | Vitest |
| ESLint config | `services/<service>/eslint.config.mjs` | Flat config |
| Prettier config | `.prettierrc` (root) | JSON |
| Prettier ignore | `.prettierignore` (root) | Gitignore syntax |
| Env config | `.env.example` → `.env` | KEY=VALUE |
| CI | `.github/workflows/ci.yml` | GitHub Actions |

## Response Format

- Be concise and actionable
- Show code changes with file paths
- Always run tests after making changes
- Suggest next steps after completing a task
