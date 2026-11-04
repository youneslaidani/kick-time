import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AnalysisCard, { AnalysisSkeleton } from "@/components/AnalysisCard";
import FormRow from "@/components/FormRow";
import HeadToHeadCard from "@/components/HeadToHeadCard";
import MatchHeader from "@/components/MatchHeader";
import Section, { Unavailable } from "@/components/Section";
import StandingsCompare from "@/components/StandingsCompare";
import WinProbabilityBar from "@/components/WinProbabilityBar";
import { getAnalysis } from "@/lib/ai";
import { buildFacts } from "@/lib/analysis";
import { getHeadToHead, getMatch, getStandings, getTeamSeason } from "@/lib/football";
import { probabilitiesFor } from "@/lib/probabilities";
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

      <Suspense fallback={<div className="h-36 animate-pulse rounded-3xl bg-surface" />}>
        <ProbabilityBlock match={match} homeSeason={homeSeason} awaySeason={awaySeason} />
      </Suspense>

      <Suspense fallback={<AnalysisSkeleton />}>
        <AnalysisBlock match={match} homeSeason={homeSeason} awaySeason={awaySeason} pastMeetings={pastMeetings} table={table} />
      </Suspense>

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

// Probabilités calculées par le code (modèle de Poisson) : rien ne s'affiche si une équipe a trop peu joué.
async function ProbabilityBlock({ match, homeSeason, awaySeason }: { match: Match; homeSeason: Loading<Match[]>; awaySeason: Loading<Match[]> }) {
  const [home, away] = await Promise.all([homeSeason, awaySeason]);
  const probabilities = probabilitiesFor(match, home, away);
  if (!probabilities) return null;
  return <WinProbabilityBar probabilities={probabilities} home={match.homeTeam} away={match.awayTeam} />;
}

// L'analyse IA attend les mêmes données que les blocs du dessous, puis les fait expliquer par Gemini.
async function AnalysisBlock({
  match,
  homeSeason,
  awaySeason,
  pastMeetings,
  table,
}: {
  match: Match;
  homeSeason: Loading<Match[]>;
  awaySeason: Loading<Match[]>;
  pastMeetings: Loading<Match[]>;
  table: Loading<StandingRow[]>;
}) {
  const [home, away, meetings, rows] = await Promise.all([homeSeason, awaySeason, pastMeetings, table]);
  // Sans aucun chiffre (mode démo, API en panne), l'IA n'aurait rien de vrai à raconter : on n'affiche rien.
  if (!home && !away && !rows) return null;

  const probabilities = probabilitiesFor(match, home, away);
  const facts = buildFacts(match, { homeSeason: home, awaySeason: away, meetings, table: rows, probabilities });
  const analysis = await getAnalysis(facts);
  const played = match.status !== "SCHEDULED" && match.status !== "TIMED";
  return <AnalysisCard analysis={analysis} home={match.homeTeam} away={match.awayTeam} played={played} />;
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
