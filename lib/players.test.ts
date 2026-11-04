import { describe, expect, it } from "vitest";
import { pickWikipediaPage } from "./player-photo";
import { ageAt, playerToWatch, positionLabel } from "./players";
import { match, team } from "./test-fixtures";
import type { Scorer } from "./types";

const VALENCE = team(95, "Valencia");
const REAL = team(86, "Real Madrid");
const BARCA = team(81, "Barça");

const scorer = (name: string, t: typeof REAL, goals: number, playedMatches: number, assists = 0): Scorer => ({
  player: { id: goals * 100 + playedMatches, name, dateOfBirth: "1998-12-20", section: "Offence", shirtNumber: 9 },
  team: { id: t.id, shortName: t.shortName, tla: t.tla, crest: "" },
  playedMatches,
  goals,
  assists,
});

describe("playerToWatch", () => {
  const upcoming = match("2026-11-07", VALENCE, REAL, null, null, "TIMED", "PD");

  it("choisit le meilleur buteur des deux équipes du match, pas des autres", () => {
    const scorers = [scorer("Raphinha", BARCA, 15, 10), scorer("Mbappé", REAL, 12, 11), scorer("Duro", VALENCE, 4, 11)];
    expect(playerToWatch(scorers, upcoming)?.player.name).toBe("Mbappé");
  });

  it("à égalité de buts, préfère celui qui a joué le moins de matchs", () => {
    const scorers = [scorer("A", REAL, 5, 10), scorer("B", VALENCE, 5, 6)];
    expect(playerToWatch(scorers, upcoming)?.player.name).toBe("B");
  });

  it("ne renvoie personne si aucun joueur des deux équipes n'a marqué", () => {
    expect(playerToWatch([scorer("Raphinha", BARCA, 15, 10)], upcoming)).toBeNull();
  });
});

describe("ageAt", () => {
  it("compte l'âge au jour du match, anniversaire compris", () => {
    expect(ageAt("1998-12-20", "2026-11-07T20:00:00Z")).toBe(27);
    expect(ageAt("1998-12-20", "2026-12-20T20:00:00Z")).toBe(28);
  });
});

describe("positionLabel", () => {
  it("traduit le poste en français", () => {
    expect(positionLabel("Offence")).toBe("Attaquant");
    expect(positionLabel(null)).toBeNull();
  });
});

describe("pickWikipediaPage (la bonne photo du bon joueur)", () => {
  const photo = { thumbnail: { source: "https://upload.wikimedia.org/x.jpg" }, pageimage: "x.jpg" };

  it("ignore un homonyme né une autre année (cas réel : Mark et Jude Bellingham)", () => {
    const pages = [
      { index: 1, title: "Mark Bellingham", description: "English footballer (born 1976)", ...photo },
      { index: 2, title: "Jude Bellingham", description: "English footballer (born 2003)", ...photo },
    ];
    expect(pickWikipediaPage(pages, "Jude Bellingham", "2003")?.title).toBe("Jude Bellingham");
  });

  it("refuse une page qui ne parle pas d'un footballeur", () => {
    const pages = [{ index: 1, title: "2026 Ballon d'Or", description: "Annual association award", ...photo }];
    expect(pickWikipediaPage(pages, "Yan Diomandé", "2006")).toBeNull();
  });

  it("sans année dans la description, exige le même nom (accents ignorés)", () => {
    const pages = [{ index: 1, title: "Nicolò Tresoldi", description: "German footballer", ...photo }];
    expect(pickWikipediaPage(pages, "Nicolo Tresoldi", "2004")?.title).toBe("Nicolò Tresoldi");
    expect(pickWikipediaPage(pages, "Nicolo Barella", "1997")).toBeNull();
  });

  it("ne renvoie rien si la bonne page n'a pas de photo", () => {
    const pages = [{ index: 1, title: "Hugo Duro", description: "Spanish footballer (born 1999)" }];
    expect(pickWikipediaPage(pages, "Hugo Duro", "1999")).toBeNull();
  });
});
