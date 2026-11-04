import { cacheLife } from "next/cache";
import { connection } from "next/server";
import { COMPETITIONS } from "./competitions";
import { parisDate, shiftDate } from "./dates";
import { demoMatch, demoMatchDay, demoUpcomingMatches } from "./demo";
import { withLiveScores } from "./live";
import type { Match, MatchDay, Scorer, StandingRow, TeamInfo } from "./types";

// Toutes les données de foot passent par ce fichier.
// Le token reste sur le serveur : il n'est jamais envoyé au navigateur.
const API_URL = "https://api.football-data.org/v4";

function shouldUseDemoData(): boolean {
  return process.env.DEMO_MODE === "true" || !process.env.FOOTBALL_DATA_TOKEN;
}

// File d'attente : comme un videur à l'entrée, on ne laisse jamais passer plus de
// 10 appels vers l'API sur une minute glissante. Les appels en trop patientent ici.
const MAX_CALLS_PER_MINUTE = 10;
const recentCalls: number[] = []; // l'heure (en millisecondes) de chaque appel récent

async function waitForSlot(): Promise<void> {
  while (true) {
    const now = Date.now();
    while (recentCalls.length > 0 && now - recentCalls[0] > 61_000) recentCalls.shift();
    if (recentCalls.length < MAX_CALLS_PER_MINUTE) {
      recentCalls.push(now);
      return;
    }
    // On attend que le plus ancien appel sorte de la minute glissante.
    await new Promise((resolve) => setTimeout(resolve, 61_000 - (now - recentCalls[0]) + 100));
  }
}

// Si plusieurs visiteurs demandent la même donnée au même moment (avant qu'elle soit en cache),
// on n'envoie qu'UN appel et tout le monde partage la réponse : 20 téléphones = 1 appel, pas 20.
const inFlight = new Map<string, Promise<unknown>>();

function callApi<T>(path: string): Promise<T> {
  const pending = inFlight.get(path);
  if (pending) return pending as Promise<T>;

  const request = sendRequest<T>(path).finally(() => inFlight.delete(path));
  inFlight.set(path, request);
  return request;
}

async function sendRequest<T>(path: string, retry = true): Promise<T> {
  await waitForSlot();
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_TOKEN ?? "" },
  });

  // Filet de sécurité : si l'API répond quand même 429 (limite atteinte, par exemple parce qu'un
  // autre programme utilise la même clé), elle indique dans combien de secondes (60 au maximum)
  // le compteur repart à zéro : on patiente, puis on réessaie une seule fois.
  // Pendant ce temps, seul le bloc concerné de la page reste en chargement.
  if (response.status === 429 && retry) {
    const seconds = Math.min(Number(response.headers.get("X-RequestCounter-Reset")) || 60, 60);
    await new Promise((resolve) => setTimeout(resolve, (seconds + 1) * 1000));
    return sendRequest<T>(path, false);
  }

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

// Le match a-t-il lieu aujourd'hui (heure de Paris) ?
export async function isToday(utcDate: string): Promise<boolean> {
  return parisDate(new Date(utcDate)) === (await todayInParis());
}

// --- Appels mis en cache -------------------------------------------------------------
// Le cache est partagé par tous les visiteurs : 20 téléphones qui ouvrent l'app = 1 seul appel
// à l'API (limite gratuite : 10 appels/minute). La durée dépend de la vitesse à laquelle la donnée change.

// Nombre de jours affichés de chaque côté d'aujourd'hui (3 = une semaine de J-3 à J+3).
export const DAYS_AROUND = 3;

