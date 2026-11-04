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

type Params = Promise<{ id: string }>;

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

  // Les 4 chargements partent en même temps (Promise.all) : la page s'affiche plus vite.
  const [homeSeason, awaySeason, pastMeetings, table] = await Promise.all([
    getTeamSeason(match.homeTeam.id),
    getTeamSeason(match.awayTeam.id),
    getHeadToHead(match.id),
    getStandings(match.competition.code),
  ]);

  // On ne regarde que ce qui s'est passé AVANT ce match, même s'il est déjà joué.
  const before = match.utcDate;
  const homeForm = homeSeason && recentForm(homeSeason, match.homeTeam.id, before);
  const awayForm = awaySeason && recentForm(awaySeason, match.awayTeam.id, before);

  return (
    <div className="flex flex-col gap-4">
      <MatchHeader match={match} />

      <AnalysisTeaser />

      <Section title="Forme du moment" hint="5 derniers matchs, du plus ancien au plus récent →">
        {homeForm && awayForm ? (
          <div className="flex flex-col gap-5">
            <FormRow team={match.homeTeam} entries={homeForm} />
            <FormRow team={match.awayTeam} entries={awayForm} />
            <p className="text-xs text-muted">V = victoire · N = match nul · D = défaite. Sous chaque pastille : l&apos;adversaire.</p>
          </div>
        ) : (
          <Unavailable />
        )}
      </Section>

      <Section title="Face-à-face" hint="Toutes les confrontations connues">
        <HeadToHeadCard
          h2h={pastMeetings && headToHead(pastMeetings, match)}
          home={match.homeTeam}
          away={match.awayTeam}
        />
      </Section>

      <Section title="Au classement" hint="Pts = points : victoire 3, nul 1, défaite 0">
        <StandingsCompare
          table={table}
          home={match.homeTeam}
          away={match.awayTeam}
          homeRecord={homeSeason && venueRecord(homeSeason, match.homeTeam.id, "home", before)}
          awayRecord={awaySeason && venueRecord(awaySeason, match.awayTeam.id, "away", before)}
        />
      </Section>
    </div>
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

function MatchSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="h-64 rounded-3xl bg-surface" />
      <div className="h-32 rounded-3xl bg-surface" />
      <div className="h-48 rounded-3xl bg-surface" />
    </div>
  );
}
