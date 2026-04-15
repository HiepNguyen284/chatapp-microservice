import app from "./app";

const port = process.env.PORT ?? 5002;

app.listen(port, () => {
  console.log(`[friend-service] running on port ${port}`);
});
