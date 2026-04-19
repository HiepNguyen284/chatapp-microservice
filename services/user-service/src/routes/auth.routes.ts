import { Router, type Request, type Response } from "express";
import { registerUser, loginUser } from "../services/user.service.js";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res
        .status(400)
        .json({ error: "username, email, and password are required" });
      return;
    }

    if (username.length < 3 || username.length > 30) {
      res
        .status(400)
        .json({ error: "username must be between 3 and 30 characters" });
      return;
    }

    if (password.length < 6) {
      res
        .status(400)
        .json({ error: "password must be at least 6 characters" });
      return;
    }

    const user = await registerUser(username, email, password);
    res.status(201).json(user);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Registration failed";
    const status = message.includes("already exists") ? 409 : 500;
    res.status(status).json({ error: message });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    const { user, token } = await loginUser(email, password);
    res.json({ user, token });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Login failed";
    const status = message.includes("Invalid") ? 401 : 500;
    res.status(status).json({ error: message });
  }
});

export default router;
