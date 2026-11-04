import { describe, expect, it } from "vitest";
import { favouriteSentence, readingTime, storySlides, type StoryData } from "./story";

const data: StoryData = {
  home: { name: "Valencia", crest: "", tla: "VAL" },
  away: { name: "Real Madrid", crest: "", tla: "RMA" },
  competition: "Liga, journée 12",
  when: "samedi 7 novembre à 21 h",
  enjeu: "Valencia veut sortir de la zone de relégation.",
  probabilities: { home: 13, draw: 18, away: 69 },
  form: { home: ["D", "N", "N", "D", "V"], away: ["V", "V", "V", "V", "V"] },
  player: { name: "Kylian Mbappé", photo: null, goals: 12, played: 11, crest: "", tla: "RMA" },
  suspense: { level: 2, label: "Plutôt à sens unique", reason: "Le Real est nettement au-dessus." },
};

describe("storySlides", () => {
  it("enchaîne les 7 slides dans l'ordre quand toutes les données sont là", () => {
    expect(storySlides(data).map((s) => s.id)).toEqual(["intro", "enjeu", "favori", "forme", "joueur", "suspense", "outro"]);
  });

  it("présente l'affiche avec une majuscule en début de phrase", () => {
    expect(storySlides(data)[0].speech).toBe("Liga, journée 12. Samedi 7 novembre à 21 h, Valencia reçoit Real Madrid.");
  });

  it("saute les slides dont les données manquent", () => {
    const ids = storySlides({ ...data, probabilities: null, player: null }).map((s) => s.id);
    expect(ids).not.toContain("favori");
    expect(ids).not.toContain("joueur");
  });

  it("présente le joueur avec ses vrais chiffres", () => {
    expect(storySlides(data).find((s) => s.id === "joueur")?.speech).toBe(
      "Le joueur à surveiller : Kylian Mbappé, 12 buts en 11 matchs.",
    );
  });
});

describe("formSentence", () => {
  it("résume la forme en une phrase courte, avec les bons accords", () => {
    expect(storySlides(data).find((s) => s.id === "forme")?.speech).toBe(
      "Sur leurs 5 derniers matchs, Valencia compte 1 victoire, Real Madrid 5 victoires.",
    );
  });
});

describe("favouriteSentence", () => {
  it("nomme le favori quand l'écart est net", () => {
    expect(favouriteSentence("Valencia", "Real Madrid", { home: 13, draw: 18, away: 69 })).toContain(
      "Real Madrid part favori avec 69 %",
    );
  });

  it("parle d'un match ouvert quand c'est serré", () => {
    expect(favouriteSentence("Lens", "Lille", { home: 38, draw: 28, away: 34 })).toContain("très ouvert");
  });
});

describe("readingTime", () => {
  it("laisse au moins 3,5 secondes par slide", () => {
    expect(readingTime("Court.")).toBe(3500);
    expect(readingTime("x".repeat(100))).toBe(6500);
  });
});
