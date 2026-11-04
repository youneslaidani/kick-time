import { competitionLabel } from "./competitions";

// « Trouve ton équipe en 20 secondes » : pour quelqu'un qui ne suit pas le foot.
// 5 questions sans aucun mot technique → le code compare les réponses aux vraies infos
// de chaque club (couleurs, pays, classement, âge du club, nombre de buts) et choisit le plus proche.

export type ColorFamily = "rouge" | "bleu" | "blanc" | "noir" | "jaune" | "vert" | "violet" | "orange";
export type League = "FL1" | "PL" | "PD" | "SA" | "BL1";

export type QuizTeam = {
  id: number;
  name: string;
  crest: string;
  tla: string;
  league: League;
  colors: ColorFamily[]; // dans l'ordre du maillot (la 1re est la principale)
  colorsLabel: string; // « rouge et jaune »
  founded: number | null;
  venue: string | null;
  position: number;
  teamsInLeague: number;
  goalsPerMatch: number; // buts marqués + encaissés, par match
  nextMatch: { id: number; opponent: string; utcDate: string; atHome: boolean } | null;
};

export type Answers = {
  ambition: "favori" | "outsider" | "suspense";
  color: ColorFamily;
  country: League | "any";
  era: "history" | "modern";
  style: "goals" | "tension";
};

// --- Les questions (aucun mot de foot) ------------------------------------------

type Option<T> = { value: T; label: string; emoji: string };
export type Question<K extends keyof Answers = keyof Answers> = { id: K; title: string; options: Option<Answers[K]>[] };

export const QUESTIONS: Question[] = [
  {
    id: "ambition",
    title: "Dans le sport, ce que tu préfères…",
    options: [
      { value: "favori", label: "Voir les meilleurs gagner", emoji: "🏆" },
      { value: "outsider", label: "Voir un petit déjouer les pronostics", emoji: "✨" },
      { value: "suspense", label: "Vibrer jusqu'à la dernière seconde", emoji: "🎢" },
    ],
  },
  {
    id: "color",
    title: "Ta couleur préférée ?",
    options: [
      { value: "rouge", label: "Rouge", emoji: "🔴" },
      { value: "bleu", label: "Bleu", emoji: "🔵" },
      { value: "blanc", label: "Blanc", emoji: "⚪" },
      { value: "noir", label: "Noir", emoji: "⚫" },
      { value: "jaune", label: "Jaune / or", emoji: "🟡" },
      { value: "vert", label: "Vert", emoji: "🟢" },
      { value: "violet", label: "Violet", emoji: "🟣" },
      { value: "orange", label: "Orange", emoji: "🟠" },
    ],
  },
  {
    id: "country",
    title: "Un week-end de rêve, ce serait…",
    options: [
      { value: "FL1", label: "Paris, Lyon ou Marseille", emoji: "🇫🇷" },
      { value: "PL", label: "Londres ou Manchester", emoji: "🇬🇧" },
      { value: "PD", label: "Madrid ou Barcelone", emoji: "🇪🇸" },
      { value: "SA", label: "Rome ou Milan", emoji: "🇮🇹" },
      { value: "BL1", label: "Berlin ou Munich", emoji: "🇩🇪" },
      { value: "any", label: "Peu importe, surprends-moi", emoji: "🌍" },
    ],
  },
  {
    id: "era",
    title: "Tu es plutôt…",
    options: [
      { value: "history", label: "Histoire et traditions", emoji: "🏛️" },
      { value: "modern", label: "Jeunesse et nouveauté", emoji: "🚀" },
    ],
  },
  {
    id: "style",
    title: "Une bonne soirée, c'est…",
    options: [
      { value: "goals", label: "Du spectacle, de l'action, des rebondissements", emoji: "🎆" },
      { value: "tension", label: "Une partie d'échecs, tendue jusqu'au bout", emoji: "♟️" },
    ],
  },
];

// --- Les couleurs des clubs (l'API les donne en anglais) -------------------------

const COLOR_WORDS: [RegExp, ColorFamily][] = [
  [/red|claret|maroon|garnet|burgundy/i, "rouge"],
  [/blue|navy|azure/i, "bleu"],
  [/white/i, "blanc"],
  [/black/i, "noir"],
  [/yellow|gold/i, "jaune"],
  [/green/i, "vert"],
  [/violet|purple/i, "violet"],
  [/orange/i, "orange"],
];

const COLOR_NAMES: Record<ColorFamily, string> = {
  rouge: "rouge",
  bleu: "bleu",
  blanc: "blanc",
  noir: "noir",
  jaune: "jaune",
  vert: "vert",
  violet: "violet",
  orange: "orange",
};

// « Red / Navy Blue / White » → ["rouge", "bleu", "blanc"]
export function colorFamilies(clubColors: string | null): ColorFamily[] {
  if (!clubColors) return [];
  const families: ColorFamily[] = [];
  for (const part of clubColors.split("/")) {
    const family = COLOR_WORDS.find(([pattern]) => pattern.test(part))?.[1];
    if (family && !families.includes(family)) families.push(family);
  }
  return families;
}

