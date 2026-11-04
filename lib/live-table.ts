import { isFinished, isLive } from "./match-status";
import type { Match, StandingRow } from "./types";

// Le classement en direct, comme sur Flashscore : pendant les matchs, il bouge à chaque but.
//
// Piège découvert en testant (4/11) : le classement de football-data.org compte déjà les matchs en cours…
// mais avec le score en différé (le Real y était compté sur un 0-0 alors qu'il perdait 1-0).
// On ne peut donc pas simplement « ajouter » le match en cours à ce classement.
// Solution : on recalcule tout nous-mêmes à partir des matchs de la saison :
//   - « avant » = les matchs terminés ;
//   - « maintenant » = les matchs terminés + les matchs en cours avec leur score en direct.
// La différence entre les deux donne les flèches ▲ / ▼.

export type LiveRow = StandingRow & {
  previousPosition: number; // la place avant les matchs en cours (pour afficher ▲ / ▼)
  liveScore: string | null; // le score du match en cours, vu par cette équipe (« 2:1 »), sinon null
};

// On ne compte que les matchs de championnat ou de la phase de ligue (pas les phases éliminatoires).
const COUNTED_STAGES = new Set(["REGULAR_SEASON", "LEAGUE_STAGE"]);

export function liveStandings(official: StandingRow[], seasonMatches: Match[]): { rows: LiveRow[]; live: boolean } {
  const counted = seasonMatches.filter((m) => COUNTED_STAGES.has(m.stage));
  const inPlay = counted.filter((m) => isLive(m.status));

  // Aucun match en cours : le classement officiel suffit.
  if (inPlay.length === 0) {
    return { rows: official.map((row) => ({ ...row, previousPosition: row.position, liveScore: null })), live: false };
  }

  const finished = counted.filter((m) => isFinished(m.status));
  const before = buildTable(official, finished);
  const now = buildTable(official, [...finished, ...inPlay]);

  const rows = now.map((row) => {
    const match = inPlay.find((m) => m.homeTeam.id === row.team.id || m.awayTeam.id === row.team.id);
    let liveScore: string | null = null;
    if (match) {
      const { home, away } = match.score.fullTime;
      liveScore = match.homeTeam.id === row.team.id ? `${home ?? 0}:${away ?? 0}` : `${away ?? 0}:${home ?? 0}`;
    }
    const previousPosition = before.find((r) => r.team.id === row.team.id)?.position ?? row.position;
    return { ...row, previousPosition, liveScore };
  });
  return { rows, live: true };
}

// Construit un classement à partir d'une liste de matchs. La liste des équipes (et leurs logos) vient du
// classement officiel ; à égalité parfaite, on garde l'ordre officiel (ses règles de départage sont plus fines).
export function buildTable(official: StandingRow[], matches: Match[]): StandingRow[] {
  const rows: StandingRow[] = official.map((row) => ({
    ...row,
    playedGames: 0,
    won: 0,
    draw: 0,
    lost: 0,
    points: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
  }));

  for (const match of matches) {
    const { home, away } = match.score.fullTime;
    if (home === null || away === null) continue;
    for (const [teamId, scored, conceded] of [
      [match.homeTeam.id, home, away],
      [match.awayTeam.id, away, home],
    ] as const) {
      const row = rows.find((r) => r.team.id === teamId);
      if (!row) continue;
      row.playedGames += 1;
      row.goalsFor += scored;
      row.goalsAgainst += conceded;
      row.goalDifference += scored - conceded;
      if (scored > conceded) {
        row.won += 1;
        row.points += 3;
      } else if (scored === conceded) {
        row.draw += 1;
        row.points += 1;
      } else {
        row.lost += 1;
      }
    }
  }

  const officialPosition = new Map(official.map((r) => [r.team.id, r.position]));
  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      (officialPosition.get(a.team.id) ?? 99) - (officialPosition.get(b.team.id) ?? 99),
  );
  rows.forEach((row, index) => (row.position = index + 1));
  return rows;
}
