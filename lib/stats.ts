import type { Match, Team } from "./types";

// Tous les chiffres de Kick-Time sont calculés ici, par du code testé (voir stats.test.ts).
// L'IA ne fait ensuite que les expliquer : elle ne peut donc pas inventer de statistiques.

export type Result = "V" | "N" | "D"; // victoire, nul, défaite

// Résultat d'un match du point de vue d'une équipe. null si le match n'est pas terminé.
export function resultFor(match: Match, teamId: number): Result | null {
  const { home, away } = match.score.fullTime;
  if (match.status !== "FINISHED" || home === null || away === null) return null;

  const atHome = match.homeTeam.id === teamId;
  const scored = atHome ? home : away;
  const conceded = atHome ? away : home;
  if (scored > conceded) return "V";
  if (scored < conceded) return "D";
  return "N";
}

export type FormEntry = {
  matchId: number;
  date: string;
  result: Result;
  opponent: Team;
  atHome: boolean;
  goalsFor: number;
  goalsAgainst: number;
};

// Les derniers matchs terminés d'une équipe avant une date,
// rangés du plus ancien au plus récent (on les lit de gauche à droite).
export function recentForm(matches: Match[], teamId: number, before: string, count = 5): FormEntry[] {
  const entries: FormEntry[] = [];
  for (const match of finishedBefore(matches, before)) {
    const result = resultFor(match, teamId);
    if (!result) continue;
    const atHome = match.homeTeam.id === teamId;
    entries.push({
      matchId: match.id,
      date: match.utcDate,
      result,
      opponent: atHome ? match.awayTeam : match.homeTeam,
      atHome,
      goalsFor: (atHome ? match.score.fullTime.home : match.score.fullTime.away) ?? 0,
      goalsAgainst: (atHome ? match.score.fullTime.away : match.score.fullTime.home) ?? 0,
    });
  }
  return entries.slice(-count);
}

// Points récoltés sur une série : 3 par victoire, 1 par nul.
export function formPoints(entries: FormEntry[]): number {
  return entries.reduce((total, e) => total + (e.result === "V" ? 3 : e.result === "N" ? 1 : 0), 0);
}

export type HeadToHead = {
  played: number;
  homeWins: number; // victoires de l'équipe qui reçoit aujourd'hui (peu importe où se jouait l'ancien match)
  draws: number;
  awayWins: number;
  recent: Match[]; // les 5 dernières confrontations, de la plus récente à la plus ancienne
};

// Bilan des confrontations passées entre les deux équipes d'un match.
// On recompte nous-mêmes : le bilan fourni par l'API est faux (tout à 0).
export function headToHead(pastMatches: Match[], match: Match): HeadToHead {
  const homeId = match.homeTeam.id;
  const awayId = match.awayTeam.id;
  const meetings = finishedBefore(pastMatches, match.utcDate).filter((m) => {
    const ids = [m.homeTeam.id, m.awayTeam.id];
    return ids.includes(homeId) && ids.includes(awayId);
  });

  const results = meetings.map((m) => resultFor(m, homeId));
  return {
    played: meetings.length,
    homeWins: results.filter((r) => r === "V").length,
    draws: results.filter((r) => r === "N").length,
    awayWins: results.filter((r) => r === "D").length,
    recent: meetings.slice(-5).reverse(),
  };
}

export type VenueRecord = {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
};

// Bilan d'une équipe cette saison, seulement à domicile ou seulement à l'extérieur.
export function venueRecord(matches: Match[], teamId: number, venue: "home" | "away", before: string): VenueRecord {
  const record: VenueRecord = { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 };
  const entries = recentForm(matches, teamId, before, Infinity).filter((e) => e.atHome === (venue === "home"));
  for (const e of entries) {
    record.played++;
    if (e.result === "V") record.won++;
    if (e.result === "N") record.drawn++;
    if (e.result === "D") record.lost++;
    record.goalsFor += e.goalsFor;
    record.goalsAgainst += e.goalsAgainst;
  }
  return record;
}

// Matchs terminés avant une date, triés du plus ancien au plus récent
// (on ne fait pas confiance à l'ordre renvoyé par l'API : il change selon les routes).
function finishedBefore(matches: Match[], before: string): Match[] {
  return matches
    .filter((m) => m.status === "FINISHED" && m.utcDate < before)
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate));
}
