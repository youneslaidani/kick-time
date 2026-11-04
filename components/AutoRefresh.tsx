"use client";

// Pendant les matchs, la page se met à jour toute seule (sans recharger) pour suivre le score.
// router.refresh() redemande les données au serveur, qui les garde en cache 20 secondes.
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      // Pas quand l'onglet est caché, ni pendant « Le match en 30 secondes » (il recommencerait).
      if (document.visibilityState !== "visible" || document.querySelector('[role="dialog"]')) return;
      router.refresh();
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);

  return null;
}
