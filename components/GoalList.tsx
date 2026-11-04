import type { Match } from "@/lib/types";

type Goals = NonNullable<Match["live"]>["goals"];

// Les buteurs d'une équipe : « ⚽ Koita 12' », avec (pén.) ou (csc) si besoin.
// variant « card » (accueil) : toujours le nom de famille seul, la place est comptée.
// variant « header » (fiche match) : nom de famille sur téléphone, nom complet sur grand écran.
export default function GoalList({
  goals,
  side,
  variant,
  className = "",
}: {
  goals: Goals;
  side: "home" | "away";
  variant: "card" | "header";
  className?: string;
}) {
  const mine = goals.filter((goal) => goal.side === side);
  if (mine.length === 0) return <span />; // case vide : garde l'alignement de la grille

  return (
    // w-full : la liste ne peut pas être plus large que sa colonne (sinon elle déborde du cadre)
    <ul className={`flex w-full min-w-0 flex-col gap-0.5 text-muted ${className}`}>
      {mine.map((goal, i) => (
        <li key={`${goal.minute}-${i}`} className="truncate">
          <span aria-hidden="true">⚽ </span>
          {variant === "card" ? (
            goal.scorerShort
          ) : (
            <>
              <span className="sm:hidden">{goal.scorerShort}</span>
              <span className="hidden sm:inline">{goal.scorer}</span>
            </>
          )}{" "}
          {goal.minute}
          {goal.penalty && " (pén.)"}
          {goal.ownGoal && " (csc)"}
        </li>
      ))}
    </ul>
  );
}
