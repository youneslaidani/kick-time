import type { Metadata } from "next";
import Link from "next/link";
import OffsideDemo from "@/components/OffsideDemo";
import TrueOrFalse from "@/components/TrueOrFalse";
import { GLOSSARY, MAGIC_PHRASES } from "@/lib/basics";

export const metadata: Metadata = {
  title: "Tu comprends rien au foot ? · Kick-Time",
  description: "Le foot expliqué en 5 minutes, sans prise de tête : le hors-jeu, la Ligue des champions, le VAR…",
};

// Les rubriques de la page, pour le sommaire en haut.
const SECTIONS = [
  { id: "bases", label: "Les bases" },
  { id: "hors-jeu", label: "Le hors-jeu" },
  { id: "cartons", label: "Cartons & penalty" },
  { id: "var", label: "Le VAR" },
  { id: "competitions", label: "Les compétitions" },
  { id: "dico", label: "Le dico de survie" },
  { id: "phrases", label: "Phrases magiques" },
  { id: "vrai-faux", label: "Vrai ou faux ?" },
];

// Page /comprendre-le-foot : tout le contenu est écrit à l'avance (aucun appel à l'API ni à l'IA),
// elle s'affiche donc instantanément, même si le wifi de l'amphi est capricieux.
export default function BasicsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 lg:px-8">
      <section className="text-center">
        <p className="inline-block animate-wobble text-7xl sm:text-8xl" aria-hidden="true">
          🤢
        </p>
        <h1 className="mt-3 font-display text-5xl font-extrabold uppercase leading-none sm:text-7xl">Tu comprends rien au foot ?</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-text/85">
          Pas de panique. En 5 minutes, tu pourras suivre n&apos;importe quelle discussion foot… et même placer un « c&apos;était
          hors-jeu ! » au bon moment.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
          <Badge>⏱️ 5 minutes de lecture</Badge>
          <Badge>🎓 Niveau requis : aucun</Badge>
          <Badge>😌 Zéro jugement</Badge>
        </div>
      </section>

      {/* Sommaire : chaque bouton descend directement à sa rubrique */}
      <nav aria-label="Sommaire" className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:flex-wrap sm:justify-center">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="shrink-0 rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold text-muted hover:border-accent hover:text-text">
            {s.label}
          </a>
        ))}
      </nav>

      <div className="mt-10 flex flex-col gap-14">
        <Topic id="bases" emoji="⚽" title="Les bases en 30 secondes">
          <p className="text-text/85">
            Deux équipes, un ballon, et un seul objectif : mettre le ballon dans le but de l&apos;autre. Fin du tutoriel.
            Bon… presque.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Fact big="11 contre 11" text="Dont un gardien : le seul qui a le droit de prendre le ballon à la main… et seulement dans sa surface." />
            <Fact big="90 minutes" text="Deux mi-temps de 45 minutes, plus quelques minutes ajoutées par l'arbitre pour les arrêts de jeu." />
            <Fact big="3 · 1 · 0" text="Une victoire rapporte 3 points, un nul 1 point, une défaite 0. Le classement, c'est juste ce calcul." />
            <Fact big="5 changements" text="Chaque équipe peut remplacer jusqu'à 5 joueurs pendant le match. Un joueur qui sort ne revient pas." />
          </div>
        </Topic>

        <Topic id="hors-jeu" emoji="🧠" title="Le hors-jeu, le boss final">
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <div>
              <p className="text-text/85">
                LA règle qui fait débat depuis plus de 150 ans. Elle sert à une chose : empêcher un attaquant de{" "}
                <strong>camper devant le but adverse</strong> en attendant tranquillement le ballon.
              </p>
              <p className="mt-3 text-text/85">
                La règle : <strong>au moment où un coéquipier fait la passe</strong>, l&apos;attaquant ne doit pas être plus près
                du but adverse que l&apos;avant-dernier adversaire (en général le dernier défenseur, puisque le gardien est le
                dernier).
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                <Tip>Ce qui compte, c&apos;est la position quand la passe part, pas quand le ballon arrive.</Tip>
                <Tip>À la même hauteur que le défenseur ? Pas hors-jeu.</Tip>
                <Tip>Jamais de hors-jeu dans sa propre moitié de terrain, ni sur une touche, un corner ou un dégagement du gardien.</Tip>
              </ul>
              <p className="mt-4 text-sm text-muted">👉 Essaie le schéma : bascule entre les deux situations.</p>
            </div>
            <OffsideDemo />
          </div>
        </Topic>

        <Topic id="cartons" emoji="🟨" title="Cartons, coup franc, penalty : le code de la route du foot">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card emoji="🟨" title="Carton jaune">
              Un avertissement. L&apos;arbitre dit « attention, la prochaine fois c&apos;est dehors ».
            </Card>
            <Card emoji="🟥" title="Carton rouge">
              Expulsion ! L&apos;équipe finit le match à 10, sans remplaçant. Deux jaunes dans le même match = un rouge.
            </Card>
            <Card emoji="🦶" title="Coup franc">
              Après une faute, l&apos;équipe qui l&apos;a subie rejoue le ballon arrêté. Les adversaires doivent reculer à 9,15 m.
            </Card>
            <Card emoji="🎯" title="Penalty">
              Faute dans sa propre surface de réparation → tir à 11 mètres, face au gardien seul. Le moment le plus stressant du foot.
            </Card>
          </div>
          <p className="mt-4 text-sm text-muted">
            Et les joueurs qui se roulent par terre en hurlant au moindre contact ? Ça s&apos;appelle une simulation… et ça peut
            valoir un carton jaune. 🎭
          </p>
        </Topic>

        <Topic id="var" emoji="📺" title="Le VAR, ou la pause la plus longue du monde">
          <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
            <p className="text-text/85">
              Le VAR, c&apos;est l&apos;<strong>arbitrage vidéo</strong> : des arbitres regardent les images dans une salle et
              préviennent l&apos;arbitre du terrain s&apos;il a fait une erreur claire. Il ne peut intervenir que dans 4 situations :
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm font-semibold sm:grid-cols-4">
              <span className="rounded-xl bg-surface-2/70 px-3 py-2">⚽ Un but</span>
              <span className="rounded-xl bg-surface-2/70 px-3 py-2">🎯 Un penalty</span>
              <span className="rounded-xl bg-surface-2/70 px-3 py-2">🟥 Un rouge direct</span>
              <span className="rounded-xl bg-surface-2/70 px-3 py-2">🕵️ Une erreur de joueur</span>
            </div>
            <p className="mt-4 text-text/85">
              Pendant ce temps, tout le stade retient son souffle… ou en profite pour aller chercher des frites. 🍟
            </p>
          </div>
        </Topic>

        <Topic id="competitions" emoji="🏆" title="Ligue des champions & compagnie : qui joue quoi ?">
          <div className="rounded-3xl border border-accent/40 bg-linear-to-br from-accent/15 via-surface to-surface p-5 sm:p-6">
            <h3 className="font-display text-3xl font-extrabold uppercase">La Ligue des champions</h3>
            <p className="mt-2 text-text/85">
              La compétition la plus prestigieuse entre <strong>clubs</strong> européens. Pour y participer, il faut avoir très bien
              fini dans son championnat la saison précédente. Elle se joue en semaine, le mardi et le mercredi soir.
            </p>
            <ol className="mt-4 grid gap-3 sm:grid-cols-3">
              <Step n={1} title="La phase de ligue">
                36 clubs, un seul grand classement. Chacun joue 8 matchs contre 8 adversaires différents.
              </Step>
              <Step n={2} title="Le tri">
                Du 1er au 8e : qualifiés directement. Du 9e au 24e : des barrages pour rester. Du 25e au 36e : éliminés.
              </Step>
              <Step n={3} title="Les éliminations directes">
                Huitièmes, quarts, demies en matchs aller-retour… puis une finale en un seul match, fin mai ou début juin.
              </Step>
            </ol>
            <p className="mt-4 text-sm text-muted">
              Et cette musique solennelle avant chaque match ? C&apos;est l&apos;hymne de la Ligue des champions. Même les gens qui
              n&apos;aiment pas le foot avouent avoir des frissons. 🎶
            </p>
            <Link href="/classements?ligue=CL" className="mt-4 inline-flex font-bold text-accent">
              Voir le classement de la Ligue des champions →
            </Link>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Card emoji="📅" title="Le championnat">
              Ligue 1, Premier League, Liga… Chaque équipe affronte toutes les autres deux fois (aller et retour). La première en
              fin de saison est championne, les dernières descendent en 2e division.
            </Card>
            <Card emoji="🥈" title="Ligue Europa et Ligue Conférence">
              Les « petites sœurs » de la Ligue des champions, pour les clubs un peu moins bien classés. Même principe, moins de
              paillettes.
            </Card>
            <Card emoji="🪄" title="Les coupes nationales">
              Comme la Coupe de France : élimination directe, et un petit club amateur peut tomber sur le PSG. C&apos;est la magie de
              la coupe.
            </Card>
            <Card emoji="💞" title="Club ou sélection ?">
              Mbappé joue au Real Madrid (son club, toute l&apos;année) et en équipe de France (sa sélection, quelques fois par an).
              Deux équipes à la fois : non, ce n&apos;est pas de l&apos;infidélité.
            </Card>
            <Card emoji="🌍" title="La Coupe du monde">
              Tous les 4 ans, entre pays. La France l&apos;a gagnée en 1998 et en 2018. La Coupe du monde féminine aussi existe : la
              prochaine aura lieu en 2027, au Brésil.
            </Card>
            <Card emoji="🥇" title="Le Ballon d'Or">
              Le trophée du meilleur joueur de l&apos;année. Depuis 2018, un Ballon d&apos;Or récompense aussi la meilleure joueuse.
            </Card>
          </div>
        </Topic>

        <Topic id="dico" emoji="📖" title="Le dico de survie">
          <dl className="grid gap-3 sm:grid-cols-2">
            {GLOSSARY.map((entry) => (
              <div key={entry.term} className="rounded-2xl border border-line bg-surface p-4">
                <dt className="font-display text-xl font-bold uppercase text-accent">{entry.term}</dt>
                <dd className="mt-1 text-text/85">{entry.definition}</dd>
              </div>
            ))}
          </dl>
        </Topic>

        <Topic id="phrases" emoji="✨" title="Les phrases magiques pour briller dans une discussion foot">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MAGIC_PHRASES.map((phrase) => (
              <figure key={phrase.quote} className="rounded-2xl border border-line bg-surface p-4">
                <blockquote className="relative rounded-2xl rounded-bl-sm bg-surface-2 px-4 py-3 font-display text-xl font-bold leading-tight">
                  « {phrase.quote} »
                </blockquote>
                <figcaption className="mt-2 text-sm text-muted">{phrase.tip}</figcaption>
              </figure>
            ))}
          </div>
        </Topic>

        <Topic id="vrai-faux" emoji="🤔" title="Vrai ou faux ? Teste-toi">
          <div className="mx-auto max-w-3xl">
            <TrueOrFalse />
          </div>
        </Topic>

        <section className="rounded-3xl border border-line bg-surface p-6 text-center sm:p-8">
          <p className="font-display text-3xl font-extrabold uppercase sm:text-4xl">Et maintenant, place au match !</p>
          <p className="mt-2 text-muted">Tu connais les bases : il ne te manque plus qu&apos;une équipe à supporter.</p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/mon-equipe" prefetch={false} className="rounded-full bg-accent px-6 py-3 font-bold text-accent-ink hover:opacity-90">
              ✨ Trouve ton équipe en 20 secondes
            </Link>
            <Link href="/" className="rounded-full border border-text/40 px-6 py-3 font-bold hover:border-accent">
              ⚽ Voir les matchs de la semaine
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

