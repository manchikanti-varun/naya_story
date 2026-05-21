import { API_BASE, ApiError } from "@/lib/api";
import type { MediaAsset } from "@/types";

export type MediaUploadConfig = {
  configured: boolean;
  cloudName?: string;
  hint?: string;
  maxBytes: number;
  allowedTypes: string[];
};

export type MediaUploadResult = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  item?: MediaAsset | null;
};

export async function fetchMediaUploadConfig(token: string): Promise<MediaUploadConfig> {
  const res = await fetch(`${API_BASE}/media/upload-config`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = (await res.json()) as MediaUploadConfig & { message?: string };
  if (!res.ok) {
    throw new ApiError(data.message ?? "Failed to load upload settings", res.status);
  }
  return data;
}

export async function uploadMediaToCloudinary(
  file: File,
  options: {
    token: string;
    name?: string;
    category?: string;
    tags?: string[];
    saveToLibrary?: boolean;
  },
): Promise<MediaUploadResult> {
  const fd = new FormData();
  fd.append("file", file);
  if (options.name?.trim()) fd.append("name", options.name.trim());
  if (options.category) fd.append("category", options.category);
  if (options.tags?.length) fd.append("tags", options.tags.join(","));
  if (options.saveToLibrary === false) fd.append("saveToLibrary", "false");

  const res = await fetch(`${API_BASE}/media/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${options.token}` },
    body: fd,
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const body = (typeof data === "object" && data !== null ? data : {}) as { message?: string };
    throw new ApiError(body.message ?? `Upload failed (${res.status})`, res.status);
  }

  return data as MediaUploadResult;
}
