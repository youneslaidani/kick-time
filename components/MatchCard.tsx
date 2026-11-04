import { formatKickoff } from "@/lib/dates";
import { isFinished, isLive, statusLabel } from "@/lib/match-status";
import type { Match, Team } from "@/lib/types";
import LiveBadge from "./LiveBadge";
import TeamCrest from "./TeamCrest";

// Une ligne de match : équipe à domicile | score ou heure | équipe à l'extérieur.
export default function MatchCard({ match }: { match: Match }) {
  const live = isLive(match.status);
  const finished = isFinished(match.status);
  const showScore = live || finished;
  const { home, away } = match.score.fullTime;
  const winner = match.score.winner;

  return (
    <article
      className={`grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border px-3 py-3.5 transition-colors sm:px-5 ${
        live ? "border-live/40 bg-live/[0.06]" : "border-line bg-surface hover:border-accent/40"
      }`}
    >
      <TeamSide team={match.homeTeam} side="home" dimmed={winner === "AWAY_TEAM"} />

      <div className="flex min-w-20 flex-col items-center gap-1">
        {showScore ? (
          <span
            className={`font-display text-3xl font-extrabold tabular-nums leading-none ${
              live ? "text-text" : "text-text/90"
            }`}
          >
            {home ?? 0}
            <span className="mx-1.5 text-muted">-</span>
            {away ?? 0}
          </span>
        ) : (
          <span className="rounded-lg bg-surface-2 px-2.5 py-1 font-display text-xl font-bold tabular-nums leading-none">
            {formatKickoff(match.utcDate)}
          </span>
        )}
        {live ? (
          <LiveBadge label={statusLabel(match.status) ?? "Live"} />
        ) : (
          statusLabel(match.status) && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {statusLabel(match.status)}
            </span>
          )
        )}
      </div>

      <TeamSide team={match.awayTeam} side="away" dimmed={winner === "HOME_TEAM"} />
    </article>
  );
}

// Sur téléphone : logo au-dessus du nom (sinon les noms sont coupés). Sur grand écran : côte à côte.
function TeamSide({ team, side, dimmed }: { team: Team; side: "home" | "away"; dimmed: boolean }) {
  return (
    <div
      className={`flex min-w-0 flex-col items-center gap-1.5 text-center sm:gap-2.5 ${
        side === "home" ? "sm:flex-row-reverse sm:text-right" : "sm:flex-row sm:text-left"
      }`}
    >
      <TeamCrest src={team.crest} alt={team.name} fallback={team.tla} />
      <span className={`w-full truncate text-sm font-semibold sm:w-auto sm:text-base ${dimmed ? "text-muted" : "text-text"}`}>
        {team.shortName}
      </span>
    </div>
  );
}
