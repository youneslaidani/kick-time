import { competitionLabel } from "@/lib/competitions";
import { formatShortDate } from "@/lib/dates";
import type { HeadToHead } from "@/lib/stats";
import type { Team } from "@/lib/types";
import { Unavailable } from "./Section";

// Bilan des confrontations passées : qui a gagné le plus souvent, et les derniers résultats.
export default function HeadToHeadCard({ h2h, home, away }: { h2h: HeadToHead | null; home: Team; away: Team }) {
  if (!h2h) return <Unavailable />;
  if (h2h.played === 0) {
    // Être honnête sur les limites des données gratuites plutôt que d'affirmer « première rencontre ».
    return (
      <Unavailable>
        <span className="block font-semibold text-text">Aucune confrontation trouvée entre ces deux équipes.</span>
        <span className="mt-1 block">
          Nos données gratuites couvrent la Ligue des champions et les grands championnats depuis 2020 : les matchs de
          Ligue Europa, de Ligue Conférence et de coupes nationales n&apos;y figurent pas.
        </span>
      </Unavailable>
    );
  }

  // Largeur de chaque morceau de la barre, en pourcentage du nombre de matchs.
  const percent = (n: number) => `${(n / h2h.played) * 100}%`;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 text-center">
        <Stat value={h2h.homeWins} label={`Victoires ${home.shortName}`} className="text-accent" />
        <Stat value={h2h.draws} label="Matchs nuls" className="text-muted" />
        <Stat value={h2h.awayWins} label={`Victoires ${away.shortName}`} className="text-away" />
      </div>

      <div className="flex h-2.5 gap-1 overflow-hidden rounded-full" aria-hidden="true">
        {h2h.homeWins > 0 && <span className="rounded-full bg-accent" style={{ width: percent(h2h.homeWins) }} />}
        {h2h.draws > 0 && <span className="rounded-full bg-muted/50" style={{ width: percent(h2h.draws) }} />}
        {h2h.awayWins > 0 && <span className="rounded-full bg-away" style={{ width: percent(h2h.awayWins) }} />}
      </div>

      <ul className="flex flex-col divide-y divide-line">
        {h2h.recent.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <span className="w-24 shrink-0 text-muted">{formatShortDate(m.utcDate)}</span>
            <span className="min-w-0 flex-1 truncate text-center">
              {m.homeTeam.shortName}{" "}
              <strong className="font-display text-base tabular-nums">
                {m.score.fullTime.home}-{m.score.fullTime.away}
              </strong>{" "}
              {m.awayTeam.shortName}
            </span>
            <span className="hidden w-24 shrink-0 text-right text-xs text-muted sm:block">
              {competitionLabel(m.competition.code)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ value, label, className }: { value: number; label: string; className: string }) {
  return (
    <div>
      <p className={`font-display text-4xl font-extrabold ${className}`}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
