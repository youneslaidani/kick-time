// « Tu comprends rien au foot ? » : le contenu de la page qui explique les bases.
// Règle d'écriture : on rit du foot (le VAR interminable, les plongeons, les phrases toutes faites),
// jamais des gens. Le texte parle à « tu », à n'importe qui qui découvre le foot.

export type TrueFalse = { statement: string; answer: boolean; explanation: string };

// Le « Vrai ou faux ? » de fin de page : 5 idées reçues qui reviennent souvent.
export const TRUE_OR_FALSE: TrueFalse[] = [
  {
    statement: "Un match nul rapporte 1 point à chaque équipe.",
    answer: true,
    explanation: "Victoire = 3 points, nul = 1 point, défaite = 0. C'est tout le calcul du classement.",
  },
  {
    statement: "On peut être hors-jeu sur une touche.",
    answer: false,
    explanation: "Pas de hors-jeu sur une touche, un corner ou un dégagement du gardien. Le foot a ses petits cadeaux.",
  },
  {
    statement: "Le gardien peut prendre le ballon à la main partout sur le terrain.",
    answer: false,
    explanation: "Seulement dans sa surface de réparation, le grand rectangle devant son but. Ailleurs, il joue au pied comme tout le monde.",
  },
  {
    statement: "Deux cartons jaunes dans le même match, c'est l'expulsion.",
    answer: true,
    explanation: "Deux jaunes = un rouge. Le joueur sort et son équipe finit le match à 10, sans remplaçant.",
  },
  {
    statement: "La Ligue des champions oppose des pays.",
    answer: false,
    explanation: "Ce sont des clubs (Real Madrid, PSG, Liverpool…). Les pays s'affrontent à la Coupe du monde ou à l'Euro.",
  },
];

// Le message de fin, selon le score obtenu au Vrai ou faux.
export function verdict(score: number, total: number): string {
  if (score === total) return "Sans faute ! Tu peux briller au prochain repas de famille. 🏆";
  if (score >= total - 1) return "Presque parfait : encore une relecture du hors-jeu et c'est gagné. 💪";
  if (score >= Math.ceil(total / 2)) return "Pas mal du tout ! Tu en sais déjà plus que la moitié des commentateurs du dimanche. 😉";
  return "Aucun souci, même les arbitres se trompent. Relis la page et retente ta chance ! 🔁";
}

export type Entry = { term: string; definition: string };

// Le dico de survie : les mots qu'on entend dans toutes les discussions foot.
export const GLOSSARY: Entry[] = [
  { term: "Un triplé (ou hat-trick)", definition: "Le même joueur marque 3 buts dans un match. On dit « coup du chapeau »… sans chapeau." },
  { term: "Une clean sheet", definition: "Un match sans encaisser de but. La fierté des gardiens." },
  { term: "Le derby", definition: "Un match entre deux équipes d'une même ville ou région. L'ambiance monte d'un cran." },
  { term: "Le Classique", definition: "PSG – Marseille, la plus grande rivalité du foot français." },
  { term: "Le mercato", definition: "Les deux périodes de l'année (été et janvier) où les clubs achètent et vendent des joueurs." },
  { term: "Une remontada", definition: "Un retour incroyable au score. La plus célèbre : Barcelone bat le PSG 6-1 en 2017 après avoir perdu 4-0 à l'aller." },
  { term: "Un petit pont", definition: "Faire passer le ballon entre les jambes d'un adversaire. Humiliation garantie." },
  { term: "La lucarne", definition: "Le coin en haut du but. Le plus beau but possible, et le plus dur à arrêter." },
  { term: "Une simulation", definition: "Se laisser tomber sans avoir été touché pour obtenir une faute. Ça peut valoir un carton jaune." },
  { term: "Le temps additionnel", definition: "Les minutes ajoutées à la fin de chaque mi-temps pour compenser les arrêts de jeu." },
];

export type Phrase = { quote: string; tip: string };

// Les phrases magiques : à placer au bon moment pour avoir l'air d'y connaître quelque chose.
export const MAGIC_PHRASES: Phrase[] = [
  { quote: "Ça va se jouer sur des détails.", tip: "Impossible d'avoir tort : un match se joue toujours sur des détails." },
  { quote: "Ils ont manqué de réalisme devant le but.", tip: "À dire quand une équipe tire beaucoup… mais ne marque pas." },
  { quote: "Il faut prendre les matchs les uns après les autres.", tip: "La phrase préférée de tous les entraîneurs du monde." },
  { quote: "Pour moi, il n'y a pas penalty.", tip: "À dégainer dès que la discussion s'enflamme. Effet garanti." },
  { quote: "Attention, c'est un match piège.", tip: "Quand un gros club affronte une petite équipe qui n'a rien à perdre." },
  { quote: "Le public a poussé, c'est le 12e homme !", tip: "Le « 12e homme », ce sont les supporters dans le stade." },
];
