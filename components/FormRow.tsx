import { formatShortDate } from "@/lib/dates";
import { formPoints, type FormEntry } from "@/lib/stats";
import type { Team } from "@/lib/types";
import TeamCrest from "./TeamCrest";

// Couleurs des pastilles : vert = victoire, gris = nul, rouge = défaite.
const PILL_STYLE = {
  V: "bg-accent text-accent-ink",
  N: "border border-line bg-surface-2 text-text",
  D: "bg-live text-white",
} as const;

// Une ligne « forme du moment » : les 5 derniers matchs d'une équipe, du plus ancien au plus récent.
export default function FormRow({ team, entries }: { team: Team; entries: FormEntry[] }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2.5">
        <TeamCrest src={team.crest} alt={team.name} fallback={team.tla} size={28} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{team.shortName}</p>
          <p className="text-xs text-muted">
            {formPoints(entries)} pts sur {entries.length * 3}
          </p>
        </div>
      </div>

      <ol className="flex gap-2">
        {entries.map((e) => (
          <li
            key={e.matchId}
            className="flex flex-col items-center gap-1.5"
            title={`${formatShortDate(e.date)} · ${e.atHome ? "à domicile" : "à l'extérieur"} contre ${e.opponent.shortName} : ${e.goalsFor}-${e.goalsAgainst}`}
          >
            <span className={`grid size-9 place-items-center rounded-lg font-display text-lg font-bold ${PILL_STYLE[e.result]}`}>
              {e.result}
            </span>
            {/* le logo de l'adversaire sous chaque pastille : lisible même sans survol, sur téléphone */}
            <TeamCrest src={e.opponent.crest} alt={e.opponent.name} fallback={e.opponent.tla} size={18} />
          </li>
        ))}
      </ol>
    </div>
  );
}
