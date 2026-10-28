/* Nikon Z50II : ce qu'il faut pour la vue éclatée et le viseur.
   Commandes et rôles vérifiés dans le Guide de référence Nikon Z50II
   (onlinemanual.nikonimglib.com/z50II/fr, consulté le 28/10/2026). */
window.APPAREIL = {
  id: "z50ii",
  nom: "Nikon Z50II",
  // pièces de la vue éclatée (image générée par IA à partir d'une vraie photo du Z50II)
  // z = ordre d'empilement ; k = de combien la pièce rentre dans le boîtier quand il est fermé
  pieces: {
    ecran: { z: 1, k: .92, nom: "L'écran", dit: "Il pivote : tu te vois en vlog, tu photographies au ras du sol." },
    capteur: { z: 2, k: .95, nom: "Le capteur", dit: "C'est lui qui « voit » la photo. 20,9 millions de points." },
    batterie: { z: 0, k: .97, nom: "La batterie", dit: "Environ 230 à 250 photos par charge. Prends-en une deuxième." },
    carte: { z: 0, k: .97, nom: "La carte SD", dit: "Tes photos sont dessus. Formate-la dans l'appareil." },
    boitier: { z: 3, k: 0, nom: "Le boîtier", dit: "La poignée tient bien en main. Tout se règle avec le pouce et l'index." },
    dessus: { z: 4, k: .9, nom: "Le dessus", dit: "Les molettes et les touches que tu utilises tout le temps." },
    objectif: { z: 5, k: .8, nom: "L'objectif", dit: "Il fait entrer la lumière. Tourne la bague pour zoomer." }
  },
  // commandes sur la vraie photo (commandes.webp), en % de l'image
  commandes: {
    principale: { x: 31.9, y: 29.6, nom: "Molette arrière", dit: "La molette sous ton pouce." },
    correction: { x: 19.4, y: 58.3, nom: "Touche ±", dit: "Plus clair ou plus sombre." },
    iso: { x: 33.8, y: 56.7, nom: "Touche ISO", dit: "La sensibilité à la lumière." },
    rec: { x: 48.2, y: 56.4, nom: "Bouton rouge", dit: "Lance la vidéo." },
    declencheur: { x: 30.6, y: 78.4, nom: "Déclencheur", dit: "Appuie pour prendre la photo." },
    secondaire: { x: 37.5, y: 86.5, nom: "Molette avant", dit: "La molette sous ton index." },
    mode: { x: 75.1, y: 31.9, nom: "Molette de mode", dit: "P, S, A, M… le « qui décide quoi »." }
  },
  modes: ["AUTO", "P", "S", "A", "M", "U1", "U2", "U3", "SCN"],
  // les défis : on essaie, on voit le résultat tout de suite
  defis: [
    {
      id: "clair", titre: "Trop sombre ?", but: "Rends la photo plus claire.", scene: "paysage", mode: "P",
      etapes: [
        { cmd: "correction", tenir: true, txt: "Maintiens la touche ±…" },
        { cmd: ["principale", "secondaire"], txt: "…et tourne une molette vers le +." }
      ],
      reussi: "Correction {v} : la photo est juste.",
      vraie: "Pour de vrai : photographie une fenêtre très lumineuse. Si elle sort sombre, fais la même chose."
    },
    {
      id: "flou", titre: "Fond flou", but: "Floute l'arrière-plan, garde le visage net.", scene: "portrait", mode: "P",
      etapes: [
        { cmd: "mode", vers: "A", txt: "Tourne la molette de mode sur A." },
        { cmd: "secondaire", txt: "Tourne la molette avant pour baisser le chiffre f/." }
      ],
      reussi: "{v} : le fond est flou, le visage reste net.",
      vraie: "Pour de vrai : pose une tasse près de toi, loin d'un mur. Zoome au maximum et rapproche-toi : le fond devient flou."
    },
    {
      id: "fige", titre: "Fige l'action", but: "Le joueur est flou. Fige-le.", scene: "sport", mode: "P",
      etapes: [
        { cmd: "mode", vers: "S", txt: "Tourne la molette de mode sur S." },
        { cmd: "principale", txt: "Tourne la molette arrière pour accélérer la vitesse." }
      ],
      reussi: "{v} : le mouvement est figé.",
      vraie: "Pour de vrai : fais tomber une balle devant toi à 1/1000 s, puis à 1/30 s. Compare."
    },
    {
      id: "nuit", titre: "Il fait nuit", but: "La scène est trop sombre. Monte la sensibilité.", scene: "ville", mode: "M",
      etapes: [
        { cmd: "iso", tenir: true, txt: "Maintiens la touche ISO…" },
        { cmd: "principale", txt: "…et tourne la molette arrière pour monter les ISO." }
      ],
      reussi: "{v} : on voit tout. Un peu de grain : c'est normal.",
      vraie: "Pour de vrai : éteins la lumière de ta chambre et essaie 400, 1600, 6400 ISO. Regarde le grain."
    }
  ]
};
