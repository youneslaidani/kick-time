"use client";

// Le « Vrai ou faux ? » : on répond, on voit tout de suite la bonne réponse et pourquoi.
import { useState } from "react";
import { TRUE_OR_FALSE, verdict } from "@/lib/basics";

export default function TrueOrFalse() {
  // Réponse donnée à chaque question (undefined = pas encore répondu).
  const [answers, setAnswers] = useState<(boolean | undefined)[]>(() => TRUE_OR_FALSE.map(() => undefined));
  const answered = answers.filter((a) => a !== undefined).length;
  const score = answers.filter((a, i) => a === TRUE_OR_FALSE[i].answer).length;

  function answer(index: number, value: boolean) {
    setAnswers((previous) => previous.map((a, i) => (i === index ? value : a)));
  }

  return (
    <div className="flex flex-col gap-3">
      {TRUE_OR_FALSE.map((question, i) => {
        const given = answers[i];
        const right = given === question.answer;
        return (
          <div key={question.statement} className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
            <p className="font-semibold">
              {i + 1}. {question.statement}
            </p>
            {given === undefined ? (
              <div className="mt-3 flex gap-2">
                <AnswerButton label="Vrai" onClick={() => answer(i, true)} />
                <AnswerButton label="Faux" onClick={() => answer(i, false)} />
              </div>
            ) : (
              <p className={`mt-3 animate-story-in rounded-xl px-3 py-2 text-sm ${right ? "bg-accent/15" : "bg-live/15"}`}>
                <strong className={right ? "text-accent" : "text-live"}>
                  {right ? "✅ Bien joué !" : "❌ Raté !"} C&apos;est {question.answer ? "vrai" : "faux"}.
                </strong>{" "}
                {question.explanation}
              </p>
            )}
          </div>
        );
      })}

      {answered === TRUE_OR_FALSE.length && (
        <div className="animate-story-in rounded-2xl border border-accent/40 bg-accent/10 p-5 text-center">
          <p className="font-display text-3xl font-extrabold uppercase">
            {score} / {TRUE_OR_FALSE.length}
          </p>
          <p className="mt-1">{verdict(score, TRUE_OR_FALSE.length)}</p>
          <button
            type="button"
            onClick={() => setAnswers(TRUE_OR_FALSE.map(() => undefined))}
            className="mt-3 text-sm font-semibold text-muted underline hover:text-text"
          >
            Recommencer
          </button>
        </div>
      )}
    </div>
  );
}

function AnswerButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded-xl border border-line bg-surface-2/60 py-2.5 font-bold transition-colors hover:border-accent"
    >
      {label}
    </button>
  );
}
