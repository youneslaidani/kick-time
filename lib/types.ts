// Formes des données renvoyées par l'API football-data.org (v4).
// On ne décrit que les champs dont l'app a besoin.

export type MatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "LIVE"
  | "FINISHED"
  | "AWARDED"
  | "POSTPONED"
  | "SUSPENDED"
  | "CANCELLED";

export type Team = {
  id: number;
  name: string;
  shortName: string;
  tla: string; // abréviation en 3 lettres, ex. « PSG »
  crest: string; // URL du logo
};

export type Competition = {
  id: number;
  name: string;
  code: string; // ex. « FL1 » pour la Ligue 1
  emblem: string;
};

export type Score = {
  winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
  fullTime: { home: number | null; away: number | null };
  halfTime: { home: number | null; away: number | null };
};

export type Match = {
  id: number;
  utcDate: string; // date et heure du coup d'envoi, en temps universel
  status: MatchStatus;
  matchday: number | null;
  stage: string;
  competition: Competition;
  homeTeam: Team;
  awayTeam: Team;
  score: Score;
};

// Ce que reçoit l'écran des matchs : la journée affichée + d'où viennent les données.
export type MatchDay = {
  date: string; // AAAA-MM-JJ, heure de Paris
  matches: Match[];
  source: "api" | "demo";
  sample: boolean; // true = données d'exemple inventées (avant le premier vrai instantané)
};
