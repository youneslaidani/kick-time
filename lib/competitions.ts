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

export function isCompetitionCode(code: unknown): code is CompetitionCode {
  return COMPETITIONS.some((c) => c.code === code);
}

// Zones colorées du classement, pour comprendre d'un coup d'œil ce que vaut chaque place.
// Places indicatives : le nombre exact de places européennes change un peu chaque saison.
export type ZoneKind = "top" | "europe" | "playoff" | "bottom";
export type Zone = { from: number; to: number; kind: ZoneKind; label: string };

const BIG_LEAGUE: Zone[] = [
  { from: 1, to: 4, kind: "top", label: "Ligue des champions la saison prochaine" },
  { from: 5, to: 6, kind: "europe", label: "Ligue Europa ou Ligue Conférence" },
  { from: 18, to: 20, kind: "bottom", label: "Relégation en deuxième division" },
];
const LEAGUE_OF_18: Zone[] = [
  { from: 1, to: 4, kind: "top", label: "Ligue des champions la saison prochaine" },
  { from: 5, to: 6, kind: "europe", label: "Ligue Europa ou Ligue Conférence" },
  { from: 16, to: 16, kind: "playoff", label: "Barrage pour ne pas descendre" },
  { from: 17, to: 18, kind: "bottom", label: "Relégation en deuxième division" },
];

export const ZONES: Record<CompetitionCode, Zone[]> = {
  CL: [
    { from: 1, to: 8, kind: "top", label: "Qualifiés directement pour les huitièmes de finale" },
    { from: 9, to: 24, kind: "europe", label: "Barrages pour aller en huitièmes" },
    { from: 25, to: 36, kind: "bottom", label: "Éliminés" },
  ],
  FL1: LEAGUE_OF_18,
  BL1: LEAGUE_OF_18,
  PL: BIG_LEAGUE,
  PD: BIG_LEAGUE,
  SA: BIG_LEAGUE,
};

export function zoneOf(code: CompetitionCode, position: number): Zone | undefined {
  return ZONES[code].find((z) => position >= z.from && position <= z.to);
}

// Position dans la liste, pour trier les groupes de matchs.
export function competitionRank(code: string): number {
  const index = COMPETITIONS.findIndex((c) => c.code === code);
  return index === -1 ? COMPETITIONS.length : index;
}
