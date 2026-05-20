import { CartDrawer } from "@/components/layout/CartDrawer";
import { ScrollToTopButton } from "@/components/layout/ScrollToTopButton";
import { StoreFooter } from "@/components/layout/StoreFooter";
import { StoreHeader } from "@/components/layout/StoreHeader";
import { StorefrontLiveSync } from "@/components/store/StorefrontLiveSync";
import { getSiteSettings } from "@/lib/server-content";
import { NAYA_STORE_THEME_STYLE_ID, storefrontThemeCssString } from "@/lib/storefront-theme";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const data = await getSiteSettings();
  const themeCss = storefrontThemeCssString(data.settings.homepage.theme);
  return (
    <>
      <StorefrontLiveSync />
      <style
        id={NAYA_STORE_THEME_STYLE_ID}
        dangerouslySetInnerHTML={{ __html: themeCss || "/* naya storefront theme */" }}
      />
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
        topPromoTextColors={data.settings.homepage.sectionTextColors?.promoBar}
      />
      <main className="min-h-screen overflow-x-hidden bg-ivory pt-[calc(var(--store-nav-pad)+var(--store-promo-bar-h))] lux-grain">
        {children}
      </main>
      <StoreFooter footer={data.settings.homepage.footer} />
      <CartDrawer />
      <ScrollToTopButton />
    </>
  );
}
