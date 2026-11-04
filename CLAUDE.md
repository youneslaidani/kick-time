@AGENTS.md

# Kick-Time — mémoire du projet

Application web de résultats de football avec **analyse d'avant-match par IA**, pensée pour les supporters débutants.
Projet scolaire présenté en 10 minutes devant élèves et professeurs : la démo doit être **fiable** et le code **explicable par un débutant**.

## Stack
- Next.js 16 (App Router, Cache Components activé) + TypeScript + Tailwind CSS v4
- Données : API football-data.org v4 (plan gratuit : 10 requêtes/min, scores légèrement différés)
- IA dans l'app : Google Gemini (offre gratuite), appelée **uniquement côté serveur**
- Hébergement : Vercel

## Règles de code
- Commentaires **en français**, courts, qui expliquent le *pourquoi* (l'élève doit pouvoir défendre chaque fichier).
- Interface 100 % en français, dates et heures en fuseau `Europe/Paris` (les serveurs Vercel sont en UTC).
- Les clés API ne sortent jamais du serveur : jamais de `NEXT_PUBLIC_` pour une clé.
- Toute donnée externe passe par `lib/football.ts` ; si l'API échoue ou si `DEMO_MODE=true`, on bascule sur `data/demo/`.
- Les chiffres (forme, face-à-face, écarts) sont **calculés par le code** dans `lib/stats.ts`. L'IA ne fait que les expliquer.
- Pas de fonctionnalité hors MVP (3 écrans : Matchs, Fiche match, Classements), sauf ajout demandé par l'élève (ex. : barre de probabilités et joueur à surveiller, 4/11).

## Ce que donne l'API football-data.org gratuite (testé le 4/11/2026)
- `/matches?competitions=…&dateFrom=…&dateTo=…` : `dateTo` est **exclu**. Pas de champ `minute`.
- `/competitions/{code}/standings` : seulement le classement `TOTAL`, `form` vaut `null` → la forme se calcule nous-mêmes.
- `/matches/{id}/head2head` : historique depuis 2020 environ, **seulement dans les 12 compétitions gratuites** (pas de Ligue Europa, Conférence ni coupes : Man United–Roma apparaît vide). `limit` vaut 15 par défaut → on demande `limit=50`. Filtre `dateFrom` interdit (403). `aggregates` est faux (victoires à 0) → recompter à partir de `matches`.
- `/teams/{id}/matches?status=FINISHED` : saison en cours, uniquement les compétitions couvertes. Le paramètre `season` pour 2020 et avant renvoie 403.
- Limite stricte de 10 appels/minute (erreur 429 au-delà). L'en-tête `X-RequestCounter-Reset` donne le nombre de secondes avant la remise à zéro (fiable, testé). Défenses dans `lib/football.ts` : cache partagé, file d'attente (10 appels sur une minute glissante), puis une nouvelle tentative après le délai indiqué.
- Une fiche match jamais ouverte coûte 4 appels (2 équipes, face-à-face, classement) → environ 2 nouvelles fiches par minute ; au-delà, les blocs attendent. Avant l'oral : **préchauffer** les fiches de la démo.

## Ce que donne Gemini gratuit (testé le 4/11/2026)
- Clé au nouveau format `AQ.…` (53 caractères), envoyée dans l'en-tête `x-goog-api-key` (jamais dans l'URL).
- `gemini-3.6-flash` répond en 2 à 10 s. `gemini-2.5-flash` n'est plus ouvert aux nouveaux comptes ; `gemini-3.8-flash` et `gemini-flash-latest` ont renvoyé 503 (« forte demande ») → essayer une liste de modèles dans l'ordre, puis l'analyse de secours.
- JSON fiable avec `generationConfig.responseMimeType: "application/json"` + `responseSchema`.
- `thinkingConfig.thinkingLevel: "low"` : ~6 s au lieu de ~11 s, mais une faute d'orthographe observée → à trancher au J4 (le cache rend la latence moins critique).

