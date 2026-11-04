import { cacheLife } from "next/cache";

// Photo d'un joueur, trouvée sur Wikipédia (images sous licence libre de Wikimedia Commons).
// Piège découvert en testant : le premier résultat n'est pas toujours le bon joueur
// (« Jude Bellingham » renvoie d'abord Mark Bellingham, né en 1976). On vérifie donc
// que la page décrit bien un footballeur né la même année que le joueur de l'API.

export type PlayerPhoto = {
  url: string; // l'image elle-même
  creditUrl: string; // la page de la photo, avec son auteur et sa licence
};

type WikiPage = {
  index: number;
  title: string;
  description?: string;
  thumbnail?: { source: string };
  pageimage?: string;
};

// Choisit, parmi les résultats de recherche, la page qui correspond vraiment au joueur.
export function pickWikipediaPage(pages: WikiPage[], name: string, birthYear: string | null): WikiPage | null {
  const sorted = [...pages].sort((a, b) => a.index - b.index);
  for (const page of sorted) {
    const description = page.description ?? "";
    if (!page.thumbnail || !page.pageimage || !/football/i.test(description)) continue;

    const year = description.match(/born (\d{4})/)?.[1];
    if (year) {
      if (year === birthYear) return page; // footballeur né la bonne année : c'est lui
    } else if (simplify(page.title) === simplify(name)) {
      return page; // pas d'année dans la description : on exige alors exactement le même nom
    }
  }
  return null;
}

// « Nicolò Tresoldi » → « nicolo tresoldi » (sans accents ni majuscules) pour comparer les noms.
function simplify(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// Une photo par joueur, gardée une semaine : elle ne change pas d'un jour à l'autre.
async function fetchPlayerPhoto(name: string, birthYear: string | null): Promise<PlayerPhoto | null> {
  "use cache: remote";
  cacheLife("weeks");

  const url =
    "https://en.wikipedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      format: "json",
      formatversion: "2",
      generator: "search",
      gsrsearch: `${name} footballer`,
      gsrlimit: "5",
      prop: "pageimages|description",
      piprop: "thumbnail|name",
      pithumbsize: "400",
    });
  // Wikipédia demande que chaque programme se présente (règle d'usage de son API).
  const response = await fetch(url, { headers: { "User-Agent": "KickTime/1.0 (projet scolaire)" } });
  if (!response.ok) throw new Error(`Wikipédia a répondu ${response.status}`);

  const data: { query?: { pages?: WikiPage[] } } = await response.json();
  const page = pickWikipediaPage(data.query?.pages ?? [], name, birthYear);
  if (!page) return null;
  return {
    url: page.thumbnail!.source,
    creditUrl: `https://en.wikipedia.org/wiki/File:${encodeURIComponent(page.pageimage!)}`,
  };
}

// Pas de photo trouvée ou Wikipédia indisponible → null : la carte affiche alors les initiales.
export async function getPlayerPhoto(name: string, dateOfBirth: string | null): Promise<PlayerPhoto | null> {
  try {
    return await fetchPlayerPhoto(name, dateOfBirth?.slice(0, 4) ?? null);
  } catch (error) {
    console.error(error);
    return null;
  }
}
