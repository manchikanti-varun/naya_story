import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Response } from "express";
import type { LeanUserFull } from "../lean.js";
import { User } from "../models/User.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { requireAuth } from "../middleware/auth.js";
import { signAccessToken } from "../lib/accessJwt.js";
import {
  clearRefreshTokenCookie,
  readRefreshRaw,
  setRefreshTokenCookie,
} from "../lib/authCookies.js";
import { generateRefreshRaw, hashRefreshToken } from "../lib/refreshTokenCrypto.js";

const REFRESH_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

export function createAuthRouter(env: {
  jwtSecret: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleCallbackUrl?: string;
  clientOrigin: string;
}) {
  const r = Router();

  const credentialLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts. Try again later." },
  });

  const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const secureCookie = process.env.NODE_ENV === "production";

  function serialize(user: InstanceType<typeof User>) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      wishlist: (user.wishlist ?? []).map((id: unknown) => String(id)),
    };
  }

  async function issueAuthSession(user: InstanceType<typeof User>, res: Response) {
    await RefreshToken.deleteMany({ userId: user._id });
    const raw = generateRefreshRaw();
    await RefreshToken.create({
      userId: user._id,
      tokenHash: hashRefreshToken(raw),
      expiresAt: new Date(Date.now() + REFRESH_LIFETIME_MS),
    });
    const access = signAccessToken(user.id, env.jwtSecret);
    setRefreshTokenCookie(res, raw, secureCookie);
    return { access, refresh: raw, user: serialize(user) };
  }

  r.post(
    "/register",
    credentialLimiter,
    body("email").isEmail(),
    body("password").isLength({ min: 8 }),
    body("name").trim().notEmpty(),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ message: "Validation failed", errors: errors.array() });
      const { email, password, name } = req.body as {
        email: string;
        password: string;
        name: string;
      };
      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ message: "Email already registered" });
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ email, passwordHash, name, role: "customer" });
      const session = await issueAuthSession(user, res);
      return res.json({ token: session.access, refreshToken: session.refresh, user: session.user });
    },
  );

  r.post(
    "/login",
    credentialLimiter,
    body("email").isEmail(),
    body("password").notEmpty(),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ message: "Validation failed", errors: errors.array() });
      const { email, password } = req.body as { email: string; password: string };
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ message: "Invalid email or password." });
      if (!user.passwordHash) {
        return res.status(401).json({
          message: user.googleId
            ? "This email uses Google sign-in. Continue with Google below."
            : "Invalid email or password.",
        });
      }
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ message: "Invalid email or password." });
      if (user.role === "admin") {
        return res
          .status(403)
          .json({ message: "Administrator accounts must sign in via the admin portal." });
      }
      const session = await issueAuthSession(user, res);
      return res.json({ token: session.access, refreshToken: session.refresh, user: session.user });
    },
  );

  r.post(
    "/admin/login",
    credentialLimiter,
    body("email").isEmail(),
    body("password").notEmpty(),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ message: "Validation failed", errors: errors.array() });
      const { email, password } = req.body as { email: string; password: string };
      const user = await User.findOne({ email });
      if (!user?.passwordHash)
        return res.status(401).json({ message: "Invalid credentials" });
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ message: "Invalid credentials" });
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Administrator account required." });
      }
      const session = await issueAuthSession(user, res);
      return res.json({ token: session.access, refreshToken: session.refresh, user: session.user });
    },
  );

  r.post("/refresh", refreshLimiter, async (req, res) => {
    try {
      const raw = readRefreshRaw(req);
      if (!raw) return res.status(401).json({ message: "Missing refresh token" });
      const hash = hashRefreshToken(raw);
      const doc = await RefreshToken.findOne({
        tokenHash: hash,
        expiresAt: { $gt: new Date() },
      });
      if (!doc) return res.status(401).json({ message: "Invalid or expired refresh token" });
      await RefreshToken.deleteOne({ _id: doc._id });
      const user = await User.findById(doc.userId);
      if (!user) return res.status(401).json({ message: "User not found" });
      const newRaw = generateRefreshRaw();
      await RefreshToken.create({
        userId: user._id,
        tokenHash: hashRefreshToken(newRaw),
        expiresAt: new Date(Date.now() + REFRESH_LIFETIME_MS),
      });
      setRefreshTokenCookie(res, newRaw, secureCookie);
      const access = signAccessToken(user.id, env.jwtSecret);
      return res.json({ token: access, refreshToken: newRaw, user: serialize(user) });
    } catch {
      return res.status(500).json({ message: "Refresh failed" });
    }
  });

  r.post("/logout", async (req, res) => {
    const raw = readRefreshRaw(req);
    if (raw) {
      await RefreshToken.deleteMany({ tokenHash: hashRefreshToken(raw) });
    }
    clearRefreshTokenCookie(res, secureCookie);
    return res.json({ ok: true });
  });

  r.get("/me", requireAuth(env.jwtSecret), async (req, res) => {
    const raw = await User.findById(req.user!._id).lean();
    if (!raw || Array.isArray(raw)) return res.status(404).json({ message: "Not found" });
    const full = raw as unknown as LeanUserFull;
    return res.json({
      user: {
        id: String(full._id),
        email: full.email,
        name: full.name,
        role: full.role,
        wishlist: (full.wishlist ?? []).map((id) => String(id)),
        addresses: full.addresses ?? [],
      },
    });
  });

  if (env.googleClientId && env.googleClientSecret && env.googleCallbackUrl) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.googleClientId,
          clientSecret: env.googleClientSecret,
          callbackURL: env.googleCallbackUrl,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(new Error("No email from Google"));
            let user = await User.findOne({ googleId: profile.id });
            if (!user) user = await User.findOne({ email });
            if (!user) {
              user = await User.create({
                email,
                name: profile.displayName ?? email.split("@")[0],
                googleId: profile.id,
                role: "customer",
              });
            } else if (!user.googleId) {
              user.googleId = profile.id;
              await user.save();
            }
            return done(null, user);
          } catch (e) {
            return done(e as Error);
          }
        },
      ),
    );

    r.get(
      "/google",
      passport.authenticate("google", { scope: ["profile", "email"], session: false }),
    );

    r.get(
      "/google/callback",
      passport.authenticate("google", { session: false, failureRedirect: `${env.clientOrigin}/login?error=google` }),
      async (req, res) => {
        const user = req.user as InstanceType<typeof User> | undefined;
        if (!user) return res.redirect(`${env.clientOrigin}/login?error=google`);
        if (user.role === "admin") {
          return res.redirect(`${env.clientOrigin}/login?error=admin_portal`);
        }
        const session = await issueAuthSession(user, res);
        const access = encodeURIComponent(session.access);
        const refresh = encodeURIComponent(session.refresh);
        return res.redirect(
          `${env.clientOrigin}/login?token=${access}&refresh=${refresh}`,
        );
      },
    );
  } else {
    r.get("/google", (_req, res) =>
      res.status(501).json({
        message:
          "Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL.",
      }),
    );
  }

  return r;
}
