import app from "./app";
import type { Server } from "node:http";

const port = process.env.PORT ?? 5002;

const server = app.listen(port, () => {
  console.log(`[friend-service] running on port ${port}`);
});

const SHUTDOWN_GRACE_MS = 7000;
let shuttingDown = false;

const gracefulShutdown = (signal: NodeJS.Signals, srv: Server) => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`[friend-service] ${signal} received, shutting down...`);

  const forceExitTimer = setTimeout(() => {
    console.error("[friend-service] force exit after timeout");
    process.exit(1);
  }, SHUTDOWN_GRACE_MS);

  srv.close((err) => {
    clearTimeout(forceExitTimer);
    if (err) {
      console.error("[friend-service] shutdown error", err);
      process.exit(1);
    }
    console.log("[friend-service] shutdown complete");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM", server));
process.on("SIGINT", () => gracefulShutdown("SIGINT", server));
