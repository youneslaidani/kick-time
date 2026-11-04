"use client";

// « Le match en 30 secondes » : un résumé plein écran, animé et lu à voix haute.
// Composant « client » : il tourne dans le navigateur, qui sait parler tout seul
// grâce à la synthèse vocale intégrée (Web Speech API) → gratuit et sans aucun appel à une IA.
import { useEffect, useMemo, useState } from "react";
import { storySlides, type Slide, type StoryData } from "@/lib/story";
import type { Result } from "@/lib/stats";
import PlayerAvatar from "./PlayerAvatar";
import TeamCrest from "./TeamCrest";

// La plus belle voix française disponible : les voix « Natural » (Edge) ou Google sonnent moins robotiques.
function pickFrenchVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("fr"));
  return (
    voices.find((v) => /natural|online/i.test(v.name)) ??
    voices.find((v) => /google/i.test(v.name)) ??
    voices[0] ??
    null
  );
}

export default function MatchStory({ data }: { data: StoryData }) {
  const slides = useMemo(() => storySlides(data), [data]);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const slide = slides[index];
  const isLast = index === slides.length - 1;

  // Les voix se chargent un peu après la page : on écoute l'événement « voiceschanged ».
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => setVoice(pickFrenchVoice());
    const first = setTimeout(load, 0);
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      clearTimeout(first);
      window.speechSynthesis.removeEventListener("voiceschanged", load);
    };
  }, []);

  // Lecture de la slide en cours : on la dit à voix haute, puis on passe à la suivante.
  useEffect(() => {
    if (!open) return;
    let stopped = false; // évite d'avancer deux fois quand on change de slide en pleine phrase
    const next = () => {
      if (!stopped && !isLast) setIndex((i) => i + 1);
    };
    const timers: number[] = [];

    if (voice && !muted) {
      const utterance = new SpeechSynthesisUtterance(slide.speech);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = 1.1; // un peu plus rapide : ton de commentateur
      utterance.onend = () => timers.push(window.setTimeout(next, 500));
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      // Filet de sécurité : certains navigateurs oublient de signaler la fin de la phrase.
      timers.push(window.setTimeout(next, slide.duration * 2));
    } else {
      // Sans voix (son coupé ou navigateur muet) : on laisse le temps de lire les sous-titres.
      timers.push(window.setTimeout(next, slide.duration));
    }

    return () => {
      stopped = true;
      timers.forEach(clearTimeout);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [open, index, muted, voice, slide, isLast]);

  // Clavier (Échap, flèches) et page bloquée en arrière-plan pendant le résumé.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowRight") setIndex((i) => Math.min(i + 1, slides.length - 1));
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, slides.length]);

  function start() {
    // Sur iPhone, la voix n'est autorisée qu'au moment exact du clic : on la « réveille » ici.
    if ("speechSynthesis" in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
    setIndex(0);
    setOpen(true);
  }

  // Toucher l'écran : à gauche on revient en arrière, ailleurs on avance (comme les stories).
  function onScreenClick(event: React.MouseEvent<HTMLDivElement>) {
    const { left, width } = event.currentTarget.getBoundingClientRect();
    if (event.clientX - left < width * 0.3) setIndex((i) => Math.max(i - 1, 0));
    else setIndex((i) => Math.min(i + 1, slides.length - 1));
  }

  return (
    <>
      <button
        type="button"
        onClick={start}
        className="group flex w-full items-center gap-4 rounded-3xl bg-accent px-5 py-4 text-left text-accent-ink transition-transform hover:scale-[1.01] active:scale-[0.99]"
      >
        <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-accent-ink text-accent">
          <span className="absolute inset-0 animate-ping rounded-full bg-accent-ink/40" aria-hidden="true" />
          <svg viewBox="0 0 24 24" className="relative ml-0.5 size-5 fill-current" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        <span>
          <span className="block font-display text-2xl font-extrabold uppercase leading-none">Le match en 30 secondes</span>
          <span className="mt-1 block text-sm font-semibold opacity-80">Résumé animé et commenté à voix haute</span>
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Le match en 30 secondes"
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg text-text"
        >
          <Backdrop />

          <header className="relative z-10 flex flex-col gap-3 px-4 pt-4 sm:px-8 sm:pt-6">
            <div className="flex gap-1.5" aria-hidden="true">
              {slides.map((s, i) => (
                <span key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                  {i < index && <span className="block h-full w-full bg-accent" />}
                  {i === index && (
                    <span
                      key={`${index}-${muted}`}
                      className="block h-full animate-story-progress bg-accent"
                      style={{ animationDuration: `${s.duration}ms` }}
                    />
                  )}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-lg font-extrabold uppercase tracking-wide">
                Kick<span className="text-accent">Time</span>
                <span className="ml-2 text-sm font-semibold text-muted">· le match en 30 s</span>
              </p>
              <div className="flex gap-2">
                <RoundButton label={muted ? "Activer le son" : "Couper le son"} onClick={() => setMuted((m) => !m)}>
                  {muted ? "🔇" : "🔊"}
                </RoundButton>
                <RoundButton label="Fermer" onClick={() => setOpen(false)}>
                  ✕
                </RoundButton>
              </div>
            </div>
          </header>

          <div className="relative z-10 flex flex-1 cursor-pointer items-center justify-center px-6" onClick={onScreenClick}>
            {/* key={index} : à chaque slide, les animations repartent de zéro */}
            <div key={index} className="w-full max-w-4xl animate-story-in">
              <SlideContent slide={slide} data={data} onReplay={() => setIndex(0)} onClose={() => setOpen(false)} />
            </div>
          </div>

          {/* Sous-titres : utiles si le son de la salle est mauvais */}
          {slide.id !== "enjeu" && slide.id !== "outro" && (
            <p className="relative z-10 mx-auto mb-8 max-w-3xl px-6 text-center text-base text-text/75 sm:text-xl">
              {slide.speech}
            </p>
          )}
          {!voice && (
            <p className="relative z-10 mb-4 text-center text-xs text-muted">Pas de voix française sur cet appareil : lecture silencieuse.</p>
          )}
        </div>
      )}
    </>
  );
}

function SlideContent({ slide, data, onReplay, onClose }: { slide: Slide; data: StoryData; onReplay: () => void; onClose: () => void }) {
  const { home, away } = data;

  switch (slide.id) {
    case "intro":
      return (
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-accent sm:text-base">{data.competition}</p>
          <div className="mt-8 flex items-center justify-center gap-6 sm:gap-12">
            <BigTeam team={home} delay={0} />
            <span className="animate-story-pop font-display text-4xl font-extrabold text-muted sm:text-6xl" style={{ animationDelay: "400ms" }}>
              VS
            </span>
            <BigTeam team={away} delay={200} />
          </div>
          <p className="mt-8 text-lg text-muted first-letter:uppercase sm:text-2xl">{data.when}</p>
        </div>
      );

    case "enjeu":
      return (
        <div className="text-center">
          <Label>✦ L&apos;enjeu, selon l&apos;IA</Label>
          <p className="mt-6 font-display text-4xl font-extrabold uppercase leading-tight sm:text-6xl">{data.enjeu}</p>
        </div>
      );

    case "favori": {
      const p = data.probabilities!;
      return (
        <div className="text-center">
          <Label>Qui part favori ?</Label>
          <div className="mt-8 grid grid-cols-3 items-end gap-3">
            <Percent value={p.home} label={home.name} className="text-accent" />
            <Percent value={p.draw} label="Match nul" className="text-muted" />
            <Percent value={p.away} label={away.name} className="text-away" />
          </div>
          <div className="mt-6 flex h-5 gap-1.5 overflow-hidden rounded-full sm:h-6">
            <span className="origin-left animate-story-grow rounded-full bg-accent" style={{ width: `${p.home}%` }} />
            <span className="origin-left animate-story-grow rounded-full bg-muted/50" style={{ width: `${p.draw}%`, animationDelay: "250ms" }} />
            <span className="origin-left animate-story-grow rounded-full bg-away" style={{ width: `${p.away}%`, animationDelay: "500ms" }} />
          </div>
        </div>
      );
    }

    case "forme": {
      const form = data.form!;
      return (
        <div>
          <Label className="text-center">La forme du moment</Label>
          <div className="mt-8 flex flex-col gap-6">
            <FormLine team={home} results={form.home} />
            <FormLine team={away} results={form.away} delay={500} />
          </div>
        </div>
      );
    }

    case "joueur": {
      const player = data.player!;
      return (
        <div className="flex flex-col items-center text-center">
          <Label>Le joueur à surveiller</Label>
          <div className="mt-6 animate-story-zoom">
            <PlayerAvatar src={player.photo} name={player.name} sizeClass="size-40 text-6xl sm:size-56 sm:text-7xl" />
          </div>
          <p className="mt-6 font-display text-4xl font-extrabold uppercase sm:text-6xl">{player.name}</p>
          <p className="mt-2 font-display text-2xl font-bold text-accent sm:text-4xl">
            <CountUp to={player.goals} /> buts · {player.played} matchs
          </p>
        </div>
      );
    }

    case "suspense":
      return (
        <div className="text-center">
          <Label>Suspense</Label>
          <p className="mt-4 font-display text-5xl font-extrabold uppercase text-accent sm:text-7xl">{data.suspense.label}</p>
          <div className="mx-auto mt-8 grid max-w-xl grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={`h-4 origin-left animate-story-grow rounded-full ${n <= data.suspense.level ? "bg-accent" : "bg-line"}`}
                style={{ animationDelay: `${n * 150}ms` }}
              />
            ))}
          </div>
        </div>
      );

    case "outro":
      return (
        <div className="text-center">
          <p className="font-display text-6xl font-extrabold uppercase sm:text-8xl">
            Kick<span className="text-accent">Time</span>
          </p>
          <p className="mt-4 text-xl text-muted sm:text-2xl">Tu sais tout avant le coup d&apos;envoi. Bon match !</p>
          <div className="mt-10 flex justify-center gap-3" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={onReplay} className="rounded-full border border-text/40 px-6 py-3 font-bold hover:border-accent">
              ↺ Revoir
            </button>
            <button type="button" onClick={onClose} className="rounded-full bg-accent px-6 py-3 font-bold text-accent-ink">
              Fermer
            </button>
          </div>
        </div>
      );
  }
}

