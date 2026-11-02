/* Découvrir : le vrai Z50II en photo (face, dessus, dos), avec un numéro sur chaque commande.
   Emplacements relevés d'après les schémas du Guide de référence officiel (« Boîtier »). */
(function () {
  "use strict";
  var G = window.GZ, $ = G.$, $$ = G.$$;
  // [nom, rôle, astuce, lien, x %, y %]
  var VUES = {
    face: [
      ["Molette secondaire", "Ouverture en A et M ; second réglage quand tu maintiens une touche.", "La molette de l'index.", null, 12.9, 36.9],
      ["Illuminateur d'assistance AF", "Aide la mise au point dans le noir, témoin du retardateur.", "Coupe-le pour les animaux et les oiseaux (réglage a11), comme le conseille le manuel.", null, 33.1, 30.4],
      ["Flash intégré", "Nombre guide d'environ 7 à 100 ISO. Il se lève avec la petite commande d'ouverture du flash, sur le côté du viseur.", "À contre-jour, baisse sa puissance pour déboucher un visage.", null, 63, 12.5],
      ["Fn1", "Par défaut : balance des blancs.", "Modifiable (f2).", null, 33.1, 60.4],
      ["Fn2", "Par défaut : mode et zone de mise au point.", "Pour passer d'AF-S à AF-C en une seconde.", null, 37.9, 78.8],
      ["Le capteur", "Format DX (23,5 × 15,7 mm), 20,9 millions de pixels. C'est lui qui « voit » la photo.", "Ne le touche jamais : le manuel décrit le seul nettoyage autorisé.", null, 62.5, 57.9],
      ["Les contacts", "Ces contacts dorés échangent les informations avec l'objectif : mise au point, ouverture, stabilisation.", "Remets le bouchon de boîtier dès que l'objectif est retiré : poussière et contacts restent protégés.", null, 62.1, 38.2],
      ["La monture Z", "Elle accueille les objectifs NIKKOR Z. Les anciens objectifs F se montent avec un adaptateur (avec des restrictions possibles).", "Change d'objectif tête en bas, à l'abri du vent : moins de poussière.", null, 62.5, 88.2],
      ["Déverrouillage de l'objectif", "Maintiens pour tourner et retirer l'objectif.", "Appareil éteint.", null, 92, 58.9],
      ["La poignée", "Main droite autour de la poignée, index sur le déclencheur, main gauche sous l'objectif.", "Coudes contre le buste : la moitié des photos floues viennent d'une mauvaise tenue.", null, 10.5, 66],
      ["Témoin d'enregistrement", "Il s'allume pendant que tu filmes. Il clignote aussi pour prévenir : carte presque pleine, batterie faible ou appareil trop chaud.", "Sa luminosité se règle dans le menu Configuration (Luminosité du témoin d'enreg.).", "video.html", 88.8, 28],
      ["Le boîtier", "495 g seul, 550 g avec batterie et carte. Wi‑Fi et Bluetooth intégrés pour envoyer les photos sur ton téléphone (SnapBridge).", "Prise micro, prise casque, USB‑C et HDMI sont sur le côté.", "video.html", 85, 80]
    ],
    dessus: [
      ["Déclencheur et marche-arrêt", "À mi-course : la mise au point (mémorisée en AF-S). Jusqu'au bout : la photo. Le commutateur autour (OFF/ON) allume et éteint l'appareil.", "Garde le doigt à mi-course pour recadrer sans perdre la netteté. Éteins avant de changer d'objectif, de batterie ou de carte.", null, 77.9, 16.4],
      ["Enregistrement vidéo", "Démarre et arrête une vidéo.", "Le cadre REC rouge (réglage g19) confirme que ça tourne.", "video.html", 73.6, 26.6],
      ["Touche ISO", "Maintiens + molette principale : la sensibilité. Avec la molette secondaire : ISO AUTO oui/non.", "ISO AUTO avec une limite à 6400 : la photo reste nette quand la lumière baisse.", "apprendre.html#lumiere", 79.9, 26.8],
      ["Correction d'exposition ±", "Maintiens + une molette : plus clair (+) ou plus sombre (−), de −5 à +5 IL.", "Neige : +1. Sujet sur fond noir : −1.", "apprendre.html#lumiere", 86.2, 27.8],
      ["Touche Picture Control", "Le style d'image : Standard, Portrait, Paysage, Monochrome, Creative…", "Voir la leçon Couleur.", "apprendre.html#couleur", 82.2, 39.2],
      ["Molette principale", "Vitesse en S et M, décalage du programme en P, valeur d'un réglage quand tu maintiens une touche.", "La molette du pouce : celle que tu tournes le plus.", null, 88, 51.8],
      ["Sélecteur de mode", "AUTO, P, S, A, M, U1 à U3, SCN.", "Voir la leçon Modes.", "apprendre.html#modes", 65.4, 43.2],
      ["Sélecteur photo/vidéo", "Bascule tout l'appareil en photo ou en vidéo.", "Rien ne filme ? Vérifie d'abord ce sélecteur.", "video.html", 76.9, 46.2],
      ["Griffe flash", "Pour un flash externe et certains accessoires.", "Un flash orienté vers le plafond change tout en intérieur.", null, 37.9, 40.2],
      ["Réglage dioptrique", "Adapte la netteté du viseur à ta vue.", "Une fois pour toutes.", null, 55.7, 60.9],
      ["Haut-parleur", "Le son des vidéos quand tu les revois sur l'appareil.", "Au tournage, c'est le microphone stéréo qui enregistre : ses deux ouvertures sont de chaque côté du viseur.", "video.html", 12.9, 45.7],
      ["L'objectif", "La bague de zoom change le cadrage. L'objectif souvent vendu avec l'appareil est le NIKKOR Z DX 16–50 mm f/3.5–6.3 VR : stabilisé, et rétractable (déplie-le avant de photographier).", "Ouverture la plus grande : f/3.5 en grand-angle, f/6.3 en zoom.", "apprendre.html#lumiere", 30, 11]
    ],
    dos: [
      ["Écran tactile orientable", "8 cm, tactile et orientable : visée, menus, visualisation. Touche-le pour faire la mise au point ou déclencher.", "Retourne-le vers l'avant pour les autoportraits et le vlog.", "video.html", 41, 68],
      ["Viseur électronique", "Tu vois exactement la photo avant de la prendre.", "Plus lisible que l'écran en plein soleil.", null, 38.5, 22.3],
      ["Détecteur oculaire", "Bascule auto vers le viseur.", "S'il ne bascule plus : soufflette.", null, 39, 31.6],
      ["Mode moniteur", "Automatique, viseur seul, écran seul…", "Écran noir ? Appuie ici.", null, 61.8, 32],
      ["DISP", "Fait défiler les affichages d'informations.", "Un affichage montre l'horizon virtuel.", null, 69.2, 32],
      ["AE-L/AF-L", "Mémorise exposition et/ou mise au point. En lecture : protège une image.", "Contre-jour : mémorise sur le visage, puis recadre.", null, 79, 36.4],
      ["Touche i", "Les 12 réglages les plus utilisés.", "Personnalisable (f1).", null, 79.1, 52.5],
      ["Sélecteur multidirectionnel + OK", "Menus et déplacement du point AF.", "Plusieurs visages ? Les flèches passent de l'un à l'autre.", null, 82.9, 67.2],
      ["MENU", "Tous les menus.", "Le menu personnalisé garde tes favoris.", "reglages.html", 86.5, 80.6],
      ["Visualisation", "Revoir photos et vidéos.", "Mi-course sur le déclencheur pour revenir à la prise de vue.", null, 86.3, 90],
      ["Loupe arrière / imagettes / aide", "Dézoome ; sur un menu, affiche l'aide de la rubrique.", "L'aide intégrée remplace le manuel papier.", null, 78.6, 90],
      ["Loupe avant", "Zoome pour vérifier la netteté.", "Après un portrait, zoome sur l'œil.", null, 78.6, 80.6],
      ["Déclenchement / retardateur", "Maintiens + molette principale : vue par vue, rafales, retardateur.", "Voir la leçon Rafale.", "apprendre.html#rafale", 10.6, 31.2],
      ["Suppression", "En visualisation, efface la photo affichée : appuie une fois, l'appareil demande confirmation, appuie une seconde fois.", "Une photo effacée ne se récupère pas : en cas de doute, protège-la avec AE-L/AF-L.", null, 17.7, 31.2]
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
