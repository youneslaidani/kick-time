// Carte avec un titre : la brique de base des blocs de la fiche match.
export default function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide">{title}</h2>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

// Message affiché quand une donnée manque (API saturée, mode démo…) : la page reste utilisable.
export function Unavailable({ children = "Données momentanément indisponibles." }: { children?: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">{children}</p>;
}
