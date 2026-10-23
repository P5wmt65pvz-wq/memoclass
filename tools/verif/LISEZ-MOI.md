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

Safari n'est pas disponible dans cet environnement : éviter le CSS qui dépend du navigateur.
