import type { WinProbabilities } from "@/lib/probabilities";
import type { Team } from "@/lib/types";

// « 1,8 » (virgule à la française)
const decimal = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

// Barre « Qui part favori ? » : victoire de l'un, match nul, victoire de l'autre.
export default function WinProbabilityBar({ probabilities: p, home, away }: { probabilities: WinProbabilities; home: Team; away: Team }) {
  return (
    <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide">Qui part favori ?</h2>
        <p className="text-xs text-muted">Probabilités avant le match</p>
      </header>

      <div className="grid grid-cols-3 items-end gap-2">
        <Outcome value={p.home} label={home.shortName} className="text-left text-accent" />
        <Outcome value={p.draw} label="Match nul" className="text-center text-muted" />
        <Outcome value={p.away} label={away.shortName} className="text-right text-away" />
      </div>

      <div
        className="mt-3 flex h-3 gap-1 overflow-hidden rounded-full"
        role="img"
        aria-label={`${home.shortName} ${p.home} %, match nul ${p.draw} %, ${away.shortName} ${p.away} %`}
      >
        <span className="rounded-full bg-accent" style={{ width: `${p.home}%` }} />
        <span className="rounded-full bg-muted/50" style={{ width: `${p.draw}%` }} />
        <span className="rounded-full bg-away" style={{ width: `${p.away}%` }} />
      </div>

      {/* Transparence : on explique la méthode en 3 phrases, sur demande */}
      <details className="group mt-4 text-sm">
        <summary className="cursor-pointer list-none font-semibold text-text/80 hover:text-text">
          <span className="mr-1 inline-block transition-transform group-open:rotate-90">›</span> Comment c&apos;est calculé ?
        </summary>
        <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-muted">
          <li>
            On compare l&apos;attaque de chaque équipe (buts marqués par match cette saison) à la défense de l&apos;autre
            (buts encaissés par match).
          </li>
          <li>
            On en déduit les buts « attendus » dans ce match : <strong className="text-text">{decimal(p.expectedHome)}</strong> pour{" "}
            {home.shortName} et <strong className="text-text">{decimal(p.expectedAway)}</strong> pour {away.shortName}, avec un
            petit bonus pour l&apos;équipe qui joue à domicile.
          </li>
          <li>
            Une formule de probabilités, la loi de Poisson, donne les chances de chaque score (0-0, 1-0, 2-1…) : on les
            additionne pour obtenir victoire, nul ou défaite.
          </li>
        </ol>
        <p className="mt-3 text-xs text-muted">
          Calculé par le code (pas par l&apos;IA) sur {p.played.home} matchs de {home.shortName} et {p.played.away} de{" "}
          {away.shortName}. C&apos;est une estimation statistique, pas un pronostic : le foot réserve toujours des surprises !
        </p>
      </details>
    </section>
  );
}

function Outcome({ value, label, className }: { value: number; label: string; className: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="font-display text-3xl font-extrabold leading-none sm:text-4xl">{value} %</p>
      <p className="mt-1 truncate text-xs text-muted">{label}</p>
    </div>
  );
}
