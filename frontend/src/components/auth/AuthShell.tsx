import Link from "next/link";
import type { ReactNode } from "react";
import { NayaLoader } from "@/components/ui/NayaLoader";
import { STORE_LOGO_PUBLIC_PATH, SITE_NAME } from "@/lib/constants";

type Props = {
  kicker: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  oauthLoading?: boolean;
};

export function AuthShell({ kicker, title, subtitle, children, footer, oauthLoading }: Props) {
  if (oauthLoading) {
    return (
      <div className="mx-auto flex min-h-[75vh] max-w-md flex-col items-center justify-center px-6 py-24">
        <div className="w-full rounded-[32px] border border-ivory-deep bg-white/80 p-10 text-center shadow-[0_24px_80px_-40px_rgba(44,40,36,0.35)] backdrop-blur-sm">
          <NayaLoader
            label="Completing sign-in"
            sublabel="Securing your session with Google"
            size="lg"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-6 py-16 md:py-24">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={STORE_LOGO_PUBLIC_PATH}
            alt={SITE_NAME}
            className="mx-auto h-9 w-auto object-contain"
          />
        </Link>
      </div>

      <div className="rounded-[32px] border border-ivory-deep bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(44,40,36,0.35)] backdrop-blur-sm md:p-10">
        <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold">{kicker}</p>
        <h1 className="mt-3 font-display text-3xl text-ink md:text-4xl">{title}</h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>

      <div className="mt-8">{footer}</div>
    </div>
  );
}
