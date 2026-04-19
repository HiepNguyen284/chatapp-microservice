# System Architecture

> This document is completed **after** the Analysis and Design phase.
> Choose **one** analysis approach and complete it first:
> - [Analysis and Design — Step-by-Step Action](analysis-and-design.md)
> - [Analysis and Design — DDD](analysis-and-design-ddd.md)
>
> Both approaches produce the same inputs for this document: **Service Candidates**, **Service Composition**, and **Non-Functional Requirements**.

**References:**
1. *Service-Oriented Architecture: Analysis and Design for Services and Microservices* — Thomas Erl (2nd Edition)
2. *Microservices Patterns: With Examples in Java* — Chris Richardson
3. *Bài tập — Phát triển phần mềm hướng dịch vụ* — Hung Dang (available in Vietnamese)

---

### How this document connects to Analysis & Design

```
┌─────────────────────────────────────────────────────┐
│         Analysis & Design (choose one)              │
│                                                     │
│  Step-by-Step Action        DDD                     │
│  Part 1: Analysis Prep     Part 1: Domain Discovery │
│  Part 2: Decompose →       Part 2: Strategic DDD →  │
│    Service Candidates        Bounded Contexts       │
│  Part 3: Service Design    Part 3: Service Design   │
│    (contract + logic)        (contract + logic)     │
└────────────────┬────────────────────────────────────┘
                 │ inputs: service list, NFRs,
                 │         service contracts (API specs)
                 ▼
┌─────────────────────────────────────────────────────┐
│         Architecture (this document)                │
│                                                     │
│  1. Pattern Selection                               │
│  2. System Components (tech stack, ports)           │
│  3. Communication Matrix                            │
│  4. Architecture Diagram                            │
│  5. Deployment                                      │
└─────────────────────────────────────────────────────┘
```

> 💡 **What you need before starting:** your completed service list from Part 2 (service candidates and their responsibilities) and your service contracts from Part 3 (API endpoints). This document turns those logical designs into a concrete, deployable system architecture.

---

## 1. Pattern Selection

Select patterns based on business/technical justifications from your analysis.

| Pattern | Selected? | Business/Technical Justification |
|---------|-----------|----------------------------------|
| API Gateway | ✅ | Traefik đóng vai trò single entry point, reverse proxy, routing dựa trên path prefix. Xử lý cross-cutting concerns: TLS termination, load balancing. JWT authentication được xử lý tại mỗi service thông qua middleware chung (shared library). |
| Database per Service | ✅ | Mỗi service (user, friend, message) có PostgreSQL **database riêng** trong cùng một PostgreSQL instance, đảm bảo **logical isolation** — mỗi service chỉ truy cập database của mình thông qua connection string riêng. Thay đổi schema của service này không ảnh hưởng service khác. Sử dụng chung instance giúp tiết kiệm tài nguyên trong môi trường development/MVP mà vẫn giữ nguyên tắc database-per-service ở mức logical. |
| Shared Database | ❌ | Không sử dụng shared database (1 DB cho tất cả services) — vi phạm nguyên tắc service autonomy. Mặc dù dùng chung PostgreSQL instance, mỗi service có database riêng biệt, không chia sẻ tables. |
| Saga | ❌ | Không cần — không có distributed transaction phức tạp. Gửi tin nhắn chỉ cần message-service gọi friend-service kiểm tra bạn bè (synchronous call), không cần compensating transaction. |
| Event-driven / Message Queue | ✅ | Redis được sử dụng làm **message broker** cho `@socket.io/redis-adapter`. Khi message-service cần scale horizontally (nhiều instances), Redis Pub/Sub đảm bảo tin nhắn WebSocket được broadcast đến tất cả instances — client kết nối đến bất kỳ instance nào cũng nhận được tin nhắn. |
| CQRS | ❌ | Không cần — read/write patterns của hệ thống đơn giản, không có yêu cầu tách biệt read model và write model. |
| Circuit Breaker | ❌ | Không áp dụng trong phạm vi MVP. Có thể bổ sung khi scale (ví dụ: message-service gọi friend-service fail → fallback). |
| Service Registry / Discovery | ✅ | Traefik Docker provider tự động phát hiện services thông qua Docker container labels. Khi service start/stop/scale, Traefik cập nhật routing table tự động — không cần cấu hình thủ công. Kết hợp với Docker Compose DNS cho inter-service communication nội bộ. |

