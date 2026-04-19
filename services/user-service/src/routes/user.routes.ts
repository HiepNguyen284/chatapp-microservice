import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getUserById, getUsersByIds, searchUsers } from "../services/user.service.js";

const router = Router();

// POST /api/users/batch — Lookup users by IDs
router.post("/batch", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: number[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: "ids array is required" });
      return;
    }

    // Limit to 50 users max
    const users = await getUsersByIds(ids.slice(0, 50));
    res.json(users);
  } catch {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /api/users/me
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.user!.userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// GET /api/users/search?q=keyword
router.get(
  "/search",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const q = req.query.q as string;

      if (!q || q.length < 1) {
        res.status(400).json({ error: "Search query 'q' is required" });
        return;
      }

      const users = await searchUsers(q, req.user!.userId);
      res.json(users);
    } catch {
      res.status(500).json({ error: "Search failed" });
    }
  },
);

export default router;
