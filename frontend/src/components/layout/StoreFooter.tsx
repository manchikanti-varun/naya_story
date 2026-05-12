import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa6";
import { SiInstagram } from "react-icons/si";
import type { HomepageConfig } from "@/types/homepage";
import { STORE_LOGO_PUBLIC_PATH, bustLocalPublicAsset } from "@/lib/constants";

const fallbackFooter: HomepageConfig["footer"] = {
  logoUrl: STORE_LOGO_PUBLIC_PATH,
  logoAlt: "Naya Studio",
  brandDescription:
    "Naya Studio creates timeless silhouettes for modern femininity.",
  supportingText: "Designed with intention, elegance, and everyday luxury.",
  legalTitle: "Legal",
  legalLinks: [
    { label: "Terms & Conditions", href: "/policies/terms", enabled: true, order: 0 },
    { label: "Privacy Policy", href: "/policies/privacy", enabled: true, order: 1 },
    { label: "Refund Policy", href: "/policies/terms", enabled: true, order: 2 },
    { label: "Shipping & Delivery", href: "/policies/shipping", enabled: true, order: 3 },
  ],
  contactTitle: "Contact",
  email: "hello@nayastudio.com",
  phone: "+91 00000 00000",
  location: "Mumbai, India",
  socialLinks: [
    { platform: "instagram", href: "https://instagram.com", enabled: true, order: 0 },
    { platform: "pinterest", href: "https://pinterest.com", enabled: true, order: 1 },
    { platform: "facebook", href: "https://facebook.com", enabled: true, order: 2 },
  ],
  ctaLinks: [
    { label: "Explore Collections", href: "/collections", enabled: true, order: 0 },
    { label: "Our Story", href: "/our-story", enabled: true, order: 1 },
  ],
  copyrightText: "© 2026 Naya Studio. All rights reserved.",
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
      className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-ink/80 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-gold/50 hover:text-gold"
    >
      {children}
    </Link>
  );
}

export function StoreFooter({ footer }: { footer?: HomepageConfig["footer"] }) {
  const safeFooter = footer ?? fallbackFooter;
  const legal = safeFooter.legalLinks
    .filter((l) => l.enabled)
    .sort((a, b) => a.order - b.order);
  const socials = safeFooter.socialLinks
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);
  const ctas = safeFooter.ctaLinks
    .filter((c) => c.enabled)
    .sort((a, b) => a.order - b.order);
  const year = new Date().getFullYear();
  const copyright =
    safeFooter.copyrightText?.trim().replace(/2026/g, String(year)) ||
    `© ${year} Naya Studio. All rights reserved.`;
  const instagramHref =
    socials.find((s) => s.platform === "instagram")?.href ?? "https://instagram.com";
  const whatsappHref = `https://wa.me/${safeFooter.phone.replace(/[^\d]/g, "")}`;
  const footerLogoSrc = bustLocalPublicAsset(safeFooter.logoUrl);

  return (
    <footer className="relative overflow-hidden border-t border-[#e6ddd1] bg-gradient-to-b from-[#f8f4ef] via-[#f1ebe3] to-[#ece3d8]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(rgba(44,40,37,0.35)_0.45px,transparent_0.45px)] [background-size:3px_3px]" />
      <div className="relative mx-auto max-w-[1480px] px-6 py-16 md:px-10 md:py-20 lg:px-14 lg:py-24">
        <div className="grid gap-14 border-b border-[#dccfbe]/70 pb-12 md:grid-cols-3 md:gap-10 md:pb-14 lg:gap-16">
          <div className="space-y-7 md:pr-6">
            <Link href="/" className="relative inline-block h-12 w-[200px] md:h-14 md:w-[230px]">
              <Image
                src={footerLogoSrc}
                alt={safeFooter.logoAlt}
                fill
                sizes="230px"
                className="object-contain object-left"
              />
            </Link>
            <p className="max-w-sm font-sans text-[15px] font-light leading-relaxed text-[#4f4943]">
              {safeFooter.brandDescription}
            </p>
            <p className="max-w-sm border-l border-[#d8cab8] pl-4 font-sans text-[11px] uppercase tracking-[0.22em] text-[#7c7268]">
              {safeFooter.supportingText}
            </p>
          </div>

          <div className="md:px-4">
            <p className="font-sans text-[10px] font-light uppercase tracking-[0.34em] text-[#8a7f73]">
              {safeFooter.legalTitle}
            </p>
            <ul className="mt-6 space-y-3.5 font-sans text-sm font-light text-[#524b44]">
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

          <div className="md:pl-6">
            <p className="font-sans text-[10px] font-light uppercase tracking-[0.34em] text-[#8a7f73]">
              {safeFooter.contactTitle}
            </p>
            <ul className="mt-6 space-y-3.5 font-sans text-sm font-light text-[#524b44]">
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

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <SocialIcon href={instagramHref} label="Instagram (opens in new tab)">
                <SiInstagram className="h-[18px] w-[18px]" aria-hidden />
              </SocialIcon>
              <SocialIcon href={whatsappHref} label="WhatsApp (opens in new tab)">
                <FaWhatsapp className="h-[19px] w-[19px]" aria-hidden />
              </SocialIcon>
            </div>

            <div className="mt-7 space-y-2.5">
              {ctas.map((cta) => (
                <Link
                  key={cta.href}
                  href={cta.href}
                  className="group inline-flex items-center gap-2.5 font-sans text-[11px] uppercase tracking-[0.22em] text-[#5f564d] transition-colors duration-500 hover:text-gold"
                >
                  {cta.label}
                  <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-[#dccfbe]/40 pt-4 md:mt-6 md:pt-5">
          <p className="text-center font-sans text-[10px] font-light leading-snug tracking-[0.04em] text-[#9a8f84]">
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
