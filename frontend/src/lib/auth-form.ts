import { ApiError } from "@/lib/api";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateLoginInput(email: string, password: string): string | null {
  if (!email.trim()) return "Enter your email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))) {
    return "Enter a valid email address.";
  }
  if (!password) return "Enter your password.";
  return null;
}

export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) return "weak";
  let score = 0;
  if (password.length >= 10) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 1) return "fair";
  if (score <= 3) return "good";
  return "strong";
}

export function validateRegisterInput(
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
): string | null {
  const trimmedName = name.trim();
  if (trimmedName.length < 2) return "Enter your full name (at least 2 characters).";
  if (!email.trim()) return "Enter your email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))) {
    return "Enter a valid email address.";
  }
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password !== confirmPassword) return "Passwords do not match.";
  if (getPasswordStrength(password) === "weak" && password.length < 10) {
    return "Choose a stronger password (mix letters, numbers, and symbols).";
  }
  return null;
}

export function formatAuthError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 429) return "Too many attempts. Please wait a few minutes and try again.";
    if (err.body?.message) return err.body.message;
    const errors = err.body?.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0] as { msg?: string };
      if (typeof first?.msg === "string") return first.msg;
    }
  }
  if (err instanceof TypeError && String(err.message).includes("fetch")) {
    return "Unable to reach the server. Check your connection and try again.";
  }
  return fallback;
}
