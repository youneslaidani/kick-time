import { Suspense } from "react";
import FilterChip from "@/components/FilterChip";
import { Unavailable } from "@/components/Section";
import StandingsTable from "@/components/StandingsTable";
import { COMPETITIONS, competitionLabel, isCompetitionCode } from "@/lib/competitions";
import { getStandings } from "@/lib/football";

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
  const table = await getStandings(code);

  return (
    <>
      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:flex-wrap">
        {COMPETITIONS.map((c) => (
          <FilterChip key={c.code} href={`/classements?ligue=${c.code}`} active={c.code === code} label={c.label} />
        ))}
      </div>

      {table && table.length > 0 ? (
        <StandingsTable code={code} table={table} />
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
