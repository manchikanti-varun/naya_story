"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setConfigured(false);
      return;
    }
    let cancelled = false;
    void fetchMediaUploadConfig(token)
      .then((c) => {
        if (!cancelled) setConfigured(c.configured);
      })
      .catch(() => {
        if (!cancelled) setConfigured(false);
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

  if (configured === false) {
    return (
      <div
        className={cn(
          "rounded-[var(--admin-radius-sm)] border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-4 py-3",
          className,
        )}
      >
        <p className="font-sans text-sm text-[var(--admin-muted)]">
          Cloudinary upload is not configured on the API. Add{" "}
          <code className="rounded bg-black/[0.04] px-1 py-0.5 text-[11px]">CLOUDINARY_URL</code>{" "}
          (from Cloudinary Dashboard → API Keys) to Railway or{" "}
          <code className="text-[11px]">backend/.env</code>, then redeploy the API. You can still
          paste image URLs below.
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
      {hint ? <p className="font-sans text-[11px] text-[var(--admin-faint)]">{hint}</p> : null}
      {error ? (
        <p className="font-sans text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
