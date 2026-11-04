"use client";

// Composant « client » : si la photo ne charge pas (pas de photo libre, wifi coupé…),
// on affiche les initiales du joueur à la place.
import { useState } from "react";

// sizeClass : la taille (petite sur la carte, très grande dans le résumé animé).
export default function PlayerAvatar({
  src,
  name,
  sizeClass = "size-24 text-4xl sm:size-28",
}: {
  src: string | null;
  name: string;
  sizeClass?: string;
}) {
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
        className={`grid place-items-center rounded-2xl bg-surface-2 font-display font-extrabold text-muted ${sizeClass}`}
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
      className={`rounded-2xl bg-surface-2 object-cover object-top ${sizeClass}`}
    />
  );
}
