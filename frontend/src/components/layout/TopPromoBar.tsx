"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { TopPromoBarConfig, SectionTextColors } from "@/types/homepage";
import { sectionTextStyles } from "@/lib/section-text-styles";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "naya_store_promo_dismiss_sig";

function promoSignature(c: TopPromoBarConfig): string {
  return [c.message.trim(), c.linkHref ?? "", c.linkLabel ?? "", c.variant ?? "ink"].join("::");
}

const variantClass: Record<NonNullable<TopPromoBarConfig["variant"]>, string> = {
  ink: "bg-ink text-[#f7f3ee] border-b border-black/20",
  sand: "bg-[#e8dfd4] text-ink border-b border-ivory-deep/40",
  gold: "bg-gradient-to-r from-[#f0e6d8] to-[#ebe1d4] text-ink border-b border-gold/25",
};

type Props = {
  config?: TopPromoBarConfig | null;
  /** Optional message / link hex (overrides variant text). */
  textColors?: SectionTextColors | null;
};

export function TopPromoBar({ config, textColors }: Props) {
  const [storageChecked, setStorageChecked] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const sig = useMemo(() => (config ? promoSignature(config) : ""), [config]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sig && localStorage.getItem(STORAGE_KEY) === sig) setDismissed(true);
    } catch {
      /* private mode */
    }
    setStorageChecked(true);
  }, [sig]);

  const variant = config?.variant ?? "ink";
  const barClass = variantClass[variant] ?? variantClass.ink;

  const visible =
    Boolean(config?.enabled) &&
    Boolean(config?.message?.trim()) &&
    storageChecked &&
    !dismissed;

  useEffect(() => {
    const h = visible ? "2.25rem" : "0px";
    document.documentElement.style.setProperty("--store-promo-bar-h", h);
    return () => {
      document.documentElement.style.setProperty("--store-promo-bar-h", "0px");
    };
  }, [visible]);

  function onDismiss() {
    try {
      if (sig) localStorage.setItem(STORAGE_KEY, sig);
    } catch {
      /* */
    }
    setDismissed(true);
  }

  if (!config || !storageChecked) return null;

  if (!visible) return null;

  const link = config.linkHref?.trim();
  const linkLabel = config.linkLabel?.trim();
  const st = sectionTextStyles(textColors);

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-[55] flex h-9 items-stretch shadow-sm",
        barClass,
      )}
      role="region"
      aria-label="Promotion"
      style={st.body}
    >
      <div className="lux-shell flex h-full min-w-0 flex-1 items-center gap-2 px-1 sm:gap-3">
        <div className="no-scrollbar flex min-h-0 min-w-0 flex-1 items-center overflow-x-auto py-1 text-center sm:text-left">
          <p className="inline-flex min-w-0 items-center gap-x-2 whitespace-nowrap px-1 font-sans text-[11px] font-medium uppercase tracking-[0.14em] sm:text-xs sm:tracking-[0.16em]">
            <span>{config.message.trim()}</span>
            {link && linkLabel ? (
              <>
                <span className="text-[0.65em] opacity-50" aria-hidden>
                  ·
                </span>
                <Link
                  href={link}
                  className="shrink-0 underline underline-offset-2 opacity-90 decoration-current/40 hover:opacity-100 hover:decoration-current"
                  style={st.link}
                >
                  {linkLabel}
                </Link>
              </>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-current opacity-80 transition hover:bg-black/10 hover:opacity-100"
          aria-label="Dismiss promotion"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
