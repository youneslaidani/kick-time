import { connection } from "next/server";
import { Suspense } from "react";
import { Unavailable } from "@/components/Section";
import TeamQuiz from "@/components/TeamQuiz";
import { getStandings, getTeams, getUpcomingMatches } from "@/lib/football";
import { colorFamilies, colorsLabel, type League, type QuizTeam } from "@/lib/quiz";
import type { Match } from "@/lib/types";

// Les 5 grands championnats où l'on cherche « ton » équipe.
const LEAGUES: League[] = ["FL1", "PL", "PD", "SA", "BL1"];

// Page /mon-equipe : le quiz pour ceux qui ne suivent pas le foot.
export default function MyTeamPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-6">
      <section className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">Pas fan de foot ?</p>
        <h1 className="font-display text-4xl font-extrabold uppercase leading-tight sm:text-5xl">
          Trouve ton équipe en 20 secondes
        </h1>
        <p className="mt-2 text-muted">5 questions, aucune connaissance en foot nécessaire. À la fin : ton club, et son prochain match à suivre.</p>
      </section>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-surface" />}>
        <QuizLoader />
      </Suspense>
    </main>
  );
}

// Côté serveur : on rassemble les vraies infos des ~100 clubs, puis le quiz tourne dans le navigateur.
async function QuizLoader() {
  // On attend une vraie visite : sans ça, Next.js chargerait ces données pendant la compilation,
  // ce qui peut échouer si l'API est occupée (limite de 10 appels/minute).
  await connection();
  const [upcoming, ...leagues] = await Promise.all([
    getUpcomingMatches(),
    ...LEAGUES.map(async (code) => ({ code, teams: await getTeams(code), table: await getStandings(code) })),
  ]);

  const teams: QuizTeam[] = [];
  for (const { code, teams: infos, table } of leagues) {
    if (!infos || !table) continue;
    for (const row of table) {
      const info = infos.find((t) => t.id === row.team.id);
      const families = colorFamilies(info?.clubColors ?? null);
      teams.push({
        id: row.team.id,
        name: row.team.shortName,
        crest: row.team.crest,
        tla: row.team.tla,
        league: code,
        colors: families,
        colorsLabel: colorsLabel(families),
        founded: info?.founded ?? null,
        venue: info?.venue ?? null,
        position: row.position,
        teamsInLeague: table.length,
        goalsPerMatch: row.playedGames > 0 ? (row.goalsFor + row.goalsAgainst) / row.playedGames : 2.6,
        nextMatch: nextMatchOf(row.team.id, upcoming),
      });
    }
  }

  if (teams.length === 0) {
    return <Unavailable>Le quiz est momentanément indisponible : réessaie dans une minute.</Unavailable>;
  }
  return <TeamQuiz teams={teams} />;
}

// Le prochain match de l'équipe parmi ceux de la semaine (null s'il n'y en a pas).
function nextMatchOf(teamId: number, upcoming: Match[]): QuizTeam["nextMatch"] {
  const match = upcoming
    .filter((m) => m.homeTeam.id === teamId || m.awayTeam.id === teamId)
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))[0];
  if (!match) return null;
  const atHome = match.homeTeam.id === teamId;
  return { id: match.id, opponent: (atHome ? match.awayTeam : match.homeTeam).shortName, utcDate: match.utcDate, atHome };
}
