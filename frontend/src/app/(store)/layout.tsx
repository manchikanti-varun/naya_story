import { CartDrawer } from "@/components/layout/CartDrawer";
import { ScrollToTopButton } from "@/components/layout/ScrollToTopButton";
import { StoreFooter } from "@/components/layout/StoreFooter";
import { StoreHeader } from "@/components/layout/StoreHeader";
import { StorefrontLiveSync } from "@/components/store/StorefrontLiveSync";
import { getSiteSettings } from "@/lib/server-content";
import { getPublishedLegalPages } from "@/lib/server-legal-pages";
import { getLogoCacheRev } from "@/lib/logo-cache";
import { resolveStoreLogoSrc } from "@/lib/image-src";
import { NAYA_STORE_THEME_STYLE_ID, storefrontThemeCssString } from "@/lib/storefront-theme";
import { storePageFlagsFromHomepage } from "@/lib/store-page-flags";
import "../store-theme.css";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [data, legalPages] = await Promise.all([getSiteSettings(), getPublishedLegalPages()]);
  const logoRev = getLogoCacheRev();
  const footer = data.settings.homepage.footer;
  const headerLogoSrc = resolveStoreLogoSrc(footer?.logoUrl, logoRev);
  const themeCss = storefrontThemeCssString(data.settings.homepage.theme);
  const storePageFlags = storePageFlagsFromHomepage(data.settings.homepage);
  return (
    <div className="store-app">
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
        logoSrc={headerLogoSrc}
        logoAlt={footer?.logoAlt}
        storePageFlags={storePageFlags}
      />
      <main className="min-h-screen overflow-x-hidden bg-ivory pt-[calc(var(--store-nav-pad)+var(--store-promo-bar-h))] lux-grain">
        {children}
      </main>
      <StoreFooter footer={footer} legalPages={legalPages} logoRev={logoRev} />
      <CartDrawer />
      <ScrollToTopButton />
    </div>
  );
}