> Reference: *Microservices Patterns* — Chris Richardson, chapters on decomposition, data management, and communication patterns.

---

## 2. System Components

| Component | Responsibility | Tech Stack | Port |
|-----------|---------------|------------|------|
| **Frontend** | Giao diện người dùng: đăng ký, đăng nhập, tìm kiếm bạn bè, nhắn tin real-time, quản lý từ khóa cấm (Admin). Caddy serve static files (React build output) | ReactJS + Caddy (static file server) | 3000 |
| **Gateway** | Single entry point cho toàn bộ hệ thống (cả static files lẫn API + WebSocket). Reverse proxy, service discovery tự động qua Docker labels, routing dựa trên path prefix, load balancing, health check | Traefik v3 (Docker provider) | 8080 (HTTP), 8081 (Dashboard) |
| **user-service** | Đăng ký, đăng nhập (JWT), lấy profile, tìm kiếm người dùng | ExpressJS (Node.js) | 5001 |
| **friend-service** | Gửi/chấp nhận/từ chối lời mời kết bạn, lấy danh sách bạn bè, kiểm tra quan hệ bạn bè (internal API) | ExpressJS (Node.js) | 5002 |
| **message-service** | Gửi/nhận tin nhắn (kèm kiểm tra bạn bè + lọc nội dung), WebSocket (Socket.io + Redis adapter), quản lý từ khóa cấm | ExpressJS (Node.js) + Socket.io | 5003 |
| **postgres** | Lưu trữ dữ liệu cho cả 3 services — 3 databases riêng biệt: `chatapp_user`, `chatapp_friend`, `chatapp_message` trong cùng 1 instance | PostgreSQL 18-alpine | 5432 |
| **redis** | Message broker cho `@socket.io/redis-adapter` — đồng bộ WebSocket events giữa các message-service instances khi scale horizontally | Redis 8-alpine | 6379 |

---

## 3. Communication

### Inter-service Communication Matrix

| From → To | Frontend (Caddy) | Gateway (Traefik) | user-service | friend-service | message-service | postgres | redis |
|-----------|-----------------|-------------------|--------------|----------------|-----------------|----------|-------|
| **Client** | — | HTTP REST + WebSocket (single entry point) | — | — | — | — | — |
| **Gateway** | HTTP (reverse proxy static files) | — | HTTP REST (reverse proxy) | HTTP REST (reverse proxy) | HTTP REST + WebSocket (reverse proxy) | — | — |
| **user-service** | — | — | — | — | — | TCP (pg → chatapp_user) | — |
| **friend-service** | — | — | — | — | — | TCP (pg → chatapp_friend) | — |
| **message-service** | — | — | — | HTTP REST (verify friendship) | — | TCP (pg → chatapp_message) | Redis Pub/Sub (Socket.io adapter) |

> **Lưu ý:** Client chỉ giao tiếp với Traefik (port 8080). Traefik proxy static files đến Caddy (Frontend) và proxy API/WebSocket đến backend services. Socket.io WebSocket connection đi qua Traefik (`/socket.io/*` → message-service).

### Communication Protocols

