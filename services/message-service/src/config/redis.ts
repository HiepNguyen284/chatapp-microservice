import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

const redisClient = createClient({ url: REDIS_URL });

redisClient.on("error", (err) => {
  console.error("[redis] client error", err);
});

export async function connectRedis() {
  await redisClient.connect();
  console.log("[redis] connected");
}

export default redisClient;
