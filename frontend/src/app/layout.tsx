import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/context/providers";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  STORE_LOGO_PUBLIC_PATH,
} from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";
import { bustLogoPath, getLogoCacheRev } from "@/lib/logo-cache";

const logoIconUrl = bustLogoPath(STORE_LOGO_PUBLIC_PATH, getLogoCacheRev());

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} — Luxury Women’s Fashion`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: getSiteUrl(),
    // i18n readiness: uncomment and extend when launching additional locales.
    // languages: { "en-US": getSiteUrl(), "hi-IN": `${getSiteUrl()}/hi` },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: `${SITE_NAME} — Luxury Women’s Fashion`,
    description: SITE_DESCRIPTION,
    url: getSiteUrl(),
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Naya Story \u2014 Luxury Women\u2019s Fashion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Luxury Women’s Fashion`,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: logoIconUrl, type: "image/png" },
    ],
    apple: logoIconUrl,
    shortcut: logoIconUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${sans.variable}`}
    >
      <body className="min-h-screen bg-ivory font-sans text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
