import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Champ — tech jobs in Armenia, salaries visible",
  description:
    "A job platform built only for Armenia's tech community. Every listing shows a real salary range.",
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
      </body>
    </html>
  );
}
