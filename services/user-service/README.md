# user-service

User service chịu trách nhiệm đăng ký/đăng nhập (JWT), lấy profile hiện tại, tìm kiếm user và tra cứu user theo danh sách ID.

## Endpoints

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`
- `GET /api/users/search?q=<keyword>`
- `POST /api/users/batch`

## Local Commands

```bash
pnpm install
pnpm lint
pnpm run build
pnpm test -- --run
```

## Environment Variables

- `PORT` (default `5001`)
- `DATABASE_URL`
- `JWT_SECRET`
