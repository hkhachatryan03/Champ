import SiteFooter from "@/components/SiteFooter";
import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { headers } from "next/headers";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, getSiteUrl } from "@/lib/seo";

// Site-wide defaults. Every page overrides title + description with its own
// (see lib/seo.ts → pageMetadata); these are the fallback and they set the
// rules everything else builds on:
//  - metadataBase: link previews need ABSOLUTE urls, so relative ones in each
//    page's metadata are resolved against the real site address.
//  - title.template: a page that says "Inbox" becomes "Inbox | Champ".
//  - the share image itself comes from app/opengraph-image.png and
//    app/twitter-image.png, which Next attaches to every page automatically.
export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The BackOffice (/admin) has its own header/nav — the public-facing
  // NavBar (candidate/company tabs, "Contact us", etc.) doesn't belong there.
  // The middleware tags admin requests so we can tell here.
  const hdrs = await headers();
  const isAdminArea = hdrs.get("x-admin-area") === "1";

  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink">
        {!isAdminArea && <NavBar />}
        {children}
        {!isAdminArea && <SiteFooter />}
      </body>
    </html>
  );
}
