"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { API_BASE } from "@/lib/api";
import { fetchMediaUploadConfig, uploadMediaToCloudinary } from "@/lib/upload-media";
import { AdminButton } from "@/components/admin/ui/AdminButton";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";

type Props = {
  token: string | null | undefined;
  category?: string;
  name?: string;
  tags?: string[];
  saveToLibrary?: boolean;
  disabled?: boolean;
  label?: string;
  hint?: string;
  className?: string;
  onUploaded: (url: string) => void;
  onLibraryItem?: () => void;
};

export function CloudinaryImageUpload({
  token,
  category = "general",
  name,
  tags,
  saveToLibrary = true,
  disabled,
  label = "Upload image",
  hint = "JPEG, PNG, WebP, GIF, or AVIF · max 10MB · stored on Cloudinary",
  className,
  onUploaded,
  onLibraryItem,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [cloudName, setCloudName] = useState<string | null>(null);
  const [setupHint, setSetupHint] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setConfigured(false);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    setLoadError(null);
    void fetchMediaUploadConfig(token)
      .then((c) => {
        if (cancelled) return;
        setConfigured(c.configured);
        setCloudName(c.cloudName ?? null);
        setSetupHint(c.hint ?? null);
      })
      .catch((e) => {
        if (cancelled) return;
        setConfigured(false);
        setSetupHint(null);
        const msg = e instanceof Error ? e.message : "Could not reach API";
        setLoadError(
          `${msg}. Check NEXT_PUBLIC_API_URL points to your Railway API (${API_BASE}). Redeploy the backend if upload was recently added.`,
        );
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file || !token || uploading) return;
      setError(null);
      setUploading(true);
      try {
        const result = await uploadMediaToCloudinary(file, {
          token,
          category,
          name: name?.trim() || file.name.replace(/\.[^.]+$/, ""),
          tags,
          saveToLibrary,
        });
        onUploaded(result.url);
        if (saveToLibrary) onLibraryItem?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [token, uploading, category, name, tags, saveToLibrary, onUploaded, onLibraryItem],
  );

  if (!token) {
    return (
      <p className={cn("font-sans text-xs text-[var(--admin-muted)]", className)}>
        Sign in to upload images.
      </p>
    );
  }

  if (loadError) {
    return (
      <div
        className={cn(
          "rounded-[var(--admin-radius-sm)] border border-dashed border-amber-200 bg-amber-50/80 px-4 py-3",
          className,
        )}
      >
        <p className="font-sans text-sm text-amber-950">{loadError}</p>
      </div>
    );
  }

  if (configured === false) {
    return (
      <div
        className={cn(
          "rounded-[var(--admin-radius-sm)] border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-4 py-3 space-y-2",
          className,
        )}
      >
        <p className="font-sans text-sm font-medium text-[var(--admin-ink)]">
          Cloudinary upload is not configured on the API
        </p>
        <p className="font-sans text-sm text-[var(--admin-muted)]">
          {setupHint ??
            "On Railway (backend service only), add either CLOUDINARY_URL or all three: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET. Then redeploy the API."}
        </p>
        <p className="font-sans text-xs text-[var(--admin-faint)]">
          <strong className="font-medium">CLOUDINARY_URL</strong> must look like{" "}
          <code className="rounded bg-black/[0.04] px-1 text-[11px]">
            cloudinary://API_KEY:API_SECRET@dvbee9lgq
          </code>{" "}
          — copy the full line from Cloudinary Dashboard → API Keys → API environment variable
          (no quotes, no placeholders).
        </p>
        <p className="font-sans text-xs text-[var(--admin-faint)]">
          After redeploy, check Railway logs for{" "}
          <code className="text-[11px]">[cloudinary] Image uploads enabled</code>.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={disabled || uploading || configured !== true}
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
      />
      <AdminButton
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled || uploading || configured !== true}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
        ) : (
          <ImagePlus className="h-4 w-4" strokeWidth={1.5} />
        )}
        {uploading ? "Uploading…" : label}
      </AdminButton>
      {configured && cloudName ? (
        <p className="font-sans text-[11px] text-[var(--admin-faint)]">
          Connected to Cloudinary cloud <span className="font-mono">{cloudName}</span>
        </p>
      ) : null}
      {hint ? <p className="font-sans text-[11px] text-[var(--admin-faint)]">{hint}</p> : null}
      {error ? (
        <p className="font-sans text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
