import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/context/providers";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  STORE_LOGO_PUBLIC_PATH,
  bustLocalPublicAsset,
} from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

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
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: `${SITE_NAME} — Luxury Women’s Fashion`,
    description: SITE_DESCRIPTION,
    url: getSiteUrl(),
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Luxury Women’s Fashion`,
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: [
      { url: STORE_LOGO_PUBLIC_PATH, type: "image/png" },
      { url: bustLocalPublicAsset(STORE_LOGO_PUBLIC_PATH), type: "image/png" },
    ],
    apple: STORE_LOGO_PUBLIC_PATH,
    shortcut: STORE_LOGO_PUBLIC_PATH,
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
