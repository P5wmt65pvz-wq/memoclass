# Vérifications dans Chromium (Playwright)

Lancer un serveur : `python3 -m http.server 8131` à la racine du dépôt, puis `node tools/verif/<script>.cjs`.
Chaque script ouvre le site avec un faux micro et affiche `erreurs []` s'il n'y a rien à signaler.

- `fin.cjs` : enregistrer → arrêter → écran de fin → Mes cours → Modifier
- `lib.cjs` : rangement de Mes cours (puces par matière, recherche, aucun téléchargement automatique)
- `ce.cjs` : animation de fin (Raphaël → onglet Mes cours → écran de fin), captures `ce-*.png`
- `sao3.cjs <préfixe> <largeur> <hauteur>` : animation de départ, captures chronométrées (`TS=ms,ms,...`)
- `sc.cjs <WxH> <étiquette>` : écran d'enregistrement + défilement vers la transcription
- `au.cjs` : fait rendre la bande-son hors ligne et mesure le volume (pas de saturation)
- `srt.cjs` : ponctuation de la transcription en direct (fausse reconnaissance vocale)
- `ct.cjs` : le bouton de départ est centré (390, 1366, 1920 px)
- `a11y.cjs` : étiquettes et débordements
- `imp.cjs <fichier audio>` : importer un audio dans Mes cours, vitesse, téléchargement, puis transcription automatique (`?whisper=tiny`)
- `txt.cjs` : fausse dictée d'un cours d'histoire → titre et matière trouvés pendant l'animation de fin
- `live.cjs <tiny|small> <fichier.wav>` : vraie voix branchée à la place du micro (`--use-file-for-fake-audio-capture`), transcription en direct de bout en bout ; texte final dans `live-out.txt`
- `tremble.cjs` : moment où la carte « Ton cours est prêt » retombe et fait trembler la page
- `rebond.cjs` : amplitude du tremblement et carte immobile une fois posée (plus de petit rebond)
- `pastille.cjs` : la pastille d'enregistrement (point rouge + chrono) reste visible par-dessus l'animation « Link Start », puis redevient normale
- `logo.cjs` : logo en métal liquide bien placé (téléphone et ordinateur), réaction à l'appui, fenêtre Réglages qui se referme en fondu, logo dessiné et appui en fondu avec « réduire les animations » (capture `logo-<largeur>.png`)
- `son.cjs` : rend hors ligne les deux bandes-son (début et fin), mesure pic et moyenne par seconde, écrit `son-debut.wav` et `son-fin.wav` (viser : pics sous -10 dB, moyenne vers -36 dB)

Mesure de la qualité (taux d'erreur par mot sur FLEURS fr) : voir `CLAUDE.md`. Chromium peut simuler une carte graphique avec `--enable-unsafe-webgpu --use-webgpu-adapter=swiftshader` (lent, sans shader-f16).

Safari n'est pas disponible dans cet environnement : éviter le CSS qui dépend du navigateur.
