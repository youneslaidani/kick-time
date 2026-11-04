import { describe, expect, it } from "vitest";
import { buildTable, liveStandings } from "./live-table";
import { match, team } from "./test-fixtures";
import type { MatchStatus, StandingRow, Team } from "./types";

const PSG = team(1, "PSG");
const REAL = team(2, "Real Madrid");
const LIVERPOOL = team(3, "Liverpool");
const FENER = team(4, "Fenerbahçe");
const AEK = team(5, "AEK");

// Le classement officiel ne sert qu'à la liste des équipes (et à départager les égalités parfaites).
const official: StandingRow[] = [PSG, REAL, LIVERPOOL, FENER, AEK].map((t, i) => ({
  position: i + 1,
  team: t,
  playedGames: 0,
  won: 0,
  draw: 0,
  lost: 0,
  points: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDifference: 0,
}));

const game = (date: string, home: Team, away: Team, h: number | null, a: number | null, status: MatchStatus = "FINISHED") => {
  const m = match(date, home, away, h, a, status, "CL");
  m.stage = "LEAGUE_STAGE";
  return m;
};

// 3 journées déjà jouées.
const season = [
  game("2026-09-16", PSG, AEK, 4, 0),
  game("2026-09-17", REAL, FENER, 3, 1),
  game("2026-09-30", LIVERPOOL, PSG, 1, 1),
  game("2026-10-01", AEK, FENER, 0, 0),
  game("2026-10-21", REAL, LIVERPOOL, 2, 2),
];

describe("buildTable", () => {
  it("calcule points, différence de buts et places à partir des matchs", () => {
    const table = buildTable(official, season);
    // À égalité de points, Fenerbahçe (différence -2) passe devant l'AEK (-4).
    expect(table.map((r) => `${r.team.shortName} ${r.points}`)).toEqual(["PSG 4", "Real Madrid 4", "Liverpool 2", "Fenerbahçe 1", "AEK 1"]);
    expect(table[0]).toMatchObject({ playedGames: 2, goalDifference: 4 });
  });
});

describe("liveStandings (classement en direct)", () => {
  it("garde le classement officiel quand aucun match n'est en cours", () => {
    const { rows, live } = liveStandings(official, season);
    expect(live).toBe(false);
    expect(rows.every((r) => r.liveScore === null && r.previousPosition === r.position)).toBe(true);
  });

  it("compte le match en cours avec son score en direct et montre le score à côté des équipes", () => {
    const { rows, live } = liveStandings(official, [...season, game("2026-11-04", AEK, REAL, 1, 0, "IN_PLAY")]);
    expect(live).toBe(true);
    expect(rows.find((r) => r.team.id === AEK.id)).toMatchObject({ points: 4, liveScore: "1:0" });
    expect(rows.find((r) => r.team.id === REAL.id)).toMatchObject({ points: 4, liveScore: "0:1" });
  });

  it("fait bouger les places et garde l'ancienne pour la flèche ▲ / ▼", () => {
    const { rows } = liveStandings(official, [...season, game("2026-11-04", AEK, REAL, 4, 0, "IN_PLAY")]);
    const aek = rows.find((r) => r.team.id === AEK.id)!;
    const real = rows.find((r) => r.team.id === REAL.id)!;
    // AEK : 5e avant le match ; avec 4-0, 4 points et une différence de 0 → 2e, devant le Real (4 points, -2).
    expect(aek.previousPosition).toBe(5);
    expect(aek.position).toBe(2);
    expect(real.previousPosition).toBe(2);
    expect(real.position).toBe(3);
  });

  it("ne compte pas les matchs pas encore commencés ni ceux des phases éliminatoires", () => {
    const knockout = game("2026-11-04", PSG, REAL, 5, 0, "IN_PLAY");
    knockout.stage = "LAST_16";
    const { rows } = liveStandings(official, [...season, game("2026-11-05", PSG, FENER, null, null, "TIMED"), knockout, game("2026-11-04", AEK, LIVERPOOL, 0, 0, "IN_PLAY")]);
    expect(rows.find((r) => r.team.id === PSG.id)).toMatchObject({ points: 4, liveScore: null });
  });
});
