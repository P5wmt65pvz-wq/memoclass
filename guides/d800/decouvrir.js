/* Découvrir : le vrai D800 en photo (face, côté, dos), avec un numéro sur chaque commande.
   Rôles vérifiés dans le Manuel d'utilisation officiel du D800 (« Familiarisation avec l'appareil photo »). */
(function () {
  "use strict";
  var G = window.GZ, $ = G.$, $$ = G.$$;
  // [nom, rôle, astuce, lien, x %, y %]
  var VUES = {
    face: [
      ["Commutateur marche-arrêt et déclencheur", "À mi-course : la mise au point (mémorisée en AF-S). Jusqu'au bout : la photo. Le commutateur autour allume l'appareil ; poussé vers l'ampoule, il éclaire l'écran de contrôle.", "Juste à côté : les commandes ±, vidéo et MODE (voir l'onglet Côté).", null, 13.5, 29],
      ["Molette secondaire", "Ouverture en A et M ; second réglage quand tu maintiens une commande (zone AF, température de couleur…).", "La molette sous ton index.", null, 17, 42],
      ["Illuminateur d'assistance AF", "Aide la mise au point dans le noir ; témoin du retardateur ; lampe d'atténuation des yeux rouges.", "Coupe-le pour les animaux (réglage a8).", null, 31, 33],
      ["Aperçu de la profondeur de champ", "Maintenue, elle ferme le diaphragme à l'ouverture choisie : tu vois dans le viseur ce qui sera net.", "Le viseur s'assombrit : c'est normal.", "apprendre.html#lumiere", 31, 54],
      ["Commande Fn", "Une commande à toi : tu choisis son rôle (réglage f4).", "Pratique pour basculer vite en zone d'image DX ou pour mémoriser l'exposition.", null, 31, 73],
      ["Monture F et bouchon de boîtier", "La monture Nikon F accepte les objectifs AF NIKKOR (types G et D) et les objectifs DX, en recadrant l'image (zone DX). Derrière : le miroir et le capteur FX de 36,3 millions de pixels.", "Remets le bouchon dès que l'objectif est retiré. Ne touche jamais le miroir ni le capteur.", null, 53, 58],
      ["Déverrouillage de l'objectif", "Maintiens pour tourner et retirer l'objectif.", "Appareil éteint, tête en bas, à l'abri du vent : moins de poussière.", null, 83, 61],
      ["Sélecteur du mode de mise au point", "AF ou M. Au centre, la commande de mode AF : avec la molette principale, AF-S ou AF-C ; avec la molette secondaire, la zone AF.", "Rien ne fait le point ? Vérifie que ce sélecteur est sur AF.", "apprendre.html#nettete", 85, 74],
      ["Flash intégré et son ouverture", "Le flash (nombre guide 12 à 100 ISO) se lève avec la commande à l'éclair, à côté du prisme. La commande en dessous règle le mode de flash et sa correction.", "À contre-jour, baisse sa puissance pour déboucher un visage.", null, 80, 38.5],
      ["Microphone intégré", "Le son des vidéos, en mono. Pour la stéréo, branche un micro externe sur le côté gauche.", "Ne le pose pas près d'un support magnétique (manuel).", "video.html", 81, 27.5],
      ["Sélecteur du mode de déclenchement", "Vue par vue, rafales CL et CH, déclenchement discret, retardateur, miroir relevé. Sur le dessus : les commandes BKT, QUAL, WB et ISO.", "Voir la leçon Rafale.", "apprendre.html#rafale", 84, 19]
    ],
    dessus: [
      ["Déclencheur et marche-arrêt", "Le commutateur ON/OFF entoure le déclencheur. Poussé vers l'ampoule, il éclaire l'écran de contrôle quelques secondes.", "Éteins avant de changer d'objectif, de batterie ou de carte.", null, 79, 40],
      ["Commande MODE", "Maintiens + molette principale : P, S, A ou M.", "Avec la commande Effacer, maintenues ensemble : formatage de la carte (le mot FORMAT en rouge te le rappelle).", "apprendre.html#modes", 58, 27.5],
      ["Enregistrement vidéo", "Démarre et arrête une vidéo en visée écran vidéo.", "Une vidéo dure au plus 29 min 59 s.", "video.html", 67, 30],
      ["Correction d'exposition ±", "Maintiens + molette principale.", "Maintenue avec QUAL pendant plus de 2 s : réinitialisation de nombreux réglages.", "apprendre.html#lumiere", 63, 36],
      ["Écran de contrôle", "Vitesse, ouverture, sensibilité, batterie, vues restantes, cartes : tout se lit ici.", "Dans le noir, pousse le commutateur vers l'ampoule pour l'éclairer.", null, 36, 30],
      ["Réglage dioptrique", "Adapte la netteté du viseur à ta vue (−3 à +1 dioptrie). Tire-le, tourne, puis repousse-le.", "Une fois pour toutes, en regardant les points AF.", null, 19, 21],
      ["Œillet pour courroie", "Un de chaque côté.", "Vérifie de temps en temps que la courroie est bien serrée.", null, 32, 40],
      ["Molette secondaire", "À l'avant, juste sous le déclencheur.", "Ouverture en A et M.", null, 95, 54],
      ["Volet des cartes mémoire", "Deux logements : une carte CompactFlash et une carte SD. L'une peut servir de sauvegarde de l'autre.", "Le voyant d'accès au dos s'allume pendant l'écriture : n'ouvre pas le volet à ce moment-là.", null, 30, 87],
      ["La poignée", "Main droite autour de la poignée, index sur le déclencheur, main gauche sous l'objectif. L'appareil pèse environ 1 kg avec batterie et carte.", "Coudes contre le buste : la moitié des photos floues viennent d'une mauvaise tenue.", null, 80, 75]
    ],
    dos: [
      ["Écran (moniteur)", "8 cm, 921 000 points, environ 100 % de l'image. Il n'est pas tactile : on navigue avec le sélecteur multidirectionnel. Ici, il porte le protège-écran BM-12.", "Sa luminosité peut se régler toute seule grâce au capteur de lumière ambiante.", null, 39, 67],
      ["Viseur reflex", "Tu vois à travers l'objectif, sans retard : couverture de 100 % en format FX, grossissement environ 0,7×.", "Pour les poses longues, ferme l'obturateur d'oculaire.", null, 40, 28],
      ["Levier de l'obturateur d'oculaire", "Ferme le viseur pour que la lumière qui y entre ne fausse pas la mesure (retardateur, trépied).", "Ouvre-le à nouveau pour viser.", null, 29, 17],
      ["Réglage dioptrique", "La netteté du viseur, à ta vue.", "Tire-le pour le tourner.", null, 56, 17],
      ["Sélecteur du mode de déclenchement et ISO", "Le cadran S, CL, CH… choisit la rafale (appuie sur son déverrouillage pour le tourner). Sur le dessus, la commande ISO : maintiens + molette principale.", "Voir les leçons Rafale et Lumière.", "apprendre.html#rafale", 15, 21],
      ["Visualisation", "Revoir photos et vidéos.", "Mi-course sur le déclencheur pour revenir à la prise de vue.", null, 11.5, 34],
      ["Effacer", "Efface la photo affichée : appuie une fois, l'appareil demande confirmation, appuie une seconde fois.", "Une photo effacée ne se récupère pas : protège-la avec la commande à la clé.", null, 19.5, 34],
      ["Mesure et AE-L/AF-L", "La bague choisit la mesure : matricielle, pondérée centrale ou spot. La commande au centre mémorise l'exposition et la mise au point.", "Contre-jour : mémorise sur le visage, puis recadre.", null, 63, 31],
      ["AF-ON", "Fait la mise au point comme le déclencheur à mi-course.", "Beaucoup s'en servent pour séparer la mise au point du déclenchement.", "apprendre.html#nettete", 72.5, 32],
      ["Molette principale", "Vitesse en S et M, décalage du programme en P, valeur d'un réglage quand tu maintiens une commande.", "La molette du pouce : celle que tu tournes le plus.", null, 86, 33],
      ["MENU", "Tous les menus : Visualisation, Prise de vue, Réglages personnalisés, Configuration, Retouche, Menu personnalisé.", "Le Menu personnalisé garde tes réglages favoris.", "reglages.html", 12, 49],
      ["Clé : protection, Picture Control, aide", "En visualisation : protège la photo. En prise de vue : le Picture Control. Sur un menu : affiche l'aide (le « ? »).", "L'aide intégrée remplace le manuel papier.", "apprendre.html#couleur", 12, 59],
      ["Loupes", "Zoome (+) ou dézoome et affiche les imagettes (−).", "Après un portrait, zoome sur l'œil.", null, 12, 74],
      ["OK", "Valide un réglage.", "Dans les menus, la flèche droite fait souvent la même chose.", null, 12, 88],
      ["Sélecteur multidirectionnel", "Menus, et déplacement du point AF. La bague « L » autour le verrouille.", "Le point AF ne bouge plus ? Déverrouille la bague (point blanc).", "apprendre.html#nettete", 70, 56],
      ["Visée écran (Lv)", "Le sélecteur choisit photo ou vidéo ; la commande Lv allume la visée sur l'écran.", "Rien ne filme ? Le sélecteur doit être sur la caméra.", "video.html", 70, 81],
      ["info", "Affiche les informations de prise de vue sur l'écran ; un second appui permet d'en modifier certaines.", "Pratique quand l'écran de contrôle est difficile à lire.", null, 67.5, 91],
      ["Haut-parleur et voyant de carte", "Les trois petits trous : le son des vidéos à la relecture. Le voyant à gauche s'allume pendant l'écriture sur la carte.", "Ne retire jamais la carte quand le voyant est allumé.", null, 73, 72]
    ]
  };

  function charger(vue) {
    var panneau = document.getElementById(vue); if (!panneau) return;
    var img = $("img", panneau);
    if (img.dataset.src && !img.getAttribute("src")) img.src = img.dataset.src;
    var zone = $(".points", panneau), fiche = $(".fiche", panneau), defil = $(".defil", panneau);
    if (zone.children.length) return;
    var liste = VUES[vue];
    zone.innerHTML = liste.map(function (c, i) { return '<button type="button" class="pt" style="left:' + c[4] + "%;top:" + c[5] + '%" aria-label="' + G.echapper((i + 1) + " : " + c[0]) + '">' + (i + 1) + "</button>"; }).join("");
    var pts = $$(".pt", zone), sel = 0;
    // sur téléphone la photo est plus large que l'écran : on amène le numéro choisi au milieu
    function centrer(b) {
      if (defil.scrollWidth <= defil.clientWidth + 2) return;
      defil.scrollTo({ left: b.offsetLeft - defil.clientWidth / 2, behavior: G.reduit ? "auto" : "smooth" });
    }
    function montrer(i, centre) {
      sel = (i + liste.length) % liste.length; var c = liste[sel];
      fiche.innerHTML = '<div class="num">' + (sel + 1) + " / " + liste.length + "</div><h3>" + G.echapper(c[0]) + '</h3><p class="role">' + G.echapper(c[1]) + '</p><p class="astuce"><strong>Astuce · </strong>' + G.echapper(c[2]) + "</p>" + (c[3] ? '<a class="lien" href="' + c[3] + '">En savoir plus →</a>' : "") + '<div class="nav-fiche"><button class="bouton clair" type="button" data-d="-1" aria-label="Commande précédente">←</button><button class="bouton" type="button" data-d="1">Suivant →</button></div>';
      $$("button[data-d]", fiche).forEach(function (b) { b.addEventListener("click", function () { montrer(sel + +b.dataset.d, true); }); });
      pts.forEach(function (b, j) { b.classList.toggle("actif", j === sel); b.setAttribute("aria-pressed", j === sel ? "true" : "false"); });
      if (centre) centrer(pts[sel]);
    }
    pts.forEach(function (b, i) { b.addEventListener("click", function () { montrer(i, true); }); });
    montrer(0, false);
  }
  G.onglets($("#vues"), charger);
})();
