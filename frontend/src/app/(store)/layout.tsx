import { CartDrawer } from "@/components/layout/CartDrawer";
import { ScrollToTopButton } from "@/components/layout/ScrollToTopButton";
import { StoreFooter } from "@/components/layout/StoreFooter";
import { StoreHeader } from "@/components/layout/StoreHeader";
import { getSiteSettings } from "@/lib/server-content";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const data = await getSiteSettings();
  return (
    <>
      <StoreHeader
        topPromoBar={
          data.settings.homepage.topPromoBar ?? {
            enabled: false,
            message: "",
            linkLabel: "",
            linkHref: "",
            variant: "ink",
          }
        }
      />
      <main className="min-h-screen pt-[calc(var(--store-nav-pad)+var(--store-promo-bar-h))] lux-grain">
        {children}
      </main>
      <StoreFooter footer={data.settings.homepage.footer} />
      <CartDrawer />
      <ScrollToTopButton />
    </>
  );
}
