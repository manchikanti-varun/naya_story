import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Types } from "mongoose";
import { User } from "../models/User.js";
import { verifyAccessToken } from "../lib/accessJwt.js";

/** Returns true when Authorization is a valid admin access JWT (optional auth for CMS reads). */
export async function isAdminRequest(req: Request, secret: string): Promise<boolean> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return false;
  try {
    const payload = verifyAccessToken(header.slice(7), secret);
    const user = await User.findById(payload.sub).select("role").lean();
    if (!user || Array.isArray(user)) return false;
    return (user as { role?: string }).role === "admin";
  } catch {
    return false;
  }
}

export type AuthedUser = {
  _id: Types.ObjectId;
  email: string;
  role: "customer" | "admin";
};

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthedUser;
  }
}

export function requireAuth(secret: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer "))
      return res.status(401).json({ message: "Unauthorized" });
    try {
      const payload = verifyAccessToken(header.slice(7), secret);
      const user = await User.findById(payload.sub).select("_id email role").lean();
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      req.user = user as unknown as AuthedUser;
      return next();
    } catch {
      return res.status(401).json({ message: "Unauthorized" });
    }
  };
}

/** Admin-only guard — use on all `/api/admin/*` routes and sensitive CMS writes. */
export function requireAdmin(secret: string) {
  return [
    requireAuth(secret),
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.user || req.user.role !== "admin")
        return res.status(403).json({ message: "Forbidden" });
      return next();
    },
  ];
}

/** Restrict route to specific roles (RBAC primitive). */
export function requireRole(...allowed: Array<"admin" | "customer">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}
