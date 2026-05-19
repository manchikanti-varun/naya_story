import Link from "next/link";
import { Megaphone, Percent, Sparkles } from "lucide-react";

const lanes = [
  {
    title: "Coupons & incentives",
    body: "Create stackable codes, monitor usage, and toggle activation — storefront checkout reads active coupons in real time after each save.",
    href: "/admin/coupons",
    icon: Percent,
  },
  {
    title: "Homepage & editorial",
    body: "Hero, rails, and collection storytelling — publish from Storefront CMS; shoppers see updates as soon as tabs sync.",
    href: "/admin/storefront",
    icon: Sparkles,
  },
  {
    title: "Lifecycle campaigns",
    body: "Automated journeys (back-in-stock, VIP drops) will plug into this lane — for now orchestrate manually with coupons + email.",
    href: "/admin/media/banners",
    icon: Megaphone,
  },
];

export default function MarketingCampaignsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header>
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--admin-faint)]">
          Marketing
        </p>
        <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[var(--admin-ink)]">Campaigns</h1>
        <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-[var(--admin-muted)]">
          Coordinate offers, editorial moments, and creative assets. Saves that affect the public site broadcast to open
          storefront tabs automatically.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {lanes.map(({ title, body, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="admin-surface flex flex-col rounded-2xl p-5 transition hover:border-[var(--admin-border-strong)]"
          >
            <span className="inline-flex w-fit rounded-xl bg-[var(--admin-accent-soft)] p-2 text-[var(--admin-accent)]">
              <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
            </span>
            <h2 className="mt-4 font-sans text-base font-semibold text-[var(--admin-ink)]">{title}</h2>
            <p className="mt-2 flex-1 font-sans text-sm leading-relaxed text-[var(--admin-muted)]">{body}</p>
            <span className="mt-4 font-sans text-[11px] font-semibold uppercase tracking-wide text-[var(--admin-accent)]">
              Open →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
