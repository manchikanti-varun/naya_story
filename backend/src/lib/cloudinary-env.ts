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

/** Shown in admin when uploads are disabled (no secrets). */
export let cloudinarySetupHint: string | undefined;

export function isCloudinaryEnvReady(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim(),
  );
}

export function normalizeCloudinaryEnv(): void {
  cloudinarySetupHint = undefined;

  const hasTriplet = isCloudinaryEnvReady();

  let raw = process.env.CLOUDINARY_URL?.trim();
  if (!raw) {
    if (!hasTriplet) {
      cloudinarySetupHint =
        "Add CLOUDINARY_URL (cloudinary://KEY:SECRET@CLOUD_NAME) or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET on the API server, then redeploy.";
    }
    return;
  }

  raw = stripQuotes(raw);

  if (raw.includes("<") || /your_/i.test(raw)) {
    console.warn(
      "[cloudinary] CLOUDINARY_URL contains placeholder text — paste the real URL from Cloudinary Dashboard → API Keys.",
    );
    cloudinarySetupHint =
      "CLOUDINARY_URL still has placeholder text (<your_api_key>). Copy the full API environment variable from Cloudinary Dashboard.";
    delete process.env.CLOUDINARY_URL;
    return;
  }

  if (!raw.toLowerCase().startsWith("cloudinary://")) {
    console.warn(
      "[cloudinary] CLOUDINARY_URL must start with cloudinary:// (not https). Ignoring invalid value.",
    );
    cloudinarySetupHint =
      "CLOUDINARY_URL must start with cloudinary:// (not https://). Or delete it and set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET instead.";
    delete process.env.CLOUDINARY_URL;
    return;
  }

  const parsed = parseCloudinaryUrl(raw);
  if (!parsed) {
    console.warn(
      "[cloudinary] Could not parse CLOUDINARY_URL. Expected cloudinary://API_KEY:API_SECRET@CLOUD_NAME",
    );
    cloudinarySetupHint =
      "CLOUDINARY_URL could not be parsed. Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME — no spaces or quotes.";
    delete process.env.CLOUDINARY_URL;
    return;
  }

  if (!hasTriplet) {
    process.env.CLOUDINARY_API_KEY = parsed.apiKey;
    process.env.CLOUDINARY_API_SECRET = parsed.apiSecret;
    process.env.CLOUDINARY_CLOUD_NAME = parsed.cloudName;
    cloudinarySetupHint = undefined;
  }

  delete process.env.CLOUDINARY_URL;
}

normalizeCloudinaryEnv();

if (isCloudinaryEnvReady()) {
  console.log(
    `[cloudinary] Image uploads enabled (cloud: ${process.env.CLOUDINARY_CLOUD_NAME?.trim()})`,
  );
} else if (cloudinarySetupHint) {
  console.warn(`[cloudinary] Image uploads disabled — ${cloudinarySetupHint}`);
} else {
  console.warn("[cloudinary] Image uploads disabled — Cloudinary credentials not set.");
}
