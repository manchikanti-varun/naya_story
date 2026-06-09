/**
 * Authentication service — handles registration, login, token management.
 */
import type { Response } from "express";
import bcrypt from "bcryptjs";
import { signAccessToken } from "../lib/accessJwt.js";
import { generateRefreshRaw, hashRefreshToken } from "../lib/refreshTokenCrypto.js";
import { setRefreshTokenCookie } from "../lib/authCookies.js";
import { userRepository } from "../repositories/user.repository.js";
import { HttpError } from "../middleware/httpError.js";

const REFRESH_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

type SerializedUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  wishlist: string[];
};

type AuthSession = {
  access: string;
  refresh: string;
  user: SerializedUser;
};

function serializeUser(user: { id?: string; _id?: unknown; email: string; name: string; role: string; wishlist?: unknown[] }): SerializedUser {
  return {
    id: user.id ?? String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
    wishlist: (user.wishlist ?? []).map((id) => String(id)),
  };
}

export const authService = {
  async register(
    email: string,
    password: string,
    name: string,
    jwtSecret: string,
    res: Response,
    secureCookie: boolean,
  ): Promise<AuthSession> {
    const exists = await userRepository.findByEmail(email);
    if (exists) throw new HttpError(409, "Email already registered");

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userRepository.create({ email, passwordHash, name, role: "customer" });

    return this.issueSession(user, jwtSecret, res, secureCookie);
  },

  async login(
    email: string,
    password: string,
    jwtSecret: string,
    res: Response,
    secureCookie: boolean,
    adminOnly = false,
  ): Promise<AuthSession> {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new HttpError(401, "Invalid email or password.");

    if (!user.passwordHash) {
      const msg = user.googleId
        ? "This email uses Google sign-in. Continue with Google below."
        : "Invalid email or password.";
      throw new HttpError(401, msg);
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new HttpError(401, "Invalid email or password.");

    if (adminOnly && user.role !== "admin") {
      throw new HttpError(403, "Access denied. Administrator account required.");
    }
    if (!adminOnly && user.role === "admin") {
      throw new HttpError(403, "Administrator accounts must sign in via the admin portal.");
    }

    return this.issueSession(user, jwtSecret, res, secureCookie);
  },

  async refresh(
    rawToken: string,
    jwtSecret: string,
    res: Response,
    secureCookie: boolean,
  ): Promise<AuthSession> {
    const hash = hashRefreshToken(rawToken);
    const doc = await userRepository.findValidRefreshToken(hash);
    if (!doc) throw new HttpError(401, "Invalid or expired refresh token");

    await userRepository.deleteRefreshToken(doc._id);

    const user = await userRepository.findById(String(doc.userId));
    if (!user) throw new HttpError(401, "User not found");

    const newRaw = generateRefreshRaw();
    await userRepository.createRefreshToken(
      user._id,
      hashRefreshToken(newRaw),
      new Date(Date.now() + REFRESH_LIFETIME_MS),
    );
    setRefreshTokenCookie(res, newRaw, secureCookie);

    const access = signAccessToken(user.id, jwtSecret);
    return { access, refresh: newRaw, user: serializeUser(user) };
  },

  async logout(rawToken: string | null, res: Response, secureCookie: boolean): Promise<void> {
    if (rawToken) {
      await userRepository.deleteRefreshTokensByHash(hashRefreshToken(rawToken));
    }
    const { clearRefreshTokenCookie } = await import("../lib/authCookies.js");
    clearRefreshTokenCookie(res, secureCookie);
  },

  async getProfile(userId: string) {
    const user = await userRepository.findByIdLean(userId);
    if (!user) throw new HttpError(404, "Not found");
    return {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      wishlist: (user.wishlist ?? []).map((id) => String(id)),
      addresses: user.addresses ?? [],
    };
  },

  async issueSession(
    user: { _id: unknown; id?: string; email: string; name: string; role: string; wishlist?: unknown[] },
    jwtSecret: string,
    res: Response,
    secureCookie: boolean,
  ): Promise<AuthSession> {
    await userRepository.deleteAllRefreshTokens(user._id as import("mongoose").Types.ObjectId);
    const raw = generateRefreshRaw();
    await userRepository.createRefreshToken(
      user._id as import("mongoose").Types.ObjectId,
      hashRefreshToken(raw),
      new Date(Date.now() + REFRESH_LIFETIME_MS),
    );
    const access = signAccessToken(user.id ?? String(user._id), jwtSecret);
    setRefreshTokenCookie(res, raw, secureCookie);
    return { access, refresh: raw, user: serializeUser(user) };
  },
};
