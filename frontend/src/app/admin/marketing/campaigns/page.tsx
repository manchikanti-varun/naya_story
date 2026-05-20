import Link from "next/link";
import { Megaphone, Percent, Sparkles } from "lucide-react";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";

import { websitePagesUrl } from "@/lib/admin/website-pages";

const lanes = [
  {
    title: "Coupons & incentives",
    body: "Create stackable codes, monitor usage, and toggle activation — storefront checkout reads active coupons in real time after each save.",
    href: "/admin/coupons",
    icon: Percent,
  },
  {
    title: "Homepage & editorial",
    body: "Hero, rails, and collection storytelling — publish from Website; shoppers see updates as soon as tabs sync.",
    href: websitePagesUrl("homepage"),
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
    <AdminPageLayout
      eyebrow="Marketing"
      title="Campaigns"
      maxWidthClass="max-w-4xl"
      description="Coordinate offers, editorial moments, and creative assets. Saves that affect the public site broadcast to open storefront tabs automatically."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {lanes.map(({ title, body, href, icon: Icon }) => (
          <Link key={href} href={href} className="block h-full">
            <AdminCard className="flex h-full flex-col transition hover:border-[var(--admin-border-strong)]" padding="md">
              <span className="inline-flex w-fit rounded-xl bg-[var(--admin-accent-soft)] p-2 text-[var(--admin-accent)]">
                <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              </span>
              <h2 className="mt-4 font-sans text-base font-semibold text-[var(--admin-ink)]">{title}</h2>
              <p className="mt-2 flex-1 font-sans text-sm leading-relaxed text-[var(--admin-muted)]">{body}</p>
              <span className="mt-4 font-sans text-[11px] font-semibold uppercase tracking-wide text-[var(--admin-accent)]">
                Open →
              </span>
            </AdminCard>
          </Link>
        ))}
      </div>
    </AdminPageLayout>
  );
}
