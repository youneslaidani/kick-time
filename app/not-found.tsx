import Link from "next/link";

// Page affichée quand une adresse n'existe pas (ou pas encore).
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-display text-7xl font-extrabold text-accent">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold uppercase">Hors-jeu !</h1>
      <p className="mt-2 text-muted">Cette page n&apos;existe pas.</p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-accent px-5 py-2.5 font-bold text-accent-ink transition-opacity hover:opacity-90"
      >
        Retour aux matchs
      </Link>
    </main>
  );
}
