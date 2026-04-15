import express, { type Express } from "express";

const app: Express = express();

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

export default app;
