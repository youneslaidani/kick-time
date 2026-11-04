// Les championnats suivis par Kick-Time, dans l'ordre d'affichage.
// Tous sont inclus dans le plan gratuit de football-data.org.
export const COMPETITIONS = [
  { code: "CL", label: "Ligue des champions" },
  { code: "FL1", label: "Ligue 1" },
  { code: "PL", label: "Premier League" },
  { code: "PD", label: "Liga" },
  { code: "SA", label: "Serie A" },
  { code: "BL1", label: "Bundesliga" },
] as const;

export type CompetitionCode = (typeof COMPETITIONS)[number]["code"];

export function competitionLabel(code: string): string {
  return COMPETITIONS.find((c) => c.code === code)?.label ?? code;
}

// Position dans la liste, pour trier les groupes de matchs.
export function competitionRank(code: string): number {
  const index = COMPETITIONS.findIndex((c) => c.code === code);
  return index === -1 ? COMPETITIONS.length : index;
}
