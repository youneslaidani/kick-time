import { competitionLabel, isCompetitionCode, zoneOf } from "./competitions";
import { formatShortDate } from "./dates";
import { count } from "./text";
import { formPoints, headToHead, recentForm, venueRecord, type FormEntry } from "./stats";
import type { Match, StandingRow } from "./types";

// Ce fichier prépare l'analyse d'avant-match :
// 1. buildFacts : transforme les données brutes en chiffres clairs, datés et ordonnés → c'est EXACTEMENT ce que l'IA reçoit ;
// 2. parseAnalysis : vérifie que la réponse de l'IA a la bonne forme ;
// 3. simpleAnalysis : une analyse sans IA, écrite par le code, si l'IA est indisponible.

// --- Les chiffres envoyés à l'IA ---------------------------------------------------

type TeamFacts = {
  nom: string;
  joue: "à domicile" | "à l'extérieur";
  classement: {
    position: number;
    points: number;
    matchs_joues: number;
    buts_marques: number;
    buts_encaisses: number;
    zone: string | null; // ce que vaut cette place (ex. « Relégation en deuxième division »)
  } | null;
  forme_du_plus_recent_au_plus_ancien: string[] | null;
  bilan_des_5_derniers: string | null;
  points_sur_les_5_derniers: number | null;
  bilan_sur_ce_terrain_cette_saison: string | null;
};

export type MatchFacts = {
  match_id: number;
  competition: string;
  nombre_equipes_au_classement: number | null;
  domicile: TeamFacts;
  exterieur: TeamFacts;
  face_a_face: { nombre: number; bilan: string; les_plus_recents: string[] } | null;
};

type Sources = {
  homeSeason: Match[] | null;
  awaySeason: Match[] | null;
  meetings: Match[] | null;
  table: StandingRow[] | null;
};

export function buildFacts(match: Match, { homeSeason, awaySeason, meetings, table: currentTable }: Sources): MatchFacts {
  const home = match.homeTeam;
  const away = match.awayTeam;
  // Seulement ce qui s'est passé AVANT le match : l'analyse reste une analyse d'avant-match.
  const before = match.utcDate;
  // Une fois le match commencé, le classement actuel contient déjà (ou bientôt) son résultat :
  // le donner à l'IA reviendrait à tricher, donc on ne le donne qu'avant le coup d'envoi.
  const table = match.status === "SCHEDULED" || match.status === "TIMED" ? currentTable : null;

  function teamFacts(teamId: number, name: string, venue: "home" | "away", season: Match[] | null): TeamFacts {
    const row = table?.find((r) => r.team.id === teamId);
    const form = season && recentForm(season, teamId, before);
    const record = season && venueRecord(season, teamId, venue, before);
    return {
      nom: name,
      joue: venue === "home" ? "à domicile" : "à l'extérieur",
      classement: row
        ? {
            position: row.position,
            points: row.points,
            matchs_joues: row.playedGames,
            buts_marques: row.goalsFor,
            buts_encaisses: row.goalsAgainst,
            zone: isCompetitionCode(match.competition.code)
              ? (zoneOf(match.competition.code, row.position)?.label ?? null)
              : null,
          }
        : null,
      // Du plus récent au plus ancien, chaque match daté : sans ça, l'IA s'était trompée d'ordre (voir DEVLOG).
      forme_du_plus_recent_au_plus_ancien: form && form.length > 0 ? [...form].reverse().map(describeFormEntry) : null,
      bilan_des_5_derniers: form && form.length > 0 ? describeFormSummary(form) : null,
      points_sur_les_5_derniers: form && form.length > 0 ? formPoints(form) : null,
      bilan_sur_ce_terrain_cette_saison:
        record && record.played > 0
          ? `${count(record.won, "victoire")}, ${count(record.drawn, "nul")}, ${count(record.lost, "défaite")} ${venue === "home" ? "à domicile" : "à l'extérieur"} (${count(record.goalsFor, "but")} marqué${record.goalsFor >= 2 ? "s" : ""}, ${record.goalsAgainst} encaissé${record.goalsAgainst >= 2 ? "s" : ""})`
          : null,
    };
  }

  const h2h = meetings && headToHead(meetings, match);

  return {
    match_id: match.id,
    competition: `${competitionLabel(match.competition.code)}${match.matchday ? `, journée ${match.matchday}` : ""}`,
    nombre_equipes_au_classement: table ? table.length : null,
    domicile: teamFacts(home.id, home.shortName, "home", homeSeason),
    exterieur: teamFacts(away.id, away.shortName, "away", awaySeason),
    face_a_face: h2h && {
      nombre: h2h.played,
      bilan: `${count(h2h.homeWins, "victoire")} de ${home.shortName}, ${count(h2h.draws, "nul")}, ${count(h2h.awayWins, "victoire")} de ${away.shortName}`,
      les_plus_recents: h2h.recent.map(
        (m) => `${formatShortDate(m.utcDate)} : ${m.homeTeam.shortName} ${m.score.fullTime.home}-${m.score.fullTime.away} ${m.awayTeam.shortName}`,
      ),
    },
  };
}

