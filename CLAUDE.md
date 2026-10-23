# Dictavox — enregistreur vocal de cours (site statique)

Site GitHub Pages (`https://p5wmt65pvz-wq.github.io/memovox/`), un seul fichier `index.html`, sans serveur : tout reste dans le navigateur. Propriétaire : Adrien (utilise surtout un **Mac / Safari** ; Chromebook en second). Parle français, réponses courtes.

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
