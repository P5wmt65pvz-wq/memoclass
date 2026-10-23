# Mémoclass — enregistreur vocal de cours (site statique)

Site GitHub Pages (`https://p5wmt65pvz-wq.github.io/memovox/`, puis `/memoclass/` quand le dépôt sera renommé), un seul fichier `index.html`, sans serveur : tout reste dans le navigateur. Propriétaire : Adrien (utilise surtout un **Mac / Safari** ; Chromebook en second). Parle français, réponses courtes.

## Règles de travail
- **Une image ou une vidéo qu'Adrien envoie est un cahier des charges à reproduire à l'identique** (pas « à ma sauce »). La regarder en entier, relever forme / taille / position / couleurs / timing, dire en une ligne ce qu'on va reproduire, puis construire une seule fois.
- **Périmètre strict** : ne changer que ce qui est demandé ; ne jamais retoucher ce qu'il a validé. Le site garde son thème rouge / noir ; seul l'écran d'enregistrement (Raphaël) est bleu nuit étoilé.
- Ses messages sont dictés : lister sa demande point par point avant d'agir, ne rien oublier.
- Sons : très légers, graves, jamais de jingle. Aucun téléchargement automatique dans Téléchargements (réglage désactivé par défaut).
- Vérifier avec `tools/verif/` (voir `LISEZ-MOI.md`) aux tailles téléphone et ordinateur avant de pousser. Ne jamais mettre d'identifiant de modèle dans un commit.

## Où est quoi dans `index.html`
- Réglages `S` (clé `memovox.reglages`), IndexedDB `memovox` (`cours`, `brouillon`) : ne pas renommer ces clés.
- `raphaelDraw` / `oracleFrame` / `oSky` : la scène de Raphaël (voix → `lv`), aussi utilisée par `mvCelebrate`.
- `mvStartFx` : animation de départ « Link Start » (canvas) + partition sonore synthétisée (`score`).
- `mvCelebrate` : animation de fin (Raphaël → onglet « Mes cours »).
- `analyse` : titre et matière proposés d'après le contenu (mots-clés).
- `hqRun` / `autoHq` : transcription précise (Whisper) automatique ; `renderList` : Mes cours (puces par matière, recherche).
- Liquid Glass : uniquement Chromium ; ailleurs, verre dépoli classique.

## État au 23/10/2026 (reprise de session)
Fait et en ligne :
- Repos : thème rouge et noir, verre liquide, gros bouton centré, Mes cours rangé par matière (puces, recherche, cartes repliables).
- Animation de départ « Link Start » (environ 19 s, toucher pour passer) :
  - noir puis « Link Start ! » (voix synthétique seule, aucun effet sonore) ;
  - gerbe de cônes en 3D ;
  - cercles de contrôle qui deviennent de petits ronds alignés au centre (nom / OK), puis passent au vert et tombent ;
  - « Bienvenue dans Mémoclass ! », tunnel bleu, éclair blanc, fondu vers l'appli.
- Enregistrement : Raphaël en grand au centre sur une nuit étoilée copiée sur la vidéo (nuages bleu-gris aux bords éclairés). La vague suit la voix. Chrono, Arrêter, Annuler. La transcription est en descendant (texte blanc, gros).
- Transcription précise en direct : Whisper large-v3-turbo sur carte graphique, par morceaux de 12 à 25 s ; sinon Whisper small après le cours.
- Arrêt : Raphaël dit « Réponse. Cours enregistré. » puis explose en gouttes dorées (sans son). L'écran titre / matière s'ouvre, pré-rempli d'après le contenu.
- Fichier en M4A ; boutons « Partager le fichier » et « Enregistrer le fichier » ; boutons Copier pour le texte.

À faire / en attente :
- Adrien doit renommer le dépôt `memovox` → `memoclass` (la création d'un dépôt par l'API est refusée, erreur 403).
- Questions restées sans réponse : « les lignes bizarres » et « les trucs bleus pas bien montés » (écran non précisé).
- Jamais testé ici :
  - Safari ;
  - le grand modèle Whisper sur carte graphique (testé seulement avec whisper-tiny en wasm, `?whisper=tiny`) ;
  - le partage de fichier ;
  - la vraie voix d'Adrien.

Vidéos de référence (Google Drive, partage par lien ; télécharger avec `https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t`) :
- SAO Link Start : `1zcmeVjDMrNo--NGO6tT9f5ZBvMYffMJw`
- Raphaël (cercle doré, vers 21 s ; petit cercle de 23 à 30 s) : `122419Njo2kh19h1olN5Du_9EbI5T5MCj`
- Raphaël de nuit (ciel étoilé, apparition du cercle vers 8 s) : `1UrgXyu45joiC21FHS2qzMf5lVDFtBEJQ`
Ces vidéos sont sans son. Ne jamais intégrer d'images ni de sons de l'anime dans le site (droits d'auteur) : reproduire avec du dessin canvas.
