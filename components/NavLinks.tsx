"use client";

// Composant « client » : il a besoin de connaître la page ouverte dans le navigateur
// pour surligner le bon onglet.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const LINKS = [
  { href: "/", label: "Matchs" },
  { href: "/classements", label: "Classements" },
];

// L'adresse de la page n'est connue qu'au moment de la visite : on affiche d'abord les liens
// sans surlignage (Suspense), pour ne pas bloquer l'affichage du reste de la page.
export default function NavLinks() {
  return (
    <Suspense fallback={<Links pathname={null} />}>
      <ActiveLinks />
    </Suspense>
  );
}

function ActiveLinks() {
  return <Links pathname={usePathname()} />;
}

function Links({ pathname }: { pathname: string | null }) {
  return (
    <nav className="flex gap-1">
      {LINKS.map((link) => {
        const active =
          pathname !== null &&
          (link.href === "/" ? pathname === "/" || pathname.startsWith("/match") : pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-2.5 py-1.5 text-sm font-semibold transition-colors sm:px-3 ${
              active ? "bg-surface-2 text-text" : "text-muted hover:text-text"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
