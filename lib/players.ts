import type { Match, Scorer } from "./types";

// « Le joueur à surveiller » : choisi par le code à partir des vrais chiffres (meilleurs buteurs),
// jamais inventé par l'IA. La photo vient de Wikipédia (voir player-photo.ts).

// Le meilleur buteur des deux équipes dans la compétition du match.
// À égalité de buts : celui qui marque le plus souvent, puis celui qui fait le plus de passes décisives.
export function playerToWatch(scorers: Scorer[], match: Match): Scorer | null {
  const teams = [match.homeTeam.id, match.awayTeam.id];
  const candidates = scorers.filter((s) => teams.includes(s.team.id) && s.goals > 0);
  candidates.sort(
    (a, b) =>
      b.goals - a.goals ||
      b.goals / b.playedMatches - a.goals / a.playedMatches ||
      (b.assists ?? 0) - (a.assists ?? 0),
  );
  return candidates[0] ?? null;
}

// Âge du joueur le jour du match (et pas le jour où on regarde l'app).
export function ageAt(dateOfBirth: string, date: string): number {
  const birth = new Date(dateOfBirth);
  const day = new Date(date);
  let age = day.getUTCFullYear() - birth.getUTCFullYear();
  const birthdayPassed =
    day.getUTCMonth() > birth.getUTCMonth() ||
    (day.getUTCMonth() === birth.getUTCMonth() && day.getUTCDate() >= birth.getUTCDate());
  if (!birthdayPassed) age--;
  return age;
}

const POSITIONS: Record<string, string> = {
  Offence: "Attaquant",
  Midfield: "Milieu de terrain",
  Defence: "Défenseur",
  Goalkeeper: "Gardien",
};

export function positionLabel(section: string | null): string | null {
  return section ? (POSITIONS[section] ?? section) : null;
}
