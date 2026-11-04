import type { MetadataRoute } from "next";

// Le « manifeste » de l'app : nom, couleurs et icône utilisés quand on l'ajoute
// à l'écran d'accueil d'un téléphone (elle s'ouvre alors comme une vraie application).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kick-Time",
    short_name: "Kick-Time",
    description: "Les résultats de foot, et l'IA qui t'explique les enjeux de chaque match.",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#070b09",
    theme_color: "#070b09",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      // version avec plus de marge : Android peut la découper en rond ou en goutte
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
