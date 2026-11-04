import { competitionLabel } from "@/lib/competitions";
import type { PlayerPhoto } from "@/lib/player-photo";
import { ageAt, positionLabel } from "@/lib/players";
import { count } from "@/lib/text";
import type { Match, Scorer } from "@/lib/types";
import PlayerAvatar from "./PlayerAvatar";
import Section from "./Section";
import TeamCrest from "./TeamCrest";

// « 1,1 » (virgule à la française)
const decimal = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

// La carte « Le joueur à surveiller » : photo, identité, et ses chiffres de la saison.
export default function PlayerToWatch({ scorer, photo, match }: { scorer: Scorer; photo: PlayerPhoto | null; match: Match }) {
  const { player, team, goals, playedMatches } = scorer;
  const assists = scorer.assists ?? 0;
  const competition = competitionLabel(match.competition.code);
  const details = [
    positionLabel(player.section),
    team.shortName,
    player.dateOfBirth && `${ageAt(player.dateOfBirth, match.utcDate)} ans`,
    player.shirtNumber && `n° ${player.shirtNumber}`,
  ].filter(Boolean);

  return (
    <Section title="Le joueur à surveiller" hint={`Meilleur buteur des deux équipes en ${competition}`}>
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="relative shrink-0">
          <PlayerAvatar src={photo?.url ?? null} name={player.name} />
          {/* le logo du club en badge sur la photo */}
          <span className="absolute -bottom-2 -right-2 rounded-full bg-surface p-1 ring-2 ring-line">
            <TeamCrest src={team.crest} alt={team.shortName} fallback={team.tla} size={26} />
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-display text-2xl font-extrabold uppercase leading-tight sm:text-3xl">{player.name}</p>
          <p className="mt-1 text-sm text-muted">{details.join(" · ")}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <Stat value={goals} label={goals > 1 ? "buts" : "but"} highlight />
        <Stat value={assists} label={assists > 1 ? "passes déc." : "passe déc."} />
        <Stat value={playedMatches} label="matchs" />
      </div>

      {/* Phrase écrite par le code à partir des chiffres : rien n'est inventé */}
      <p className="mt-4 leading-relaxed">
        Meilleur buteur de {team.shortName} en {competition} cette saison : {count(goals, "but")} en{" "}
        {count(playedMatches, "match")}, soit {decimal(goals / playedMatches)} but par match en moyenne.
        {assists > 0 && ` Il a aussi délivré ${assists} ${assists > 1 ? "passes décisives" : "passe décisive"}.`}
      </p>
      <p className="mt-3 text-sm text-muted">
        <span className="font-bold text-accent">Passe décisive :</span> la dernière passe qui permet à un coéquipier de marquer.
      </p>

      {photo && (
        <p className="mt-3 text-[11px] text-muted">
          Photo :{" "}
          <a href={photo.creditUrl} target="_blank" rel="noreferrer" className="underline hover:text-text">
            Wikimedia Commons
          </a>{" "}
          (licence libre)
        </p>
      )}
    </Section>
  );
}

function Stat({ value, label, highlight = false }: { value: number; label: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl bg-surface-2/70 py-3">
      <p className={`font-display text-3xl font-extrabold leading-none ${highlight ? "text-accent" : ""}`}>{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}
