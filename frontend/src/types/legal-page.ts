export type LegalPage = {
  id: string;
  title: string;
  slug: string;
  body: string;
  published: boolean;
  order: number;
  updatedAt: string | null;
};

export type LegalPageSummary = Pick<LegalPage, "id" | "title" | "slug" | "order" | "published">;

export function legalPageHref(slug: string): string {
  return `/policies/${slug}`;
}

export function splitLegalBody(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}
