import { Suspense } from "react";
import AutoRefresh from "@/components/AutoRefresh";
import FilterChip from "@/components/FilterChip";
import { Unavailable } from "@/components/Section";
import StandingsTable from "@/components/StandingsTable";
import { COMPETITIONS, competitionLabel, isCompetitionCode } from "@/lib/competitions";
import { getCompetitionMatches, getMatchDay, getStandings } from "@/lib/football";
import { liveStandings } from "@/lib/live-table";
import { isLive } from "@/lib/match-status";
import type { Match } from "@/lib/types";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// Page /classements?ligue=PL — Ligue 1 par défaut.
export default function StandingsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 lg:px-8">
      <section className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">Classements</p>
        <h1 className="font-display text-4xl font-extrabold uppercase leading-tight sm:text-5xl">Qui est en tête ?</h1>
      </section>
      <Suspense fallback={<TableSkeleton />}>
        <StandingsView searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function StandingsView({ searchParams }: { searchParams: SearchParams }) {
  const { ligue } = await searchParams;
  const code = isCompetitionCode(ligue) ? ligue : "FL1";
  const [table, today] = await Promise.all([getStandings(code), getMatchDay(0)]);

  // Les matchs du jour (avec le direct) ; jamais les matchs d'exemple du mode secours, qui fausseraient le classement.
  const todaysMatches = today.source === "api" ? today.matches : [];
  const liveCompetitions = new Set(todaysMatches.filter((m) => isLive(m.status)).map((m) => m.competition.code));

  // Classement en direct : seulement quand un match de cette compétition est en cours (1 appel de plus).
  // On reprend tous les matchs de la saison, en remplaçant ceux du jour par leur version « direct ».
  let season: Match[] = [];
  if (table && liveCompetitions.has(code)) {
    const todayById = new Map(todaysMatches.map((m) => [m.id, m]));
    season = ((await getCompetitionMatches(code)) ?? []).map((m) => todayById.get(m.id) ?? m);
  }
  const { rows, live } = liveStandings(table ?? [], season);

  return (
    <>
      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:flex-wrap">
        {COMPETITIONS.map((c) => (
          <FilterChip
            key={c.code}
            href={`/classements?ligue=${c.code}`}
            active={c.code === code}
            label={c.label}
            live={liveCompetitions.has(c.code)}
          />
        ))}
      </div>

      {live && (
        <>
          {/* Pendant les matchs, le classement se recalcule tout seul toutes les 30 secondes */}
          <AutoRefresh seconds={30} />
          <p className="mb-4 flex items-start gap-3 rounded-2xl border border-live/40 bg-live/10 px-4 py-3 text-sm">
            <span className="relative mt-1 flex size-2.5 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-live" />
            </span>
            <span>
              <strong className="text-live">Classement en direct :</strong> il bouge à chaque but, comme si les matchs
              s&apos;arrêtaient maintenant. Les points en rouge sont provisoires jusqu&apos;au coup de sifflet final.
            </span>
          </p>
        </>
      )}

      {rows.length > 0 ? (
        <StandingsTable code={code} table={rows} />
      ) : (
        <Unavailable>Le classement de {competitionLabel(code)} est momentanément indisponible.</Unavailable>
      )}
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-9 rounded-full bg-surface" />
      <div className="h-[32rem] rounded-3xl bg-surface" />
    </div>
  );
}
