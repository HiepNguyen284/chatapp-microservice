# message-service

Message service xử lý gửi/nhận tin nhắn, lịch sử chat, moderation (từ khóa cấm) và real-time Socket.io.

## Endpoints

- `GET /health`
- `POST /api/messages`
- `GET /api/messages/:userId?limit=<n>&offset=<n>`
- `GET /api/moderation/banned-words` (ADMIN)
- `POST /api/moderation/banned-words` (ADMIN)
- `DELETE /api/moderation/banned-words/:id` (ADMIN)

## Socket.io

- Kết nối tại path `/socket.io`
- Auth JWT qua `auth.token`
- Event nhận tin nhắn: `new_message`

## Local Commands

```bash
pnpm install
pnpm lint
pnpm run build
pnpm test -- --run
```

## Environment Variables

- `PORT` (default `5003`)
- `DATABASE_URL`
- `JWT_SECRET`
- `FRIEND_SERVICE_URL`
- `REDIS_URL`
