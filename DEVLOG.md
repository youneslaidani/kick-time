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

## J1 (suite) — ma nouvelle idée : « Qui part favori ? »

**Ce que j'ai demandé**
- Une barre avec le pourcentage de chances de victoire de chaque équipe, juste avant l'analyse.

**Ce qu'on a décidé ensemble**
- Les probabilités sont **calculées par le code, pas par l'IA** : on garde la règle du projet (le code calcule, l'IA explique).
- Méthode : le **modèle de Poisson**, classique chez les statisticiens du foot. Attaque de l'un face à la défense de l'autre → buts « attendus » → probabilité de chaque score → victoire / nul / défaite.
- Présenté comme une **estimation statistique, pas un pronostic de pari**, avec un bouton « Comment c'est calculé ? ».
- Les pourcentages sont aussi donnés à l'IA, pour que sa jauge de suspense ne contredise pas la barre.

**Résultat** : Valence 13 % · nul 18 % · Real Madrid 69 % (buts attendus 0,9 contre 2,3) ; l'IA écrit « Plutôt à sens unique ».

**Problèmes rencontrés et solutions**
- **Un test a trouvé un vrai défaut** dans un calcul existant : la forme comptait aussi les matchs où l'équipe ne jouait pas. Invisible dans l'app (la liste d'une équipe ne contient que ses matchs), mais fragile → corrigé + test.
- **20 visiteurs sur une fiche pas encore en cache = 20 fois les mêmes appels** (une page a mis 3,5 minutes en test) → les demandes identiques en cours sont maintenant partagées. Test : 3 visiteurs simultanés = 1 seule rédaction par l'IA, 17 s pour tous.
- **Découverte importante : Gemini gratuit = 20 analyses par jour** pour le modèle principal, et nos tests les ont toutes utilisées. Le modèle de secours a pris le relais automatiquement. Pour l'oral : analyses générées à l'avance, pas de tests le jour J.

**Tests automatiques** : 31 (contre 22 avant).

**Ce que j'ai appris** *(à compléter par moi)*
-

---

## J1 (suite) — mon idée : « Le joueur à surveiller », avec sa photo

**Ce que j'ai demandé**
- Pour chaque match, un joueur à surveiller avec sa photo, entre l'analyse IA et la forme du moment.

**Ce qu'on a décidé ensemble**
- Le joueur est **choisi par le code à partir de vrais chiffres** : le meilleur buteur des deux équipes dans la compétition (l'API gratuite donne les 100 meilleurs buteurs). L'IA ne parle toujours d'aucun joueur, pour qu'elle ne puisse rien inventer.
- La photo vient de **Wikipédia / Wikimedia Commons** (images sous licence libre), avec le crédit affiché.

**Résultat** : Valence – Real Madrid → Kylian Mbappé (12 buts en 11 matchs, 2 passes décisives) ; Lens – Côme → Anastasios Douvikas (3 buts en 3 matchs).

**Problèmes rencontrés et solutions**
- **Le piège des homonymes** : en cherchant « Jude Bellingham », Wikipédia renvoie d'abord **Mark** Bellingham, né en 1976 ! → le code vérifie que la page décrit un footballeur **né la même année** que le joueur de l'API (+ test automatique avec ce cas réel).
- Certains joueurs n'ont pas de photo libre (ex. Hugo Duro) → on affiche leurs initiales.
- L'âge est calculé au jour du match, pas au jour où on ouvre l'app.

**Tests automatiques** : 40.

**Ce que j'ai appris** *(à compléter par moi)*
-

---

## J1 (suite) — « Surprends-moi » : le match en 30 secondes

**Ce que j'ai demandé**
- Une fonctionnalité qui me surprenne et qui surprenne le jury.

**Ce que l'IA a proposé et construit**
- Un bouton **« Le match en 30 secondes »** sur chaque fiche : un résumé plein écran, **animé et commenté à voix haute**, comme une mini-émission de télé. Affiche → enjeu (écrit par l'IA) → qui part favori (barre qui se remplit) → forme (pastilles qui apparaissent) → joueur à surveiller (photo qui zoome, compteur de buts) → jauge de suspense → conclusion.
- La voix est celle du **navigateur** (synthèse vocale intégrée) : gratuite, sans internet, **aucun appel d'IA en plus** (important avec le quota de 20/jour).
- Sous-titres, son coupable, navigation au clavier ou au toucher (comme les stories).

**Problèmes rencontrés et solutions**
- Le premier essai durait environ 1 minute : les phrases de l'IA sur la forme étaient trop longues à l'oral → phrase courte calculée par le code (« Sur leurs 5 derniers matchs, Valencia compte 1 victoire, Real Madrid 5 victoires »).
- « Samedi 7 Novembre À 21 H » : une majuscule à chaque mot → seulement la première lettre.
- La photo agrandie chevauchait le titre ; sur téléphone, les noms étaient coupés dans la slide de forme → corrigé.
- Sur iPhone, la voix n'est autorisée qu'au moment précis du clic → on la « réveille » dans le clic.

**Tests automatiques** : 48.

**Ce que j'ai appris** *(à compléter par moi)*
-

---

## J1 (suite) — séduire quelqu'un qui ne s'intéresse pas au foot

**Ce que j'ai demandé**
- Quelque chose qui touche les personnes qui ne suivent pas le foot.

**Ce qu'on a décidé ensemble**
- Viser **les non-fans de foot** (c'est la cible même de Kick-Time), sans clichés sur un public en particulier.
- Idée retenue : **« Trouve ton équipe en 20 secondes »**. On ne connaît rien au foot ? En 5 questions de la vie de tous les jours (ta couleur préférée, ta ville de week-end rêvée, plutôt histoire ou nouveauté…), l'app te trouve **ton** club et te donne une raison de regarder son prochain match.
- Pendant l'oral : « Sortez votre téléphone : dans 20 secondes, vous avez une équipe à supporter ce week-end. »

**Comment ça marche**
- Le code compare les réponses aux **vraies infos des ~100 clubs** des 5 grands championnats : couleurs du maillot, pays, place au classement, année de création, nombre de buts par match. Un score par club, le plus haut gagne (testé : le violet mène à Toulouse, Madrid + favoris au Real).
- Le résultat explique **pourquoi** (« Ses couleurs : rouge et jaune. Avec ton rouge préféré ! », « Un club chargé d'histoire, fondé en 1906 »), avec des confettis aux couleurs du club, puis **son prochain match** avec un lien vers l'analyse IA.
- Les réponses ne quittent pas le téléphone : le choix est calculé dans le navigateur.
- Une grande accroche « Pas fan de foot ? » en haut de l'accueil.

**Exemple réel** : outsider + rouge + France + histoire + spectacle → **RC Lens** (9e de Ligue 1, fondé en 1906, Stade Bollaert-Delelis), prochain match : Lens – Côme ce soir à 21 h.

**Tests automatiques** : 55.

**Ce que j'ai appris** *(à compléter par moi)*
-

---

## J1 (suite) — l'écran de PC n'était pas utilisé en entier

**Ce que j'ai remarqué** : sur PC, la fiche match tenait dans une colonne étroite au milieu, avec de grandes bandes vides sur les côtés.

**Pourquoi** : l'app avait été conçue « téléphone d'abord », avec une largeur maximale d'environ 770 px partout.

**Ce qu'on a changé** (seulement sur grand écran, le téléphone ne bouge pas) :
- Largeur maximale portée à ~1150 px.
- Fiche match en **2 colonnes** : à gauche probabilités + analyse IA, à droite joueur, forme, face-à-face, classement.
- Accueil : les championnats répartis sur 2 colonnes. Classements : la légende à droite du tableau.
- Vérifié en 1440 px (PC), 1280 px (vidéoprojecteur) et 375 px (téléphone).

---

## J1 (suite) — alléger l'analyse IA

**Ce que j'ai remarqué** : l'analyse IA répétait la forme et le face-à-face, alors qu'ils sont déjà affichés plus bas en graphiques, bien plus parlants.

**Ce que j'ai décidé** : retirer ces deux parties de la carte… et aussi **de ce qu'on demande à l'IA** : elle écrit moins de texte (réponse plus rapide), mais reçoit toujours ces chiffres pour l'enjeu, le résumé et le suspense. Nouvelle consigne : « ne les détaille pas, ils sont déjà affichés en graphiques ».

**Au passage** : l'IA avait écrit « 59 pourcent » → nouvelle règle « écris les pourcentages avec le symbole % ». Vérifié : « 59 % ».

---

## J1 (suite) — « Tu comprends rien au foot ? 🤢 »

**Ce que j'ai demandé**
- Une rubrique drôle, avec un gros bouton et un emoji dégoûté, pour que quelqu'un qui n'aime pas le foot comprenne les bases et puisse participer à une discussion. Sans être sexiste : beaucoup de gens, hommes comme femmes, ne comprennent pas certaines règles.

**Ce que l'IA a construit**
- Un gros bouton **🤢 « Tu comprends rien au foot ? »** (l'emoji se tortille) en haut de l'accueil.
- Une page « Le foot expliqué en 5 minutes » : les bases en 30 secondes, **le hors-jeu avec un schéma animé interactif** (on bascule entre « hors-jeu » et « pas hors-jeu »), cartons/coup franc/penalty, le VAR, la Ligue des champions expliquée en 3 étapes, les autres compétitions (dont la Coupe du monde féminine et le Ballon d'Or féminin), un dico de survie, des **phrases magiques pour briller en discussion**, et un **Vrai ou faux** avec score.
- Règle d'humour : on rit **du foot** (le VAR interminable, les joueurs qui se roulent par terre, les phrases toutes faites des entraîneurs), jamais d'un public.
- Aucun appel à l'API ni à l'IA : la page est instantanée, même avec un mauvais wifi.

**Vérifications** : schéma du hors-jeu (étiquettes qui se chevauchaient → corrigé), Vrai ou faux jusqu'au score, PC / tablette / téléphone sans débordement.

**Tests automatiques** : 59.

---

## J1 (suite) — le logo partout et un QR code pour le jury

**Ce que j'ai demandé**
- Le logo de l'app dans l'onglet du navigateur et comme icône d'application.
- Un QR code que le jury pourra scanner pendant la présentation pour ouvrir l'app sur son téléphone.

**Ce que l'IA a fait**
- Un script (`scripts/generate-icons.mjs`) fabrique toutes les icônes à partir du logo : favicon (onglet), icône iPhone, icônes Android. Plus un « manifeste » : sur téléphone, « Ajouter à l'écran d'accueil » installe Kick-Time avec son logo, comme une vraie application.
- Une page **/qr** à projeter : un grand QR code avec le logo au centre, et le choix de la page à ouvrir (accueil, quiz, « Tu comprends rien au foot ? »).
- Le QR code s'adapte tout seul : une fois l'app en ligne, il contient l'adresse publique ; en local, il utilise l'adresse du PC sur le wifi (pour tester avec mon téléphone avant la mise en ligne).
- Un pied de page avec les sources des données (football-data.org, Gemini, Wikimedia Commons) et un lien « Partager l'app (QR code) ».

**Vérification** : le QR code avec le logo au centre a été **décodé par un lecteur de QR code** (comme le ferait un téléphone), sur 3 adresses différentes, avec un logo plus grand que le vrai par sécurité : lu à chaque fois.

**À faire** : la mise en ligne sur Vercel, sans quoi le jury ne pourra pas ouvrir l'app (son téléphone ne voit pas mon PC).

**Tests automatiques** : 64.

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
