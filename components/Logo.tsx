// Le logo de Kick-Time : un ballon stylisé dans un cadran (le foot + le temps réel).
// Le même dessin sert à l'en-tête, au centre du QR code et aux icônes (scripts/generate-icons.mjs).
export default function Logo({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="15" className="fill-accent" />
      <circle cx="16" cy="16" r="9.5" fill="none" strokeWidth="2.5" className="stroke-accent-ink" />
      <path d="M16 9.5V16l4.5 3" fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-accent-ink" />
    </svg>
  );
}
