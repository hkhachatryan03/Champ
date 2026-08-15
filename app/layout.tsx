import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Champ — tech jobs in Armenia, salaries visible",
  description:
    "A job platform built only for Armenia's tech community. Every listing shows a real salary range.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