| Protocol | Usage | Description |
|----------|-------|-------------|
| HTTP/REST | Client ↔ Gateway ↔ Services | Synchronous request/response cho tất cả API endpoints |
| HTTP (static) | Gateway ↔ Frontend (Caddy) | Traefik proxy request đến Caddy để serve React static files (HTML, JS, CSS) |
| WebSocket (Socket.io) | Client ↔ Gateway ↔ message-service | Real-time bidirectional communication cho nhận tin nhắn. WebSocket connection đi qua Traefik — client kết nối vào cùng port 8080, Traefik route `/socket.io/*` đến message-service. Socket.io cung cấp tự động fallback polling nếu WS không khả dụng |
| TCP (PostgreSQL) | Services ↔ postgres | PostgreSQL wire protocol, mỗi service kết nối đến database riêng trong cùng 1 instance qua connection pool |
| Redis Pub/Sub | message-service ↔ redis | `@socket.io/redis-adapter` sử dụng Redis Pub/Sub để đồng bộ WebSocket events giữa các message-service instances |

### Traefik Routing Rules

| Path Prefix | Target Service | Priority | Strip Prefix? | Ghi chú |
|-------------|---------------|----------|---------------|----------|
| `/api/auth/*` | user-service:5001 | 100 | No | |
| `/api/users/*` | user-service:5001 | 100 | No | |
| `/api/friends/*` | friend-service:5002 | 100 | No | |
| `/api/messages/*` | message-service:5003 | 100 | No | |
| `/api/moderation/*` | message-service:5003 | 100 | No | |
| `/socket.io/*` | message-service:5003 | 110 | No | WebSocket upgrade |
| `/api-specs/*` | api-specs:8082 (Caddy) | 120 | StripPrefix(`/api-specs`) | Serve OpenAPI YAML files |
| `/health/user` | user-service:5001 | 110 | ReplacePath(`/health`) | Health check |
| `/health/friend` | friend-service:5002 | 110 | ReplacePath(`/health`) | Health check |
| `/health/message` | message-service:5003 | 110 | ReplacePath(`/health`) | Health check |
| `/*` (catch-all) | frontend:3000 (Caddy) | 1 | No | Static files (React SPA) |

> **Health Check qua Gateway:** Mỗi service expose `GET /health` nội bộ. Traefik sử dụng middleware `ReplacePath` để route `/health/{service-name}` đến endpoint `/health` tương ứng. Ví dụ: `curl http://localhost:8080/health/user` → user-service `/health`. Ngoài ra, Docker healthcheck cũng kiểm tra health nội bộ (xem §5 Deployment).

---

## 4. Architecture Diagram

> Place diagrams in `docs/asset/` and reference here.

```mermaid
graph TB
    subgraph Client
        U[User / Admin Browser]
    end

    subgraph Docker Compose Network
        subgraph Gateway
            GW[Traefik v3<br/>Docker Provider<br/>:8080]
        end

        subgraph Frontend
            FE[Caddy<br/>React static files :3000]
        end

        subgraph Services
            US[user-service<br/>ExpressJS :5001]
            FS[friend-service<br/>ExpressJS :5002]
            MS[message-service<br/>ExpressJS + Socket.io :5003]
        end

        subgraph Infrastructure
            PG[(postgres<br/>PostgreSQL 18-alpine :5432<br/>chatapp_user / chatapp_friend / chatapp_message)]
            RD[redis<br/>Redis 8-alpine :6379]
        end
    end

    U -->|HTTP + WebSocket :8080| GW

    GW -->|catch-all /*| FE
    GW -->|/api/auth/*, /api/users/*| US
    GW -->|/api/friends/*| FS
    GW -->|/api/messages/*, /api/moderation/*, /socket.io/*| MS

    MS -.->|HTTP: verify friendship| FS

    US --- |chatapp_user| PG
    FS --- |chatapp_friend| PG
    MS --- |chatapp_message| PG

    MS ---|Pub/Sub: socket.io adapter| RD
```

