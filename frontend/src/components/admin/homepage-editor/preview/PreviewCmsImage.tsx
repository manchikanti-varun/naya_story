"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/** Admin preview: `<img>` so any CMS URL works (Next `<Image>` is host-restricted). */
export function PreviewCmsImage({
  src,
  alt,
  className,
  fallbackLabel,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src?.trim()) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-slate-200 p-2 text-center font-sans text-[10px] leading-tight text-slate-500",
          className,
        )}
      >
        {fallbackLabel ?? "No image URL"}
      </div>
    );
  }

  if (failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-amber-50 p-2 text-center font-sans text-[10px] leading-tight text-amber-900/90",
          className,
        )}
      >
        Image failed to load — check the URL is public and correct.
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src.trim()}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
