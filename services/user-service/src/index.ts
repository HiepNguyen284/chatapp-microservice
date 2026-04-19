import app from "./app";
import type { Server } from "node:http";

const port = process.env.PORT ?? 5001;

const server = app.listen(port, () => {
  console.log(`[user-service] running on port ${port}`);
});

const SHUTDOWN_GRACE_MS = 7000;
let shuttingDown = false;

const gracefulShutdown = (signal: NodeJS.Signals, srv: Server) => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`[user-service] ${signal} received, shutting down...`);

  const forceExitTimer = setTimeout(() => {
    console.error("[user-service] force exit after timeout");
    process.exit(1);
  }, SHUTDOWN_GRACE_MS);

  srv.close((err) => {
    clearTimeout(forceExitTimer);
    if (err) {
      console.error("[user-service] shutdown error", err);
      process.exit(1);
    }
    console.log("[user-service] shutdown complete");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM", server));
process.on("SIGINT", () => gracefulShutdown("SIGINT", server));
