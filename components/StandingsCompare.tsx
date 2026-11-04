import type { VenueRecord } from "@/lib/stats";
import type { StandingRow, Team } from "@/lib/types";
import { Unavailable } from "./Section";
import TeamCrest from "./TeamCrest";

type Props = {
  table: StandingRow[] | null;
  home: Team;
  away: Team;
  homeRecord: VenueRecord | null; // bilan de l'équipe qui reçoit, à domicile
  awayRecord: VenueRecord | null; // bilan de l'équipe qui se déplace, à l'extérieur
};

// Les deux équipes côte à côte dans le classement, plus leur bilan selon le lieu du match.
export default function StandingsCompare({ table, home, away, homeRecord, awayRecord }: Props) {
  const homeRow = table?.find((r) => r.team.id === home.id);
  const awayRow = table?.find((r) => r.team.id === away.id);
  if (!table || !homeRow || !awayRow) return <Unavailable />;

  const rows = [homeRow, awayRow].sort((a, b) => a.position - b.position);
  const gap = Math.abs(homeRow.points - awayRow.points);
  const leader = homeRow.points > awayRow.points ? home : away;

  return (
    <div className="flex flex-col gap-5">
      <table className="w-full text-sm">
        <thead className="text-xs text-muted">
          <tr>
            <th className="w-10 pb-2 text-left font-semibold">Pos.</th>
            <th className="pb-2 text-left font-semibold">Équipe</th>
            <th className="w-10 pb-2 text-center font-semibold" title="Matchs joués">J</th>
            <th className="w-12 pb-2 text-center font-semibold" title="Buts marqués moins buts encaissés">Diff</th>
            <th className="w-12 pb-2 text-right font-semibold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.team.id} className="border-t border-line">
              <td className="py-2.5 font-display text-lg font-bold">{r.position}</td>
              <td className="py-2.5">
                <span className="flex items-center gap-2">
                  <TeamCrest src={r.team.crest} alt={r.team.name} fallback={r.team.tla} size={22} />
                  <span className="truncate font-semibold">{r.team.shortName}</span>
                </span>
              </td>
              <td className="py-2.5 text-center text-muted">{r.playedGames}</td>
              <td className="py-2.5 text-center text-muted">{r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}</td>
              <td className="py-2.5 text-right font-display text-lg font-bold">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="rounded-2xl bg-surface-2 px-4 py-3 text-center text-sm">
        {gap === 0 ? (
          <>Les deux équipes ont <strong>le même nombre de points</strong> sur {table.length} équipes.</>
        ) : (
          <>
            <strong>{leader.shortName}</strong> a <strong>{gap} point{gap > 1 ? "s" : ""}</strong> d&apos;avance, sur{" "}
            {table.length} équipes au classement.
          </>
        )}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <VenueLine team={home} venue="à domicile" record={homeRecord} />
        <VenueLine team={away} venue="à l'extérieur" record={awayRecord} />
      </div>
    </div>
  );
}

function VenueLine({ team, venue, record }: { team: Team; venue: string; record: VenueRecord | null }) {
  if (!record || record.played === 0) return null;
  return (
    <div className="rounded-2xl border border-line px-4 py-3 text-sm">
      <p className="text-xs text-muted">
        {team.shortName} {venue} cette saison
      </p>
      <p className="mt-1 font-semibold">
        {record.won} V · {record.drawn} N · {record.lost} D
        <span className="font-normal text-muted">
          {" "}
          ({record.goalsFor} buts marqués, {record.goalsAgainst} encaissés)
        </span>
      </p>
    </div>
  );
}
