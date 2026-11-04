import { describe, expect, it } from "vitest";
import { colorFamilies, colorsLabel, findTeam, type Answers, type QuizTeam } from "./quiz";

const club = (overrides: Partial<QuizTeam>): QuizTeam => ({
  id: 1,
  name: "Club",
  crest: "",
  tla: "CLB",
  league: "FL1",
  colors: ["bleu"],
  colorsLabel: "bleu",
  founded: 1950,
  venue: "Stade",
  position: 10,
  teamsInLeague: 18,
  goalsPerMatch: 2.6,
  nextMatch: null,
  ...overrides,
});

const LENS = club({ id: 1, name: "RC Lens", colors: ["rouge", "jaune"], colorsLabel: "rouge et jaune", founded: 1906, position: 6 });
const PSG = club({ id: 2, name: "PSG", colors: ["rouge", "bleu", "blanc"], colorsLabel: "rouge, bleu et blanc", founded: 1904, position: 1, goalsPerMatch: 3.4 });
const TOULOUSE = club({ id: 3, name: "Toulouse", colors: ["violet", "blanc"], colorsLabel: "violet et blanc", founded: 1937, position: 12 });
const REAL = club({ id: 4, name: "Real Madrid", league: "PD", colors: ["blanc"], colorsLabel: "blanc", founded: 1902, position: 3, teamsInLeague: 20, goalsPerMatch: 3.3 });
const ALL = [LENS, PSG, TOULOUSE, REAL];

const answers = (overrides: Partial<Answers>): Answers => ({
  ambition: "suspense",
  color: "bleu",
  country: "any",
  era: "history",
  style: "goals",
  ...overrides,
});

describe("colorFamilies", () => {
  it("traduit les couleurs de l'API en familles simples", () => {
    expect(colorFamilies("Red / Navy Blue / White")).toEqual(["rouge", "bleu", "blanc"]);
    expect(colorFamilies("Black / White / Gold")).toEqual(["noir", "blanc", "jaune"]);
    expect(colorFamilies("Sky Blue / Navy Blue")).toEqual(["bleu"]); // deux bleus = une seule famille
    expect(colorFamilies(null)).toEqual([]);
  });

  it("écrit les couleurs comme on les dit", () => {
    expect(colorsLabel(["rouge", "bleu", "blanc"])).toBe("rouge, bleu et blanc");
    expect(colorsLabel(["violet"])).toBe("violet");
  });
});

describe("findTeam", () => {
  it("trouve Toulouse pour quelqu'un qui aime le violet", () => {
    expect(findTeam(ALL, answers({ color: "violet" }))?.team.name).toBe("Toulouse");
  });

  it("emmène en Espagne quelqu'un qui rêve de Madrid, en préférant les favoris", () => {
    expect(findTeam(ALL, answers({ country: "PD", ambition: "favori", color: "blanc" }))?.team.name).toBe("Real Madrid");
  });

  it("préfère le leader quand on aime voir les meilleurs gagner", () => {
    expect(findTeam([LENS, PSG], answers({ ambition: "favori", color: "rouge" }))?.team.name).toBe("PSG");
  });

  it("explique le choix avec de vraies infos du club", () => {
    const result = findTeam(ALL, answers({ color: "violet" }))!;
    expect(result.reasons).toContain("Ses couleurs : violet et blanc. Avec ton violet préféré !");
    expect(result.reasons).toContain("Un club chargé d'histoire, fondé en 1937.");
  });

  it("ne renvoie rien s'il n'y a aucune équipe", () => {
    expect(findTeam([], answers({}))).toBeNull();
  });
});
