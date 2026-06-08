"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Props = {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

/**
 * Combobox: dropdown with existing options + free text input.
 * Shows filtered suggestions as you type, with an "Add new" option.
 */
export function AdminCombobox({ value, options, onChange, placeholder, className }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter(
    (opt) => opt.toLowerCase().includes(query.toLowerCase()),
  );

  const exactMatch = options.some(
    (opt) => opt.toLowerCase() === query.toLowerCase(),
  );

  return (
    <div ref={ref} className={cn("relative", className)}>
      <input
        type="text"
        className="admin-input mt-1.5 w-full"
        value={query}
        placeholder={placeholder ?? "Type to search or add new…"}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && (filtered.length > 0 || (query.trim() && !exactMatch)) && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-lg">
          {filtered.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-[var(--admin-surface-raised)]",
                  opt.toLowerCase() === query.toLowerCase() && "font-medium text-[var(--admin-accent)]",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQuery(opt);
                  onChange(opt);
                  setOpen(false);
                }}
              >
                {opt}
              </button>
            </li>
          ))}
          {query.trim() && !exactMatch && (
            <li>
              <button
                type="button"
                className="w-full border-t border-[var(--admin-border)] px-3 py-2 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(query.trim());
                  setOpen(false);
                }}
              >
                + Add &ldquo;{query.trim()}&rdquo; as new category
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
