import type { Result } from "./stats";
import { count } from "./text";

// « Le match en 30 secondes » : un résumé plein écran, animé et lu à voix haute.
// Ce fichier prépare le contenu : quelles slides montrer et quelle phrase dire sur chacune.
// Tout vient des données déjà présentes sur la fiche match : aucun appel en plus.

type StoryTeam = { name: string; crest: string; tla: string };

export type StoryData = {
  home: StoryTeam;
  away: StoryTeam;
  competition: string; // « Liga, journée 12 »
  when: string; // « samedi 7 novembre à 21 h »
  enjeu: string; // écrit par l'IA (ou par l'analyse de secours)
  probabilities: { home: number; draw: number; away: number } | null;
  form: { home: Result[]; away: Result[] } | null; // du plus ancien au plus récent
  player: { name: string; photo: string | null; goals: number; played: number; crest: string; tla: string } | null;
  suspense: { level: number; label: string; reason: string };
};

export type SlideId = "intro" | "enjeu" | "favori" | "forme" | "joueur" | "suspense" | "outro";
export type Slide = { id: SlideId; speech: string; duration: number };

// Durée d'une slide quand il n'y a pas de voix : environ le temps de lire la phrase, 3,5 s minimum.
export function readingTime(text: string): number {
  return Math.max(3500, text.length * 65);
}

export function storySlides(data: StoryData): Slide[] {
  const { home, away, probabilities: p, form, player, suspense } = data;
  const speeches: [SlideId, string | null][] = [
    ["intro", `${data.competition}. ${capitalize(data.when)}, ${home.name} reçoit ${away.name}.`],
    ["enjeu", data.enjeu],
    ["favori", p && favouriteSentence(home.name, away.name, p)],
    ["forme", form && formSentence(home.name, away.name, form)],
    ["joueur", player && `Le joueur à surveiller : ${player.name}, ${player.goals} but${player.goals > 1 ? "s" : ""} en ${player.played} match${player.played > 1 ? "s" : ""}.`],
    ["suspense", `Niveau de suspense : ${suspense.label.toLowerCase()}. ${suspense.reason}`],
    ["outro", "Voilà, tu sais tout avant le coup d'envoi. Bon match avec Kick-Time !"],
  ];

  // Une slide sans données (pas de probabilités, pas de buteur…) est simplement sautée.
  return speeches
    .filter((entry): entry is [SlideId, string] => entry[1] !== null)
    .map(([id, speech]) => ({ id, speech, duration: readingTime(speech) }));
}

// « Real Madrid part favori avec 69 % de chances de victoire » ou « match très ouvert » si c'est serré.
export function favouriteSentence(home: string, away: string, p: { home: number; draw: number; away: number }): string {
  if (Math.abs(p.home - p.away) < 8) {
    return `Selon nos statistiques, le match est très ouvert : ${p.home} % pour ${home}, ${p.draw} % de match nul, ${p.away} % pour ${away}.`;
  }
  const [favourite, chance, other, otherChance] = p.home > p.away ? [home, p.home, away, p.away] : [away, p.away, home, p.home];
  return `Selon nos statistiques, ${favourite} part favori avec ${chance} % de chances de victoire, contre ${otherChance} % pour ${other}.`;
}

// Une phrase courte (les phrases de l'IA sont trop longues pour un résumé de 30 secondes).
export function formSentence(home: string, away: string, form: { home: Result[]; away: Result[] }): string {
  const wins = (results: Result[]) => results.filter((r) => r === "V").length;
  const period = form.home.length === form.away.length ? `Sur leurs ${form.home.length} derniers matchs` : "Sur leurs derniers matchs";
  return `${period}, ${home} compte ${count(wins(form.home), "victoire")}, ${away} ${count(wins(form.away), "victoire")}.`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
