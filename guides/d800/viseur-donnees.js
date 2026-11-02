/* Nikon D800 : ce qu'il faut pour les défis de l'accueil.
   Commandes et rôles vérifiés dans le Manuel d'utilisation Nikon D800
   (édition française, download.nikonimglib.com, consulté le 31/10/2026). */
window.APPAREIL = {
  id: "d800",
  nom: "Nikon D800",
  // commandes sur la vraie photo (commandes.webp : en haut le dos, en bas le dessus côté droit), en % de l'image
  commandes: {
    iso: { x: 12.9, y: 11.3, nom: "Commande ISO", dit: "Sur le cadran de gauche : la sensibilité à la lumière." },
    principale: { x: 82, y: 26.4, nom: "Molette principale", dit: "La molette sous ton pouce." },
    mode: { x: 35.5, y: 38.5, t: 12.5, nom: "Commande MODE", dit: "Maintiens-la et tourne la molette principale : P, S, A, M." },
    correction: { x: 41.5, y: 53.5, t: 12.5, nom: "Commande ±", dit: "Plus clair ou plus sombre." },
    declencheur: { x: 59, y: 61.3, nom: "Déclencheur", dit: "Appuie pour prendre la photo." },
    secondaire: { x: 75.5, y: 85, nom: "Molette secondaire", dit: "La molette sous ton index, à l'avant." }
  },
  modes: ["P", "S", "A", "M"],
  // les défis : on essaie, on voit le résultat tout de suite
  defis: [
    {
      id: "clair", titre: "Trop sombre ?", but: "Rends la photo plus claire.", scene: "paysage", mode: "P",
      etapes: [
        { cmd: "correction", tenir: true, txt: "Maintiens la commande ±…" },
        { cmd: "principale", txt: "…et tourne la molette principale vers le +." }
      ],
      reussi: "Correction {v} : la photo est juste.",
      vraie: "Pour de vrai : photographie une fenêtre très lumineuse. Si elle sort sombre, fais la même chose."
    },
    {
      id: "flou", titre: "Fond flou", but: "Floute l'arrière-plan, garde le visage net.", scene: "portrait", mode: "P",
      etapes: [
        { cmd: "mode", tenir: true, txt: "Maintiens la commande MODE…" },
        { cmd: "principale", vers: "A", txt: "…et tourne la molette principale jusqu'à A." },
        { cmd: "secondaire", txt: "Tourne la molette secondaire pour baisser le chiffre f/." }
      ],
      reussi: "{v} : le fond est flou, le visage reste net.",
      vraie: "Pour de vrai : pose une tasse près de toi, loin d'un mur. Ouvre au maximum (f/1.8 avec un 50 mm) et rapproche-toi : le fond devient flou."
    },
    {
      id: "fige", titre: "Fige l'action", but: "Le joueur est flou. Fige-le.", scene: "sport", mode: "P",
      etapes: [
        { cmd: "mode", tenir: true, txt: "Maintiens la commande MODE…" },
        { cmd: "principale", vers: "S", txt: "…et tourne la molette principale jusqu'à S." },
        { cmd: "principale", txt: "Lâche MODE, puis tourne la molette principale pour accélérer la vitesse." }
      ],
      reussi: "{v} : le mouvement est figé.",
      vraie: "Pour de vrai : fais tomber une balle devant toi à 1/1000 s, puis à 1/30 s. Compare."
    },
    {
      id: "nuit", titre: "Il fait nuit", but: "La scène est trop sombre. Monte la sensibilité.", scene: "ville", mode: "M",
      etapes: [
        { cmd: "iso", tenir: true, txt: "Maintiens la commande ISO…" },
        { cmd: "principale", txt: "…et tourne la molette principale pour monter les ISO." }
      ],
      reussi: "{v} : on voit tout. Un peu de grain : c'est normal.",
      vraie: "Pour de vrai : éteins la lumière de ta chambre et essaie 400, 1600, 6400 ISO. Regarde le grain (zoome à 100 % : 36 millions de pixels, ça se voit)."
    }
  ]
};
