import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { saveMessage, getConversation } from "../services/message.service.js";
import { checkFriendship } from "../services/friend.client.js";
import { containsBannedWord } from "../services/moderation.service.js";
import { io } from "../app.js";

const router = Router();

// POST /api/messages — Send a message
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user!.userId;

    if (!receiverId || !content) {
      res
        .status(400)
        .json({ error: "receiverId and content are required" });
      return;
    }

    if (senderId === receiverId) {
      res.status(400).json({ error: "Cannot send message to yourself" });
      return;
    }

    // Check friendship
    const token = req.headers.authorization!.slice(7);
    const isFriend = await checkFriendship(senderId, receiverId, token);

    if (!isFriend) {
      res
        .status(403)
        .json({ error: "You can only send messages to friends" });
      return;
    }

    // Check content against banned words
    if (containsBannedWord(content)) {
      res
        .status(400)
        .json({ error: "Message blocked: contains banned words" });
      return;
    }

    const message = await saveMessage(senderId, receiverId, content);

    // Emit real-time event to receiver
    io.to(`user:${receiverId}`).emit("new_message", message);
    // Also emit to sender so their other devices/tabs get the update
    io.to(`user:${senderId}`).emit("new_message", message);

    res.status(201).json(message);
  } catch {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// GET /api/messages/:userId — Get conversation with a user
router.get(
  "/:userId",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const otherUserId = parseInt(req.params.userId, 10);
      const limit = parseInt((req.query.limit as string) ?? "50", 10);
      const offset = parseInt((req.query.offset as string) ?? "0", 10);

      const messages = await getConversation(
        req.user!.userId,
        otherUserId,
        limit,
        offset,
      );

      res.json(messages);
    } catch {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  },
);

export default router;
