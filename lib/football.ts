import { cacheLife } from "next/cache";
import { connection } from "next/server";
import { COMPETITIONS } from "./competitions";
import { parisDate, shiftDate } from "./dates";
import { demoMatch, demoMatchDay } from "./demo";
import type { Match, MatchDay, StandingRow } from "./types";

// Toutes les données de foot passent par ce fichier.
// Le token reste sur le serveur : il n'est jamais envoyé au navigateur.
const API_URL = "https://api.football-data.org/v4";

function shouldUseDemoData(): boolean {
  return process.env.DEMO_MODE === "true" || !process.env.FOOTBALL_DATA_TOKEN;
}

async function callApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_TOKEN ?? "" },
  });
  if (!response.ok) {
    throw new Error(`football-data.org a répondu ${response.status} pour ${path}`);
  }
  return response.json();
}

// On attend la vraie visite avant de lire l'heure : sinon Next.js figerait la date du jour
// au moment de la compilation et l'app afficherait toujours la même journée.
async function todayInParis(): Promise<string> {
  await connection();
  return parisDate(new Date());
}

// --- Appels mis en cache -------------------------------------------------------------
// Le cache est partagé par tous les visiteurs : 20 téléphones qui ouvrent l'app = 1 seul appel
// à l'API (limite gratuite : 10 appels/minute). La durée dépend de la vitesse à laquelle la donnée change.

// Tous les matchs d'hier, aujourd'hui et demain en un seul appel (scores rafraîchis chaque minute).
async function fetchMatchWindow(today: string): Promise<Match[]> {
  "use cache: remote";
  cacheLife("minutes");

  const codes = COMPETITIONS.map((c) => c.code).join(",");
  // L'API raisonne en heure universelle et exclut le jour « dateTo » (vérifié le 4/11) :
  // on prend donc une marge d'un jour de chaque côté, puis on trie à l'heure de Paris.
  const data = await callApi<{ matches: Match[] }>(
    `/matches?competitions=${codes}&dateFrom=${shiftDate(today, -2)}&dateTo=${shiftDate(today, 2)}`,
  );
  return data.matches;
}

async function fetchMatch(id: number): Promise<Match> {
  "use cache: remote";
  cacheLife("minutes");
  return callApi<Match>(`/matches/${id}`);
}

// Tous les matchs terminés d'une équipe cette saison (sert à la forme et au bilan domicile/extérieur).
async function fetchTeamSeason(teamId: number): Promise<Match[]> {
  "use cache: remote";
  cacheLife("hours");
  const data = await callApi<{ matches: Match[] }>(`/teams/${teamId}/matches?status=FINISHED`);
  return data.matches;
}

// Les anciennes confrontations ne changent pas : on les garde une journée.
async function fetchHeadToHead(matchId: number): Promise<Match[]> {
  "use cache: remote";
  cacheLife("days");
  const data = await callApi<{ matches: Match[] }>(`/matches/${matchId}/head2head?limit=10`);
  return data.matches;
}

async function fetchStandings(code: string): Promise<StandingRow[]> {
  "use cache: remote";
  cacheLife("hours");
  const data = await callApi<{ standings: { type: string; table: StandingRow[] }[] }>(
    `/competitions/${code}/standings`,
  );
  return data.standings.find((s) => s.type === "TOTAL")?.table ?? [];
}

// --- Fonctions utilisées par les pages ----------------------------------------------

// dayOffset : -1 = hier, 0 = aujourd'hui, 1 = demain.
export async function getMatchDay(dayOffset: number): Promise<MatchDay> {
  if (shouldUseDemoData()) return demoMatchDay(dayOffset);

  const today = await todayInParis();
  const date = shiftDate(today, dayOffset);
  try {
    const matches = (await fetchMatchWindow(today)).filter((m) => parisDate(new Date(m.utcDate)) === date);
    return { date, matches, source: "api", sample: false };
  } catch (error) {
    // L'API est en panne ou la limite est atteinte : on bascule sur les données de secours.
    console.error(error);
    return demoMatchDay(dayOffset);
  }
}

export async function getMatch(id: number): Promise<Match | null> {
  if (shouldUseDemoData()) return demoMatch(id);

  try {
    // Le plus souvent, le match est déjà dans la fenêtre d'hier à demain : pas d'appel en plus.
    const fromWindow = (await fetchMatchWindow(await todayInParis())).find((m) => m.id === id);
    return fromWindow ?? (await fetchMatch(id));
  } catch (error) {
    console.error(error);
    return demoMatch(id);
  }
}

// Ces données sont « en bonus » : si elles manquent, la page s'affiche quand même (null = indisponible).
export const getTeamSeason = (teamId: number) => safely(() => fetchTeamSeason(teamId));
export const getHeadToHead = (matchId: number) => safely(() => fetchHeadToHead(matchId));
export const getStandings = (code: string) => safely(() => fetchStandings(code));

async function safely<T>(load: () => Promise<T>): Promise<T | null> {
  if (shouldUseDemoData()) return null;
  try {
    return await load();
  } catch (error) {
    console.error(error);
    return null;
  }
}
