import Link from "next/link";
import Logo from "./Logo";
import NavLinks from "./NavLinks";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="Kick-Time, accueil">
          <Logo />
          {/* sur les tout petits écrans, on ne garde que le logo pour laisser la place au menu */}
          <span className="hidden font-display text-xl font-extrabold uppercase tracking-wide min-[360px]:inline sm:text-2xl">
            Kick<span className="text-accent">Time</span>
          </span>
        </Link>
        <NavLinks />
      </div>
    </header>
  );
}
