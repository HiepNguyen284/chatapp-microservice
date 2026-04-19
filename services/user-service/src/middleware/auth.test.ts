import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authMiddleware, type JwtPayload } from "./auth.js";

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

describe("authMiddleware", () => {
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
