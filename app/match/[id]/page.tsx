import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import FormRow from "@/components/FormRow";
import HeadToHeadCard from "@/components/HeadToHeadCard";
import MatchHeader from "@/components/MatchHeader";
import Section, { Unavailable } from "@/components/Section";
import StandingsCompare from "@/components/StandingsCompare";
import { getHeadToHead, getMatch, getStandings, getTeamSeason } from "@/lib/football";
import { headToHead, recentForm, venueRecord } from "@/lib/stats";
import type { Match, StandingRow } from "@/lib/types";

type Params = Promise<{ id: string }>;
type Loading<T> = Promise<T | null>; // une donnée en cours de chargement (null = indisponible)

// Fiche match : /match/575393
export default function MatchPage({ params }: { params: Params }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-4">
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-text">
        <span aria-hidden="true">←</span> Tous les matchs
      </Link>
      <Suspense fallback={<MatchSkeleton />}>
        <MatchView params={params} />
      </Suspense>
    </main>
  );
}

async function MatchView({ params }: { params: Params }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const match = await getMatch(id);
  if (!match) notFound();

  // On lance les 4 chargements tout de suite, SANS les attendre ici :
  // chaque bloc s'affiche dès que ses propres données arrivent (s'il faut patienter
  // à cause de la limite d'appels, seul ce bloc reste en chargement).
  const homeSeason = getTeamSeason(match.homeTeam.id);
  const awaySeason = getTeamSeason(match.awayTeam.id);
  const pastMeetings = getHeadToHead(match.id);
  const table = getStandings(match.competition.code);

  return (
    <div className="flex flex-col gap-4">
      <MatchHeader match={match} />

      <AnalysisTeaser />

      <Section title="Forme du moment" hint="5 derniers matchs, du plus ancien au plus récent →">
        <Suspense fallback={<BlockSkeleton />}>
          <FormBlock match={match} homeSeason={homeSeason} awaySeason={awaySeason} />
        </Suspense>
      </Section>

      <Section title="Face-à-face" hint="Ligue des champions et grands championnats, depuis 2020">
        <Suspense fallback={<BlockSkeleton />}>
          <HeadToHeadBlock match={match} pastMeetings={pastMeetings} />
        </Suspense>
      </Section>

      <Section title="Au classement" hint="Pts = points : victoire 3, nul 1, défaite 0">
        <Suspense fallback={<BlockSkeleton />}>
          <StandingsBlock match={match} table={table} homeSeason={homeSeason} awaySeason={awaySeason} />
        </Suspense>
      </Section>
    </div>
  );
}

async function FormBlock({ match, homeSeason, awaySeason }: { match: Match; homeSeason: Loading<Match[]>; awaySeason: Loading<Match[]> }) {
  const [home, away] = await Promise.all([homeSeason, awaySeason]);
  if (!home || !away) return <Unavailable />;

  // On ne regarde que ce qui s'est passé AVANT ce match, même s'il est déjà joué.
  return (
    <div className="flex flex-col gap-5">
      <FormRow team={match.homeTeam} entries={recentForm(home, match.homeTeam.id, match.utcDate)} />
      <FormRow team={match.awayTeam} entries={recentForm(away, match.awayTeam.id, match.utcDate)} />
      <p className="text-xs text-muted">V = victoire · N = match nul · D = défaite. Sous chaque pastille : l&apos;adversaire.</p>
    </div>
  );
}

async function HeadToHeadBlock({ match, pastMeetings }: { match: Match; pastMeetings: Loading<Match[]> }) {
  const meetings = await pastMeetings;
  return <HeadToHeadCard h2h={meetings && headToHead(meetings, match)} home={match.homeTeam} away={match.awayTeam} />;
}

async function StandingsBlock({
  match,
  table,
  homeSeason,
  awaySeason,
}: {
  match: Match;
  table: Loading<StandingRow[]>;
  homeSeason: Loading<Match[]>;
  awaySeason: Loading<Match[]>;
}) {
  const [rows, home, away] = await Promise.all([table, homeSeason, awaySeason]);
  return (
    <StandingsCompare
      table={rows}
      home={match.homeTeam}
      away={match.awayTeam}
      homeRecord={home && venueRecord(home, match.homeTeam.id, "home", match.utcDate)}
      awayRecord={away && venueRecord(away, match.awayTeam.id, "away", match.utcDate)}
    />
  );
}

// Emplacement de l'analyse IA (branchée au jour 4).
function AnalysisTeaser() {
  return (
    <section className="rounded-3xl border border-accent/40 bg-linear-to-br from-accent/15 via-surface to-surface p-5 sm:p-6">
      <p className="text-sm font-bold uppercase tracking-widest text-accent">✦ Analyse IA</p>
      <p className="mt-2 font-display text-2xl font-bold uppercase leading-tight">Les enjeux du match, expliqués simplement</p>
      <p className="mt-1 text-sm text-muted">
        Bientôt ici : l&apos;enjeu en une phrase, la forme des équipes, le face-à-face et le niveau de suspense.
      </p>
    </section>
  );
}

function BlockSkeleton() {
  return <div className="h-28 animate-pulse rounded-2xl bg-surface-2" />;
}

function MatchSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="h-64 rounded-3xl bg-surface" />
      <div className="h-32 rounded-3xl bg-surface" />
      <div className="h-48 rounded-3xl bg-surface" />
    </div>
  );
}
