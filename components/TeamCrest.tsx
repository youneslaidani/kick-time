"use client";

// Composant « client » : si le logo ne charge pas (wifi de l'amphi coupé, par exemple),
// on affiche à la place les 3 lettres de l'équipe dans un rond.
import { useState } from "react";

type Props = { src: string; alt: string; fallback: string; size?: number };

export default function TeamCrest({ src, alt, fallback, size = 32 }: Props) {
  const [broken, setBroken] = useState(!src);

  if (broken) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-full bg-surface-2 font-display text-[11px] font-bold text-muted"
        style={{ width: size, height: size }}
        aria-label={alt}
      >
        {fallback.slice(0, 3)}
      </span>
    );
  }

  return (
    // <img> classique : les logos viennent d'un autre site, et next/image demanderait une configuration en plus.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setBroken(true)}
      // léger halo clair : les logos noirs (Juventus, Ligue des champions…) restent visibles sur fond sombre
      className="shrink-0 object-contain drop-shadow-[0_0_1px_rgb(255_255_255/0.7)]"
      style={{ width: size, height: size }}
    />
  );
}
