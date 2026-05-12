import Link from "next/link";
import { ArrowUpRight, Home, ImageIcon, LayoutGrid, Package } from "lucide-react";

const cards = [
  {
    title: "Content editor",
    description:
      "Per-section editors, preview your draft, then save or discard. Homepage rails pick catalog products here.",
    href: "/admin/content/hero",
    icon: Home,
  },
  {
    title: "Products",
    description: "Global catalog — single source for everything on the store. Rails below pick from here (no duplicate IDs).",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Media library",
    description: "Reusable banner and campaign URLs to paste into the site editor or product media.",
    href: "/admin/media",
    icon: ImageIcon,
  },
  {
    title: "Collections page block",
    description: "Jump straight to the collections browse settings (tabs, copy, limits).",
    href: "/admin/content/collections",
    icon: LayoutGrid,
  },
];

export default function AdminPagesHub() {
  return (
    <div className="space-y-10">
      <header>
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Reference</p>
        <h1 className="mt-2 font-display text-3xl text-slate-900 md:text-4xl">Admin map</h1>
        <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-slate-600">
          Sidebar groups mirror how the app is built: <strong className="font-medium text-slate-800">Catalog</strong>,{" "}
          <strong className="font-medium text-slate-800">Storefront</strong>, then{" "}
          <strong className="font-medium text-slate-800">Customers & orders</strong>.
        </p>
      </header>
      <div className="grid gap-5 md:grid-cols-2">
        {cards.map(({ title, description, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex rounded-xl bg-slate-100 p-2.5 text-slate-700">
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-slate-900" />
            </div>
            <h2 className="mt-4 font-display text-xl text-slate-900">{title}</h2>
            <p className="mt-2 flex-1 font-sans text-sm leading-relaxed text-slate-600">{description}</p>
            <span className="mt-5 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">
              Open
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