// --- Petites briques de mise en page -------------------------------------------------

function Topic({ id, emoji, title, children }: { id: string; emoji: string; title: string; children: React.ReactNode }) {
  return (
    // scroll-mt : le titre ne se cache pas sous l'en-tête quand on arrive par le sommaire
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-4 flex items-center gap-3 font-display text-3xl font-extrabold uppercase leading-tight sm:text-4xl">
        <span aria-hidden="true">{emoji}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-surface-2 px-3 py-1.5 font-semibold">{children}</span>;
}

function Fact({ big, text }: { big: string; text: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="font-display text-3xl font-extrabold uppercase text-accent">{big}</p>
      <p className="mt-1 text-sm text-text/85">{text}</p>
    </div>
  );
}

function Card({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-3xl" aria-hidden="true">
        {emoji}
      </p>
      <h3 className="mt-2 font-display text-xl font-bold uppercase">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-text/85">{children}</p>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-2xl bg-surface-2/70 p-4">
      <p className="font-display text-sm font-bold uppercase tracking-widest text-accent">Étape {n}</p>
      <p className="mt-1 font-display text-xl font-bold uppercase">{title}</p>
      <p className="mt-1 text-sm text-text/85">{children}</p>
    </li>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="text-accent" aria-hidden="true">
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}
