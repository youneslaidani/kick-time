import { describe, expect, it } from "vitest";
import { applyLive, findEspnEvent, nameWords, toEspnEvent, type EspnEvent } from "./live";
import { match } from "./test-fixtures";
import type { Team } from "./types";

const team = (id: number, name: string, shortName: string): Team => ({ id, name, shortName, tla: "XXX", crest: "" });

// Un match ESPN, construit comme la vraie réponse reçue le 4/11 (AEK - Real Madrid, but de Koita à la 12e).
const raw = (date: string, home: string, away: string, homeScore: string, awayScore: string, status = "STATUS_FIRST_HALF", state: "pre" | "in" | "post" = "in") => ({
  date,
  competitions: [
    {
      status: { displayClock: "18'", type: { name: status, state, completed: state === "post" } },
      competitors: [
        { homeAway: "home" as const, score: homeScore, team: { id: "887", displayName: home } },
        { homeAway: "away" as const, score: awayScore, team: { id: "86", displayName: away } },
      ],
      details: [
        {
          clock: { displayValue: "12'" },
          team: { id: "887" },
          scoringPlay: true,
          penaltyKick: false,
          ownGoal: false,
          athletesInvolved: [{ displayName: "Aboubakary Koita", shortName: "A. Koita" }],
        },
        { clock: { displayValue: "15'" }, team: { id: "86" }, scoringPlay: false, athletesInvolved: [{ displayName: "Carton jaune" }] },
      ],
    },
  ],
});

const AEK = team(1, "PAE AEK", "PAE AEK");
const REAL = team(2, "Real Madrid CF", "Real Madrid");
const aekReal = match("2026-11-04", AEK, REAL, 0, 0, "IN_PLAY", "CL");
aekReal.utcDate = "2026-11-04T17:45:00Z";

describe("toEspnEvent", () => {
  it("garde le score, la minute et seulement les buts", () => {
    const event = toEspnEvent(raw("2026-11-04T17:45Z", "AEK Athens", "Real Madrid", "1", "0"));
    expect(event.teams.map((t) => t.score)).toEqual([1, 0]);
    expect(event.clock).toBe("18'");
    expect(event.goals).toEqual([{ minute: "12'", scorer: "Aboubakary Koita", scorerShort: "A. Koita", teamId: "887", penalty: false, ownGoal: false }]);
  });
});

describe("findEspnEvent (le même match dans les deux sources)", () => {
  const events: EspnEvent[] = [
    toEspnEvent(raw("2026-11-04T17:45Z", "Fenerbahce", "Liverpool", "0", "0")),
    toEspnEvent(raw("2026-11-04T17:45Z", "AEK Athens", "Real Madrid", "1", "0")),
  ];

  it("reconnaît « PAE AEK » dans « AEK Athens », à la même heure", () => {
    expect(findEspnEvent(aekReal, events)?.teams[0].names[0]).toBe("AEK Athens");
  });

  it("reconnaît les noms abrégés : Man City, Barça, PSG", () => {
    const city = toEspnEvent(raw("2026-11-04T20:00Z", "RB Leipzig", "Manchester City", "0", "0"));
    const leipzigCity = { ...match("2026-11-04", team(3, "RB Leipzig", "RB Leipzig"), team(4, "Manchester City FC", "Man City"), null, null, "TIMED"), utcDate: "2026-11-04T20:00:00Z" };
    expect(findEspnEvent(leipzigCity, [city])).not.toBeNull();

    const barca = toEspnEvent(raw("2026-11-07T20:00Z", "Barcelona", "Paris Saint-Germain", "0", "0"));
    const barcaPsg = { ...match("2026-11-07", team(5, "FC Barcelona", "Barça"), team(6, "Paris Saint-Germain FC", "PSG"), null, null, "TIMED"), utcDate: "2026-11-07T20:00:00Z" };
    expect(findEspnEvent(barcaPsg, [barca])).not.toBeNull();
  });

  it("ne confond pas avec un match joué à une autre heure", () => {
    const later = { ...aekReal, utcDate: "2026-11-04T20:00:00Z" };
    expect(findEspnEvent(later, events)).toBeNull();
  });

  it("ignore les accents et les mots comme FC ou Olympique", () => {
    expect(nameWords("Fenerbahçe SK")).toEqual(["fenerbahce"]);
    expect(nameWords("Olympique de Marseille")).toEqual(["marseille"]);
  });
});

describe("applyLive (mettre le match à jour)", () => {
  it("affiche le vrai score, la minute et le buteur du bon côté", () => {
    const updated = applyLive(aekReal, toEspnEvent(raw("2026-11-04T17:45Z", "AEK Athens", "Real Madrid", "1", "0")));
    expect(updated.score.fullTime).toEqual({ home: 1, away: 0 });
    expect(updated.status).toBe("IN_PLAY");
    expect(updated.live).toEqual({ clock: "18'", goals: [{ minute: "12'", scorer: "Aboubakary Koita", scorerShort: "A. Koita", side: "home", penalty: false, ownGoal: false }] });
  });

  it("passe en « Mi-temps » à la pause et en « Terminé » à la fin, avec le vainqueur", () => {
    const pause = applyLive(aekReal, toEspnEvent(raw("2026-11-04T17:45Z", "AEK Athens", "Real Madrid", "1", "0", "STATUS_HALFTIME")));
    expect(pause.status).toBe("PAUSED");
    const end = applyLive(aekReal, toEspnEvent(raw("2026-11-04T17:45Z", "AEK Athens", "Real Madrid", "1", "2", "STATUS_FULL_TIME", "post")));
    expect(end.status).toBe("FINISHED");
    expect(end.score.winner).toBe("AWAY_TEAM");
    expect(end.live?.clock).toBeNull();
  });

  it("ne touche à rien avant le coup d'envoi", () => {
    const before = { ...aekReal, status: "TIMED" as const };
    expect(applyLive(before, toEspnEvent(raw("2026-11-04T17:45Z", "AEK Athens", "Real Madrid", "0", "0", "STATUS_SCHEDULED", "pre")))).toBe(before);
  });
});
