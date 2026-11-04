"use client";

// Schéma animé du hors-jeu : on bascule entre « hors-jeu » et « pas hors-jeu »
// et on voit l'attaquant changer de place par rapport à la ligne du défenseur.
import { useState } from "react";

// Positions sur le dessin (un demi-terrain vu du dessus, le but adverse à droite).
const PASSER = { x: 150, y: 150 };
const DEFENDER = { x: 290, y: 75 };
const KEEPER = { x: 375, y: 120 };
const ATTACKER = { offside: { x: 325, y: 168 }, onside: { x: 268, y: 168 } };

export default function OffsideDemo() {
  const [offside, setOffside] = useState(true);
  const attacker = offside ? ATTACKER.offside : ATTACKER.onside;

  return (
    <div className="rounded-3xl border border-line bg-surface p-4 sm:p-6">
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-bg/60 p-1">
        <ToggleButton active={offside} onClick={() => setOffside(true)} label="❌ Hors-jeu" />
        <ToggleButton active={!offside} onClick={() => setOffside(false)} label="✅ Pas hors-jeu" />
      </div>

      <svg
        viewBox="0 0 400 240"
        className="mt-4 w-full rounded-2xl"
        role="img"
        aria-label={
          offside
            ? "L'attaquant est plus près du but que le dernier défenseur au moment de la passe : hors-jeu."
            : "L'attaquant est derrière la ligne du dernier défenseur au moment de la passe : pas hors-jeu."
        }
      >
        {/* la pelouse, avec ses bandes */}
        <rect width="400" height="240" fill="#123222" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={i * 80} width="40" height="240" fill="#16402b" />
        ))}
        <g fill="none" stroke="rgb(255 255 255 / 0.55)" strokeWidth="2">
          <rect x="6" y="6" width="388" height="228" />
          <rect x="320" y="45" width="74" height="150" />
          <path d="M6 70 A 50 50 0 0 1 6 170" />
        </g>
        <rect x="394" y="95" width="6" height="50" fill="#eef3f0" />

        {/* la ligne du hors-jeu : celle de l'avant-dernier adversaire (ici le défenseur, le gardien étant le dernier) */}
        <line x1={DEFENDER.x} y1="10" x2={DEFENDER.x} y2="230" stroke="#f5c542" strokeWidth="2.5" strokeDasharray="7 6" />
        <text x={DEFENDER.x - 6} y="24" textAnchor="end" fill="#f5c542" fontSize="11" fontWeight="700">
          ligne du hors-jeu
        </text>

        <Player x={KEEPER.x} y={KEEPER.y} color="#5ab4ff" label="Gardien" />
        <Player x={DEFENDER.x} y={DEFENDER.y} color="#5ab4ff" label="Défenseur" />
        <Player x={PASSER.x} y={PASSER.y} color="#2bff88" label="Passeur" />

        {/* l'attaquant glisse d'une position à l'autre */}
        <g style={{ transform: `translate(${attacker.x}px, ${attacker.y}px)`, transition: "transform 0.7s cubic-bezier(.2,.8,.2,1)" }}>
          <circle r="11" fill={offside ? "#ff3d5a" : "#2bff88"} stroke="#03140a" strokeWidth="2" />
          <text y="26" textAnchor="middle" fill="#eef3f0" fontSize="11" fontWeight="700">
            Attaquant
          </text>
        </g>

        {/* le ballon part du passeur vers l'attaquant, en boucle (key : l'animation repart à chaque changement) */}
        <circle
          key={String(offside)}
          cx={PASSER.x + 12}
          cy={PASSER.y - 8}
          r="5.5"
          fill="#ffffff"
          stroke="#03140a"
          strokeWidth="1.5"
          className="animate-ball-pass"
          style={{ "--tx": `${attacker.x - PASSER.x - 26}px`, "--ty": `${attacker.y - PASSER.y + 8}px` } as React.CSSProperties}
        />
      </svg>

      <p className={`mt-4 rounded-2xl px-4 py-3 text-center font-semibold ${offside ? "bg-live/15 text-live" : "bg-accent/15 text-accent"}`}>
        {offside
          ? "Au moment de la passe, l'attaquant est plus près du but que le défenseur : HORS-JEU, le but ne compte pas."
          : "Au moment de la passe, l'attaquant est derrière la ligne (ou à sa hauteur) : tout est bon, il peut filer au but !"}
      </p>
    </div>
  );
}

function Player({ x, y, color, label }: { x: number; y: number; color: string; label: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="11" fill={color} stroke="#03140a" strokeWidth="2" />
      <text y="26" textAnchor="middle" fill="#eef3f0" fontSize="11" fontWeight="700">
        {label}
      </text>
    </g>
  );
}

function ToggleButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl py-2.5 text-sm font-bold transition-colors ${active ? "bg-surface-2 text-text" : "text-muted hover:text-text"}`}
    >
      {label}
    </button>
  );
}
