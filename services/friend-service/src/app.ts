import express, { type Express } from "express";
import friendRoutes from "./routes/friend.routes.js";

const app: Express = express();

app.use(express.json());

// Health check
app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api/friends", friendRoutes);

export default app;
