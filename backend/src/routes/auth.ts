import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { LeanUserFull } from "../lean.js";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

function tokenFor(userId: string, secret: string) {
  return jwt.sign({ sub: userId }, secret, { expiresIn: "14d" });
}

export function createAuthRouter(env: {
  jwtSecret: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleCallbackUrl?: string;
  clientOrigin: string;
}) {
  const r = Router();

  function serialize(user: InstanceType<typeof User>) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      wishlist: (user.wishlist ?? []).map((id: unknown) => String(id)),
    };
  }

  r.post(
    "/register",
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
      const token = tokenFor(user.id, env.jwtSecret);
      return res.json({ token, user: serialize(user) });
    },
  );

  r.post(
    "/login",
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
      const token = tokenFor(user.id, env.jwtSecret);
      return res.json({ token, user: serialize(user) });
    },
  );

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
      (req, res) => {
        const user = req.user as InstanceType<typeof User> | undefined;
        if (!user) return res.redirect(`${env.clientOrigin}/login?error=google`);
        const token = tokenFor(user.id, env.jwtSecret);
        const redirect = `${env.clientOrigin}/login?token=${encodeURIComponent(token)}`;
        return res.redirect(redirect);
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