function describeFormEntry(e: FormEntry): string {
  const result = { V: "victoire", N: "match nul", D: "défaite" }[e.result];
  return `${formatShortDate(e.date)} : ${result} ${e.goalsFor}-${e.goalsAgainst} contre ${e.opponent.shortName} (${e.atHome ? "à domicile" : "à l'extérieur"})`;
}

// « 3 victoires, 1 nul, 1 défaite (10 points sur 15) »
function describeFormSummary(form: FormEntry[]): string {
  const times = (r: FormEntry["result"]) => form.filter((e) => e.result === r).length;
  return `${count(times("V"), "victoire")}, ${count(times("N"), "nul")}, ${count(times("D"), "défaite")} (${formPoints(form)} points sur ${form.length * 3})`;
}

// --- La réponse attendue -----------------------------------------------------------

export type AnalysisContent = {
  enjeu: string;
  resume: string;
  forme_domicile: string;
  forme_exterieur: string;
  face_a_face: string;
  a_surveiller: string[];
  suspense: number; // de 1 (match déséquilibré) à 5 (très indécis)
  suspense_raison: string;
  lexique: { mot: string; definition: string }[];
};

export type Analysis = AnalysisContent & {
  source: "ia" | "secours"; // « secours » = analyse simplifiée écrite par le code
  model?: string;
};

// L'IA peut renvoyer un texte mal formé : on vérifie chaque champ avant de l'afficher.
export function parseAnalysis(text: string): AnalysisContent | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const d = data as Record<string, unknown>;

  const isText = (v: unknown) => typeof v === "string" && v.trim().length > 0;
  const texts = ["enjeu", "resume", "forme_domicile", "forme_exterieur", "face_a_face", "suspense_raison"];
  if (!texts.every((key) => isText(d[key]))) return null;
  if (!Array.isArray(d.a_surveiller) || !d.a_surveiller.every(isText) || d.a_surveiller.length === 0) return null;
  if (!Number.isInteger(d.suspense) || (d.suspense as number) < 1 || (d.suspense as number) > 5) return null;
  if (!Array.isArray(d.lexique) || !d.lexique.every((l) => isText(l?.mot) && isText(l?.definition))) return null;

  return {
    enjeu: d.enjeu as string,
    resume: d.resume as string,
    forme_domicile: d.forme_domicile as string,
    forme_exterieur: d.forme_exterieur as string,
    face_a_face: d.face_a_face as string,
    a_surveiller: (d.a_surveiller as string[]).slice(0, 3),
    suspense: d.suspense as number,
    suspense_raison: d.suspense_raison as string,
    lexique: (d.lexique as { mot: string; definition: string }[]).slice(0, 3),
  };
}

// --- L'analyse de secours, sans IA ---------------------------------------------------
// Si Gemini est saturé ou en panne, le code écrit lui-même une analyse plus simple
// à partir des mêmes chiffres : le bloc n'est jamais vide pendant la démo.

