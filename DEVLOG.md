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

## J1 (suite) — mercredi 4 novembre 2026 : fiche match et classements

*On avait un jour d'avance : on a enchaîné sur le programme du jour 3.*

**Ce que j'ai demandé**
- Continuer avec la fiche match et la page des classements.

**Ce que l'IA a fait**
- Elle a d'abord vérifié ce que l'API renvoie pour un match, une équipe et le classement de la Ligue des champions (36 équipes).
- Elle a écrit `lib/stats.ts` (forme, points, face-à-face, bilan domicile/extérieur) avec **13 tests automatiques** (`npm test`), écrits avant de brancher l'interface.
- Fiche match : en-tête, forme du moment (pastilles V/N/D avec le logo de l'adversaire), face-à-face, comparaison au classement. Un emplacement est prêt pour l'analyse IA.
- Page Classements : 6 championnats, zones colorées (Europe, barrage, relégation) et une légende pour les débutants.

**Ce que j'ai décidé / corrigé**
- *(à compléter : ce que j'ai regardé, ce que j'ai voulu changer)*

**Problèmes rencontrés et solutions**
- Risque de dépasser les 10 appels/minute : Next.js précharge les pages des liens visibles. Une page d'accueil avec 9 matchs = des dizaines d'appels inutiles → préchargement désactivé sur les liens des matchs et des championnats.
- Tous les matchs d'hier à demain sont chargés en **un seul appel**, partagé entre l'accueil et les fiches.
- Vérification du cache : 5 visites de la même page = **1 seul appel** à l'API.
- Le menu bloquait l'affichage des fiches match (il lisait l'adresse trop tôt) → il affiche d'abord les liens, puis surligne l'onglet actif.
- Si une donnée manque (API saturée), la section affiche « Données momentanément indisponibles » au lieu de faire planter la page.

**Ce que j'ai appris** *(à compléter par moi)*
-

---

## J1 (suite) — mes retours après avoir testé l'app

**Ce que j'ai demandé**
- Voir 7 jours de matchs au lieu de 3 (hier / aujourd'hui / demain).
- Comprendre pourquoi le face-à-face était vide pour des équipes qui se sont déjà affrontées.

**Ce que l'IA a fait**
- Avant de toucher au code, elle a **cherché la cause** : tests directs de l'API et lecture des journaux du serveur.
- Barre de 7 jours (J-3 à J+3), toujours en **un seul appel** à l'API (8 jours d'un coup, le maximum autorisé est 10).

**Ce qu'on a découvert (deux causes différentes)**
1. **Limite des données gratuites** : elles ne couvrent que 12 compétitions depuis 2020 environ. Man United – Roma se sont affrontés en Ligue Europa (2021, 2023), qui n'est pas incluse → l'API ne connaît aucune confrontation. L'app disait « Première rencontre », ce qui était faux → elle dit maintenant honnêtement ce que couvrent nos données.
2. **Limite de 10 appels/minute** : en ouvrant plusieurs fiches d'affilée, l'API refusait des appels (erreur 429) et le bloc restait vide. Pour Atlético – Bayern, l'API avait pourtant 2 confrontations.

**Solutions**
- L'API s'arrêtait à 15 confrontations par défaut → on en demande 50 (Valence – Real Madrid : 13 matchs, contre 10 avant).
- Chaque bloc de la fiche match se charge séparément : si l'un attend, les autres s'affichent quand même.
- Un premier essai de « réessayer après le délai indiqué » ne suffisait pas : toutes les pages réessayaient en même temps et redépassaient la limite. On a donc ajouté une **file d'attente** qui n'envoie jamais plus de 10 appels par minute.
- Test : 4 fiches jamais ouvertes à la suite → les 4 complètes (la 3e a attendu une minute).

**Ce que j'ai appris** *(à compléter par moi)*
-

---

## J1 (suite) — l'analyse IA (programme du jour 4)

**Ce que j'ai demandé**
- Brancher l'analyse IA sur la fiche match.

**Ce que l'IA a fait**
- `lib/analysis.ts` prépare les chiffres envoyés à Gemini : classement et « zone » (qualification, relégation…), forme datée du plus récent au plus ancien, bilan à domicile/extérieur, face-à-face. **9 nouveaux tests** (22 au total).
- `lib/ai.ts` : les consignes (prompt), le format JSON imposé, 3 modèles essayés dans l'ordre, le cache de 12 h.
- Une **analyse de secours écrite par le code** si Gemini est en panne (badge « Version simplifiée ») : le bloc n'est jamais vide.
- La carte d'analyse : l'enjeu en une phrase, la jauge de suspense, la forme, le face-à-face, « À surveiller » et « Le mot du débutant ».

**Vérifications**
- Chaque affirmation de l'IA comparée aux vrais chiffres sur 3 matchs (Leipzig – Man City, Valence – Real Madrid, Feyenoord – Inter) : tout est juste, y compris « 0 but encaissé à domicile » pour Leipzig (19 marqués, 0 encaissé : vérifié).
- Cache : 3 rechargements de la même fiche = 0 nouvel appel à Gemini (0,2 s chacun).
- Panne simulée (nom de modèle inexistant) → l'analyse de secours s'affiche.

**Problèmes rencontrés et solutions**
- Vers 16 h, Gemini gratuit était saturé (erreur 503 sur 3 modèles) ou lent (20 s pour répondre « OK ») → ajout d'un modèle « lite » moins demandé, 35 s d'attente maximum par modèle, et l'analyse de secours.
- **Triche involontaire repérée** : pour un match déjà joué, le classement actuel contient déjà son résultat. L'IA écrivait « Feyenoord, 30e et virtuel éliminé » en comptant la défaite 0-3 du match lui-même → on ne donne plus le classement à l'IA une fois le match commencé (+ un test).
- « 2 victoire(s), 0 nul(s) » faisait brouillon → vrais accords (« 2 victoires, 0 nul »).

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
