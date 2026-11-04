import { parisDate, shiftDate } from "./dates";
import type { Match, MatchDay } from "./types";
import snapshot from "@/data/demo/matches.json";

// Données de secours enregistrées dans data/demo/.
// Elles servent si l'API ne répond pas, si aucune clé n'est configurée, ou si DEMO_MODE=true.
type Snapshot = { referenceDate: string; sample: boolean; matches: Match[] };
const demo = snapshot as Snapshot;

// En mode secours, « aujourd'hui » devient le jour où l'instantané a été pris,
// pour que hier / aujourd'hui / demain gardent un sens.
export function demoMatchDay(dayOffset: number): MatchDay {
  const date = shiftDate(demo.referenceDate, dayOffset);
  return {
    date,
    matches: demo.matches.filter((m) => parisDate(new Date(m.utcDate)) === date),
    source: "demo",
    sample: demo.sample,
  };
}
