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

## Règles du prompt IA
- Français simple, pour quelqu'un qui découvre le foot.
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
