import { Router, type Request, type Response } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import {
  getAllBannedWords,
  addBannedWord,
  removeBannedWord,
} from "../services/moderation.service.js";

const router = Router();

// GET /api/moderation/banned-words — List all banned words (ADMIN only)
router.get(
  "/banned-words",
  authMiddleware,
  adminMiddleware,
  async (_req: Request, res: Response) => {
    try {
      const words = await getAllBannedWords();
      res.json(words);
    } catch {
      res.status(500).json({ error: "Failed to fetch banned words" });
    }
  },
);

// POST /api/moderation/banned-words — Add a banned word (ADMIN only)
router.post(
  "/banned-words",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { word } = req.body;

      if (!word || word.trim().length === 0) {
        res.status(400).json({ error: "word is required" });
        return;
      }

      const bannedWord = await addBannedWord(word.trim());
      res.status(201).json(bannedWord);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to add banned word";
      const status = message.includes("already") ? 409 : 500;
      res.status(status).json({ error: message });
    }
  },
);

// DELETE /api/moderation/banned-words/:id — Remove a banned word (ADMIN only)
router.delete(
  "/banned-words/:id",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      await removeBannedWord(id);
      res.json({ message: "Banned word removed" });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to remove banned word";
      const status = message.includes("not found") ? 404 : 500;
      res.status(status).json({ error: message });
    }
  },
);

export default router;