## Analyse IA (fiche match)
- `lib/analysis.ts` : `buildFacts` (chiffres envoyés à l'IA, testés), `parseAnalysis` (vérifie le JSON), `simpleAnalysis` (version sans IA si Gemini est en panne).
- `lib/ai.ts` : prompt, schéma JSON, modèles essayés dans l'ordre (`gemini-3.6-flash`, `gemini-3.5-flash-lite`, `gemini-flash-latest`), 35 s max par modèle, cache partagé 12 h (clé = les chiffres).
- Générée dans un composant serveur sous `Suspense` (pas de route API) : la clé reste côté serveur, le squelette « L'IA analyse le match… » s'affiche pendant la rédaction.
- Le classement n'est donné à l'IA qu'avant le coup d'envoi (après, il contient déjà le résultat).
- Gemini gratuit est lent aux heures chargées (15-25 s, 503 fréquents l'après-midi) → **préchauffer** les analyses de la démo.
- **Quota gratuit : 20 requêtes par jour et par modèle** pour `gemini-3.6-flash` (remise à zéro vers 9 h, heure de Paris). Les autres modèles de la liste ont leur propre quota. Voir https://aistudio.google.com/rate-limit. Ne pas « brûler » le quota en tests le jour de l'oral, et ne plus modifier `buildFacts` ensuite (ça change la clé du cache → tout est réécrit).
- Demandes identiques simultanées regroupées (`inFlight` dans `lib/football.ts`, `inProgress` dans `lib/ai.ts`) : 20 visiteurs sur une fiche pas encore en cache = 1 appel.

## Probabilités « Qui part favori ? »
- `lib/probabilities.ts` : modèle de Poisson calculé par le code (buts marqués/encaissés par match cette saison, bonus domicile ×1,15, prudence = 4 matchs « moyens » ajoutés, rien sous 3 matchs joués). Testé dans `probabilities.test.ts`.
- Présenté comme une **estimation statistique**, pas un pronostic de pari. Les pourcentages sont aussi donnés à l'IA pour que sa jauge de suspense soit cohérente ; elle peut dire qui part favori, jamais qui va gagner.

## Joueur à surveiller (fiche match)
- Choisi par le code (`lib/players.ts`) : meilleur buteur des deux équipes dans la compétition, via `/competitions/{code}/scorers?limit=100` (gratuit, 1 appel par compétition, cache 1 h). Rien ne s'affiche si personne n'a marqué.
- Photo : API de Wikipédia (`lib/player-photo.ts`), images libres de Wikimedia Commons, crédit affiché sous la carte. On vérifie que la page décrit un footballeur né la même année (le 1er résultat peut être un homonyme : Mark au lieu de Jude Bellingham). Sans photo → initiales.
- L'IA ne parle toujours d'aucun joueur : la phrase de la carte est écrite par le code.

## « Le match en 30 secondes » (effet waouh de la démo)
- Bouton sous l'en-tête de la fiche match → résumé plein écran animé, lu à voix haute par la **synthèse vocale du navigateur** (Web Speech API : gratuite, hors ligne, aucun appel IA en plus).
- `lib/story.ts` (contenu et phrases, testé) + `components/MatchStory.tsx` (lecteur). Slides : affiche, enjeu (IA), favori, forme, joueur, suspense, conclusion ; une slide sans données est sautée.
- Commandes : clic à droite/gauche ou flèches, Échap pour fermer, bouton son. Sans voix française → lecture silencieuse avec sous-titres.
- Pour l'oral : utiliser **Microsoft Edge** (voix « Natural » plus humaines que Hortense/Julie/Paul de Chrome) et tester le son de l'amphi avant.
- La page prépare l'analyse et le joueur **une seule fois** (`loadAnalysis`, `loadFeaturedPlayer`) et les partage entre leurs blocs et le résumé.

## Règles du prompt IA
- Français simple, pour quelqu'un qui découvre le foot.
- Appeler les équipes **par leur nom** (sinon l'IA écrit « l'équipe à domicile »).
- Fournir des matchs **datés, dans un ordre annoncé** (« du plus récent au plus ancien ») : sans ça, l'IA a inversé la forme d'une équipe.
- N'utiliser que les données fournies ; aucun nom de joueur.
- Aucun pronostic de pari, aucun score exact prédit ; l'IA peut dire qui part favori d'après les probabilités calculées, jamais qui va gagner.
- Réponse en JSON validé ; si invalide → analyse de secours.

## Design (sombre et sportif)
- Fond quasi noir teinté vert, cartes anthracite, accent **vert pelouse fluo**, rouge pour le LIVE.
- Titres en Barlow Condensed (gras, majuscules), texte en Inter.
- Lisible au vidéoprojecteur : contrastes forts, grandes tailles, mobile d'abord.
- Couleurs définies une seule fois dans `app/globals.css` (`@theme`).

## Commandes
- `npm run dev` : serveur local sur http://localhost:3000
- `npm run lint` : vérification du code
