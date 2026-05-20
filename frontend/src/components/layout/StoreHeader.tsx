"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { SearchPalette } from "@/components/layout/SearchPalette";
import { TopPromoBar } from "@/components/layout/TopPromoBar";
import { MobileMenu } from "@/components/layout/store-header/mobile-menu";
import { ProfileMenu } from "@/components/layout/store-header/profile-menu";
import { StoreNavLinks } from "@/components/layout/store-header/nav-links";
import { WishlistPop } from "@/components/layout/store-header/wishlist-pop";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { SITE_NAME, STORE_LOGO_PUBLIC_PATH, bustLocalPublicAsset } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { TopPromoBarConfig, SectionTextColors } from "@/types/homepage";

const iconClassBase =
  "rounded-full p-2.5 transition-[color,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/35";

const logoOnHeroClass =
  "drop-shadow-[0_0_1px_rgba(255,255,255,0.45),0_2px_20px_rgba(0,0,0,0.65)]";

const iconMotion = {
  whileHover: { scale: 1.04 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

const cartCountBadgeClass =
  "absolute -right-1 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 font-sans text-[10px] font-semibold leading-none tabular-nums text-ivory shadow-[0_1px_3px_rgba(44,40,37,0.2)] ring-2 ring-ivory";

export function StoreHeader({
  topPromoBar,
  topPromoTextColors,
}: {
  topPromoBar?: TopPromoBarConfig | null;
  topPromoTextColors?: SectionTextColors | null;
}) {
  const pathname = usePathname();
  const { openCart, lines } = useCart();
  const { user, wishlistIds } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [wishOpen, setWishOpen] = useState(false);

  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const wishCount = wishlistIds.length;
  const logoSrc = bustLocalPublicAsset(STORE_LOGO_PUBLIC_PATH);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setWishOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const openProfile = () => {
    setWishOpen(false);
    setProfileOpen((v) => !v);
  };

  const overDarkBanner = pathname === "/" && !scrolled;

  const openWish = () => {
    setProfileOpen(false);
    setWishOpen((v) => !v);
  };

  const iconClass = cn(iconClassBase, "text-ink hover:text-gold");

  const headerSurface = cn(
    "fixed inset-x-0 top-[var(--store-promo-bar-h,0px)] z-50 border-b transition-[border-color,background-color,box-shadow,backdrop-filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
    scrolled
      ? "border-ivory-deep/35 bg-ivory/94 shadow-[0_1px_0_rgba(232,224,214,0.45)] backdrop-blur-xl"
      : overDarkBanner
        ? "border-transparent bg-ivory/90 backdrop-blur-md"
        : "border-transparent bg-ivory/92 backdrop-blur-md",
  );

  return (
    <>
      <TopPromoBar config={topPromoBar} textColors={topPromoTextColors} />
      <motion.header
        layout
        className={headerSurface}
        initial={false}
        animate={{ height: scrolled ? 80 : 96 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="lux-shell flex h-full items-stretch">
          {/* Mobile: logo left, actions + menu right */}
          <div className="relative flex w-full flex-1 items-center justify-between gap-3 md:hidden">
            <Link
              href="/"
              className="relative z-20 shrink-0"
              aria-label={`${SITE_NAME} home`}
            >
              <motion.div
                whileHover={{ opacity: 0.9 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="relative h-11 w-[152px] min-[400px]:h-12 min-[400px]:w-[172px]"
              >
                <Image
                  src={logoSrc}
                  alt={SITE_NAME}
                  fill
                  className={cn(
                    "object-contain object-left",
                    overDarkBanner && logoOnHeroClass,
                  )}
                  sizes="172px"
                  priority
                />
              </motion.div>
            </Link>

            <div className="flex shrink-0 items-center gap-0.5">
              <motion.button
                type="button"
                {...iconMotion}
                className={iconClass}
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.05} />
              </motion.button>
              <motion.button
                type="button"
                {...iconMotion}
                className={cn(iconClass, "relative")}
                aria-label={count > 0 ? `Open cart, ${count} item${count === 1 ? "" : "s"}` : "Open cart"}
                onClick={() => openCart()}
              >
                <ShoppingBag
                  className="h-[1.125rem] w-[1.125rem]"
                  strokeWidth={1.05}
                />
                {count > 0 ? (
                  <span className={cartCountBadgeClass} aria-hidden>
                    {count > 9 ? "9+" : count}
                  </span>
                ) : null}
              </motion.button>
              <motion.button
                type="button"
                {...iconMotion}
                className={cn(iconClass, "-mr-0.5")}
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.05} />
              </motion.button>
            </div>
          </div>

          {/* Desktop */}
          <div className="relative hidden h-full w-full flex-1 items-center md:flex">
            <div className="absolute left-0 top-1/2 z-20 -translate-y-1/2">
              <Link href="/" aria-label={`${SITE_NAME} home`}>
                <motion.div
                  whileHover={{ opacity: 0.9 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "relative transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    scrolled ? "h-14 w-[260px]" : "h-16 w-[304px]",
                  )}
                >
                  <Image
                    src={logoSrc}
                    alt={SITE_NAME}
                    fill
                    className={cn(
                      "object-contain object-left",
                      overDarkBanner && logoOnHeroClass,
                    )}
                    sizes="304px"
                    priority
                  />
                </motion.div>
              </Link>
            </div>

            <div className="pointer-events-none flex flex-1 justify-center">
              <div className="pointer-events-auto">
                <Suspense
                  fallback={
                    <div
                      className="hidden h-4 w-[280px] md:block"
                      aria-hidden
                    />
                  }
                >
                  <StoreNavLinks />
                </Suspense>
              </div>
            </div>

            <div className="absolute right-0 top-1/2 z-10 flex -translate-y-1/2 items-center gap-0.5 lg:gap-1.5">
              <motion.button
                type="button"
                {...iconMotion}
                className={iconClass}
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.05} />
              </motion.button>

              <div className="relative">
                <motion.button
                  type="button"
                  {...iconMotion}
                  className={iconClass}
                  aria-label="Account menu"
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                  aria-controls={profileOpen ? "profile-menu-panel" : undefined}
                  onClick={openProfile}
                >
                  <UserRound className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.05} />
                </motion.button>
                <ProfileMenu
                  open={profileOpen}
                  onClose={() => setProfileOpen(false)}
                />
              </div>

              <div className="relative">
                <motion.button
                  type="button"
                  {...iconMotion}
                  className={cn(iconClass, "group relative")}
                  aria-label="Wishlist"
                  aria-expanded={wishOpen}
                  onClick={openWish}
                >
                  <Heart
                    className={cn(
                      "h-[1.15rem] w-[1.15rem] transition-[fill,stroke,color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      wishCount > 0
                        ? "fill-gold/20 stroke-current"
                        : "fill-none stroke-current group-hover:fill-gold/15 group-hover:stroke-gold",
                    )}
                    strokeWidth={1.05}
                  />
                  {wishCount > 0 ? (
                    <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-gold/45 ring-2 ring-ivory/90" />
                  ) : null}
                </motion.button>
                <WishlistPop
                  open={wishOpen}
                  onClose={() => setWishOpen(false)}
                />
              </div>

              <motion.button
                type="button"
                {...iconMotion}
                className={cn(iconClass, "relative")}
                aria-label={count > 0 ? `Open cart, ${count} item${count === 1 ? "" : "s"}` : "Open cart"}
                onClick={() => openCart()}
              >
                <ShoppingBag
                  className="h-[1.15rem] w-[1.15rem]"
                  strokeWidth={1.05}
                />
                {count > 0 ? (
                  <span className={cartCountBadgeClass} aria-hidden>
                    {count > 9 ? "9+" : count}
                  </span>
                ) : null}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onOpenCart={() => {
          setMobileOpen(false);
          openCart();
        }}
      />
    </>
  );
}
