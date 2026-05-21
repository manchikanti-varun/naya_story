/**
 * Runs before the `cloudinary` package is imported. The SDK validates CLOUDINARY_URL
 * at require-time and crashes the process if the protocol is wrong or placeholders remain.
 */
function stripQuotes(value: string): string {
  return value.replace(/^["']|["']$/g, "").trim();
}

function parseCloudinaryUrl(raw: string): { apiKey: string; apiSecret: string; cloudName: string } | null {
  const match = /^cloudinary:\/\/([^:]+):([^@]+)@([^/?#\s]+)/i.exec(raw);
  if (!match) return null;
  const apiKey = decodeURIComponent(match[1] ?? "").trim();
  const apiSecret = decodeURIComponent(match[2] ?? "").trim();
  const cloudName = decodeURIComponent(match[3] ?? "").trim();
  if (!apiKey || !apiSecret || !cloudName) return null;
  return { apiKey, apiSecret, cloudName };
}

export function normalizeCloudinaryEnv(): void {
  const hasTriplet = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim(),
  );

  let raw = process.env.CLOUDINARY_URL?.trim();
  if (!raw) return;

  raw = stripQuotes(raw);

  if (raw.includes("<") || /your_/i.test(raw)) {
    console.warn(
      "[cloudinary] CLOUDINARY_URL contains placeholder text — remove it or paste the real URL from Cloudinary Dashboard.",
    );
    delete process.env.CLOUDINARY_URL;
    return;
  }

  if (!raw.toLowerCase().startsWith("cloudinary://")) {
    console.warn(
      "[cloudinary] CLOUDINARY_URL must start with cloudinary:// (not https). Ignoring invalid value so the API can start.",
    );
    delete process.env.CLOUDINARY_URL;
    return;
  }

  const parsed = parseCloudinaryUrl(raw);
  if (!parsed) {
    console.warn(
      "[cloudinary] Could not parse CLOUDINARY_URL. Expected cloudinary://API_KEY:API_SECRET@CLOUD_NAME",
    );
    delete process.env.CLOUDINARY_URL;
    return;
  }

  if (!hasTriplet) {
    process.env.CLOUDINARY_API_KEY = parsed.apiKey;
    process.env.CLOUDINARY_API_SECRET = parsed.apiSecret;
    process.env.CLOUDINARY_CLOUD_NAME = parsed.cloudName;
  }

  // Never leave CLOUDINARY_URL set — the SDK reads it on import and can crash on edge cases.
  delete process.env.CLOUDINARY_URL;
}

normalizeCloudinaryEnv();
