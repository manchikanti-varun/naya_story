import type { SectionDesign, SectionTextColors } from "@/types/homepage";
import {
  heroHeadingStyle,
  heroKickerStyle,
  heroSubheadingStyle,
} from "@/lib/cms/section-design";
import { sectionTextStyles } from "@/lib/section-text-styles";
import { cn } from "@/lib/cn";

type Props = {
  /** Small line above title; hidden when empty. */
  kicker?: string;
  title: string;
  subtitle?: string;
  /** Used when CMS section design has no `align` token. */
  align?: "left" | "center" | "right";
  design?: SectionDesign | null;
  sectionText?: SectionTextColors | null;
  className?: string;
};

export function HomeSectionHeader({
  kicker,
  title,
  subtitle,
  align = "left",
  design,
  sectionText,
  className,
}: Props) {
  const st = sectionTextStyles(sectionText);
  const resolved = design?.align ?? align;
  const centered = resolved === "center";
  const right = resolved === "right";
  const eyebrow = kicker?.trim();

  return (
    <header
      className={cn(
        "max-w-2xl",
        centered && "mx-auto text-center",
        right && "ml-auto text-right",
        !centered && !right && "text-left",
        className,
      )}
    >
      {eyebrow ? (
        <p className="lux-kicker text-gold/90" style={heroKickerStyle(design, st.kicker)}>
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn("lux-heading-rail text-balance", eyebrow ? "mt-2" : "")}
        style={heroHeadingStyle(design, st.heading)}
      >
        {title}
      </h2>
      {subtitle?.trim() ? (
        <p
          className={cn(
            "lux-copy mt-4 max-w-md",
            centered && "mx-auto",
            right && "ml-auto",
          )}
          style={heroSubheadingStyle(design, st.subheading)}
        >
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
