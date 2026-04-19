# Frontend — ChatApp

Giao diện SPA cho hệ thống chat 1-1 microservice. Hỗ trợ đăng ký/đăng nhập, tìm kiếm và kết bạn, nhắn tin real-time qua Socket.io, và quản lý từ khóa cấm (Admin).

## Tech Stack

- **React 18** + **TypeScript** — UI framework
- **Vite** — Build tool & dev server
- **Tailwind CSS** — Utility-first styling
- **Socket.io Client** — Real-time messaging
- **React Router v6** — Client-side routing
- **Caddy** — Production static file server (Docker)

## Pages

| Route | Page | Mô tả |
|-------|------|-------|
| `/login` | LoginPage | Đăng nhập bằng email + password |
| `/register` | RegisterPage | Đăng ký tài khoản mới |
| `/friends` | FriendsPage | Tìm kiếm user, gửi/chấp nhận/từ chối lời mời, danh sách bạn bè |
| `/chat/:userId` | ChatPage | Nhắn tin 1-1 real-time với bạn bè |
| `/admin/moderation` | AdminPage | Quản lý từ khóa cấm (ADMIN only) |
| `/docs` | ApiDocsPage | Swagger UI hiển thị OpenAPI specs |

## Local Development

```bash
pnpm install
pnpm run dev        # Dev server tại http://localhost:5173
pnpm run build      # Production build vào dist/
pnpm run lint       # ESLint check
```

## Docker

Frontend được đóng gói thành multi-stage Docker image:

1. **Build stage**: `node:24-slim` + pnpm → Vite build
2. **Production stage**: `caddy:2-alpine` serve static files tại port 3000

Caddy config: [`Caddyfile`](Caddyfile)

## Environment

Frontend gọi API qua relative path (ví dụ `/api/auth/login`). Trong Docker, Traefik reverse proxy chuyển tiếp request đến đúng backend service. Trong dev mode, Vite proxy config trong [`vite.config.ts`](vite.config.ts) chuyển tiếp API calls.
