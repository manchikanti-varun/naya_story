import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLegalPageBySlug, getLegalPageSlugs } from "@/lib/server-legal-pages";
import { rewriteEmbeddedMediaInHtml } from "@/lib/rich-text-utils";

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
  // Strip HTML tags for meta description
  const plainText = page.body.replace(/<[^>]*>/g, "").trim();
  return {
    title: page.title,
    description: plainText.slice(0, 160),
  };
}

export default async function LegalPolicyPage({ params }: Props) {
  const { slug } = await params;
  const page = await getLegalPageBySlug(slug);
  if (!page || !page.published) notFound();

  // Determine if content is HTML (has tags) or plain text (legacy)
  const isHtml = /<[a-z][\s\S]*>/i.test(page.body);

  return (
    <div className="mx-auto max-w-3xl px-6 py-section md:px-10">
      <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold">Policies</p>
      <h1 className="mt-6 font-display text-4xl text-ink">{page.title}</h1>
      {isHtml ? (
        <div
          className="mt-10 prose prose-sm max-w-none text-ink-muted prose-headings:text-ink prose-headings:font-display prose-a:text-gold prose-a:underline-offset-4 hover:prose-a:text-ink prose-strong:text-ink prose-blockquote:border-gold/40 prose-blockquote:text-ink-muted/80"
          dangerouslySetInnerHTML={{ __html: rewriteEmbeddedMediaInHtml(page.body) }}
        />
      ) : (
        <div className="mt-10 space-y-6 font-sans text-sm leading-relaxed text-ink-muted">
          {page.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).length > 0 ? (
            page.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))
          ) : (
            <p className="text-ink-soft">Content for this page has not been added yet.</p>
          )}
        </div>
      )}
      <p className="mt-12 font-sans text-sm text-ink-soft">
        <Link href="/" className="text-gold underline-offset-4 hover:underline">
          Back to store
        </Link>
      </p>
    </div>
  );
}
