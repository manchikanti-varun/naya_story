/** CMS state returned with authenticated `GET /api/content/site` (admin homepage editor). */
export type HomepageCmsMeta = {
  publishedAt: string | null;
  version: number;
  hasUnpublishedChanges: boolean;
};
