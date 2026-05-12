import { HomePageView } from "@/components/home/HomePageView";
import { getProductsByIds, getSiteSettings } from "@/lib/server-content";

export default async function HomePage() {
  const { settings } = await getSiteSettings();
  const hp = settings.homepage;
  const ids = [...new Set([...hp.bestsellers.productIds, ...hp.newIn.productIds])];
  const products = await getProductsByIds(ids);

  return <HomePageView homepage={hp} products={products} />;
}
