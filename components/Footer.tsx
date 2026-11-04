import Link from "next/link";

// Pied de page : d'où viennent les données (transparence) + le lien vers le QR code à partager.
export default function Footer() {
  return (
    <footer className="border-t border-line/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p>
          <span className="font-display text-sm font-extrabold uppercase text-text">
            Kick<span className="text-accent">Time</span>
          </span>{" "}
          · Données : football-data.org · Analyses : Google Gemini · Photos : Wikimedia Commons
        </p>
        <Link href="/qr" className="font-semibold text-text hover:text-accent">
          📱 Partager l&apos;app (QR code)
        </Link>
      </div>
    </footer>
  );
}
