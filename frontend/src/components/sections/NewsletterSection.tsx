import Link from "next/link";
import type { SectionTextColors } from "@/types/homepage";
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
};

export function NewsletterSection({
  title,
  description,
  placeholder,
  buttonLabel,
  cta,
  compactTop = false,
  textColors,
}: Props) {
  const st = sectionTextStyles(textColors);
  return (
    <section
      className={`border-y border-ivory-deep/20 bg-[#E4DDD4] px-6 ${compactTop ? "pt-10 pb-20 md:pt-14 md:pb-28" : "py-20 md:py-28"} md:px-10`}
    >
      <div className="mx-auto max-w-[720px]">
        <NewsletterInline
          dense
          layout="centered"
          title={title}
          description={description}
          placeholder={placeholder}
          buttonLabel={buttonLabel}
          textColors={textColors}
        />
        {cta ? (
          <div className="mt-8 flex justify-center">
            <Link
              href={cta.href}
              className="rounded-full border border-ivory-deep/80 bg-transparent px-7 py-3 font-sans text-[11px] uppercase tracking-[0.22em] text-ink transition-all duration-500 hover:border-gold hover:text-gold"
              style={st.link}
            >
              {cta.label}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
