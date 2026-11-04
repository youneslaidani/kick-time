import type { Match } from "@/lib/types";

type Goals = NonNullable<Match["live"]>["goals"];

// Les buteurs d'une équipe : « ⚽ Aboubakary Koita 12' », avec (pén.) ou (csc) si besoin.
// compact : nom de famille seul (« Koita ») pour les petites cartes de l'accueil.
export default function GoalList({
  goals,
  side,
  compact = false,
  className = "",
}: {
  goals: Goals;
  side: "home" | "away";
  compact?: boolean;
  className?: string;
}) {
  const mine = goals.filter((goal) => goal.side === side);
  if (mine.length === 0) return <span />; // case vide : garde l'alignement de la grille

  return (
    <ul className={`flex min-w-0 flex-col gap-0.5 text-muted ${className}`}>
      {mine.map((goal, i) => (
        <li key={`${goal.minute}-${i}`} className="truncate">
          <span aria-hidden="true">⚽ </span>
          {compact ? goal.scorerShort : goal.scorer} {goal.minute}
          {goal.penalty && " (pén.)"}
          {goal.ownGoal && " (csc)"}
        </li>
      ))}
    </ul>
  );
}
