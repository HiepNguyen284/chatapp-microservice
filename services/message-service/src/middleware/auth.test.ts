import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  adminMiddleware,
  authMiddleware,
  type JwtPayload,
  verifyToken,
} from "./auth.js";

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

function createMockResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
}

describe("auth middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when authorization header is missing", () => {
    const req = { headers: {} } as Request;
    const res = createMockResponse() as unknown as Response;
    const next = vi.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Missing or invalid authorization header",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should attach user payload and call next for valid token", () => {
    const payload: JwtPayload = { userId: 1, role: "USER" };
    vi.mocked(jwt.verify).mockReturnValue(payload);

    const req = {
      headers: { authorization: "Bearer valid-token" },
    } as Request;
    const res = createMockResponse() as unknown as Response;
    const next = vi.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith("valid-token", expect.any(String));
    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should return 401 when token verification fails", () => {
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error("invalid token");
    });

    const req = {
      headers: { authorization: "Bearer invalid-token" },
    } as Request;
    const res = createMockResponse() as unknown as Response;
    const next = vi.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired token" });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("adminMiddleware", () => {
  it("should return 403 when current user is not admin", () => {
    const req = { user: { userId: 1, role: "USER" } } as Request;
    const res = createMockResponse() as unknown as Response;
    const next = vi.fn() as NextFunction;

    adminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Admin access required" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next when current user is admin", () => {
    const req = { user: { userId: 1, role: "ADMIN" } } as Request;
    const res = createMockResponse() as unknown as Response;
    const next = vi.fn() as NextFunction;

    adminMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("verifyToken", () => {
  it("should return decoded payload", () => {
    const payload: JwtPayload = { userId: 10, role: "ADMIN" };
    vi.mocked(jwt.verify).mockReturnValue(payload);

    const result = verifyToken("token-123");

    expect(jwt.verify).toHaveBeenCalledWith("token-123", expect.any(String));
    expect(result).toEqual(payload);
  });
});
