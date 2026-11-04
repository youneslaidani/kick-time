import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import Footer from "@/components/Footer";
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

// Les icônes (onglet, écran d'accueil) sont dans app/icon.svg, app/favicon.ico et app/apple-icon.png :
// Next.js les ajoute tout seul. Elles sont fabriquées par scripts/generate-icons.mjs.
export const metadata: Metadata = {
  title: "Kick-Time",
  description: "Les résultats de foot en direct, et l'IA qui t'explique les enjeux de chaque match.",
  applicationName: "Kick-Time",
  // Sur iPhone, « Ajouter à l'écran d'accueil » ouvre l'app en plein écran, avec ce nom.
  appleWebApp: { title: "Kick-Time", capable: true, statusBarStyle: "black-translucent" },
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
        <Footer />
      </body>
    </html>
  );
}
