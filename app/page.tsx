import Link from "next/link";
import { Suspense } from "react";
import FilterChip from "@/components/FilterChip";
import MatchCard from "@/components/MatchCard";
import TeamCrest from "@/components/TeamCrest";
import { competitionLabel, competitionRank } from "@/lib/competitions";
import { formatDayNumber, formatLongDate, formatWeekdayShort, shiftDate } from "@/lib/dates";
import { DAYS_AROUND, getMatchDay } from "@/lib/football";
import { isLive } from "@/lib/match-status";
import type { Match } from "@/lib/types";

// Les 7 jours proposés, de J-3 à J+3. Le jour choisi est écrit dans l'adresse :
// /?jour=-1 pour hier, /?jour=2 pour après-demain…
const OFFSETS = Array.from({ length: DAYS_AROUND * 2 + 1 }, (_, i) => i - DAYS_AROUND);

function relativeLabel(offset: number): string {
  if (offset === 0) return "Aujourd'hui";
  if (offset === -1) return "Hier";
  if (offset === 1) return "Demain";
  return offset < 0 ? `Il y a ${-offset} jours` : `Dans ${offset} jours`;
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default function HomePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-6">
      {/* L'accroche pour ceux qui ne suivent pas le foot : c'est la première chose qu'ils voient */}
      <Link
        href="/mon-equipe"
        prefetch={false}
        className="mb-6 flex items-center gap-4 rounded-3xl border border-accent/40 bg-linear-to-r from-accent/15 to-surface px-5 py-4 transition-colors hover:border-accent"
      >
        <span className="text-3xl" aria-hidden="true">
          ✨
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold uppercase tracking-widest text-accent">Pas fan de foot ?</span>
          <span className="block font-display text-xl font-extrabold uppercase leading-tight sm:text-2xl">
            Trouve ton équipe en 20 secondes
          </span>
        </span>
        <span className="text-2xl text-accent" aria-hidden="true">
          →
        </span>
      </Link>

      {/* Suspense : le squelette s'affiche tout de suite, les matchs arrivent dès qu'ils sont chargés. */}
      <Suspense fallback={<MatchListSkeleton />}>
        <MatchesView searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function MatchesView({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requested = Number(params.jour);
  const offset = OFFSETS.includes(requested) ? requested : 0; // valeur absente ou bizarre → aujourd'hui
  const league = typeof params.ligue === "string" ? params.ligue : null;

  const { date, matches, source, sample } = await getMatchDay(offset);
  const today = shiftDate(date, -offset); // le jour de référence (le vrai aujourd'hui, ou celui de l'instantané démo)
  const leagues = groupByCompetition(matches);
  const visible = league ? leagues.filter((g) => g.code === league) : leagues;
  const liveCount = matches.filter((m) => isLive(m.status)).length;

  return (
    <>
      <section className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">{relativeLabel(offset)}</p>
        <h1 className="font-display text-4xl font-extrabold uppercase leading-tight sm:text-5xl">
          {formatLongDate(date)}
        </h1>
        <p className="mt-1 text-muted">
          {matches.length} match{matches.length > 1 ? "s" : ""}
          {liveCount > 0 && <span className="text-live"> · {liveCount} en direct</span>}
        </p>
      </section>

      <nav aria-label="Choisir un jour" className="mb-4 grid grid-cols-7 gap-1 rounded-2xl border border-line bg-surface p-1">
        {OFFSETS.map((o) => {
          const day = shiftDate(today, o);
          return (
            <Link
              key={o}
              href={buildHref(o, null)}
              aria-current={o === offset ? "date" : undefined}
              className={`flex flex-col items-center rounded-xl py-1.5 transition-colors ${
                o === offset ? "bg-accent text-accent-ink" : "text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              <span className="text-[11px] font-semibold uppercase">{o === 0 ? "Auj." : formatWeekdayShort(day)}</span>
              <span className="font-display text-xl font-bold leading-tight">{formatDayNumber(day)}</span>
            </Link>
          );
        })}
      </nav>

      {leagues.length > 1 && (
        <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:flex-wrap">
          <FilterChip href={buildHref(offset, null)} active={!league} label="Tous" />
          {leagues.map((g) => (
            <FilterChip key={g.code} href={buildHref(offset, g.code)} active={league === g.code} label={competitionLabel(g.code)} />
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-8">
          {visible.map((group) => (
            <section key={group.code}>
              <h2 className="mb-3 flex items-center gap-2.5">
                <TeamCrest src={group.emblem} alt="" fallback={group.code} size={24} />
                <span className="font-display text-xl font-bold uppercase tracking-wide">
                  {competitionLabel(group.code)}
                </span>
                <span className="text-sm text-muted">{group.matches.length}</span>
              </h2>
              <div className="flex flex-col gap-2">
                {group.matches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <SourceNote source={source} sample={sample} />
    </>
  );
}

// Regroupe les matchs par championnat, dans l'ordre défini dans lib/competitions.ts,
// et trie chaque groupe : matchs en direct d'abord, puis par heure de coup d'envoi.
function groupByCompetition(matches: Match[]) {
  const groups = new Map<string, { code: string; emblem: string; matches: Match[] }>();
  for (const match of matches) {
    const code = match.competition.code;
    if (!groups.has(code)) groups.set(code, { code, emblem: match.competition.emblem, matches: [] });
    groups.get(code)!.matches.push(match);
  }
  for (const group of groups.values()) {
    group.matches.sort(
      (a, b) => Number(isLive(b.status)) - Number(isLive(a.status)) || a.utcDate.localeCompare(b.utcDate),
    );
  }
  return [...groups.values()].sort((a, b) => competitionRank(a.code) - competitionRank(b.code));
}

function buildHref(offset: number, ligue: string | null) {
  const params = new URLSearchParams({ jour: String(offset) });
  if (ligue) params.set("ligue", ligue);
  return `/?${params}`;
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      <p className="font-display text-2xl font-bold uppercase">Pas de match ce jour-là</p>
      <p className="mt-1 text-muted">Aucun des championnats suivis ne joue. Regarde les autres jours !</p>
    </div>
  );
}

// Transparence : on dit toujours d'où viennent les données affichées.
function SourceNote({ source, sample }: { source: "api" | "demo"; sample: boolean }) {
  let text = "Données football-data.org · rafraîchies chaque minute";
  if (source === "demo") text = sample ? "Données d'exemple (aucune clé API configurée)" : "Mode démo : données enregistrées";

  return (
    <p className="mt-10 flex items-center justify-center gap-2 text-center text-xs text-muted">
      <span className={`size-1.5 rounded-full ${source === "api" ? "bg-accent" : "bg-amber-400"}`} />
      {text}
    </p>
  );
}

function MatchListSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 h-4 w-24 rounded bg-surface-2" />
      <div className="mb-6 h-10 w-64 rounded bg-surface-2" />
      <div className="mb-6 h-11 rounded-2xl bg-surface" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-surface" />
        ))}
      </div>
    </div>
  );
}
