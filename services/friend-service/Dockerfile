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

FROM node:24-slim

COPY --from=build /app/dist /app

ENV PORT 5002
EXPOSE 5002

CMD [ "node", "/app/index.mjs" ]
