import { Router } from "express";
import rateLimit from "express-rate-limit";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/httpError.js";
import { readRefreshRaw } from "../lib/authCookies.js";
import { authService } from "../services/auth.service.js";
import { registerRules, loginRules } from "../validators/auth.validator.js";
import { handleValidationErrors } from "../validators/index.js";

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

  // POST /register
  r.post(
    "/register",
    credentialLimiter,
    ...registerRules,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
      const { email, password, name } = req.body;
      const session = await authService.register(email, password, name, env.jwtSecret, res, secureCookie);
      res.json({ token: session.access, refreshToken: session.refresh, user: session.user });
    }),
  );

  // POST /login
  r.post(
    "/login",
    credentialLimiter,
    ...loginRules,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
      const { email, password } = req.body;
      const session = await authService.login(email, password, env.jwtSecret, res, secureCookie, false);
      res.json({ token: session.access, refreshToken: session.refresh, user: session.user });
    }),
  );

  // POST /admin/login
  r.post(
    "/admin/login",
    credentialLimiter,
    ...loginRules,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
      const { email, password } = req.body;
      const session = await authService.login(email, password, env.jwtSecret, res, secureCookie, true);
      res.json({ token: session.access, refreshToken: session.refresh, user: session.user });
    }),
  );

  // POST /refresh
  r.post("/refresh", refreshLimiter, asyncHandler(async (req, res) => {
    const raw = readRefreshRaw(req);
    if (!raw) return res.status(401).json({ message: "Missing refresh token" });
    const session = await authService.refresh(raw, env.jwtSecret, res, secureCookie);
    res.json({ token: session.access, refreshToken: session.refresh, user: session.user });
  }));

  // POST /logout
  r.post("/logout", asyncHandler(async (req, res) => {
    const raw = readRefreshRaw(req);
    await authService.logout(raw, res, secureCookie);
    res.json({ ok: true });
  }));

  // GET /me
  r.get("/me", requireAuth(env.jwtSecret), asyncHandler(async (req, res) => {
    const profile = await authService.getProfile(String(req.user!._id));
    res.json({ user: profile });
  }));

  // Google OAuth
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

    r.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

    r.get(
      "/google/callback",
      passport.authenticate("google", { session: false, failureRedirect: `${env.clientOrigin}/login?error=google` }),
      asyncHandler(async (req, res) => {
        const user = req.user as InstanceType<typeof User> | undefined;
        if (!user) return res.redirect(`${env.clientOrigin}/login?error=google`);
        if (user.role === "admin") return res.redirect(`${env.clientOrigin}/login?error=admin_portal`);
        const session = await authService.issueSession(user, env.jwtSecret, res, secureCookie);
        const access = encodeURIComponent(session.access);
        const refresh = encodeURIComponent(session.refresh);
        res.redirect(`${env.clientOrigin}/login?token=${access}&refresh=${refresh}`);
      }),
    );
  } else {
    r.get("/google", (_req, res) =>
      res.status(501).json({ message: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL." }),
    );
  }

  return r;
}
