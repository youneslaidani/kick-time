import Link from "next/link";
import NavLinks from "./NavLinks";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="Kick-Time, accueil">
          <Logo />
          <span className="font-display text-2xl font-extrabold uppercase tracking-wide">
            Kick<span className="text-accent">Time</span>
          </span>
        </Link>
        <NavLinks />
      </div>
    </header>
  );
}

// Un ballon stylisé dans un cadran : le foot + le temps réel.
function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
      <circle cx="16" cy="16" r="15" className="fill-accent" />
      <circle cx="16" cy="16" r="9.5" fill="none" strokeWidth="2.5" className="stroke-accent-ink" />
      <path d="M16 9.5V16l4.5 3" fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-accent-ink" />
    </svg>
  );
}
