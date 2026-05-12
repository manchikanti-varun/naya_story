import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Types } from "mongoose";
import { User } from "../models/User.js";

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
      const payload = jwt.verify(header.slice(7), secret) as { sub: string };
      const user = await User.findById(payload.sub).select("_id email role").lean();
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      req.user = user as unknown as AuthedUser;
      return next();
    } catch {
      return res.status(401).json({ message: "Unauthorized" });
    }
  };
}

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
