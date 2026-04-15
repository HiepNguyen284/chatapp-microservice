import { httpServer } from "./app.js";

const port = process.env.PORT ?? 5003;

httpServer.listen(port, () => {
  console.log(`[message-service] running on port ${port}`);
});