// ["rouge", "bleu", "blanc"] → « rouge, bleu et blanc »
export function colorsLabel(families: ColorFamily[]): string {
  const names = families.map((f) => COLOR_NAMES[f]);
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} et ${names.at(-1)}`;
}

// --- Le choix de l'équipe ----------------------------------------------------------

const COUNTRY: Record<League, string> = { FL1: "France", PL: "Angleterre", PD: "Espagne", SA: "Italie", BL1: "Allemagne" };
// Où se situe l'équipe idéale dans le classement : 0 = 1re place, 1 = dernière place.
const TARGET_RANK = { favori: 0, outsider: 0.7, suspense: 0.4 };

export function scoreTeam(team: QuizTeam, answers: Answers, all: QuizTeam[]): number {
  let score = 0;

  // Couleur préférée : 3 points si c'est la couleur principale du maillot, 2 si elle y figure.
  if (team.colors[0] === answers.color) score += 3;
  else if (team.colors.includes(answers.color)) score += 2;

  // Pays de rêve : 3 points.
  if (answers.country === team.league) score += 3;

  // Place au classement : jusqu'à 3 points, d'autant plus qu'on est proche de la place idéale.
  const rank = team.teamsInLeague > 1 ? (team.position - 1) / (team.teamsInLeague - 1) : 0.5;
  score += 3 * (1 - Math.abs(rank - TARGET_RANK[answers.ambition]));

  // Âge du club : jusqu'à 1,5 point (comparé aux autres clubs).
  const years = all.map((t) => t.founded).filter((y): y is number => y !== null);
  const oldness = team.founded === null ? 0.5 : normalize(team.founded, Math.max(...years), Math.min(...years));
  score += 1.5 * (answers.era === "history" ? oldness : 1 - oldness);

  // Nombre de buts dans ses matchs : jusqu'à 1,5 point.
  const goals = all.map((t) => t.goalsPerMatch);
  const spectacular = normalize(team.goalsPerMatch, Math.min(...goals), Math.max(...goals));
  score += 1.5 * (answers.style === "goals" ? spectacular : 1 - spectacular);

  // Petit bonus si l'équipe joue cette semaine : on a un match à te proposer.
  if (team.nextMatch) score += 0.5;
  return score;
}

export function findTeam(teams: QuizTeam[], answers: Answers): { team: QuizTeam; reasons: string[] } | null {
  if (teams.length === 0) return null;
  const ranked = [...teams].sort(
    (a, b) => scoreTeam(b, answers, teams) - scoreTeam(a, answers, teams) || a.position - b.position || a.name.localeCompare(b.name),
  );
  const team = ranked[0];
  return { team, reasons: reasonsFor(team, answers) };
}

// Les raisons du choix, en phrases simples, à partir des vraies infos du club.
export function reasonsFor(team: QuizTeam, answers: Answers): string[] {
  const league = competitionLabel(team.league);
  const place = team.position === 1 ? "1re" : `${team.position}e`;
  const reasons: string[] = [];

  if (team.colors.includes(answers.color)) {
    reasons.push(`Ses couleurs : ${team.colorsLabel}. Avec ton ${COLOR_NAMES[answers.color]} préféré !`);
  } else if (team.colorsLabel) {
    reasons.push(`Ses couleurs : ${team.colorsLabel}.`);
  }
  if (answers.country === team.league) {
    reasons.push(`Elle joue en ${COUNTRY[team.league]} (${league}) : ton week-end de rêve est tout trouvé.`);
  }
  if (answers.ambition === "favori") reasons.push(`Une équipe qui joue les premiers rôles : ${place} de ${league}.`);
  if (answers.ambition === "outsider") reasons.push(`Une équipe qui peut créer la surprise : ${place} de ${league}.`);
  if (answers.ambition === "suspense") reasons.push(`${place} de ${league} : chaque match compte, rien n'est joué.`);
  if (team.founded) {
    reasons.push(answers.era === "history" ? `Un club chargé d'histoire, fondé en ${team.founded}.` : `Un club fondé en ${team.founded}.`);
  }
  const goals = team.goalsPerMatch.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  reasons.push(
    answers.style === "goals"
      ? `Ses matchs sont animés : ${goals} buts par match en moyenne.`
      : `Ses matchs sont serrés : ${goals} buts par match en moyenne.`,
  );
  if (team.venue) reasons.push(`Son stade : ${team.venue}.`);
  return reasons;
}

// Ramène une valeur entre 0 et 1 (0 = « from », 1 = « to »).
function normalize(value: number, from: number, to: number): number {
  if (from === to) return 0.5;
  return Math.min(1, Math.max(0, (value - from) / (to - from)));
}
