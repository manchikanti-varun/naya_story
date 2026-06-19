/**
 * Firebase Admin SDK initialization for server-side token verification.
 *
 * Verifies Firebase ID tokens sent by the client after phone OTP verification.
 * The token is cryptographically signed by Google — we verify it without needing
 * to store OTPs or manage phone verification state on our server.
 *
 * Required env vars:
 *   FIREBASE_PROJECT_ID — your Firebase project ID
 *
 * Optional (for service account auth — needed in non-GCP environments):
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 */
import { logger } from "./logger.js";

let initialized = false;

async function ensureInitialized() {
  if (initialized) return;

  const { initializeApp, cert, getApps } = await import("firebase-admin/app");
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();

  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID is required for phone authentication.");
  }

  if (getApps().length > 0) {
    initialized = true;
    return;
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim()?.replace(/\\n/g, "\n");

  if (clientEmail && privateKey) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  } else {
    initializeApp({ projectId });
  }

  initialized = true;
  logger.info("firebase_admin_initialized", { projectId });
}

export type FirebasePhonePayload = {
  uid: string;
  phone: string;
};

/**
 * Verify a Firebase ID token and extract the phone number.
 * Throws if the token is invalid, expired, or doesn't contain a phone number.
 */
export async function verifyFirebasePhoneToken(idToken: string): Promise<FirebasePhonePayload> {
  await ensureInitialized();

  const { getAuth } = await import("firebase-admin/auth");
  const auth = getAuth();

  const decoded = await auth.verifyIdToken(idToken, true /* checkRevoked */);

  const phone = decoded.phone_number;
  if (!phone) {
    throw new Error("Firebase token does not contain a phone number.");
  }

  return { uid: decoded.uid, phone };
}
