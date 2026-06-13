import type { Metadata } from "next";
import { Cinzel, EB_Garamond } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const display = Cinzel({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nightreign Field Grimoire",
  description: "A quick-reference companion for Elden Ring Nightreign.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh">
        <div className="mx-auto flex min-h-dvh w-full max-w-[1400px] flex-col md:flex-row">
          <Sidebar />
          <main className="flex-1 px-5 py-8 sm:px-8 md:px-12 md:py-12">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
