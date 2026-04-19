import { httpServer, io } from "./app.js";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { setupSocketHandlers } from "./socket/handler.js";
import { loadBannedWords } from "./services/moderation.service.js";

const port = process.env.PORT ?? 5003;
const REDIS_URL = process.env.REDIS_URL ?? "redis://redis:6379";

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
  } catch (err) {
    console.error("[message-service] failed to start", err);
    process.exit(1);
  }
}

start();
