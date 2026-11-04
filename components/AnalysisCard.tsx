import type { Analysis } from "@/lib/analysis";
import type { Team } from "@/lib/types";

const SUSPENSE_LABELS = ["", "Match déséquilibré", "Plutôt à sens unique", "Incertain", "Très indécis", "Suspense maximal"];

// La carte vedette de la fiche match : l'analyse d'avant-match, à lire en quelques secondes.
export default function AnalysisCard({ analysis, home, away, played }: { analysis: Analysis; home: Team; away: Team; played: boolean }) {
  const fromAi = analysis.source === "ia";

  return (
    <section className="rounded-3xl border border-accent/40 bg-linear-to-br from-accent/15 via-surface to-surface p-5 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold uppercase tracking-widest text-accent">✦ Analyse d&apos;avant-match</p>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
            fromAi ? "bg-accent/15 text-accent" : "bg-warn/15 text-warn"
          }`}
        >
          {fromAi ? "Rédigée par l'IA" : "Version simplifiée"}
        </span>
      </header>

      {/* L'enjeu en une phrase : la promesse de Kick-Time, comprendre le match en quelques secondes */}
      <p className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl">{analysis.enjeu}</p>
      <p className="mt-3 leading-relaxed text-text/85">{analysis.resume}</p>

      <SuspenseMeter level={analysis.suspense} reason={analysis.suspense_raison} />

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MiniCard title={`Forme · ${home.shortName}`} text={analysis.forme_domicile} />
        <MiniCard title={`Forme · ${away.shortName}`} text={analysis.forme_exterieur} />
        <div className="sm:col-span-2">
          <MiniCard title="Face-à-face" text={analysis.face_a_face} />
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted">À surveiller</h3>
        <ul className="mt-2 flex flex-col gap-2">
          {analysis.a_surveiller.map((point) => (
            <li key={point} className="flex gap-2.5">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-bg/40 p-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted">Le mot du débutant</h3>
        <dl className="mt-2 flex flex-col gap-2 text-sm">
          {analysis.lexique.map((entry) => (
            <div key={entry.mot}>
              <dt className="inline font-bold text-accent">{entry.mot} :</dt>{" "}
              <dd className="inline text-text/85">{entry.definition}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Transparence : on dit toujours qui a écrit ce texte et à partir de quoi */}
      <p className="mt-4 text-xs leading-relaxed text-muted">
        {fromAi
          ? "Texte écrit par l'IA Gemini à partir des chiffres de cette page, sans aucun pronostic."
          : "L'IA est momentanément indisponible : ce résumé est calculé automatiquement à partir des chiffres de cette page."}
        {played && " Analyse rédigée avec les données d'avant-match."}
      </p>
    </section>
  );
}

// Jauge de suspense : 5 barres, d'autant plus remplies que le match s'annonce indécis.
function SuspenseMeter({ level, reason }: { level: number; reason: string }) {
  return (
    <div className="mt-5 rounded-2xl bg-surface-2/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-muted">Suspense</p>
        <p className="font-display text-lg font-bold uppercase text-accent">{SUSPENSE_LABELS[level]}</p>
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1.5" role="img" aria-label={`Suspense : ${level} sur 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`h-2 rounded-full ${n <= level ? "bg-accent" : "bg-line"}`} />
        ))}
      </div>
      <p className="mt-2 text-sm text-text/80">{reason}</p>
    </div>
  );
}

function MiniCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="h-full rounded-2xl border border-line bg-surface/60 p-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed">{text}</p>
    </div>
  );
}

// Affiché pendant que l'IA rédige (quelques secondes, seulement la première fois pour chaque match).
export function AnalysisSkeleton() {
  return (
    <section className="rounded-3xl border border-accent/40 bg-linear-to-br from-accent/15 via-surface to-surface p-5 sm:p-6">
      <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-accent">
        <span className="animate-spin" aria-hidden="true">✦</span> L&apos;IA analyse le match…
      </p>
      <div className="mt-4 flex animate-pulse flex-col gap-3">
        <div className="h-7 w-11/12 rounded-lg bg-surface-2" />
        <div className="h-7 w-2/3 rounded-lg bg-surface-2" />
        <div className="mt-2 h-4 w-full rounded bg-surface-2" />
        <div className="h-4 w-5/6 rounded bg-surface-2" />
        <div className="mt-3 h-20 rounded-2xl bg-surface-2" />
      </div>
    </section>
  );
}
