import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

// Barlow Condensed : police étroite et grasse, typique des visuels sportifs (titres, scores).
const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

// Inter : police très lisible pour le texte courant.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kick-Time",
  description: "Les résultats de foot en direct, et l'IA qui t'explique les enjeux de chaque match.",
};

export const viewport: Viewport = {
  themeColor: "#070b09",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${barlow.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Header />
        {children}
      </body>
    </html>
  );
}
