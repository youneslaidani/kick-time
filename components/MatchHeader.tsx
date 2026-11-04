import { competitionLabel } from "@/lib/competitions";
import { formatKickoff, formatLongDate, parisDate } from "@/lib/dates";
import { isFinished, isLive, statusLabel } from "@/lib/match-status";
import type { Match, Team } from "@/lib/types";
import LiveBadge from "./LiveBadge";
import TeamCrest from "./TeamCrest";

// Grand en-tête de la fiche match : compétition, date, équipes et score.
export default function MatchHeader({ match }: { match: Match }) {
  const live = isLive(match.status);
  const showScore = live || isFinished(match.status);
  const { home, away } = match.score.fullTime;

  return (
    <section
      className={`rounded-3xl border p-5 sm:p-8 ${live ? "border-live/40 bg-live/[0.06]" : "border-line bg-surface"}`}
    >
      <p className="text-center text-xs font-bold uppercase tracking-widest text-accent">
        {competitionLabel(match.competition.code)}
        {match.matchday && ` · Journée ${match.matchday}`}
      </p>
      <p className="mt-1 text-center text-sm text-muted">
        {formatLongDate(parisDate(new Date(match.utcDate)))} · {formatKickoff(match.utcDate)}
      </p>

      <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        <TeamBlock team={match.homeTeam} venue="Domicile" />

        <div className="flex min-w-24 flex-col items-center gap-2 pt-3">
          {showScore ? (
            <span className="font-display text-5xl font-extrabold tabular-nums leading-none sm:text-6xl lg:text-7xl">
              {home ?? 0}
              <span className="mx-2 text-muted">-</span>
              {away ?? 0}
            </span>
          ) : (
            <span className="rounded-xl bg-surface-2 px-3 py-1.5 font-display text-3xl font-bold tabular-nums">
              {formatKickoff(match.utcDate)}
            </span>
          )}
          {live ? (
            <LiveBadge label={statusLabel(match.status) ?? "Live"} />
          ) : (
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              {statusLabel(match.status) ?? "À venir"}
            </span>
          )}
        </div>

        <TeamBlock team={match.awayTeam} venue="Extérieur" />
      </div>
    </section>
  );
}

function TeamBlock({ team, venue }: { team: Team; venue: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <TeamCrest src={team.crest} alt={team.name} fallback={team.tla} size={80} />
      <p className="w-full font-display text-xl font-bold uppercase leading-tight sm:text-2xl lg:text-3xl">{team.shortName}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{venue}</p>
    </div>
  );
}
