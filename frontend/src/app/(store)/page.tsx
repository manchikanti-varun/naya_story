import { HomePageView } from "@/components/home/HomePageView";
import { getBestsellerProducts, getNewInProducts, getSiteSettings } from "@/lib/server-content";

export default async function HomePage() {
  const { settings } = await getSiteSettings();
  const hp = settings.homepage;

  // Fetch bestsellers and new-in directly by flag — no manual pinning needed
  const [bestsellers, newIn] = await Promise.all([
    getBestsellerProducts(8),
    getNewInProducts(8),
  ]);

  const products = [...bestsellers, ...newIn.filter((p) => !bestsellers.some((b) => b._id === p._id))];

  return <HomePageView homepage={hp} products={products} />;
}