> **Ghi chú:**
> - **Client chỉ kết nối vào Traefik (port 8080)** — tất cả traffic (static files, REST API, WebSocket) đều đi qua single entry point
> - Đường nét liền (→) = synchronous HTTP/WebSocket request
> - Đường nét đứt (-.->)  = inter-service call nội bộ
> - Đường nét liền không mũi tên (---) = kết nối infrastructure (database, Redis)
> - Traefik route `/socket.io/*` đến message-service — WebSocket connection upgrade được xử lý tự động
> - Traefik route `/*` (catch-all, priority thấp) đến Caddy để serve React static files
> - Traefik tự động phát hiện services thông qua Docker container labels (không cần cấu hình routing thủ công)

---

## 5. Deployment

### Containerization

- Tất cả services được containerize bằng **Docker**
- Orchestration bằng **Docker Compose**
- Single command: `docker compose up --build`

### Docker Compose Services

| Service | Image / Build | Depends On | Restart Policy |
|---------|--------------|------------|----------------|
| traefik | `traefik:v3` (ghcr.io/traefik/traefik) | — | `unless-stopped` |
| frontend | Build `./frontend` (Caddy + React build) | traefik | `unless-stopped` |
| user-service | Build `./services/user-service` | postgres (healthy) | `unless-stopped` |
| friend-service | Build `./services/friend-service` | postgres (healthy) | `unless-stopped` |
| message-service | Build `./services/message-service` | postgres (healthy), redis (healthy) | `unless-stopped` |
| postgres | `postgres:18-alpine` | — | `unless-stopped` |
| redis | `redis:8-alpine` | — | `unless-stopped` |

> **Shared PostgreSQL instance:** 1 container PostgreSQL chạy 3 databases riêng biệt (`chatapp_user`, `chatapp_friend`, `chatapp_message`). Databases được tạo tự động bởi init script (`scripts/init-databases.sql`) mount vào `/docker-entrypoint-initdb.d/`. Mỗi service kết nối đến database riêng thông qua `DATABASE_URL` khác nhau.

### Service Discovery (Traefik Docker Provider)

Traefik sử dụng **Docker provider** để tự động phát hiện services thông qua container labels. Khi service start, stop, hoặc scale, Traefik cập nhật routing table tự động — không cần file cấu hình routing thủ công.

Ví dụ labels trên mỗi service container:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.<name>.rule=PathPrefix(`/api/...`)"
  - "traefik.http.services.<name>.loadbalancer.server.port=<port>"
```

### Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_URL` | user/friend/message-service | PostgreSQL connection string, mỗi service trỏ đến database riêng (ví dụ: `postgresql://chatapp:secret@postgres:5432/chatapp_user`) |
| `JWT_SECRET` | user/friend/message-service | Shared secret cho JWT token verification |
| `PORT` | all services | Port mà service lắng nghe |
| `FRIEND_SERVICE_URL` | message-service | URL nội bộ đến friend-service (ví dụ: `http://friend-service:5002`) |
| `REDIS_URL` | message-service | Redis connection string cho `@socket.io/redis-adapter` (ví dụ: `redis://redis:6379`) |
| `POSTGRES_USER` | postgres | PostgreSQL superuser username |
| `POSTGRES_PASSWORD` | postgres | PostgreSQL superuser password |
| `POSTGRES_DB` | postgres | Default database (được tạo tự động bởi image) |

### Health Checks

| Service | Health Check | Interval |
|---------|-------------|----------|
| user/friend/message-service | `GET /health` → `{ "status": "ok" }` | Traefik tự động check |
| postgres | `pg_isready -U $POSTGRES_USER` | 5s, 5 retries |
| redis | `redis-cli ping` | 5s, 5 retries |

Traefik sử dụng Docker health status để xác định service availability và tự động routing chỉ đến healthy instances.

### Network

Tất cả containers cùng chung một Docker Compose network (`chatapp-network`), cho phép giao tiếp nội bộ qua tên service (Docker DNS). Traefik bổ sung thêm khả năng service discovery tự động qua Docker labels.
