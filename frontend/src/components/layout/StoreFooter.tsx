import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa6";
import { SiInstagram } from "react-icons/si";
import type { HomepageConfig } from "@/types/homepage";
import type { LegalPageSummary } from "@/types/legal-page";
import { legalPageHref } from "@/types/legal-page";
import { SITE_NAME, STORE_LOGO_PUBLIC_PATH } from "@/lib/constants";
import { resolveStoreLogoSrc } from "@/lib/image-src";

const fallbackFooter: HomepageConfig["footer"] = {
  logoUrl: STORE_LOGO_PUBLIC_PATH,
  logoAlt: SITE_NAME,
  brandDescription:
    `${SITE_NAME} creates timeless silhouettes for modern femininity — calm luxury, made to last.`,
  supportingText: "Designed with intention, elegance, and everyday luxury.",
  legalTitle: "Legal",
  legalLinks: [
    { label: "Terms & Conditions", href: "/policies/terms", enabled: true, order: 0 },
    { label: "Privacy Policy", href: "/policies/privacy", enabled: true, order: 1 },
    { label: "Refund & Cancellation", href: "/policies/refund-cancellation", enabled: true, order: 2 },
    { label: "Shipping & Delivery", href: "/policies/shipping", enabled: true, order: 3 },
  ],
  contactTitle: "Contact",
  email: "hello@nayastory.com",
  phone: "+91 00000 00000",
  location: "Mumbai, India",
  socialLinks: [
    { platform: "instagram", href: "https://instagram.com", enabled: true, order: 0 },
    { platform: "pinterest", href: "https://pinterest.com", enabled: true, order: 1 },
    { platform: "facebook", href: "https://facebook.com", enabled: true, order: 2 },
  ],
  ctaLinks: [],
  copyrightText: `© 2026 ${SITE_NAME}. All rights reserved.`,
};

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 text-ink/75 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-gold/50 hover:text-gold"
    >
      {children}
    </Link>
  );
}

export function StoreFooter({
  footer,
  legalPages,
  logoRev,
}: {
  footer?: HomepageConfig["footer"];
  legalPages?: LegalPageSummary[];
  logoRev?: string;
}) {
  const safeFooter = footer ?? fallbackFooter;
  const dynamicLegal =
    legalPages && legalPages.length > 0
      ? legalPages
          .filter((p) => p.published)
          .sort((a, b) => a.order - b.order)
          .map((p) => ({
            label: p.title,
            href: legalPageHref(p.slug),
            enabled: true,
            order: p.order,
          }))
      : null;
  const legal = (dynamicLegal ?? safeFooter.legalLinks)
    .filter((l) => l.enabled)
    .sort((a, b) => a.order - b.order);
  const socials = safeFooter.socialLinks
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);
  const year = new Date().getFullYear();
  const copyright =
    safeFooter.copyrightText?.trim().replace(/2026/g, String(year)) ||
    `© ${year} ${SITE_NAME}. All rights reserved.`;
  const instagramHref =
    socials.find((s) => s.platform === "instagram")?.href ?? "https://instagram.com";
  const whatsappHref = `https://wa.me/${safeFooter.phone.replace(/[^\d]/g, "")}`;
  const footerLogoSrc = resolveStoreLogoSrc(safeFooter.logoUrl, logoRev);

  return (
    <footer className="relative overflow-hidden border-t border-ivory-deep bg-gradient-to-b from-ivory via-ivory-muted to-ivory-soft">
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(rgba(44,40,37,0.35)_0.45px,transparent_0.45px)] [background-size:3px_3px]" />
      <div className="lux-shell relative py-10 md:py-12">
        <div className="grid gap-10 border-b border-ivory-deep/70 pb-8 md:grid-cols-3 md:gap-8 md:pb-10 lg:gap-12">
          <div className="space-y-5 md:pr-4">
            <Link href="/" className="relative inline-block h-9 w-[168px] md:h-10 md:w-[188px]">
              <Image
                src={footerLogoSrc}
                alt={safeFooter.logoAlt}
                fill
                sizes="188px"
                className="object-contain object-left"
              />
            </Link>
            <p className="max-w-xs font-sans text-[12px] font-light leading-relaxed text-ink-muted">
              {safeFooter.brandDescription}
            </p>
            <p className="max-w-xs border-l border-ivory-deep pl-3 font-sans text-[9px] font-light uppercase tracking-[0.24em] text-ink-soft">
              {safeFooter.supportingText}
            </p>
          </div>

          <div className="md:px-3">
            <p className="font-sans text-[9px] font-light uppercase tracking-[0.32em] text-ink-soft">
              {safeFooter.legalTitle}
            </p>
            <ul className="mt-4 space-y-2 font-sans text-[11px] font-light leading-snug text-ink-muted">
              {legal.map((item, idx) => (
                <li key={`${item.href}-${item.label}-${idx}`}>
                  <Link
                    href={item.href}
                    className="group inline-block pb-0.5 transition-colors duration-500 hover:text-gold"
                  >
                    <span className="relative">
                      {item.label}
                      <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-gold/60 transition-transform duration-500 group-hover:scale-x-100" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:pl-4">
            <p className="font-sans text-[9px] font-light uppercase tracking-[0.32em] text-ink-soft">
              {safeFooter.contactTitle}
            </p>
            <ul className="mt-4 space-y-2 font-sans text-[11px] font-light leading-snug text-ink-muted">
              <li>
                <Link href={`mailto:${safeFooter.email}`} className="transition-colors duration-500 hover:text-gold">
                  {safeFooter.email}
                </Link>
              </li>
              <li>
                <Link href={`tel:${safeFooter.phone.replace(/[^+\d]/g, "")}`} className="transition-colors duration-500 hover:text-gold">
                  {safeFooter.phone}
                </Link>
              </li>
              <li>{safeFooter.location}</li>
            </ul>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <SocialIcon href={instagramHref} label="Instagram (opens in new tab)">
                <SiInstagram className="h-[15px] w-[15px]" aria-hidden />
              </SocialIcon>
              <SocialIcon href={whatsappHref} label="WhatsApp (opens in new tab)">
                <FaWhatsapp className="h-[16px] w-[16px]" aria-hidden />
              </SocialIcon>
            </div>

          </div>
        </div>

        <div className="mt-3 border-t border-ivory-deep/50 pt-2.5 md:mt-4 md:pt-3">
          <p className="text-center font-sans text-[8px] font-light leading-none tracking-[0.12em] text-ink-soft">
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
