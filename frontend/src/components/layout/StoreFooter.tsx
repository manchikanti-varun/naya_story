import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { HomepageConfig } from "@/types/homepage";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
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
        <div className="grid gap-10 pb-8 md:grid-cols-3 md:gap-8 md:pb-10 lg:gap-12">
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
                <InstagramIcon className="h-[15px] w-[15px]" />
              </SocialIcon>
              <SocialIcon href={whatsappHref} label="WhatsApp (opens in new tab)">
                <WhatsAppIcon className="h-[16px] w-[16px]" />
              </SocialIcon>
            </div>

          </div>
        </div>

        <div className="mt-6 pt-4 md:mt-8 md:pt-5">
          <p className="text-center font-sans text-[8px] font-light leading-none tracking-[0.12em] text-ink-soft">
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
