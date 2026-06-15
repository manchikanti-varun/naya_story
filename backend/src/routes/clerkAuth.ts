/**
 * Clerk auth route — exchanges Clerk session for local JWT.
 * This lets the existing JWT-based system work alongside Clerk.
 * Frontend authenticates with Clerk, then calls POST /api/auth/clerk/exchange
 * to get a local JWT for API calls.
 */
import { Router } from "express";
import { asyncHandler, HttpError } from "../middleware/httpError.js";
import { User } from "../models/User.js";
import { authService } from "../services/auth.service.js";

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? "";

export function createClerkAuthRouter(jwtSecret: string, clientOrigin: string) {
  const r = Router();
  const secureCookie = process.env.NODE_ENV === "production";

  // POST /clerk/exchange — Exchange Clerk session for local JWT
  r.post(
    "/clerk/exchange",
    asyncHandler(async (req, res) => {
      if (!CLERK_SECRET_KEY) {
        throw new HttpError(501, "Clerk authentication is not configured.");
      }

      const { clerkUserId } = req.body as { clerkUserId?: string };
      if (!clerkUserId) {
        throw new HttpError(400, "clerkUserId is required.");
      }

      // Verify the Clerk user exists by fetching from Clerk API
      const clerkRes = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
        headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
      });

      if (!clerkRes.ok) {
        throw new HttpError(401, "Invalid Clerk user.");
      }

      const clerkUser = (await clerkRes.json()) as {
        id: string;
        email_addresses?: Array<{ email_address: string }>;
        phone_numbers?: Array<{ phone_number: string }>;
        first_name?: string;
        last_name?: string;
      };

      const email = clerkUser.email_addresses?.[0]?.email_address;
      const phone = clerkUser.phone_numbers?.[0]?.phone_number;
      const name = [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(" ") || email?.split("@")[0] || "User";

      if (!email) {
        throw new HttpError(400, "Clerk user has no email address.");
      }

      // Find or create local user
      let user = await User.findOne({ clerkId: clerkUser.id });
      if (!user) {
        user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
          user.clerkId = clerkUser.id;
          if (phone) user.phone = phone;
          await user.save();
        } else {
          user = await User.create({
            email: email.toLowerCase(),
            name,
            phone: phone || undefined,
            clerkId: clerkUser.id,
            role: "customer",
          });
        }
      } else if (phone && user.phone !== phone) {
        user.phone = phone;
        await user.save();
      }

      // Issue local JWT session
      const session = await authService.issueSession(user, jwtSecret, res, secureCookie);

      res.json({
        token: session.access,
        refreshToken: session.refresh,
        user: {
          id: String(user._id),
          email: user.email,
          name: user.name,
          role: user.role,
          wishlist: (user.wishlist ?? []).map(String),
        },
      });
    }),
  );

  return r;
}
