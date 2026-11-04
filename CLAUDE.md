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
- Pas de fonctionnalité hors MVP (3 écrans : Matchs, Fiche match, Classements).

## Ce que donne l'API football-data.org gratuite (testé le 4/11/2026)
- `/matches?competitions=…&dateFrom=…&dateTo=…` : `dateTo` est **exclu**. Pas de champ `minute`.
- `/competitions/{code}/standings` : seulement le classement `TOTAL`, `form` vaut `null` → la forme se calcule nous-mêmes.
- `/matches/{id}/head2head` : historique sur plusieurs saisons (depuis 2020), mais `aggregates` est faux (victoires à 0) → recompter à partir de `matches`. Liste vide si les équipes ne se sont jamais affrontées dans les compétitions couvertes.
- `/teams/{id}/matches?status=FINISHED` : uniquement les compétitions couvertes, ordre chronologique.
- Limite stricte de 10 appels/minute (erreur 429 au-delà) → toujours passer par le cache.

## Ce que donne Gemini gratuit (testé le 4/11/2026)
- Clé au nouveau format `AQ.…` (53 caractères), envoyée dans l'en-tête `x-goog-api-key` (jamais dans l'URL).
- `gemini-3.6-flash` répond en 2 à 10 s. `gemini-2.5-flash` n'est plus ouvert aux nouveaux comptes ; `gemini-3.8-flash` et `gemini-flash-latest` ont renvoyé 503 (« forte demande ») → essayer une liste de modèles dans l'ordre, puis l'analyse de secours.
- JSON fiable avec `generationConfig.responseMimeType: "application/json"` + `responseSchema`.
- `thinkingConfig.thinkingLevel: "low"` : ~6 s au lieu de ~11 s, mais une faute d'orthographe observée → à trancher au J4 (le cache rend la latence moins critique).

## Règles du prompt IA
- Français simple, pour quelqu'un qui découvre le foot.
- Appeler les équipes **par leur nom** (sinon l'IA écrit « l'équipe à domicile »).
- Fournir des matchs **datés, dans un ordre annoncé** (« du plus récent au plus ancien ») : sans ça, l'IA a inversé la forme d'une équipe.
- N'utiliser que les données fournies ; aucun nom de joueur.
- Aucun pronostic de pari, aucun score exact prédit.
- Réponse en JSON validé ; si invalide → analyse de secours.

## Design (sombre et sportif)
- Fond quasi noir teinté vert, cartes anthracite, accent **vert pelouse fluo**, rouge pour le LIVE.
- Titres en Barlow Condensed (gras, majuscules), texte en Inter.
- Lisible au vidéoprojecteur : contrastes forts, grandes tailles, mobile d'abord.
- Couleurs définies une seule fois dans `app/globals.css` (`@theme`).

## Commandes
- `npm run dev` : serveur local sur http://localhost:3000
- `npm run lint` : vérification du code
