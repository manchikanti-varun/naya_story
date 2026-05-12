import { getSiteSettings } from "@/lib/server-content";
import { OurStoryPageView } from "@/components/story/OurStoryPageView";

export default async function OurStoryPage() {
  const data = await getSiteSettings();
  return <OurStoryPageView story={data.settings.homepage.ourStoryPage} />;
}
