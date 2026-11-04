import { describe, expect, it } from "vitest";
import { buildFacts, parseAnalysis, simpleAnalysis } from "./analysis";
import { match, team } from "./test-fixtures";
import type { StandingRow, Team } from "./types";

const TOULOUSE = team(1, "Toulouse");
const STRASBOURG = team(2, "Strasbourg");
const NANTES = team(3, "Nantes");

const row = (t: Team, position: number, points: number): StandingRow => ({
  position,
  team: t,
  playedGames: 9,
  won: 3,
  draw: 1,
  lost: 5,
  points,
  goalsFor: 12,
  goalsAgainst: 13,
  goalDifference: -1,
});

const upcoming = match("2026-11-06", TOULOUSE, STRASBOURG, null, null, "TIMED");
const toulouseSeason = [
  match("2026-10-10", TOULOUSE, NANTES, 3, 2), // le plus ancien
  match("2026-11-01", NANTES, TOULOUSE, 2, 0), // le plus récent
];

describe("buildFacts (ce que l'IA reçoit)", () => {
  const facts = buildFacts(upcoming, {
    homeSeason: toulouseSeason,
    awaySeason: [],
    meetings: [match("2026-05-03", STRASBOURG, TOULOUSE, 1, 2)],
    table: [row(TOULOUSE, 12, 10), row(STRASBOURG, 17, 6)],
  });

  it("donne la forme du plus récent au plus ancien, avec la date de chaque match", () => {
    const forme = facts.domicile.forme_du_plus_recent_au_plus_ancien!;
    expect(forme[0]).toMatch(/^1 nov\. 2026 : défaite 0-2 contre Nantes \(à l'extérieur\)$/);
    expect(forme[1]).toMatch(/^10 oct\. 2026 : victoire 3-2 contre Nantes \(à domicile\)$/);
  });

  it("nomme les équipes dans le bilan du face-à-face", () => {
    expect(facts.face_a_face?.bilan).toBe("1 victoire de Toulouse, 0 nul, 0 victoire de Strasbourg");
  });

  it("explique ce que vaut chaque place au classement", () => {
    expect(facts.exterieur.classement?.zone).toBe("Relégation en deuxième division");
    expect(facts.domicile.classement?.zone).toBeNull(); // 12e : aucune zone particulière
  });

  it("ne donne pas le classement d'un match déjà joué (il contient déjà le résultat)", () => {
    const played = match("2026-11-06", TOULOUSE, STRASBOURG, 3, 0);
    const after = buildFacts(played, { homeSeason: null, awaySeason: null, meetings: null, table: [row(TOULOUSE, 12, 13)] });
    expect(after.domicile.classement).toBeNull();
  });

  it("met null quand une donnée manque, pour que l'IA n'en parle pas", () => {
    expect(facts.exterieur.forme_du_plus_recent_au_plus_ancien).toBeNull();
    const empty = buildFacts(upcoming, { homeSeason: null, awaySeason: null, meetings: null, table: null });
    expect(empty.domicile.classement).toBeNull();
    expect(empty.face_a_face).toBeNull();
  });
});

describe("parseAnalysis (vérification de la réponse de l'IA)", () => {
  const valid = {
    enjeu: "Un duel serré.",
    resume: "Deux équipes proches.",
    a_surveiller: ["L'attaque de Toulouse."],
    suspense: 4,
    suspense_raison: "Peu d'écart.",
    lexique: [{ mot: "Relégation", definition: "Descendre en division inférieure." }],
  };

  it("accepte une réponse complète", () => {
    expect(parseAnalysis(JSON.stringify(valid))).toMatchObject({ suspense: 4 });
  });

  it("refuse un texte qui n'est pas du JSON", () => {
    expect(parseAnalysis("Voici mon analyse : ...")).toBeNull();
  });

  it("refuse un champ manquant ou une note de suspense hors de 1 à 5", () => {
    expect(parseAnalysis(JSON.stringify({ ...valid, enjeu: "" }))).toBeNull();
    expect(parseAnalysis(JSON.stringify({ ...valid, suspense: 7 }))).toBeNull();
  });
});

describe("simpleAnalysis (analyse de secours sans IA)", () => {
  it("explique l'écart au classement et garde un suspense entre 1 et 5", () => {
    const facts = buildFacts(upcoming, { homeSeason: null, awaySeason: null, meetings: null, table: [row(TOULOUSE, 12, 10), row(STRASBOURG, 13, 10)] });
    const analysis = simpleAnalysis(facts);
    expect(analysis.source).toBe("secours");
    expect(analysis.enjeu).toContain("autant de points");
    expect(analysis.suspense).toBeGreaterThanOrEqual(1);
    expect(analysis.suspense).toBeLessThanOrEqual(5);
  });

  it("met peu de suspense quand les probabilités désignent un net favori", () => {
    const probabilities = { home: 12, draw: 17, away: 71, expectedHome: 0.7, expectedAway: 2.4, played: { home: 11, away: 11 } };
    const facts = buildFacts(upcoming, { homeSeason: null, awaySeason: null, meetings: null, table: null, probabilities });
    expect(facts.probabilites_estimees).toEqual({ victoire_domicile: 12, nul: 17, victoire_exterieur: 71 });
    expect(simpleAnalysis(facts).suspense).toBe(1);
  });
});
