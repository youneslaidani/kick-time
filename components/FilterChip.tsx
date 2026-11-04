import Link from "next/link";

// Petit bouton arrondi pour filtrer par championnat.
// prefetch={false} : on ne charge un championnat que si on clique dessus (limite de 10 appels/minute).
// live : un point rouge qui pulse quand un match de ce championnat est en cours.
export default function FilterChip({ href, active, label, live = false }: { href: string; active: boolean; label: string; live?: boolean }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        active ? "border-accent bg-accent/10 text-accent" : "border-line text-muted hover:text-text"
      }`}
    >
      {live && <span className="size-1.5 animate-pulse rounded-full bg-live" aria-label="match en cours" />}
      {label}
    </Link>
  );
}
