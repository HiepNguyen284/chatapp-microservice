import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  sendFriendRequest,
  getReceivedRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendList,
  checkFriendship,
} from "../services/friend.service.js";

const router = Router();

// POST /api/friends/requests — Send a friend request
router.post(
  "/requests",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { receiverId } = req.body;

      if (!receiverId) {
        res.status(400).json({ error: "receiverId is required" });
        return;
      }

      const request = await sendFriendRequest(req.user!.userId, receiverId);
      res.status(201).json(request);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send friend request";
      const status =
        message.includes("yourself") || message.includes("already")
          ? 409
          : 500;
      res.status(status).json({ error: message });
    }
  },
);

// GET /api/friends/requests/received — Get received pending requests
router.get(
  "/requests/received",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const requests = await getReceivedRequests(req.user!.userId);
      res.json(requests);
    } catch {
      res
        .status(500)
        .json({ error: "Failed to fetch friend requests" });
    }
  },
);

// PUT /api/friends/requests/:id/accept
router.put(
  "/requests/:id/accept",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const requestId = parseInt(req.params.id, 10);
      const request = await acceptFriendRequest(requestId, req.user!.userId);
      res.json(request);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to accept request";
      const status = message.includes("not found")
        ? 404
        : message.includes("Not authorized")
          ? 403
          : 400;
      res.status(status).json({ error: message });
    }
  },
);

// PUT /api/friends/requests/:id/reject
router.put(
  "/requests/:id/reject",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const requestId = parseInt(req.params.id, 10);
      const request = await rejectFriendRequest(requestId, req.user!.userId);
      res.json(request);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to reject request";
      const status = message.includes("not found")
        ? 404
        : message.includes("Not authorized")
          ? 403
          : 400;
      res.status(status).json({ error: message });
    }
  },
);

// GET /api/friends — Get friend list
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const friends = await getFriendList(req.user!.userId);
    res.json(friends);
  } catch {
    res.status(500).json({ error: "Failed to fetch friend list" });
  }
});

// GET /api/friends/check?userId1=X&userId2=Y — Check if two users are friends
router.get("/check", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId1 = parseInt(req.query.userId1 as string, 10);
    const userId2 = parseInt(req.query.userId2 as string, 10);

    if (isNaN(userId1) || isNaN(userId2)) {
      res
        .status(400)
        .json({ error: "userId1 and userId2 are required" });
      return;
    }

    const isFriend = await checkFriendship(userId1, userId2);
    res.json({ isFriend });
  } catch {
    res.status(500).json({ error: "Failed to check friendship" });
  }
});

export default router;