const rank = (n: number) => (n === 1 ? "1er" : `${n}e`);

export function simpleAnalysis(facts: MatchFacts): Analysis {
  const home = facts.domicile;
  const away = facts.exterieur;
  const hc = home.classement;
  const ac = away.classement;

  // L'enjeu : l'écart au classement
  let enjeu = `${home.nom} reçoit ${away.nom} (${facts.competition}).`;
  if (hc && ac) {
    const gap = Math.abs(hc.points - ac.points);
    const [first, second] = hc.points >= ac.points ? [home, away] : [away, home];
    if (gap === 0) enjeu = `${home.nom} et ${away.nom} ont autant de points : le vainqueur passera devant l'autre au classement.`;
    else if (gap <= 3) enjeu = `Seulement ${gap} point${gap > 1 ? "s" : ""} séparent ${first.nom} et ${second.nom} : une victoire peut tout changer au classement.`;
    else enjeu = `${first.nom} (${rank(first.classement!.position)}) compte ${gap} points d'avance sur ${second.nom} (${rank(second.classement!.position)}).`;
  }

  // Le suspense : plus les équipes sont proches (classement et forme), plus le match est indécis
  const formGap = Math.abs((home.points_sur_les_5_derniers ?? 7) - (away.points_sur_les_5_derniers ?? 7)); // de 0 à 15
  const tableGap = hc && ac ? Math.abs(hc.position - ac.position) / (facts.nombre_equipes_au_classement ?? 20) : 0.25; // de 0 à 1
  const suspense = Math.min(5, Math.max(1, 5 - Math.round(formGap / 5 + tableGap * 4)));

  const watch: string[] = [];
  if (hc && ac) {
    const attack = hc.buts_marques / hc.matchs_joues >= ac.buts_marques / ac.matchs_joues ? home : away;
    const defense = hc.buts_encaisses / hc.matchs_joues >= ac.buts_encaisses / ac.matchs_joues ? home : away;
    watch.push(`L'attaque de ${attack.nom} : ${attack.classement!.buts_marques} buts marqués en ${attack.classement!.matchs_joues} matchs.`);
    watch.push(`La défense de ${defense.nom} : ${defense.classement!.buts_encaisses} buts encaissés en ${defense.classement!.matchs_joues} matchs.`);
  }

  const h2h = facts.face_a_face;
  return {
    source: "secours",
    enjeu,
    resume: `${home.nom}${hc ? ` (${rank(hc.position)})` : ""} joue à domicile contre ${away.nom}${ac ? ` (${rank(ac.position)})` : ""}. Voici les chiffres clés pour comprendre ce match.`,
    forme_domicile: home.bilan_des_5_derniers ? `${home.nom} : ${home.bilan_des_5_derniers} sur ses 5 derniers matchs.` : `Forme récente de ${home.nom} indisponible.`,
    forme_exterieur: away.bilan_des_5_derniers ? `${away.nom} : ${away.bilan_des_5_derniers} sur ses 5 derniers matchs.` : `Forme récente de ${away.nom} indisponible.`,
    face_a_face: h2h && h2h.nombre > 0 ? `${count(h2h.nombre, "confrontation")} depuis 2020 : ${h2h.bilan}.` : "Aucune confrontation connue entre ces deux équipes dans nos données.",
    a_surveiller: watch.length > 0 ? watch : ["Le classement et la forme des deux équipes, détaillés plus bas."],
    suspense,
    suspense_raison: suspense >= 4 ? "Les deux équipes sont proches, au classement comme en forme." : suspense <= 2 ? "Une équipe semble nettement au-dessus sur les derniers résultats." : "Un léger avantage pour une équipe, mais rien n'est joué.",
    lexique: [
      { mot: "Forme", definition: "Les résultats récents d'une équipe : une équipe « en forme » gagne souvent en ce moment." },
      { mot: "Face-à-face", definition: "L'historique des matchs déjà joués entre les deux mêmes équipes." },
    ],
  };
}
