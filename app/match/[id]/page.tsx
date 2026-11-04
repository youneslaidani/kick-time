import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AnalysisCard, { AnalysisSkeleton } from "@/components/AnalysisCard";
import FormRow from "@/components/FormRow";
import HeadToHeadCard from "@/components/HeadToHeadCard";
import MatchHeader from "@/components/MatchHeader";
import MatchStory from "@/components/MatchStory";
import PlayerToWatch from "@/components/PlayerToWatch";
import Section, { Unavailable } from "@/components/Section";
import StandingsCompare from "@/components/StandingsCompare";
import WinProbabilityBar from "@/components/WinProbabilityBar";
import { getAnalysis } from "@/lib/ai";
import { buildFacts, SUSPENSE_LABELS, type Analysis } from "@/lib/analysis";
import { competitionLabel } from "@/lib/competitions";
import { formatSpokenKickoff } from "@/lib/dates";
import { getHeadToHead, getMatch, getScorers, getStandings, getTeamSeason } from "@/lib/football";
import { getPlayerPhoto, type PlayerPhoto } from "@/lib/player-photo";
import { playerToWatch } from "@/lib/players";
import { probabilitiesFor } from "@/lib/probabilities";
import { headToHead, recentForm, venueRecord } from "@/lib/stats";
import type { StoryData } from "@/lib/story";
import type { Match, Scorer, StandingRow } from "@/lib/types";

type Params = Promise<{ id: string }>;
type Loading<T> = Promise<T | null>; // une donnée en cours de chargement (null = indisponible)

// Fiche match : /match/575393
export default function MatchPage({ params }: { params: Params }) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-4 lg:px-8">
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
  // L'analyse IA et le joueur servent à deux endroits (leur bloc + le résumé animé) : on ne les prépare qu'une fois.
  const analysis = loadAnalysis(match, homeSeason, awaySeason, pastMeetings, table);
  const featured = loadFeaturedPlayer(match);

  return (
    <div className="flex flex-col gap-4">
      <MatchHeader match={match} />

      <Suspense fallback={<StoryPlaceholder />}>
        <StoryBlock match={match} analysis={analysis} featured={featured} homeSeason={homeSeason} awaySeason={awaySeason} />
      </Suspense>

      {/* Sur grand écran (ordinateur, vidéoprojecteur) : 2 colonnes pour utiliser toute la largeur.
          Sur téléphone : une seule colonne, dans le même ordre. */}
      <div className="grid items-start gap-4 lg:grid-cols-5 lg:gap-6">
        <div className="flex flex-col gap-4 lg:col-span-3 lg:gap-6">
          <Suspense fallback={<div className="h-36 animate-pulse rounded-3xl bg-surface" />}>
            <ProbabilityBlock match={match} homeSeason={homeSeason} awaySeason={awaySeason} />
          </Suspense>

          <Suspense fallback={<AnalysisSkeleton />}>
            <AnalysisBlock match={match} analysis={analysis} />
          </Suspense>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2 lg:gap-6">
          <Suspense fallback={<div className="h-56 animate-pulse rounded-3xl bg-surface" />}>
            <PlayerBlock match={match} featured={featured} />
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
      </div>
    </div>
  );
}

type Featured = { scorer: Scorer; photo: PlayerPhoto | null };

// Le meilleur buteur des deux équipes, avec sa photo Wikipédia (null si personne n'a marqué).
async function loadFeaturedPlayer(match: Match): Promise<Featured | null> {
  const scorers = await getScorers(match.competition.code);
  const scorer = scorers && playerToWatch(scorers, match);
  if (!scorer) return null;
  return { scorer, photo: await getPlayerPhoto(scorer.player.name, scorer.player.dateOfBirth) };
}

// L'analyse IA attend les mêmes données que les blocs du dessous, puis les fait expliquer par Gemini.
async function loadAnalysis(
  match: Match,
  homeSeason: Loading<Match[]>,
  awaySeason: Loading<Match[]>,
  pastMeetings: Loading<Match[]>,
  table: Loading<StandingRow[]>,
): Promise<Analysis | null> {
  const [home, away, meetings, rows] = await Promise.all([homeSeason, awaySeason, pastMeetings, table]);
  // Sans aucun chiffre (mode démo, API en panne), l'IA n'aurait rien de vrai à raconter : on n'affiche rien.
  if (!home && !away && !rows) return null;

  const probabilities = probabilitiesFor(match, home, away);
  const facts = buildFacts(match, { homeSeason: home, awaySeason: away, meetings, table: rows, probabilities });
  return getAnalysis(facts);
}

async function PlayerBlock({ match, featured }: { match: Match; featured: Loading<Featured> }) {
  const player = await featured;
  if (!player) return null;
  return <PlayerToWatch scorer={player.scorer} photo={player.photo} match={match} />;
}

// « Le match en 30 secondes » : on rassemble ce que les autres blocs affichent déjà, sans aucun appel en plus.
async function StoryBlock({
  match,
  analysis,
  featured,
  homeSeason,
  awaySeason,
}: {
  match: Match;
  analysis: Loading<Analysis>;
  featured: Loading<Featured>;
  homeSeason: Loading<Match[]>;
  awaySeason: Loading<Match[]>;
}) {
  const [text, player, home, away] = await Promise.all([analysis, featured, homeSeason, awaySeason]);
  if (!text) return null;

  const probabilities = probabilitiesFor(match, home, away);
  const homeForm = home ? recentForm(home, match.homeTeam.id, match.utcDate) : [];
  const awayForm = away ? recentForm(away, match.awayTeam.id, match.utcDate) : [];
  const team = (t: Match["homeTeam"]) => ({ name: t.shortName, crest: t.crest, tla: t.tla });

  const data: StoryData = {
    home: team(match.homeTeam),
    away: team(match.awayTeam),
    competition: `${competitionLabel(match.competition.code)}${match.matchday ? `, journée ${match.matchday}` : ""}`,
    when: formatSpokenKickoff(match.utcDate),
    enjeu: text.enjeu,
    probabilities: probabilities && { home: probabilities.home, draw: probabilities.draw, away: probabilities.away },
    form:
      homeForm.length > 0 && awayForm.length > 0
        ? { home: homeForm.map((e) => e.result), away: awayForm.map((e) => e.result) }
        : null,
    player: player && {
      name: player.scorer.player.name,
      photo: player.photo?.url ?? null,
      goals: player.scorer.goals,
      played: player.scorer.playedMatches,
      crest: player.scorer.team.crest,
      tla: player.scorer.team.tla,
    },
    suspense: { level: text.suspense, label: SUSPENSE_LABELS[text.suspense], reason: text.suspense_raison },
  };
  return <MatchStory data={data} />;
}

function StoryPlaceholder() {
  return (
    <div className="flex animate-pulse items-center gap-4 rounded-3xl border border-accent/30 bg-accent/10 px-5 py-4">
      <span className="size-12 rounded-full bg-accent/30" />
      <span className="font-display text-xl font-bold uppercase text-accent">Préparation du résumé animé…</span>
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

async function AnalysisBlock({ match, analysis }: { match: Match; analysis: Loading<Analysis> }) {
  const text = await analysis;
  if (!text) return null;
  const played = match.status !== "SCHEDULED" && match.status !== "TIMED";
  return <AnalysisCard analysis={text} played={played} />;
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
