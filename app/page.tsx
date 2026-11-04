import Link from "next/link";
import { Suspense } from "react";
import MatchCard from "@/components/MatchCard";
import TeamCrest from "@/components/TeamCrest";
import { competitionLabel, competitionRank } from "@/lib/competitions";
import { formatLongDate } from "@/lib/dates";
import { getMatchDay } from "@/lib/football";
import { isLive } from "@/lib/match-status";
import type { Match } from "@/lib/types";

// Les 3 onglets de date, écrits dans l'adresse : /?jour=hier
const DAYS = [
  { key: "hier", label: "Hier", offset: -1 },
  { key: "aujourdhui", label: "Aujourd'hui", offset: 0 },
  { key: "demain", label: "Demain", offset: 1 },
] as const;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default function HomePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-6">
      {/* Suspense : le squelette s'affiche tout de suite, les matchs arrivent dès qu'ils sont chargés. */}
      <Suspense fallback={<MatchListSkeleton />}>
        <MatchesView searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function MatchesView({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const day = DAYS.find((d) => d.key === params.jour) ?? DAYS[1];
  const league = typeof params.ligue === "string" ? params.ligue : null;

  const { date, matches, source, sample } = await getMatchDay(day.offset);
  const leagues = groupByCompetition(matches);
  const visible = league ? leagues.filter((g) => g.code === league) : leagues;
  const liveCount = matches.filter((m) => isLive(m.status)).length;

  return (
    <>
      <section className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">{day.label}</p>
        <h1 className="font-display text-4xl font-extrabold uppercase leading-tight sm:text-5xl">
          {formatLongDate(date)}
        </h1>
        <p className="mt-1 text-muted">
          {matches.length} match{matches.length > 1 ? "s" : ""}
          {liveCount > 0 && <span className="text-live"> · {liveCount} en direct</span>}
        </p>
      </section>

      <div className="mb-4 grid grid-cols-3 gap-1 rounded-2xl border border-line bg-surface p-1">
        {DAYS.map((d) => (
          <Link
            key={d.key}
            href={buildHref(d.key, null)}
            className={`rounded-xl py-2 text-center text-sm font-bold transition-colors ${
              d.key === day.key ? "bg-accent text-accent-ink" : "text-muted hover:text-text"
            }`}
          >
            {d.label}
          </Link>
        ))}
      </div>

      {leagues.length > 1 && (
        <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1">
          <FilterChip href={buildHref(day.key, null)} active={!league} label="Tous" />
          {leagues.map((g) => (
            <FilterChip key={g.code} href={buildHref(day.key, g.code)} active={league === g.code} label={competitionLabel(g.code)} />
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

function buildHref(jour: string, ligue: string | null) {
  const params = new URLSearchParams({ jour });
  if (ligue) params.set("ligue", ligue);
  return `/?${params}`;
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        active ? "border-accent bg-accent/10 text-accent" : "border-line text-muted hover:text-text"
      }`}
    >
      {label}
    </Link>
  );
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
