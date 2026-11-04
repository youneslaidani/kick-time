import { describe, expect, it } from "vitest";
import { formPoints, headToHead, recentForm, resultFor, venueRecord } from "./stats";
import type { Match, MatchStatus } from "./types";

// Tests automatiques : on vérifie les calculs sur de petits matchs inventés dont on connaît la réponse.
// Lancer avec : npm test

const team = (id: number, name: string) => ({ id, name, shortName: name, tla: name.slice(0, 3).toUpperCase(), crest: "" });
const TOULOUSE = team(1, "Toulouse");
const STRASBOURG = team(2, "Strasbourg");
const NANTES = team(3, "Nantes");

let nextId = 1;
function match(date: string, home: typeof TOULOUSE, away: typeof TOULOUSE, h: number | null, a: number | null, status: MatchStatus = "FINISHED"): Match {
  return {
    id: nextId++,
    utcDate: `${date}T20:00:00Z`,
    status,
    matchday: 1,
    stage: "REGULAR_SEASON",
    competition: { id: 1, name: "Ligue 1", code: "FL1", emblem: "" },
    homeTeam: home,
    awayTeam: away,
    score: { winner: null, fullTime: { home: h, away: a }, halfTime: { home: null, away: null } },
  };
}

describe("resultFor", () => {
  it("donne le résultat du point de vue de chaque équipe", () => {
    const m = match("2026-10-01", TOULOUSE, STRASBOURG, 2, 1);
    expect(resultFor(m, TOULOUSE.id)).toBe("V");
    expect(resultFor(m, STRASBOURG.id)).toBe("D");
  });

  it("reconnaît un match nul", () => {
    expect(resultFor(match("2026-10-01", TOULOUSE, STRASBOURG, 0, 0), TOULOUSE.id)).toBe("N");
  });

  it("ne compte pas un match qui n'est pas terminé", () => {
    expect(resultFor(match("2026-10-01", TOULOUSE, STRASBOURG, 1, 0, "IN_PLAY"), TOULOUSE.id)).toBeNull();
  });
});

describe("recentForm", () => {
  const season = [
    // volontairement dans le désordre, comme l'API peut le faire
    match("2026-10-20", NANTES, TOULOUSE, 3, 0), // D
    match("2026-09-01", TOULOUSE, NANTES, 1, 1), // N
    match("2026-10-10", TOULOUSE, STRASBOURG, 2, 0), // V
    match("2026-11-30", TOULOUSE, STRASBOURG, null, null, "TIMED"), // pas encore joué
  ];

  it("range les matchs du plus ancien au plus récent", () => {
    const form = recentForm(season, TOULOUSE.id, "2026-12-01");
    expect(form.map((e) => e.result)).toEqual(["N", "V", "D"]);
  });

  it("ignore les matchs joués après la date demandée", () => {
    const form = recentForm(season, TOULOUSE.id, "2026-10-15");
    expect(form.map((e) => e.result)).toEqual(["N", "V"]);
  });

  it("garde seulement les N derniers", () => {
    expect(recentForm(season, TOULOUSE.id, "2026-12-01", 2).map((e) => e.result)).toEqual(["V", "D"]);
  });

  it("note l'adversaire, le lieu et le score", () => {
    const [last] = recentForm(season, TOULOUSE.id, "2026-12-01", 1);
    expect(last).toMatchObject({ opponent: NANTES, atHome: false, goalsFor: 0, goalsAgainst: 3 });
  });

  it("compte les points : 3 par victoire, 1 par nul", () => {
    expect(formPoints(recentForm(season, TOULOUSE.id, "2026-12-01"))).toBe(4);
  });
});

describe("headToHead", () => {
  const upcoming = match("2026-11-06", TOULOUSE, STRASBOURG, null, null, "TIMED");
  const past = [
    match("2025-12-06", TOULOUSE, STRASBOURG, 1, 0), // Toulouse gagne à domicile
    match("2026-05-03", STRASBOURG, TOULOUSE, 1, 2), // Toulouse gagne à l'extérieur
    match("2025-03-16", STRASBOURG, TOULOUSE, 2, 1), // Strasbourg gagne
    match("2024-04-07", TOULOUSE, STRASBOURG, 0, 0), // nul
    match("2025-01-01", TOULOUSE, NANTES, 5, 0), // autre adversaire : ignoré
  ];

  it("recompte le bilan du point de vue de l'équipe qui reçoit", () => {
    expect(headToHead(past, upcoming)).toMatchObject({ played: 4, homeWins: 2, draws: 1, awayWins: 1 });
  });

  it("liste les confrontations de la plus récente à la plus ancienne", () => {
    const dates = headToHead(past, upcoming).recent.map((m) => m.utcDate.slice(0, 10));
    expect(dates).toEqual(["2026-05-03", "2025-12-06", "2025-03-16", "2024-04-07"]);
  });

  it("n'inclut pas le match lui-même une fois qu'il est joué", () => {
    const played = match("2026-11-06", TOULOUSE, STRASBOURG, 3, 0);
    expect(headToHead([...past, played], played).played).toBe(4);
  });

  it("gère deux équipes qui ne se sont jamais affrontées", () => {
    expect(headToHead([], upcoming)).toMatchObject({ played: 0, recent: [] });
  });
});

describe("venueRecord", () => {
  const season = [
    match("2026-09-01", TOULOUSE, NANTES, 2, 0),
    match("2026-09-15", TOULOUSE, STRASBOURG, 1, 1),
    match("2026-10-01", NANTES, TOULOUSE, 0, 1),
  ];

  it("sépare les matchs à domicile et à l'extérieur", () => {
    expect(venueRecord(season, TOULOUSE.id, "home", "2026-12-01")).toEqual({
      played: 2, won: 1, drawn: 1, lost: 0, goalsFor: 3, goalsAgainst: 1,
    });
    expect(venueRecord(season, TOULOUSE.id, "away", "2026-12-01")).toEqual({
      played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 1, goalsAgainst: 0,
    });
  });
});
