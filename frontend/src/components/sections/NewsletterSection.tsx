import Link from "next/link";
import type { SectionDesign, SectionTextColors } from "@/types/homepage";
import { SectionShell } from "@/components/cms/SectionShell";
import { sectionTextStyles } from "@/lib/section-text-styles";
import { NewsletterInline } from "@/components/sections/NewsletterInline";

type Props = {
  title?: string;
  description?: string;
  placeholder?: string;
  buttonLabel?: string;
  cta?: { label: string; href: string };
  compactTop?: boolean;
  textColors?: SectionTextColors | null;
  design?: SectionDesign | null;
};

export function NewsletterSection({
  title,
  description,
  placeholder,
  buttonLabel,
  cta,
  compactTop = false,
  textColors,
  design,
}: Props) {
  const st = sectionTextStyles(textColors);
  const align = design?.align ?? "left";
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <SectionShell
      design={design}
      className={`border-y border-ivory-deep/20 ${!design?.backgroundColor ? "bg-ivory-muted" : ""} ${compactTop ? "pt-10 pb-16 sm:pb-20 md:pt-14 md:pb-28" : "py-14 sm:py-20 md:py-28"}`}
    >
      <div className={`lux-shell mx-auto max-w-[720px] ${alignClass}`}>
        <NewsletterInline
          dense
          layout={align === "center" ? "centered" : "split"}
          title={title}
          description={description}
          placeholder={placeholder}
          buttonLabel={buttonLabel}
          textColors={textColors}
        />
        {cta ? (
          <div className={`mt-8 flex ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start"}`}>
            <Link
              href={cta.href}
              className="lux-btn-outline px-7 py-3 tracking-[0.22em]"
              style={st.link}
            >
              {cta.label}
            </Link>
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}
