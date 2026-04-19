# friend-service

Friend service quản lý luồng kết bạn: gửi lời mời, nhận danh sách lời mời, chấp nhận/từ chối và lấy danh sách bạn bè.

## Endpoints

- `GET /health`
- `POST /api/friends/requests`
- `GET /api/friends/requests/received`
- `PUT /api/friends/requests/:id/accept`
- `PUT /api/friends/requests/:id/reject`
- `GET /api/friends`
- `GET /api/friends/check?userId1=<id>&userId2=<id>`

## Local Commands

```bash
pnpm install
pnpm lint
pnpm run build
pnpm test -- --run
```

## Environment Variables

- `PORT` (default `5002`)
- `DATABASE_URL`
- `JWT_SECRET`
