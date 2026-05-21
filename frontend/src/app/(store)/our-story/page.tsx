import { getSiteSettings } from "@/lib/server-content";
import { OurStoryPageView } from "@/components/story/OurStoryPageView";
import { ensureStorePageEnabled } from "@/lib/ensure-store-page";

export default async function OurStoryPage() {
  await ensureStorePageEnabled("ourStory");
  const data = await getSiteSettings();
  return <OurStoryPageView story={data.settings.homepage.ourStoryPage} />;
}