// --- Petites briques visuelles ---------------------------------------------------

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm font-bold uppercase tracking-[0.3em] text-muted sm:text-base ${className}`}>{children}</p>;
}

function BigTeam({ team, delay }: { team: StoryData["home"]; delay: number }) {
  return (
    <div className="flex animate-story-pop flex-col items-center gap-3" style={{ animationDelay: `${delay}ms` }}>
      <TeamCrest src={team.crest} alt={team.name} fallback={team.tla} size={112} />
      <p className="font-display text-2xl font-extrabold uppercase sm:text-4xl">{team.name}</p>
    </div>
  );
}

function Percent({ value, label, className }: { value: number; label: string; className: string }) {
  return (
    <div>
      <p className={`font-display text-5xl font-extrabold sm:text-7xl ${className}`}>
        <CountUp to={value} /> %
      </p>
      <p className="mt-1 truncate text-sm text-muted sm:text-lg">{label}</p>
    </div>
  );
}

const PILL = { V: "bg-accent text-accent-ink", N: "bg-surface-2 text-text border border-line", D: "bg-live text-white" };

function FormLine({ team, results, delay = 0 }: { team: StoryData["home"]; results: Result[]; delay?: number }) {
  return (
    // Sur téléphone : le nom au-dessus des pastilles (sinon il est coupé). Sur grand écran : côte à côte.
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <TeamCrest src={team.crest} alt={team.name} fallback={team.tla} size={48} />
        <p className="truncate font-display text-2xl font-extrabold uppercase sm:text-4xl">{team.name}</p>
      </div>
      <div className="flex gap-1.5 sm:gap-2">
        {results.map((r, i) => (
          <span
            key={i}
            className={`grid size-9 animate-story-pop place-items-center rounded-lg font-display text-lg font-bold sm:size-14 sm:text-2xl ${PILL[r]}`}
            style={{ animationDelay: `${delay + i * 120}ms` }}
          >
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}

// Un nombre qui défile de 0 jusqu'à sa valeur, comme sur un tableau d'affichage.
function CountUp({ to, duration = 1000 }: { to: number; duration?: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      setValue(Math.round(to * (1 - (1 - progress) ** 3))); // ralentit à la fin
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, duration]);
  return <>{value}</>;
}

function RoundButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-full border border-line bg-surface/80 text-lg hover:border-accent"
    >
      {children}
    </button>
  );
}

// Décor : halos verts qui bougent lentement et marquages du terrain, comme un plateau télé.
function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute left-1/4 top-1/4 size-[60vmax] animate-story-glow rounded-full bg-accent/15 blur-3xl" />
      <div
        className="absolute bottom-0 right-0 size-[50vmax] animate-story-glow rounded-full bg-away/10 blur-3xl"
        style={{ animationDelay: "-7s" }}
      />
      <svg viewBox="0 0 400 260" className="absolute inset-0 size-full opacity-[0.07]" preserveAspectRatio="xMidYMid slice">
        <g fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="20" y="20" width="360" height="220" />
          <line x1="200" y1="20" x2="200" y2="240" />
          <circle cx="200" cy="130" r="38" />
          <rect x="20" y="75" width="50" height="110" />
          <rect x="330" y="75" width="50" height="110" />
        </g>
      </svg>
    </div>
  );
}
