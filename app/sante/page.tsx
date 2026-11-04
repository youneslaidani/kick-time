import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Santé de l'app · Kick-Time", robots: { index: false } };

// Page /sante : un tableau de bord à ouvrir avant l'oral pour vérifier que tout est prêt.
// Elle dit si les clés sont présentes et si l'API répond, SANS jamais afficher les clés elles-mêmes.
export default function HealthPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-accent">Avant l&apos;oral</p>
      <h1 className="font-display text-4xl font-extrabold uppercase">Santé de l&apos;app</h1>
      <Suspense fallback={<p className="mt-6 text-muted">Vérification en cours…</p>}>
        <Checks />
      </Suspense>
    </main>
  );
}

type Check = { label: string; ok: boolean; detail: string };

async function Checks() {
  await connection(); // on vérifie au moment de la visite, pas pendant la compilation

  const football = process.env.FOOTBALL_DATA_TOKEN ?? "";
  const gemini = process.env.GEMINI_API_KEY ?? "";
  const checks: Check[] = [
    keyCheck("Clé football-data.org", football),
    keyCheck("Clé Gemini", gemini),
    {
      label: "Mode démo forcé",
      ok: process.env.DEMO_MODE !== "true",
      detail: process.env.DEMO_MODE === "true" ? "DEMO_MODE=true : l'app n'utilise que les données enregistrées" : "désactivé",
    },
  ];

  // Un seul petit appel à l'API foot pour vérifier qu'elle accepte la clé.
  if (football) {
    try {
      const response = await fetch("https://api.football-data.org/v4/competitions/FL1", {
        headers: { "X-Auth-Token": football.trim() },
        cache: "no-store",
      });
      const left = response.headers.get("x-requests-available-minute");
      checks.push({
        label: "API football-data.org",
        ok: response.ok,
        detail: response.ok
          ? `répond (${left ?? "?"} appels encore disponibles cette minute)`
          : `a répondu ${response.status}${response.status === 400 || response.status === 403 ? " : la clé est refusée" : ""}`,
      });
    } catch (error) {
      checks.push({ label: "API football-data.org", ok: false, detail: `injoignable (${(error as Error).message})` });
    }
  }

  return (
    <ul className="mt-6 flex flex-col gap-3">
      {checks.map((check) => (
        <li key={check.label} className="flex items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
          <span className="text-xl" aria-hidden="true">
            {check.ok ? "✅" : "❌"}
          </span>
          <span>
            <span className="block font-semibold">{check.label}</span>
            <span className="block text-sm text-muted">{check.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

// Présence de la clé et pièges fréquents du copier-coller (espaces, guillemets) — jamais la valeur.
function keyCheck(label: string, value: string): Check {
  if (!value) return { label, ok: false, detail: "absente : à ajouter dans Vercel → Settings → Environment Variables, puis Redeploy" };
  if (value !== value.trim()) return { label, ok: false, detail: "présente, mais avec des espaces en trop au début ou à la fin" };
  if (/^["']|["']$/.test(value)) return { label, ok: false, detail: "présente, mais entourée de guillemets : à retirer" };
  return { label, ok: true, detail: `présente (${value.length} caractères)` };
}
