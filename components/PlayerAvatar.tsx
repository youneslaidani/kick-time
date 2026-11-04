"use client";

// Composant « client » : si la photo ne charge pas (pas de photo libre, wifi coupé…),
// on affiche les initiales du joueur à la place.
import { useState } from "react";

export default function PlayerAvatar({ src, name }: { src: string | null; name: string }) {
  const [broken, setBroken] = useState(!src);
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (broken || !src) {
    return (
      <span
        className="grid size-24 place-items-center rounded-2xl bg-surface-2 font-display text-4xl font-extrabold text-muted sm:size-28"
        aria-label={name}
      >
        {initials}
      </span>
    );
  }

  return (
    // <img> classique : la photo vient de Wikipédia, next/image demanderait une configuration en plus.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Photo de ${name}`}
      loading="lazy"
      onError={() => setBroken(true)}
      className="size-24 rounded-2xl bg-surface-2 object-cover object-top sm:size-28"
    />
  );
}