// Tous les matchs de la semaine en un seul appel (scores rafraîchis chaque minute).
async function fetchMatchWindow(today: string): Promise<Match[]> {
  "use cache: remote";
  cacheLife("minutes");

  const codes = COMPETITIONS.map((c) => c.code).join(",");
  // L'API raisonne en heure universelle et exclut le jour « dateTo » (vérifié le 4/11) :
  // on prend donc une marge d'un jour de chaque côté, puis on trie à l'heure de Paris.
  // Ça fait 8 jours d'un coup, sous le maximum de 10 jours autorisé par l'API.
  const data = await callApi<{ matches: Match[] }>(
    `/matches?competitions=${codes}&dateFrom=${shiftDate(today, -DAYS_AROUND - 1)}&dateTo=${shiftDate(today, DAYS_AROUND + 1)}`,
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
// limit=50 : sans ça l'API s'arrête à 15, et deux rivaux d'un même championnat dépassent vite ce nombre.
async function fetchHeadToHead(matchId: number): Promise<Match[]> {
  "use cache: remote";
  cacheLife("days");
  const data = await callApi<{ matches: Match[] }>(`/matches/${matchId}/head2head?limit=50`);
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

// Les 100 meilleurs buteurs d'une compétition (sert au « joueur à surveiller »).
async function fetchScorers(code: string): Promise<Scorer[]> {
  "use cache: remote";
  cacheLife("hours");
  const data = await callApi<{ scorers: Scorer[] }>(`/competitions/${code}/scorers?limit=100`);
  return data.scorers;
}

// Les clubs d'un championnat avec leurs couleurs, leur stade et leur année de création (pour le quiz).
// On ne garde que ces champs : l'API renvoie aussi tout l'effectif, inutile ici.
async function fetchTeams(code: string): Promise<TeamInfo[]> {
  "use cache: remote";
  cacheLife("days");
  const data = await callApi<{ teams: (TeamInfo & Record<string, unknown>)[] }>(`/competitions/${code}/teams`);
  return data.teams.map(({ id, shortName, tla, crest, founded, clubColors, venue }) => ({
    id,
    shortName,
    tla,
    crest,
    founded,
    clubColors,
    venue,
  }));
}

// --- Fonctions utilisées par les pages ----------------------------------------------

// dayOffset : -1 = hier, 0 = aujourd'hui, 1 = demain… de -DAYS_AROUND à +DAYS_AROUND.
export async function getMatchDay(dayOffset: number): Promise<MatchDay> {
  if (shouldUseDemoData()) return demoMatchDay(dayOffset);

  const today = await todayInParis();
  const date = shiftDate(today, dayOffset);
  try {
    const matches = (await fetchMatchWindow(today)).filter((m) => parisDate(new Date(m.utcDate)) === date);
    // Aujourd'hui seulement : on complète avec le direct (score à jour, minute, buteurs).
    return { date, matches: dayOffset === 0 ? await withLiveScores(matches, date) : matches, source: "api", sample: false };
  } catch (error) {
    // L'API est en panne ou la limite est atteinte : on bascule sur les données de secours.
    console.error(error);
    return demoMatchDay(dayOffset);
  }
}

export async function getMatch(id: number): Promise<Match | null> {
  if (shouldUseDemoData()) return demoMatch(id);

  try {
    // Le plus souvent, le match est déjà dans la fenêtre de la semaine : pas d'appel en plus.
    const today = await todayInParis();
    const match = (await fetchMatchWindow(today)).find((m) => m.id === id) ?? (await fetchMatch(id));
    // Match du jour : on complète avec le direct (score à jour, minute, buteurs).
    if (parisDate(new Date(match.utcDate)) === today) return (await withLiveScores([match], today))[0];
    return match;
  } catch (error) {
    console.error(error);
    return demoMatch(id);
  }
}

// Ces données sont « en bonus » : si elles manquent, la page s'affiche quand même (null = indisponible).
export const getTeamSeason = (teamId: number) => safely(() => fetchTeamSeason(teamId));
export const getHeadToHead = (matchId: number) => safely(() => fetchHeadToHead(matchId));
export const getStandings = (code: string) => safely(() => fetchStandings(code));
export const getScorers = (code: string) => safely(() => fetchScorers(code));
export const getTeams = (code: string) => safely(() => fetchTeams(code));

// Les matchs pas encore commencés de la semaine (pour proposer « le prochain match de ton équipe »).
export async function getUpcomingMatches(): Promise<Match[]> {
  const upcoming = (m: Match, now: string) => (m.status === "SCHEDULED" || m.status === "TIMED") && m.utcDate > now;
  if (shouldUseDemoData()) return demoUpcomingMatches();

  const today = await todayInParis();
  const now = new Date().toISOString();
  try {
    return (await fetchMatchWindow(today)).filter((m) => upcoming(m, now));
  } catch (error) {
    console.error(error);
    return demoUpcomingMatches();
  }
}

async function safely<T>(load: () => Promise<T>): Promise<T | null> {
  if (shouldUseDemoData()) return null;
  try {
    return await load();
  } catch (error) {
    console.error(error);
    return null;
  }
}
