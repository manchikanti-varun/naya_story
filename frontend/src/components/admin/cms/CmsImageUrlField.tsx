"use client";

import { useState } from "react";
import { Images } from "lucide-react";
import { MediaLibraryPicker } from "@/components/admin/MediaLibraryPicker";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminField, AdminInput } from "@/components/admin/ui/AdminField";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  token?: string | null;
  hint?: string;
  className?: string;
  placeholder?: string;
};

export function CmsImageUrlField({
  label,
  value,
  onChange,
  token,
  hint,
  className,
  placeholder = "https://…",
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const preview = value?.trim();

  return (
    <>
      <AdminField
        label={label}
        hint={hint ?? (token ? "Paste a URL or pick from your media library." : "Paste a public HTTPS image URL.")}
        className={className}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <AdminInput
            className="min-w-0 flex-1"
            type="url"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          {token ? (
            <AdminButton
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0"
              onClick={() => setPickerOpen(true)}
            >
              <Images className="h-4 w-4" strokeWidth={1.5} />
              Library
            </AdminButton>
          ) : null}
        </div>
        {preview ? (
          <div className="admin-cms-image-preview mt-3 max-h-36">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" />
          </div>
        ) : null}
      </AdminField>

      {token ? (
        <MediaLibraryPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          token={token}
          onSelect={(url) => onChange(url)}
        />
      ) : null}
    </>
  );
}
