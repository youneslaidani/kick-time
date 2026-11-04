import { recentForm } from "./stats";
import type { Match } from "./types";

// Probabilités de victoire, de nul et de défaite, calculées par le code avec le « modèle de Poisson »,
// une méthode classique des statisticiens du football. Ce n'est pas l'IA qui les invente.
//
// L'idée en 3 étapes :
// 1. on mesure l'attaque (buts marqués par match) et la défense (buts encaissés par match) de chaque équipe ;
// 2. on en déduit combien de buts chaque équipe devrait marquer dans CE match (les « buts attendus ») ;
// 3. la loi de Poisson donne la probabilité de chaque score (0-0, 1-0, 2-1…) : on les additionne.

// Nombre moyen de buts marqués par une équipe et par match dans les grands championnats (environ 1,4).
const AVERAGE_GOALS = 1.4;
// Avantage du terrain : on marque un peu plus chez soi, un peu moins chez l'adversaire.
const HOME_BOOST = 1.15;
// Prudence : on fait comme si chaque équipe avait aussi joué 4 matchs « dans la moyenne »,
// pour ne pas s'emballer sur une équipe qui n'a joué que 2 ou 3 matchs.
const PRIOR_MATCHES = 4;
// En dessous de 3 matchs joués, on n'a pas assez d'informations : on n'affiche pas de probabilités.
const MIN_MATCHES = 3;

export type GoalRates = { scored: number; conceded: number; played: number };

export type WinProbabilities = {
  home: number; // en pourcentage
  draw: number;
  away: number;
  expectedHome: number; // buts attendus pour l'équipe qui reçoit
  expectedAway: number;
  played: { home: number; away: number }; // nombre de matchs utilisés pour le calcul
};

// Buts marqués et encaissés par match cette saison, avant une date (toutes compétitions suivies).
export function goalRates(season: Match[], teamId: number, before: string): GoalRates {
  const entries = recentForm(season, teamId, before, Infinity);
  const scored = entries.reduce((total, e) => total + e.goalsFor, 0);
  const conceded = entries.reduce((total, e) => total + e.goalsAgainst, 0);
  const played = entries.length;
  return {
    scored: (scored + AVERAGE_GOALS * PRIOR_MATCHES) / (played + PRIOR_MATCHES),
    conceded: (conceded + AVERAGE_GOALS * PRIOR_MATCHES) / (played + PRIOR_MATCHES),
    played,
  };
}

export function winProbabilities(home: GoalRates, away: GoalRates): WinProbabilities {
  // L'attaque de l'un face à la défense de l'autre, comparées à la moyenne.
  const expectedHome = ((home.scored * away.conceded) / AVERAGE_GOALS) * HOME_BOOST;
  const expectedAway = (away.scored * home.conceded) / AVERAGE_GOALS / HOME_BOOST;

  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  // On passe en revue tous les scores de 0-0 à 10-10 (au-delà, la probabilité est quasi nulle).
  for (let h = 0; h <= 10; h++) {
    for (let a = 0; a <= 10; a++) {
      const p = poisson(h, expectedHome) * poisson(a, expectedAway);
      if (h > a) homeWin += p;
      else if (h === a) draw += p;
      else awayWin += p;
    }
  }

  const [homePct, drawPct, awayPct] = toPercentages([homeWin, draw, awayWin]);
  return { home: homePct, draw: drawPct, away: awayPct, expectedHome, expectedAway, played: { home: home.played, away: away.played } };
}

// Probabilités d'un match, ou null si une équipe n'a pas assez joué (ou si les données manquent).
// On ne regarde que les matchs joués AVANT celui-ci : ce sont des probabilités d'avant-match.
export function probabilitiesFor(match: Match, homeSeason: Match[] | null, awaySeason: Match[] | null): WinProbabilities | null {
  if (!homeSeason || !awaySeason) return null;
  const home = goalRates(homeSeason, match.homeTeam.id, match.utcDate);
  const away = goalRates(awaySeason, match.awayTeam.id, match.utcDate);
  if (home.played < MIN_MATCHES || away.played < MIN_MATCHES) return null;
  return winProbabilities(home, away);
}

// Loi de Poisson : probabilité de marquer exactement k buts quand on en attend « lambda » en moyenne.
function poisson(k: number, lambda: number): number {
  let factorial = 1;
  for (let i = 2; i <= k; i++) factorial *= i;
  return (Math.exp(-lambda) * lambda ** k) / factorial;
}

// Transforme des probabilités en pourcentages entiers qui font exactement 100
// (on arrondit vers le bas, puis on donne les points restants aux plus grandes décimales).
export function toPercentages(values: number[]): number[] {
  const total = values.reduce((sum, v) => sum + v, 0);
  const exact = values.map((v) => (v / total) * 100);
  const rounded = exact.map(Math.floor);
  let missing = 100 - rounded.reduce((sum, v) => sum + v, 0);
  const byRemainder = exact.map((v, i) => ({ i, rest: v - Math.floor(v) })).sort((a, b) => b.rest - a.rest);
  for (const { i } of byRemainder) {
    if (missing === 0) break;
    rounded[i]++;
    missing--;
  }
  return rounded;
}
