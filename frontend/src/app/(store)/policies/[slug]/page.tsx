import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLegalPageBySlug, getLegalPageSlugs } from "@/lib/server-legal-pages";
import { splitLegalBody } from "@/types/legal-page";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getLegalPageSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLegalPageBySlug(slug);
  if (!page) return { title: "Policy" };
  return {
    title: page.title,
    description: splitLegalBody(page.body)[0]?.slice(0, 160),
  };
}

export default async function LegalPolicyPage({ params }: Props) {
  const { slug } = await params;
  const page = await getLegalPageBySlug(slug);
  if (!page || !page.published) notFound();

  const paragraphs = splitLegalBody(page.body);

  return (
    <div className="mx-auto max-w-3xl px-6 py-section md:px-10">
      <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold">Policies</p>
      <h1 className="mt-6 font-display text-4xl text-ink">{page.title}</h1>
      <div className="mt-10 space-y-6 font-sans text-sm leading-relaxed text-ink-muted">
        {paragraphs.length > 0 ? (
          paragraphs.map((paragraph) => <p key={paragraph.slice(0, 48)}>{paragraph}</p>)
        ) : (
          <p className="text-ink-soft">Content for this page has not been added yet.</p>
        )}
      </div>
      <p className="mt-12 font-sans text-sm text-ink-soft">
        <Link href="/" className="text-gold underline-offset-4 hover:underline">
          Back to store
        </Link>
      </p>
    </div>
  );
}
