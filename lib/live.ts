import { cacheLife } from "next/cache";
import type { Match, MatchStatus } from "./types";

// Le direct : score à la minute près, minute de jeu et buteurs.
// L'offre gratuite de football-data.org donne des scores en différé et aucun buteur (vérifié le 4/11 :
// 0-0 affiché alors qu'un but avait été marqué à la 12e). On complète donc avec l'API publique d'ESPN
// (gratuite, sans clé, mais non officielle : si elle ne répond pas, on garde simplement les données habituelles).

const ESPN_LEAGUE: Record<string, string> = {
  CL: "uefa.champions",
  FL1: "fra.1",
  PL: "eng.1",
  PD: "esp.1",
  SA: "ita.1",
  BL1: "ger.1",
};

export type Goal = {
  minute: string; // « 12' », « 45'+2' »
  scorer: string;
  scorerShort: string; // « A. Koita » : pour les petites cartes
  side: "home" | "away"; // l'équipe qui en profite
  penalty: boolean;
  ownGoal: boolean;
};

export type LiveInfo = {
  clock: string | null; // minute de jeu pendant le match, ex. « 67' »
  goals: Goal[];
};

// Ce qu'on garde d'un match ESPN (le strict nécessaire, pour un cache léger).
export type EspnEvent = {
  date: string;
  state: "pre" | "in" | "post";
  statusName: string; // ex. STATUS_FIRST_HALF, STATUS_HALFTIME, STATUS_FULL_TIME
  completed: boolean;
  clock: string;
  teams: { side: "home" | "away"; id: string; names: string[]; score: number }[];
  goals: { minute: string; scorer: string; scorerShort: string; teamId: string; penalty: boolean; ownGoal: boolean }[];
};

// --- Lecture de la réponse d'ESPN ----------------------------------------------------

type RawEvent = {
  date: string;
  competitions: {
    status: { displayClock: string; type: { name: string; state: "pre" | "in" | "post"; completed: boolean } };
    competitors: {
      homeAway: "home" | "away";
      score: string;
      team: { id: string; displayName: string; shortDisplayName?: string; name?: string };
    }[];
    details?: {
      clock?: { displayValue: string };
      team?: { id: string };
      scoringPlay?: boolean;
      penaltyKick?: boolean;
      ownGoal?: boolean;
      shootout?: boolean;
      athletesInvolved?: { displayName: string; shortName?: string }[];
    }[];
  }[];
};

export function toEspnEvent(raw: RawEvent): EspnEvent {
  const competition = raw.competitions[0];
  return {
    date: raw.date,
    state: competition.status.type.state,
    statusName: competition.status.type.name,
    completed: competition.status.type.completed,
    clock: competition.status.displayClock,
    teams: competition.competitors.map((c) => ({
      side: c.homeAway,
      id: c.team.id,
      names: [c.team.displayName, c.team.shortDisplayName ?? "", c.team.name ?? ""],
      score: Number(c.score) || 0,
    })),
    goals: (competition.details ?? [])
      .filter((d) => d.scoringPlay && !d.shootout) // les tirs au but ne sont pas des buts du match
      .map((d) => ({
        minute: d.clock?.displayValue ?? "",
        scorer: d.athletesInvolved?.[0]?.displayName ?? "Buteur inconnu",
        scorerShort: d.athletesInvolved?.[0]?.shortName ?? d.athletesInvolved?.[0]?.displayName ?? "Buteur inconnu",
        teamId: d.team?.id ?? "",
        penalty: Boolean(d.penaltyKick),
        ownGoal: Boolean(d.ownGoal),
      })),
  };
}

// --- Retrouver le même match dans les deux sources -------------------------------------
// Les noms ne s'écrivent pas pareil (« PAE AEK » / « AEK Athens », « Man City » / « Manchester City ») :
// on compare l'heure du coup d'envoi, puis les mots des noms.

const IGNORED_WORDS = new Set(["fc", "cf", "ac", "sc", "afc", "ssc", "pae", "as", "rc", "sv", "fk", "sk", "club", "de", "cd", "ud", "olympique", "stade"]);

export function nameWords(name: string): string[] {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 0 && !IGNORED_WORDS.has(w));
}

