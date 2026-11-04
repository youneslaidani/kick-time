import { ZONES, zoneOf, type CompetitionCode, type ZoneKind } from "@/lib/competitions";
import type { StandingRow } from "@/lib/types";
import TeamCrest from "./TeamCrest";

// « 1er », « 2e », « 18e »
const ordinal = (n: number) => (n === 1 ? "1er" : `${n}e`);

const ZONE_COLOR: Record<ZoneKind, string> = {
  top: "bg-accent",
  europe: "bg-away",
  playoff: "bg-warn",
  bottom: "bg-live",
};

// Classement complet d'un championnat. Sur téléphone, on cache les colonnes G / N / P pour garder la place.
export default function StandingsTable({ code, table }: { code: CompetitionCode; table: StandingRow[] }) {
  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2/60 text-xs text-muted">
            <tr>
              <th className="w-11 py-3 pl-4 text-left font-semibold">#</th>
              <th className="py-3 text-left font-semibold">Équipe</th>
              <th className="w-9 py-3 text-center font-semibold">J</th>
              <th className="hidden w-9 py-3 text-center font-semibold sm:table-cell">G</th>
              <th className="hidden w-9 py-3 text-center font-semibold sm:table-cell">N</th>
              <th className="hidden w-9 py-3 text-center font-semibold sm:table-cell">P</th>
              <th className="w-12 py-3 text-center font-semibold">Diff</th>
              <th className="w-12 py-3 pr-4 text-right font-semibold">Pts</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row) => {
              const zone = zoneOf(code, row.position);
              return (
                <tr key={row.team.id} className="border-t border-line">
                  <td className="relative py-2.5 pl-4 font-display text-base font-bold">
                    {zone && (
                      <span className={`absolute inset-y-1.5 left-0 w-1 rounded-r ${ZONE_COLOR[zone.kind]}`} title={zone.label} />
                    )}
                    {row.position}
                  </td>
                  <td className="max-w-0 py-2.5">
                    <span className="flex items-center gap-2.5">
                      <TeamCrest src={row.team.crest} alt={row.team.name} fallback={row.team.tla} size={22} />
                      <span className="truncate font-semibold">{row.team.shortName}</span>
                    </span>
                  </td>
                  <td className="py-2.5 text-center text-muted">{row.playedGames}</td>
                  <td className="hidden py-2.5 text-center text-muted sm:table-cell">{row.won}</td>
                  <td className="hidden py-2.5 text-center text-muted sm:table-cell">{row.draw}</td>
                  <td className="hidden py-2.5 text-center text-muted sm:table-cell">{row.lost}</td>
                  <td className="py-2.5 text-center text-muted">
                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-display text-lg font-bold">{row.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Légende pour les débutants : ce que signifient les couleurs et les abréviations */}
      <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-line p-5 text-sm">
        <ul className="flex flex-col gap-2">
          {ZONES[code].map((zone) => (
            <li key={zone.label} className="flex items-center gap-3">
              <span className={`h-4 w-1 shrink-0 rounded ${ZONE_COLOR[zone.kind]}`} />
              <span>
                <span className="text-muted">
                  {zone.from === zone.to ? ordinal(zone.from) : `${ordinal(zone.from)} à ${ordinal(zone.to)}`} :
                </span>{" "}
                {zone.label}
              </span>
            </li>
          ))}
        </ul>
        <p className="border-t border-line pt-3 text-xs leading-relaxed text-muted">
          J = matchs joués · G / N / P = gagnés, nuls, perdus · Diff = buts marqués moins buts encaissés · Pts = points
          (victoire 3, nul 1, défaite 0). À égalité de points, la différence de buts départage les équipes.
        </p>
      </div>
    </>
  );
}
