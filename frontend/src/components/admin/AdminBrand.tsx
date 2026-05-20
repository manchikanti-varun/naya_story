import Image from "next/image";
import Link from "next/link";
import { SITE_NAME, STORE_LOGO_PUBLIC_PATH, bustLocalPublicAsset } from "@/lib/constants";
import { cn } from "@/lib/cn";

type Props = {
  href?: string;
  showSubtitle?: boolean;
  align?: "left" | "center";
  className?: string;
  logoClassName?: string;
};

export function AdminBrand({
  href = "/admin",
  showSubtitle = true,
  align = "center",
  className,
  logoClassName,
}: Props) {
  const logoSrc = bustLocalPublicAsset(STORE_LOGO_PUBLIC_PATH);
  const centered = align === "center";

  return (
    <Link
      href={href}
      className={cn("block min-w-0", centered && "mx-auto text-center", className)}
      aria-label={`${SITE_NAME} admin`}
    >
      <div
        className={cn(
          "relative h-10 w-[140px] sm:h-11 sm:w-[156px]",
          centered && "mx-auto",
          logoClassName,
        )}
      >
        <Image
          src={logoSrc}
          alt={SITE_NAME}
          fill
          className={cn("object-contain", centered ? "object-center" : "object-left")}
          sizes="156px"
          priority
        />
      </div>
      {showSubtitle ? (
        <p
          className={cn(
            "mt-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--admin-faint)]",
            centered && "text-center",
          )}
        >
          Commerce · {SITE_NAME}
        </p>
      ) : null}
    </Link>
  );
}
