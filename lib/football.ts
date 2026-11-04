import { cacheLife } from "next/cache";
import { connection } from "next/server";
import { COMPETITIONS } from "./competitions";
import { parisDate, shiftDate } from "./dates";
import { demoMatchDay } from "./demo";
import type { Match, MatchDay } from "./types";

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

// Cache partagé par tous les visiteurs pendant 1 minute :
// 20 téléphones qui ouvrent l'app = 1 seul appel à l'API (limite gratuite : 10 appels/minute).
async function fetchMatchesOfDay(date: string): Promise<Match[]> {
  "use cache: remote";
  cacheLife("minutes");

  const codes = COMPETITIONS.map((c) => c.code).join(",");
  // L'API raisonne en heure universelle et exclut le jour « dateTo » (vérifié le 4/11) :
  // on demande donc de la veille au lendemain, puis on garde les matchs de ce jour-là à l'heure de Paris.
  const data = await callApi<{ matches: Match[] }>(
    `/matches?competitions=${codes}&dateFrom=${shiftDate(date, -1)}&dateTo=${shiftDate(date, 1)}`,
  );
  return data.matches.filter((m) => parisDate(new Date(m.utcDate)) === date);
}

// dayOffset : -1 = hier, 0 = aujourd'hui, 1 = demain.
export async function getMatchDay(dayOffset: number): Promise<MatchDay> {
  if (shouldUseDemoData()) return demoMatchDay(dayOffset);

  // On attend la vraie visite avant de lire l'heure : sinon Next.js figerait la date du jour
  // au moment de la compilation et l'app afficherait toujours la même journée.
  await connection();
  const date = shiftDate(parisDate(new Date()), dayOffset);
  try {
    return { date, matches: await fetchMatchesOfDay(date), source: "api", sample: false };
  } catch (error) {
    // L'API est en panne ou la limite est atteinte : on bascule sur les données de secours.
    console.error(error);
    return demoMatchDay(dayOffset);
  }
}
