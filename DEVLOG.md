# Journal de bord — Kick-Time

Ce journal prouve que **c'est moi qui pilote l'IA** : pour chaque séance, je note ce que j'ai demandé, ce que l'IA a fait, ce que j'ai décidé ou corrigé, et ce que j'ai appris.
Il servira pour la partie « technique de développement avec l'IA » de la présentation.

Outils : **Claude Code** (l'IA qui m'aide à développer) et **Google Gemini** (l'IA qui est dans l'application).

---

## J1 — mercredi 4 novembre 2026

**Ce que j'ai demandé**
- Le pitch de Kick-Time et les contraintes de l'oral (10 min, 3 notes : app, technique, présentation).

**Ce que l'IA a fait**
- Elle m'a posé des questions avant de coder (mode plan) : délai, durée, mon niveau, budget.
- Elle a proposé un plan complet : choix techniques, 3 écrans, planning sur 7 jours, déroulé de l'oral.
- Elle a créé le projet Next.js, ce journal et le fichier `CLAUDE.md` (la « mémoire » du projet).
- Elle a construit une première version de l'écran des matchs avec des données d'exemple.

**Ce que j'ai décidé**
- Budget 0 € → données football-data.org (gratuit) + Gemini (offre gratuite).
- Design sombre et sportif (meilleur rendu au vidéoprojecteur).
- Code rangé hors OneDrive (`C:\Users\youne\dev\kick-time`) pour éviter les problèmes de synchronisation.

**Après avoir collé mes clés**
- L'IA a testé l'API football-data.org avant d'écrire la suite : matchs, classements, face-à-face et derniers matchs d'une équipe fonctionnent en gratuit.
- L'écran affiche maintenant les **vrais matchs** du jour (9 matchs de Ligue des champions le 4/11).

**Premier test de l'analyse IA (Toulouse – Strasbourg, 6/11)**
- Le code calcule les chiffres (classement, 5 derniers matchs, 9 confrontations depuis 2020), puis Gemini les explique en JSON.
- **L'IA s'est trompée** : elle a écrit que Strasbourg « a perdu ses 4 derniers matchs après une victoire 5-1 », alors que le 5-1 est le match **le plus récent**. Les matchs lui étaient donnés sans ordre clair.
- Solution : le code envoie maintenant chaque match **avec sa date**, du plus récent au plus ancien. Après correction, l'analyse est juste.
- Leçon : l'IA explique bien, mais elle peut mal interpréter des données ambiguës → c'est au code de préparer des données claires, et à moi de vérifier.
- En réduisant la « réflexion » de l'IA, la réponse passe de 11 s à 6 s.

**Problèmes rencontrés et solutions**
- Pas de budget pour l'IA → offre gratuite de Gemini + cache (une seule analyse par match).
- Le plan gratuit de football-data.org donne des scores légèrement différés → on l'assume et on l'explique.
- Pendant les tests, on a dépassé la limite de 10 appels par minute (erreur 429) → preuve que le cache est indispensable pendant la démo, quand toute la salle ouvre l'app.
- Le bilan « victoires / défaites » renvoyé par l'API pour le face-à-face est faux (tout à 0) → on le recalculera nous-mêmes à partir de la liste des matchs.
- Ma première clé Gemini était refusée : j'avais copié le nom du projet Google (`gen-lang-client-…`) au lieu de la clé. L'IA s'est aussi trompée : elle m'a dit qu'une clé commence toujours par `AIza`, alors que les nouvelles clés Google commencent par `AQ.`.
- Deux modèles Gemini ont répondu « trop de demande » (erreur 503) → l'app essaiera un autre modèle, puis une analyse de secours.
- Next.js refusait de lire l'heure trop tôt (la date du jour aurait été figée) → on attend la visite de l'utilisateur avant de calculer « aujourd'hui ».
- L'en-tête dépassait de l'écran sur les petits téléphones (320 px) → logo seul sur les très petits écrans.

**Ce que j'ai appris** *(à compléter par moi)*
-

---

## Modèle pour les jours suivants

## J? — date

**Ce que j'ai demandé**
-

**Ce que l'IA a fait**
-

**Ce que j'ai décidé / corrigé**
-

**Problèmes rencontrés et solutions**
-

**Ce que j'ai appris**
-
