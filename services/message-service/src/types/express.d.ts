import type { JwtPayload } from "../middleware/auth";

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload;
  }
}

export {};
