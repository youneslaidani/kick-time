import { describe, expect, it } from "vitest";
import { goalRates, probabilitiesFor, toPercentages, winProbabilities } from "./probabilities";
import { match, team } from "./test-fixtures";

const LYON = team(1, "Lyon");
const NICE = team(2, "Nice");
const BREST = team(3, "Brest");

// Une équipe « moyenne » : 1,4 but marqué et 1,4 encaissé par match.
const average = { scored: 1.4, conceded: 1.4, played: 10 };

describe("toPercentages", () => {
  it("donne des pourcentages entiers qui font toujours 100", () => {
    expect(toPercentages([1, 1, 1])).toEqual([34, 33, 33]);
    expect(toPercentages([0.456, 0.271, 0.273]).reduce((a, b) => a + b)).toBe(100);
  });
});

describe("winProbabilities", () => {
  it("additionne victoire, nul et défaite à 100 %", () => {
    const p = winProbabilities(average, average);
    expect(p.home + p.draw + p.away).toBe(100);
  });

  it("donne un petit avantage à l'équipe qui joue à domicile, à niveau égal", () => {
    const p = winProbabilities(average, average);
    expect(p.home).toBeGreaterThan(p.away);
  });

  it("rend favorite l'équipe qui marque beaucoup et encaisse peu", () => {
    const strong = { scored: 2.5, conceded: 0.6, played: 10 };
    expect(winProbabilities(average, strong).away).toBeGreaterThan(60);
    expect(winProbabilities(strong, average).home).toBeGreaterThan(70);
  });
});

describe("goalRates", () => {
  it("reste prudent avec peu de matchs : un 5-0 isolé ne fait pas une super-équipe", () => {
    const season = [match("2026-09-01", LYON, NICE, 5, 0)];
    const rates = goalRates(season, LYON.id, "2026-12-01");
    expect(rates.scored).toBeCloseTo((5 + 1.4 * 4) / 5); // 2,12 au lieu de 5
    expect(rates.played).toBe(1);
  });
});

describe("probabilitiesFor", () => {
  const season = [
    match("2026-09-01", LYON, BREST, 2, 0),
    match("2026-09-08", NICE, LYON, 1, 1),
    match("2026-09-15", LYON, NICE, 3, 1),
  ];
  const upcoming = match("2026-11-06", LYON, NICE, null, null, "TIMED");

  it("calcule les probabilités quand les deux équipes ont au moins 3 matchs", () => {
    expect(probabilitiesFor(upcoming, season, [...season, match("2026-09-20", NICE, BREST, 0, 0)])).not.toBeNull();
  });

  it("n'affiche rien quand une équipe n'a pas assez joué", () => {
    expect(probabilitiesFor(upcoming, season, season)).toBeNull(); // Nice n'a que 2 matchs
    expect(probabilitiesFor(upcoming, null, season)).toBeNull();
  });
});
