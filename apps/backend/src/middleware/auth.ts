import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { findUserById } from "@thrift/db";

const JWT_SECRET = process.env.JWT_SECRET || "thrift-dev-secret-change-in-production";

export interface AuthPayload {
  userId: string;
  email: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function signChallengeToken(userId: string): string {
  return jwt.sign({ userId, twoFactorChallenge: true }, JWT_SECRET, { expiresIn: "5m" });
}

export function verifyChallengeToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Missing or invalid authorization header" });
    return;
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return function (req: Request, res: Response, next: NextFunction) {
    authMiddleware(req, res, async () => {
      try {
        if (!req.user) {
          res.status(401).json({ success: false, error: "Authentication required" });
          return;
        }
        const user = await findUserById(req.user.userId);
        if (!user || !roles.includes(user.role)) {
          res.status(403).json({ success: false, error: "Insufficient permissions" });
          return;
        }
        req.user.role = user.role;
        next();
      } catch {
        res.status(500).json({ success: false, error: "Authorization check failed" });
      }
    });
  };
}

export const requireAdmin = requireRole("admin", "superadmin");
