FROM node:24-slim AS build

RUN corepack enable

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

COPY package.json /app
COPY pnpm-lock.yaml /app

# Use hoisted linker for Node 24 compatibility with tsdown
RUN echo 'node-linker=hoisted' > .npmrc && pnpm install --frozen-lockfile

COPY . /app
RUN pnpm run build

FROM node:24-slim

COPY --from=build /app/dist /app

ENV PORT 5003
EXPOSE 5003

CMD [ "node", "/app/index.mjs" ]
