import { httpServer, io } from "./app.js";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { setupSocketHandlers } from "./socket/handler.js";
import { loadBannedWords } from "./services/moderation.service.js";

const port = process.env.PORT ?? 5003;
const REDIS_URL = process.env.REDIS_URL ?? "redis://redis:6379";
const SHUTDOWN_GRACE_MS = 7000;

let shuttingDown = false;

const gracefulShutdown = async (
  signal: NodeJS.Signals,
  clients: { pubClient: ReturnType<typeof createClient>; subClient: ReturnType<typeof createClient> },
) => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`[message-service] ${signal} received, shutting down...`);

  const forceExitTimer = setTimeout(() => {
    console.error("[message-service] force exit after timeout");
    process.exit(1);
  }, SHUTDOWN_GRACE_MS);

  try {
    io.close();

    await new Promise<void>((resolve, reject) => {
      httpServer.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await Promise.allSettled([clients.pubClient.quit(), clients.subClient.quit()]);

    clearTimeout(forceExitTimer);
    console.log("[message-service] shutdown complete");
    process.exit(0);
  } catch (err) {
    clearTimeout(forceExitTimer);
    console.error("[message-service] shutdown error", err);
    process.exit(1);
  }
};

async function start() {
  try {
    // Setup Redis adapter for Socket.io
    const pubClient = createClient({ url: REDIS_URL });
    const subClient = pubClient.duplicate();

    pubClient.on("error", (err) =>
      console.error("[redis-pub] error", err),
    );
    subClient.on("error", (err) =>
      console.error("[redis-sub] error", err),
    );

    await Promise.all([pubClient.connect(), subClient.connect()]);
    console.log("[redis] pub/sub clients connected");

    io.adapter(createAdapter(pubClient, subClient));
    console.log("[socket.io] redis adapter attached");

    // Setup Socket.io handlers
    setupSocketHandlers(io);

    // Load banned words cache
    try {
      await loadBannedWords();
    } catch (err) {
      console.warn("[moderation] could not load banned words (table may not exist yet)", err);
    }

    // Start HTTP server
    httpServer.listen(port, () => {
      console.log(`[message-service] running on port ${port}`);
    });

    process.on("SIGTERM", () =>
      void gracefulShutdown("SIGTERM", { pubClient, subClient }),
    );
    process.on("SIGINT", () =>
      void gracefulShutdown("SIGINT", { pubClient, subClient }),
    );
  } catch (err) {
    console.error("[message-service] failed to start", err);
    process.exit(1);
  }
}

start();
