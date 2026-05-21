"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  renderOption?: (value: string) => string;
  allLabel?: string;
  className?: string;
};

export function CollectionsFilterField({
  label,
  value,
  options,
  onChange,
  renderOption,
  allLabel = "All",
  className,
}: Props) {
  const labelFor = (opt: string) =>
    renderOption ? renderOption(opt) : opt || allLabel;

  return (
    <div className={cn("lux-collection-filter-field", className)}>
      <span className="lux-collection-filter-label">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="lux-collection-select"
          aria-label={label}
        >
          {options.map((opt) => (
            <option key={opt || "all"} value={opt}>
              {labelFor(opt)}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
    </div>
  );
}
