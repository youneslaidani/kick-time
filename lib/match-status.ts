import type { MatchStatus } from "./types";

export function isLive(status: MatchStatus): boolean {
  return status === "IN_PLAY" || status === "PAUSED" || status === "LIVE";
}

export function isFinished(status: MatchStatus): boolean {
  return status === "FINISHED" || status === "AWARDED";
}

// Texte court affiché sous le score. null = rien à afficher (match à venir : on montre l'heure).
export function statusLabel(status: MatchStatus): string | null {
  switch (status) {
    case "IN_PLAY":
    case "LIVE":
      return "En direct";
    case "PAUSED":
      return "Mi-temps";
    case "FINISHED":
    case "AWARDED":
      return "Terminé";
    case "POSTPONED":
      return "Reporté";
    case "SUSPENDED":
      return "Suspendu";
    case "CANCELLED":
      return "Annulé";
    default:
      return null;
  }
}