// Deux mots « se ressemblent » s'ils sont égaux, si l'un commence l'autre (man / manchester)
// ou s'ils ont le même début sur 4 lettres (barca / barcelona, rennais / rennes).
function sameWord(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.min(a.length, b.length) >= 3 && (a.startsWith(b) || b.startsWith(a))) return true;
  return a.length >= 4 && b.length >= 4 && a.slice(0, 4) === b.slice(0, 4);
}

function similarity(ours: string[], theirs: string[]): number {
  const theirWords = theirs.flatMap(nameWords);
  return new Set(ours.flatMap(nameWords).filter((w) => theirWords.some((t) => sameWord(w, t)))).size;
}

export function findEspnEvent(match: Match, events: EspnEvent[]): EspnEvent | null {
  const kickoff = new Date(match.utcDate).getTime();
  let best: EspnEvent | null = null;
  let bestScore = 0;
  for (const event of events) {
    if (Math.abs(new Date(event.date).getTime() - kickoff) > 15 * 60_000) continue; // pas à la même heure
    const home = event.teams.find((t) => t.side === "home");
    const away = event.teams.find((t) => t.side === "away");
    if (!home || !away) continue;
    const homeScore = similarity([match.homeTeam.name, match.homeTeam.shortName], home.names);
    const awayScore = similarity([match.awayTeam.name, match.awayTeam.shortName], away.names);
    if (homeScore === 0 || awayScore === 0) continue; // il faut reconnaître les DEUX équipes
    if (homeScore + awayScore > bestScore) {
      best = event;
      bestScore = homeScore + awayScore;
    }
  }
  return best;
}

// --- Mettre le match à jour avec le direct ----------------------------------------------

function liveStatus(event: EspnEvent, current: MatchStatus): MatchStatus {
  if (event.statusName.includes("POSTPONED")) return "POSTPONED";
  if (event.statusName.includes("CANCELED")) return "CANCELLED";
  if (event.state === "in") return event.statusName.includes("HALFTIME") ? "PAUSED" : "IN_PLAY";
  if (event.state === "post" && event.completed) return "FINISHED";
  return current; // pas encore commencé : on garde l'information de football-data.org
}

export function applyLive(match: Match, event: EspnEvent): Match {
  const status = liveStatus(event, match.status);
  if (status === "SCHEDULED" || status === "TIMED") return match;

  const home = event.teams.find((t) => t.side === "home")!;
  const away = event.teams.find((t) => t.side === "away")!;
  const winner = status !== "FINISHED" ? null : home.score > away.score ? "HOME_TEAM" : home.score < away.score ? "AWAY_TEAM" : "DRAW";
  return {
    ...match,
    status,
    score: { ...match.score, winner, fullTime: { home: home.score, away: away.score } },
    live: {
      clock: event.state === "in" ? event.clock : null,
      goals: event.goals.map((g) => ({
        minute: g.minute,
        scorer: g.scorer,
        scorerShort: g.scorerShort,
        side: g.teamId === away.id ? "away" : "home",
        penalty: g.penalty,
        ownGoal: g.ownGoal,
      })),
    },
  };
}

// --- Appel à ESPN (mis en cache 20 secondes, partagé par tous les visiteurs) ------------

async function fetchScoreboard(league: string, day: string): Promise<EspnEvent[]> {
  "use cache: remote";
  cacheLife({ stale: 15, revalidate: 20, expire: 600 });
  const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${day}`);
  if (!response.ok) throw new Error(`ESPN a répondu ${response.status}`);
  const data: { events?: RawEvent[] } = await response.json();
  return (data.events ?? []).map(toEspnEvent);
}

// Complète une liste de matchs d'un même jour avec le direct d'ESPN. En cas de souci, on renvoie la liste telle quelle.
export async function withLiveScores(matches: Match[], parisDay: string): Promise<Match[]> {
  const day = parisDay.replaceAll("-", "");
  const leagues = [...new Set(matches.map((m) => m.competition.code))].filter((code) => ESPN_LEAGUE[code]);
  const boards = await Promise.all(
    leagues.map(async (code): Promise<[string, EspnEvent[]]> => {
      try {
        return [code, await fetchScoreboard(ESPN_LEAGUE[code], day)];
      } catch (error) {
        console.error(error);
        return [code, []];
      }
    }),
  );
  const byLeague = new Map(boards);
  return matches.map((match) => {
    const event = findEspnEvent(match, byLeague.get(match.competition.code) ?? []);
    return event ? applyLive(match, event) : match;
  });
}
