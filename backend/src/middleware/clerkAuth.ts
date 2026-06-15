/**
 * Clerk authentication middleware.
 * Verifies Clerk session tokens and syncs users to the local User model.
 * Works alongside existing JWT auth — does NOT replace it.
 */
import type { Request, Response, NextFunction } from "express";
import { User } from "../models/User.js";
import type { AuthedUser } from "./auth.js";

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? "";
const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY ?? "";

/**
 * Verify a Clerk session token by calling Clerk's Backend API.
 * Returns decoded session data or null.
 */
async function verifyClerkToken(token: string): Promise<{
  sub: string;
  email?: string;
  phone?: string;
  name?: string;
} | null> {
  if (!CLERK_SECRET_KEY) return null;

  try {
    // Use Clerk Backend API to verify session
    const res = await fetch("https://api.clerk.com/v1/sessions/verify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      id: string;
      user_id: string;
      status: string;
    };

    if (data.status !== "active") return null;

    // Fetch user details from Clerk
    const userRes = await fetch(`https://api.clerk.com/v1/users/${data.user_id}`, {
      headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
    });

    if (!userRes.ok) return null;

    const userData = (await userRes.json()) as {
      id: string;
      email_addresses?: Array<{ email_address: string }>;
      phone_numbers?: Array<{ phone_number: string }>;
      first_name?: string;
      last_name?: string;
    };

    return {
      sub: userData.id,
      email: userData.email_addresses?.[0]?.email_address,
      phone: userData.phone_numbers?.[0]?.phone_number,
      name: [userData.first_name, userData.last_name].filter(Boolean).join(" ") || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Sync Clerk user to local database.
 * Creates user if not found, updates clerkId if found by email.
 */
async function syncClerkUser(clerkData: {
  sub: string;
  email?: string;
  phone?: string;
  name?: string;
}) {
  if (!clerkData.email) return null;

  let user = await User.findOne({ clerkId: clerkData.sub });
  if (user) {
    // Update phone if changed
    if (clerkData.phone && user.phone !== clerkData.phone) {
      user.phone = clerkData.phone;
      await user.save();
    }
    return user;
  }

  // Try finding by email
  user = await User.findOne({ email: clerkData.email.toLowerCase() });
  if (user) {
    user.clerkId = clerkData.sub;
    if (clerkData.phone) user.phone = clerkData.phone;
    await user.save();
    return user;
  }

  // Create new user
  user = await User.create({
    email: clerkData.email.toLowerCase(),
    name: clerkData.name || clerkData.email.split("@")[0],
    phone: clerkData.phone || undefined,
    clerkId: clerkData.sub,
    role: "customer",
  });

  return user;
}

/**
 * Middleware: authenticate Clerk session token.
 * Sets req.user if valid. Falls through to next middleware if no Clerk token.
 * Uses `x-clerk-token` header or `__session` cookie.
 */
export function clerkAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (!CLERK_SECRET_KEY) return next();

  const token = req.headers["x-clerk-token"] as string | undefined;
  if (!token) return next();

  void (async () => {
    try {
      const clerkData = await verifyClerkToken(token);
      if (!clerkData) return next();

      const user = await syncClerkUser(clerkData);
      if (user) {
        req.user = {
          _id: user._id,
          email: user.email,
          role: (user.role ?? "customer") as "customer" | "admin",
        } as AuthedUser;
      }
      next();
    } catch {
      next();
    }
  })();
}

export function isClerkEnabled(): boolean {
  return !!CLERK_SECRET_KEY && !!CLERK_PUBLISHABLE_KEY;
}
