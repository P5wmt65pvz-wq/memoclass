# Mémoclass — enregistreur vocal de cours (site statique)

Site GitHub Pages (`https://p5wmt65pvz-wq.github.io/memoclass/`), un seul fichier `index.html`, sans serveur : tout reste dans le navigateur. Propriétaire : Adrien (utilise surtout un **Mac / Safari** ; Chromebook en second). Parle français, réponses courtes. **Usage réel : en cours de français sur son Chromebook** (souvent 4 Go de mémoire, pas toujours de WebGPU) : tout doit y marcher, sans modèle trop gros (`prefer()` choisit selon `navigator.deviceMemory`).

## Règles de travail
- **Une image ou une vidéo qu'Adrien envoie est un cahier des charges à reproduire à l'identique** (pas « à ma sauce »). La regarder en entier, relever forme / taille / position / couleurs / timing, dire en une ligne ce qu'on va reproduire, puis construire une seule fois.
- **Périmètre strict** : ne changer que ce qui est demandé ; ne jamais retoucher ce qu'il a validé. Le site garde son thème rouge / noir ; seul l'écran d'enregistrement (Raphaël) est bleu nuit étoilé.
- Ses messages sont dictés : lister sa demande point par point avant d'agir, ne rien oublier.
- Sons : très légers, graves, jamais de jingle, volume calme (Chromebook en classe). Tout est synthétisé (`fxKit`, `mvFxStart`, `mvFxEnd`) : le son de référence envoyé par Adrien (enregistrement de l'anime : voix « Link Start », souffle, nappe en la majeur) ne doit pas être intégré, seulement imité. Aucun téléchargement automatique dans Téléchargements (réglage désactivé par défaut).
- Vérifier avec `tools/verif/` (voir `LISEZ-MOI.md`) aux tailles téléphone et ordinateur avant de pousser. Ne jamais mettre d'identifiant de modèle dans un commit.

## Où est quoi dans `index.html`
- Réglages `S` (clé `memovox.reglages`), IndexedDB `memovox` (`cours`, `brouillon`) : ne pas renommer ces clés.
- `raphaelDraw` / `oracleFrame` / `oSky` : la scène de Raphaël (voix → `lv`), aussi utilisée par `mvCelebrate`.
- `mvStartFx` : animation de départ « Link Start » (canvas). Pendant qu'elle tourne, `body.linkfx` garde la pastille d'enregistrement (`.mini` : point rouge, chrono, pause, stop) visible en haut, sur fond sombre.
- `mvFxStart` / `mvFxEnd` : bandes-son synthétisées calées sur les deux animations (réglage « Sons des animations » = `S.sfx`, curseur « Volume des animations » = `S.fxv`, 0,7 par défaut : moyenne vers -29 dB ; la première version à -38 dB était inaudible sur le Chromebook, Adrien a cru le son supprimé) ; `mvFxUnlock()` est appelé pendant les clics Enregistrer / Arrêter (Safari et Chrome exigent un geste).
- `mvCelebrate(info, done, status)` : animation de fin. `status()` = ce que l'appli fait vraiment sur le texte (affiché en bas). La carte `#fin` arrive avec la classe `.warp` (CSS), retombe avec `.shake` et fait s'effondrer la page (`body.thud`, ~25 px, 1,15 s) avec des éclats dessinés sur le canvas ; une fois posée elle prend `.landed` (sinon l'animation d'ouverture normale se rejouait : petit rebond).
- `analyse` : titre et matière proposés d'après le contenu (mots-clés, expressions de deux mots). `polish` : mise au propre du texte (mots doublés, typographie française). `finFill` / `finRefresh` : la carte se remet à jour quand le texte précis arrive, sans écraser ce qu'Adrien a modifié.
- `WORKER_SRC` (transformers.js 4.3.1) : Cohere Transcribe sur carte graphique si l'ordinateur a au moins 8 Go de mémoire (`prefer()`), sinon Whisper large-v3-turbo (réglage « Mode léger » `S.light`), puis Whisper small ; sans carte graphique, Whisper small (wasm). `wkName()` = modèle réellement utilisé (affiché dans le direct et dans Mes cours). `cleanAsr` coupe les boucles de répétition.
- `hqRun` / `autoHq` : transcription précise automatique (lancée dès l'arrêt, pendant l'animation, si déjà acceptée) ; `importAudio` : importer un audio ; `renderList` / `courseBody` : Mes cours (puces par matière, recherche, lecteur avec vitesse, Télécharger / Partager l'audio).
- Liquid Glass : uniquement Chromium ; ailleurs, verre dépoli classique.
- Logo en métal liquide chromé (choisi par Adrien, version 1) : Paper Shaders 0.0.82 (Apache-2.0, crédité dans les mentions légales), `ShaderMount` + `liquidMetalFragmentShader` sur `logo-metal.png` (forme déjà préparée par `toProcessedLiquidMetal` : la préparer dans la page bloquait ~1 s). Seulement avec WebGL 2 et sans « réduire les animations » ; reflet fixe si `deviceMemory` < 4 ; sinon le logo dessiné reste.
- Règles d'animation (skills d'Emil Kowalski, `emilkowalski/skills`, apple-design) : jetons `--ease-out` / `--ease-in-out` ; réaction dès l'appui (`.press.down`, scale .97, aussi avec « réduire les animations » : fondu) ; pas de rebond sur ce qu'on n'a pas lancé du doigt (notification) ; Réglages avec vraie sortie animée ; `prefers-reduced-transparency` et `prefers-contrast` gérés ; contours de focus rouges (le bleu reste réservé à l'écran d'enregistrement). CSS mort supprimé (ancien écran de fin, ancienne animation de départ).

## État au 23/10/2026, fin de nuit
Fait et en ligne :
- Repos : thème rouge et noir, verre liquide, gros bouton centré, Mes cours rangé par matière (puces, recherche, cartes repliables).
- Animation de départ « Link Start » (environ 19 s, toucher pour passer) : noir puis « Link Start ! » (voix seule) ; gerbe de cônes 3D ; cercles de contrôle → petits ronds alignés (nom / OK) qui passent au vert et tombent ; « Bienvenue dans Mémoclass ! », tunnel bleu, éclair blanc, fondu.
- Enregistrement : Raphaël en grand sur la nuit étoilée de la vidéo ; la vague suit la voix ; chrono, Arrêter, Annuler ; transcription en descendant (texte blanc, gros).
- Animation de fin (validée par Adrien, environ 8,5 s) : Raphaël dit « Réponse. Cours enregistré. » ; explosion de gouttes dorées (2 200 à 3 200) qui DEVIENT le tourbillon (mêmes gouttes : elles filent vers l'extérieur, tournent, prennent tout l'écran, virent au rouge, se font aspirer au centre, les lettres des infos aussi) ; « bam » rouge (éclair court, onde de choc, vagues rouges et dorées) ; la vraie carte « Ton cours est prêt » sort du centre en tournant, vient vers toi, retombe d'un coup et fait trembler la page. Pas de loup ni de slime (retirés à sa demande).
- Pendant l'animation, le texte est retravaillé : fin de la transcription précise, mise au propre, titre et matière (message réel en bas de l'écran).
- Mes cours : Importer un audio (Dictaphone, WhatsApp, vidéo…), lecteur avec vitesse ×1 à ×2, Télécharger l'audio (aussi glissable), Partager l'audio (AirDrop…). « Copier l'audio » n'apparaît que si le navigateur l'accepte (aucun ne le garantit : seuls texte, HTML et PNG sont obligatoires).
- Mentions légales à jour (LCEN art. 1-1 II, stockage local sans consentement, droit d'auteur des cours, Cohere / Whisper).

Mesures de qualité (FLEURS fr, 40 phrases, taux d'erreur par mot ; scripts dans le scratchpad de la session, refaisables avec transformers.js en Node) :
- Whisper small q8 : 14,9 % · Whisper large-v3-turbo q4 : 7,9 % · Cohere Transcribe q4 : 6,5 % (et 3 fois plus rapide que turbo sur processeur).
- Salle simulée (voix lointaine, écho, bruit) : turbo 56,8 %, Cohere 45,2 %.
- Cohere : ne pas lui passer `chunk_length_s` (la bibliothèque découpe elle-même à 35 s) ; en wasm, son décodeur q4 ne marche pas (GatherBlockQuantized), il faudrait fp32.

À faire / en attente :
- Questions restées sans réponse : « les trucs bleus pas bien montés » (écran non précisé). Une « ligne bizarre » possible a été corrigée : la bulle de notification vide dépassait de 1,6 px en bas de l'écran.
- Jamais testé sur du vrai matériel : Safari (WebGPU de Safari 26 avec ONNX Runtime : un signalement de septembre 2026 dit que ça échoue sur iPhone) ; Cohere et Whisper turbo sur une vraie carte graphique (testés seulement sur SwiftShader, la carte graphique simulée de Chromium : textes justes, vitesse inconnue) ; le partage de fichier ; la vraie voix d'Adrien. Demander à Adrien ce qu'affiche « Transcription précise ✓ · … » sur son Mac.

Vidéos de référence (Google Drive, partage par lien ; télécharger avec `https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t`) :
- SAO Link Start : `1zcmeVjDMrNo--NGO6tT9f5ZBvMYffMJw`
- Raphaël (cercle doré, vers 21 s ; petit cercle de 23 à 30 s) : `122419Njo2kh19h1olN5Du_9EbI5T5MCj`
- Raphaël de nuit (ciel étoilé, apparition du cercle vers 8 s) : `1UrgXyu45joiC21FHS2qzMf5lVDFtBEJQ`
Ces vidéos sont sans son. Ne jamais intégrer d'images ni de sons de l'anime dans le site (droits d'auteur) : reproduire avec du dessin canvas.
