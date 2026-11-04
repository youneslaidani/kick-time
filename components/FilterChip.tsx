import Link from "next/link";

// Petit bouton arrondi pour filtrer par championnat.
// prefetch={false} : on ne charge un championnat que si on clique dessus (limite de 10 appels/minute).
export default function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        active ? "border-accent bg-accent/10 text-accent" : "border-line text-muted hover:text-text"
      }`}
    >
      {label}
    </Link>
  );
}
