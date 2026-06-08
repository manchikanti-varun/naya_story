"use client";

import { useCallback, useId, useRef, useState } from "react";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { uploadMediaBulk, type BulkUploadResponse } from "@/lib/upload-media";
import { AdminButton } from "@/components/admin/ui/AdminButton";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";
const MAX_FILES = 10;
const MAX_SIZE_MB = 10;

type Props = {
  token: string | null | undefined;
  category?: string;
  saveToLibrary?: boolean;
  disabled?: boolean;
  maxFiles?: number;
  className?: string;
  /** Called with all successfully uploaded URLs at once */
  onUploaded: (urls: string[]) => void;
};

type FilePreview = {
  file: File;
  id: string;
  preview: string;
};

export function BulkImageUpload({
  token,
  category = "product",
  saveToLibrary = true,
  disabled,
  maxFiles = MAX_FILES,
  className,
  onUploaded,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const effectiveMax = Math.min(maxFiles, MAX_FILES);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const newFiles: FilePreview[] = [];
      const fileArray = Array.from(incoming);

      for (const file of fileArray) {
        if (files.length + newFiles.length >= effectiveMax) break;

        // Validate type
        if (!file.type.startsWith("image/")) continue;

        // Validate size
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          setError(`${file.name} exceeds ${MAX_SIZE_MB}MB limit`);
          continue;
        }

        // Avoid duplicates by name + size
        const isDuplicate = files.some(
          (f) => f.file.name === file.name && f.file.size === file.size,
        );
        if (isDuplicate) continue;

        newFiles.push({
          file,
          id: `${file.name}-${file.size}-${Date.now()}`,
          preview: URL.createObjectURL(file),
        });
      }

      if (newFiles.length > 0) {
        setFiles((prev) => [...prev, ...newFiles]);
        setError(null);
      }
    },
    [files, effectiveMax],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const removed = prev.find((f) => f.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    for (const f of files) URL.revokeObjectURL(f.preview);
    setFiles([]);
    setError(null);
  }, [files]);

  const handleUpload = useCallback(async () => {
    if (!token || files.length === 0 || uploading) return;
    setError(null);
    setUploading(true);
    setProgress(`Uploading ${files.length} image${files.length > 1 ? "s" : ""}…`);

    try {
      const result: BulkUploadResponse = await uploadMediaBulk(
        files.map((f) => f.file),
        { token, category, saveToLibrary },
      );

      const urls = result.uploaded.map((item) => item.url);

      if (result.failCount > 0) {
        const failedNames = result.failed.map((f) => f.originalName).join(", ");
        setError(`${result.failCount} failed: ${failedNames}`);
      }

      if (urls.length > 0) {
        onUploaded(urls);
      }

      // Clear successfully uploaded files
      for (const f of files) URL.revokeObjectURL(f.preview);
      setFiles([]);
      setProgress(
        result.successCount > 0
          ? `${result.successCount} image${result.successCount > 1 ? "s" : ""} uploaded`
          : null,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setProgress(null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [token, files, uploading, category, saveToLibrary, onUploaded]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  if (!token) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone */}
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-colors",
          dragOver
            ? "border-[var(--admin-accent)] bg-[var(--admin-accent)]/5"
            : "border-[var(--admin-border)] bg-[var(--admin-surface-raised)]",
          disabled || uploading ? "pointer-events-none opacity-50" : "cursor-pointer",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
          }}
        />
        <div className="flex flex-col items-center gap-2 px-4 py-8">
          <Upload
            className={cn(
              "h-8 w-8",
              dragOver ? "text-[var(--admin-accent)]" : "text-[var(--admin-muted)]",
            )}
            strokeWidth={1.2}
          />
          <p className="text-center font-sans text-sm text-[var(--admin-ink)]">
            Drag &amp; drop images here, or click to browse
          </p>
          <p className="text-center font-sans text-[11px] text-[var(--admin-faint)]">
            Up to {effectiveMax} images · JPEG, PNG, WebP, GIF, AVIF · max {MAX_SIZE_MB}MB each
          </p>
        </div>
      </div>

      {/* File previews */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-sans text-xs font-medium text-[var(--admin-ink)]">
              {files.length} file{files.length > 1 ? "s" : ""} selected
            </p>
            <button
              type="button"
              className="font-sans text-xs text-red-600 hover:underline"
              onClick={clearAll}
            >
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {files.map((f) => (
              <div
                key={f.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.preview}
                  alt={f.file.name}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(f.id);
                  }}
                >
                  <X className="h-3 w-3" strokeWidth={2} />
                </button>
                <p className="absolute bottom-0 left-0 right-0 truncate bg-black/50 px-1.5 py-0.5 font-sans text-[10px] text-white">
                  {f.file.name}
                </p>
              </div>
            ))}
          </div>

          <AdminButton
            type="button"
            variant="primary"
            size="sm"
            disabled={uploading || files.length === 0}
            onClick={() => void handleUpload()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
            ) : (
              <ImagePlus className="h-4 w-4" strokeWidth={1.5} />
            )}
            {uploading
              ? "Uploading…"
              : `Upload ${files.length} image${files.length > 1 ? "s" : ""}`}
          </AdminButton>
        </div>
      )}

      {/* Status messages */}
      {progress && !error && (
        <p className="font-sans text-xs text-emerald-700">{progress}</p>
      )}
      {error && (
        <p className="font-sans text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
