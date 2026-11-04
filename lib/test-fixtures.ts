import type { Match, MatchStatus, Team } from "./types";

// Petits matchs inventés pour les tests automatiques (on connaît la bonne réponse à l'avance).

export const team = (id: number, name: string): Team => ({
  id,
  name,
  shortName: name,
  tla: name.slice(0, 3).toUpperCase(),
  crest: "",
});

let nextId = 1;

export function match(
  date: string,
  home: Team,
  away: Team,
  h: number | null,
  a: number | null,
  status: MatchStatus = "FINISHED",
  competitionCode = "FL1",
): Match {
  return {
    id: nextId++,
    utcDate: `${date}T20:00:00Z`,
    status,
    matchday: 1,
    stage: "REGULAR_SEASON",
    competition: { id: 1, name: competitionCode, code: competitionCode, emblem: "" },
    homeTeam: home,
    awayTeam: away,
    score: { winner: null, fullTime: { home: h, away: a }, halfTime: { home: null, away: null } },
  };
}
