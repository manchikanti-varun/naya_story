"use client";

import { useState } from "react";
import { Images, Upload } from "lucide-react";
import { CloudinaryImageUpload } from "@/components/admin/CloudinaryImageUpload";
import { MediaLibraryPicker } from "@/components/admin/MediaLibraryPicker";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminField, AdminInput } from "@/components/admin/ui/AdminField";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  token?: string | null;
  hint?: string;
  className?: string;
  placeholder?: string;
  /** Category for uploads (e.g. "homepage", "product", "banner") */
  category?: string;
};

export function CmsImageUrlField({
  label,
  value,
  onChange,
  token,
  hint,
  className,
  placeholder = "https://…",
  category = "homepage",
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const preview = value?.trim();

  return (
    <>
      <AdminField
        label={label}
        hint={hint ?? "Upload, choose from library, or paste URL."}
        className={className}
      >
        {/* Action buttons */}
        <div className="mt-1.5 flex flex-wrap gap-2">
          {token ? (
            <>
              <AdminButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowUpload(!showUpload)}
              >
                <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
                Upload
              </AdminButton>
              <AdminButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPickerOpen(true)}
              >
                <Images className="h-3.5 w-3.5" strokeWidth={1.5} />
                Library
              </AdminButton>
            </>
          ) : null}
        </div>

        {/* Upload area (toggled) */}
        {showUpload && token ? (
          <div className="mt-3">
            <CloudinaryImageUpload
              token={token}
              category={category}
              label="Drop or click to upload"
              onUploaded={(url) => {
                onChange(url);
                setShowUpload(false);
              }}
            />
          </div>
        ) : null}

        {/* URL input */}
        <AdminInput
          className="mt-2 min-w-0"
          type="url"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />

        {/* Preview */}
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
