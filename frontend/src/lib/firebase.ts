"use client";

/**
 * Firebase client SDK initialization for Phone Authentication.
 *
 * OTP sending and verification happens entirely client-side via Firebase.
 * After verification, the ID token is sent to our backend for session creation.
 *
 * Required env vars (NEXT_PUBLIC_ prefix for client-side access):
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 */
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type Auth,
  type ConfirmationResult,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0]!;
  } else {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  auth = getAuth(getFirebaseApp());
  return auth;
}

/**
 * Initialize invisible reCAPTCHA verifier (required by Firebase Phone Auth).
 * Attach to a container element (usually hidden).
 */
export function createRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  const firebaseAuth = getFirebaseAuth();
  return new RecaptchaVerifier(firebaseAuth, containerId, {
    size: "invisible",
  });
}

/**
 * Send OTP to the given phone number.
 * Returns a ConfirmationResult that can be used to verify the code.
 */
export async function sendOtp(
  phone: string,
  recaptchaVerifier: RecaptchaVerifier,
): Promise<ConfirmationResult> {
  const firebaseAuth = getFirebaseAuth();
  return signInWithPhoneNumber(firebaseAuth, phone, recaptchaVerifier);
}

/**
 * Get the Firebase ID token after successful OTP verification.
 * This token is sent to our backend for session creation.
 */
export async function getFirebaseIdToken(): Promise<string | null> {
  const firebaseAuth = getFirebaseAuth();
  const user = firebaseAuth.currentUser;
  if (!user) return null;
  return user.getIdToken(true);
}

/** Check if Firebase is configured (env vars present). */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  );
}
