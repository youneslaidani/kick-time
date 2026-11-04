"use client";

// Le quiz tourne dans le navigateur : les réponses ne sont envoyées nulle part,
// le choix de l'équipe est calculé sur place (voir lib/quiz.ts).
import Link from "next/link";
import { useState } from "react";
import { competitionLabel } from "@/lib/competitions";
import { formatSpokenKickoff } from "@/lib/dates";
import { findTeam, QUESTIONS, type Answers, type ColorFamily, type QuizTeam } from "@/lib/quiz";
import TeamCrest from "./TeamCrest";

// Vraies couleurs pour les pastilles de la question « couleur » et pour les confettis.
const SWATCH: Record<ColorFamily, string> = {
  rouge: "#ef4444",
  bleu: "#3b82f6",
  blanc: "#f8fafc",
  noir: "#4b5563",
  jaune: "#facc15",
  vert: "#22c55e",
  violet: "#a855f7",
  orange: "#f97316",
};

export default function TeamQuiz({ teams }: { teams: QuizTeam[] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({});

  const finished = step >= QUESTIONS.length;
  const result = finished ? findTeam(teams, answers as Answers) : null;

  function choose(value: string) {
    const question = QUESTIONS[step];
    setAnswers((previous) => ({ ...previous, [question.id]: value }));
    setStep((s) => s + 1);
  }

  function restart() {
    setAnswers({});
    setStep(0);
  }

  if (result) return <QuizResult team={result.team} reasons={result.reasons} onRestart={restart} />;

  const question = QUESTIONS[step];
  return (
    <section className="rounded-3xl border border-line bg-surface p-5 sm:p-8">
      {/* Progression : une pastille par question */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5" aria-label={`Question ${step + 1} sur ${QUESTIONS.length}`}>
          {QUESTIONS.map((q, i) => (
            <span key={q.id} className={`h-1.5 w-8 rounded-full ${i <= step ? "bg-accent" : "bg-line"}`} />
          ))}
        </div>
        {step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="text-sm font-semibold text-muted hover:text-text">
            ← Retour
          </button>
        )}
      </div>

      {/* key={step} : l'animation d'entrée repart à chaque question */}
      <div key={step} className="animate-story-in">
        <p className="mt-6 text-sm font-semibold text-muted">
          Question {step + 1} sur {QUESTIONS.length}
        </p>
        <h2 className="mt-1 font-display text-3xl font-extrabold uppercase leading-tight sm:text-4xl">{question.title}</h2>

        <div className={`mt-6 grid gap-3 ${question.id === "color" ? "grid-cols-2 sm:grid-cols-4" : "sm:grid-cols-2"}`}>
          {question.options.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => choose(String(option.value))}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/60 px-4 py-4 text-left font-semibold transition-all hover:-translate-y-0.5 hover:border-accent active:scale-[0.98]"
            >
              {question.id === "color" ? (
                <span
                  className="size-7 shrink-0 rounded-full ring-2 ring-white/20"
                  style={{ backgroundColor: SWATCH[option.value as ColorFamily] }}
                  aria-hidden="true"
                />
              ) : (
                <span className="text-2xl" aria-hidden="true">
                  {option.emoji}
                </span>
              )}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuizResult({ team, reasons, onRestart }: { team: QuizTeam; reasons: string[]; onRestart: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-accent/40 bg-linear-to-b from-accent/15 via-surface to-surface p-5 text-center sm:p-8">
      <Confetti colors={team.colors} />

      <p className="relative text-sm font-bold uppercase tracking-[0.3em] text-accent">Ton équipe, c&apos;est…</p>
      <div className="relative mt-5 flex justify-center">
        <div className="animate-story-pop">
          <TeamCrest src={team.crest} alt={team.name} fallback={team.tla} size={120} />
        </div>
      </div>
      <h2 className="relative mt-4 animate-story-in font-display text-5xl font-extrabold uppercase sm:text-6xl" style={{ animationDelay: "300ms" }}>
        {team.name}
      </h2>
      <p className="relative mt-1 text-muted">{competitionLabel(team.league)}</p>

      <ul className="relative mx-auto mt-6 flex max-w-xl flex-col gap-2.5 text-left">
        {reasons.map((reason, i) => (
          <li key={reason} className="flex animate-story-in gap-3 rounded-2xl bg-surface-2/70 px-4 py-3" style={{ animationDelay: `${500 + i * 120}ms` }}>
            <span className="text-accent" aria-hidden="true">
              ✓
            </span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>

      {/* Le prochain match : ce qui transforme un curieux en supporter */}
      <div className="relative mx-auto mt-6 max-w-xl rounded-2xl border border-line bg-bg/50 p-5 text-left">
        <p className="text-xs font-bold uppercase tracking-widest text-muted">Son prochain match</p>
        {team.nextMatch ? (
          <>
            <p className="mt-1 font-display text-2xl font-bold uppercase leading-tight">
              {team.name} {team.nextMatch.atHome ? "reçoit" : "se déplace chez"} {team.nextMatch.opponent}
            </p>
            <p className="mt-1 text-muted first-letter:uppercase">{formatSpokenKickoff(team.nextMatch.utcDate)}</p>
            <Link
              href={`/match/${team.nextMatch.id}`}
              prefetch={false}
              className="mt-4 inline-flex rounded-full bg-accent px-5 py-2.5 font-bold text-accent-ink transition-opacity hover:opacity-90"
            >
              Voir l&apos;analyse du match →
            </Link>
          </>
        ) : (
          <>
            <p className="mt-1">Pas de match cette semaine : suis sa place au classement en attendant.</p>
            <Link href={`/classements?ligue=${team.league}`} prefetch={false} className="mt-3 inline-flex font-bold text-accent">
              Voir le classement →
            </Link>
          </>
        )}
      </div>

      <button type="button" onClick={onRestart} className="relative mt-6 text-sm font-semibold text-muted underline hover:text-text">
        Refaire le quiz
      </button>
    </section>
  );
}

// Pluie de confettis aux couleurs du club (positions calculées à partir du numéro, pas au hasard,
// pour que l'affichage soit identique à chaque fois).
function Confetti({ colors }: { colors: ColorFamily[] }) {
  const palette = colors.length > 0 ? colors : (["vert"] as ColorFamily[]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 36 }, (_, i) => (
        <span
          key={i}
          className="absolute top-0 h-3 w-2 animate-confetti rounded-sm"
          style={{
            left: `${(i * 37) % 100}%`,
            backgroundColor: SWATCH[palette[i % palette.length]],
            animationDelay: `${(i % 9) * 0.12}s`,
            animationDuration: `${2.2 + (i % 5) * 0.35}s`,
          }}
        />
      ))}
    </div>
  );
}
