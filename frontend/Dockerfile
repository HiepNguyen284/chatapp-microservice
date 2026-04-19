# syntax=docker/dockerfile:1.7

# Frontend — Multi-stage build (Vite + Caddy)
FROM node:24-slim AS build

RUN corepack enable

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

COPY package.json /app
COPY pnpm-lock.yaml /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY . /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm run build

# Production — Caddy serves static files
FROM caddy:2-alpine

COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 3000
