// Toutes les dates sont affichées à l'heure de Paris :
// les serveurs Vercel tournent en heure universelle (UTC), sans ce réglage les horaires seraient décalés.
const TIME_ZONE = "Europe/Paris";

// Date du jour à Paris, au format AAAA-MM-JJ (le format « en-CA » donne exactement ça).
export function parisDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);
}

// Ajoute (ou retire) des jours à une date AAAA-MM-JJ.
export function shiftDate(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`); // midi : évite les pièges du changement d'heure
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// « mercredi 4 novembre », et « dimanche 1er novembre » pour le premier du mois
export function formatLongDate(isoDate: string): string {
  const text = new Intl.DateTimeFormat("fr-FR", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${isoDate}T12:00:00Z`));
  return formatDayNumber(isoDate) === "1" ? text.replace(" 1 ", " 1er ") : text;
}

// « ven. » (jour de la semaine abrégé, pour la barre des 7 jours)
export function formatWeekdayShort(isoDate: string): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: TIME_ZONE, weekday: "short" }).format(
    new Date(`${isoDate}T12:00:00Z`),
  );
}

// « 6 » (numéro du jour dans le mois)
export function formatDayNumber(isoDate: string): string {
  return String(Number(isoDate.slice(8, 10)));
}

// « 3 mai 2026 »
export function formatShortDate(utcDate: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(utcDate));
}

// « 21:00 »
export function formatKickoff(utcDate: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(utcDate));
}
