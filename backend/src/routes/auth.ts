import crypto from "node:crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { csrfProtection } from "../middleware/csrf.js";
import { asyncHandler } from "../middleware/httpError.js";
import { readRefreshRaw } from "../lib/authCookies.js";
import { authService } from "../services/auth.service.js";
import { cache } from "../lib/cache.js";
import { getAccountLockStatus, recordFailedAttempt, resetFailedAttempts } from "../lib/account-lockout.js";
import { registerRules, loginRules, phoneLoginRules } from "../validators/auth.validator.js";
import { handleValidationErrors } from "../validators/index.js";
import { HttpError } from "../middleware/httpError.js";
import { verifyFirebasePhoneToken } from "../lib/firebase-admin.js";

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

      // Account lockout check
      const lockStatus = await getAccountLockStatus(email);
      if (lockStatus.locked) {
        const mins = Math.ceil(lockStatus.remainingMs / 60000);
        throw new HttpError(429, `Account temporarily locked. Try again in ${mins} minute${mins > 1 ? "s" : ""}.`);
      }

      try {
        const session = await authService.login(email, password, env.jwtSecret, res, secureCookie, false);
        await resetFailedAttempts(email);
        res.json({ token: session.access, refreshToken: session.refresh, user: session.user });
      } catch (err) {
        if (err instanceof HttpError && err.status === 401) {
          await recordFailedAttempt(email);
        }
        throw err;
      }
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

      // Account lockout check
      const lockStatus = await getAccountLockStatus(email);
      if (lockStatus.locked) {
        const mins = Math.ceil(lockStatus.remainingMs / 60000);
        throw new HttpError(429, `Account temporarily locked. Try again in ${mins} minute${mins > 1 ? "s" : ""}.`);
      }

      try {
        const session = await authService.login(email, password, env.jwtSecret, res, secureCookie, true);
        await resetFailedAttempts(email);
        res.json({ token: session.access, refreshToken: session.refresh, user: session.user });
      } catch (err) {
        if (err instanceof HttpError && err.status === 401) {
          await recordFailedAttempt(email);
        }
        throw err;
      }
    }),
  );

  // POST /refresh — CSRF-protected (uses httpOnly cookie)
  r.post("/refresh", refreshLimiter, csrfProtection, asyncHandler(async (req, res) => {
    const raw = readRefreshRaw(req);
    if (!raw) return res.status(401).json({ message: "Missing refresh token" });
    const session = await authService.refresh(raw, env.jwtSecret, res, secureCookie);
    res.json({ token: session.access, refreshToken: session.refresh, user: session.user });
  }));

  // POST /logout — CSRF-protected (uses httpOnly cookie)
  r.post("/logout", csrfProtection, asyncHandler(async (req, res) => {
    const raw = readRefreshRaw(req);
    await authService.logout(raw, res, secureCookie);
    res.json({ ok: true });
  }));

  // GET /me
  r.get("/me", requireAuth(env.jwtSecret), asyncHandler(async (req, res) => {
    const profile = await authService.getProfile(String(req.user!._id));
    res.json({ user: profile });
  }));

  // POST /phone — Firebase Phone OTP login/register
  r.post(
    "/phone",
    credentialLimiter,
    ...phoneLoginRules,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
      const { idToken } = req.body as { idToken: string };

      // Verify the Firebase ID token server-side (cryptographic verification)
      let payload;
      try {
        payload = await verifyFirebasePhoneToken(idToken);
      } catch (err) {
        throw new HttpError(401, "Invalid or expired phone verification token.");
      }

      // Find or create user, issue session
      const session = await authService.loginWithPhone(
        payload.uid,
        payload.phone,
        env.jwtSecret,
        res,
        secureCookie,
      );

      res.json({ token: session.access, refreshToken: session.refresh, user: session.user });
    }),
  );

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

        // Generate a cryptographically random opaque session code (single-use, 60s TTL)
        const code = crypto.randomBytes(32).toString("hex");
        const userId = user.id ?? String(user._id);
        await cache.set(
          `session-code:${code}`,
          JSON.stringify({ userId, createdAt: Date.now() }),
          60, // 60 second TTL
        );

        // Redirect with opaque code — NOT the JWT itself
        res.redirect(`${env.clientOrigin}/auth/callback?code=${code}`);
      }),
    );
  } else {
    r.get("/google", (_req, res) =>
      res.status(501).json({ message: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL." }),
    );
  }

  // POST /session/exchange — exchange opaque session code for JWT
  r.post(
    "/session/exchange",
    rateLimit({
      windowMs: 5 * 60 * 1000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: "Too many exchange attempts. Try again later." },
    }),
    asyncHandler(async (req, res) => {
      const { code } = req.body as { code?: string };

      if (!code || typeof code !== "string" || code.length !== 64) {
        throw new HttpError(401, "Invalid or expired session code.");
      }

      const cacheKey = `session-code:${code}`;
      const raw = await cache.get<string>(cacheKey);

      if (!raw) {
        throw new HttpError(401, "Invalid or expired session code.");
      }

      // Delete immediately — single use
      await cache.del(cacheKey);

      let parsed: { userId: string; createdAt: number };
      try {
        parsed = JSON.parse(raw as string);
      } catch {
        throw new HttpError(401, "Invalid session code payload.");
      }

      // Extra guard: reject if code is older than 60 seconds (belt + suspenders with TTL)
      if (Date.now() - parsed.createdAt > 60_000) {
        throw new HttpError(401, "Session code expired.");
      }

      // Load the user
      const user = await User.findById(parsed.userId);
      if (!user) {
        throw new HttpError(401, "User not found.");
      }

      // Issue full session (JWT + refresh token cookie)
      const session = await authService.issueSession(user, env.jwtSecret, res, secureCookie);

      res.json({
        success: true,
        token: session.access,
        user: session.user,
      });
    }),
  );

  return r;
}
