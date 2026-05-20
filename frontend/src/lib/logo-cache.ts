import fs from "fs";
import path from "path";

const LOGO_FILENAME = "naya_logo.png";

/** Cache-bust query for `public/naya_logo.png` — uses file mtime in dev/build, env override in production. */
export function getLogoCacheRev(): string {
  const envRev = process.env.NEXT_PUBLIC_LOGO_REV?.trim();
  if (envRev) return envRev;

  try {
    const logoPath = path.join(process.cwd(), "public", LOGO_FILENAME);
    const stat = fs.statSync(logoPath);
    return String(Math.floor(stat.mtimeMs));
  } catch {
    return "1";
  }
}

export function bustLogoPath(assetPath: string, rev?: string): string {
  if (!assetPath.startsWith("/")) return assetPath;
  const v = rev ?? getLogoCacheRev();
  const sep = assetPath.includes("?") ? "&" : "?";
  return `${assetPath}${sep}v=${encodeURIComponent(v)}`;
}
