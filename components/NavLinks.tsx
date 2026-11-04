"use client";

// Composant « client » : il a besoin de connaître la page ouverte dans le navigateur
// pour surligner le bon onglet.
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Matchs" },
  { href: "/classements", label: "Classements" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1">
      {LINKS.map((link) => {
        const active = link.href === "/" ? pathname === "/" || pathname.startsWith("/match") : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
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
