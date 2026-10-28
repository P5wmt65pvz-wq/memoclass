/* Découvrir : vue éclatée et vues dessus / dos / avant, avec points cliquables. */
(function () {
  "use strict";
  var G = window.GZ, $ = G.$, $$ = G.$$;
  var ORDRE_ECLATEE = ["lentilles", "objectif", "monture", "capteur", "corps", "poignee", "capot", "commandes", "viseur", "ecran", "touches", "batterie", "carte"];
  var PIECES = {
    lentilles: ["Les lentilles", "Elles forment l'image sur le capteur. L'ouverture (f/) règle la quantité de lumière qui les traverse.", "Pour comprendre l'ouverture, joue avec le simulateur.", "apprendre.html#lumiere"],
    objectif: ["L'objectif", "La bague de zoom change le cadrage. L'objectif souvent vendu avec l'appareil est le NIKKOR Z DX 16–50 mm f/3.5–6.3 VR : stabilisé, et rétractable (déplie-le avant de photographier).", "Ouverture la plus grande : f/3.5 en grand-angle, f/6.3 en zoom.", "apprendre.html#lumiere"],
    monture: ["La monture Z", "Elle accueille les objectifs NIKKOR Z. Les anciens objectifs F se montent avec un adaptateur (avec des restrictions possibles).", "Change d'objectif tête en bas, à l'abri du vent : moins de poussière.", null],
    capteur: ["Le capteur", "Format DX (23,5 × 15,7 mm), 20,9 millions de pixels. C'est lui qui « voit » la photo.", "Ne le touche jamais : le manuel décrit le seul nettoyage autorisé.", null],
    corps: ["Le boîtier", "495 g seul, 550 g avec batterie et carte. Wi‑Fi et Bluetooth intégrés pour envoyer les photos sur ton téléphone (SnapBridge).", "Prise micro, prise casque, USB‑C et HDMI sont sur le côté.", "video.html"],
    poignee: ["La poignée", "Main droite autour de la poignée, index sur le déclencheur, main gauche sous l'objectif.", "Coudes contre le buste : la moitié des photos floues viennent d'une mauvaise tenue.", null],
    capot: ["Viseur, flash et griffe", "Le viseur électronique OLED (environ 2,36 millions de points) montre exactement la photo avant de la prendre. Dessous, le flash intégré ; dessus, la griffe pour un flash externe.", "En plein soleil, le viseur est bien plus lisible que l'écran.", null],
    commandes: ["Molettes et déclencheur", "Sélecteur de mode (AUTO, P, S, A, M, U1–U3, SCN), déclencheur, molette principale et touches ISO, correction (±) et Picture Control.", "Le mode A est le meilleur point de départ.", "apprendre.html#modes"],
    viseur: ["L'œilleton", "Le détecteur oculaire bascule tout seul de l'écran au viseur. La commande de réglage dioptrique adapte la netteté à ta vue.", "Règle la dioptrie une fois, le premier jour.", "reglages.html"],
    ecran: ["L'écran tactile", "8 cm, orientable : touche-le pour faire la mise au point, déclencher ou faire défiler les photos.", "Retourne-le vers l'avant pour les autoportraits et le vlog.", "video.html"],
    touches: ["Les touches arrière", "i (les réglages courants), MENU, DISP (affichages), AE-L/AF-L (mémoriser), sélecteur multidirectionnel et OK.", "Regarde la vue « Dos » pour chaque touche en détail.", null],
    batterie: ["La batterie EN-EL25a", "Environ 230 à 250 photos par charge (norme CIPA), ou 55 minutes de vidéo. Elle se recharge dans l'appareil par USB‑C, en 1 h 40 environ.", "Prends une deuxième batterie pour une journée de photo.", null],
    carte: ["La carte SD", "SD, SDHC ou SDXC, en UHS‑I ou UHS‑II. Pour la vidéo, une carte UHS de classe 3 au minimum.", "Formate chaque nouvelle carte dans l'appareil.", "reglages.html"]
  };
  var CMD = {
    dessus: [
      ["Déclencheur", "À mi-course : la mise au point (mémorisée en AF-S). Jusqu'au bout : la photo.", "Garde le doigt à mi-course pour recadrer sans perdre la netteté."],
      ["Commutateur marche-arrêt", "Autour du déclencheur.", "Éteins avant de changer d'objectif, de batterie ou de carte."],
      ["Enregistrement vidéo", "Démarre et arrête une vidéo.", "Le cadre REC rouge (réglage g19) confirme que ça tourne."],
      ["Touche ISO", "Maintiens + molette principale : la sensibilité. Avec la molette secondaire : ISO AUTO oui/non.", "ISO AUTO avec une limite à 6400 : la photo reste nette quand la lumière baisse."],
      ["Correction d'exposition ±", "Maintiens + une molette : plus clair (+) ou plus sombre (−), de −5 à +5 IL.", "Neige : +1. Sujet sur fond noir : −1."],
      ["Touche Picture Control", "Le style d'image : Standard, Portrait, Paysage, Monochrome, Creative…", "Voir la leçon Couleur."],
      ["Molette principale", "Vitesse en S et M, décalage du programme en P, valeur d'un réglage quand tu maintiens une touche.", "La molette du pouce : celle que tu tournes le plus."],
      ["Sélecteur de mode", "AUTO, P, S, A, M, U1 à U3, SCN.", "Voir la leçon Modes."],
      ["Sélecteur photo/vidéo", "Bascule tout l'appareil en photo ou en vidéo.", "Rien ne filme ? Vérifie d'abord ce sélecteur."],
      ["Griffe flash", "Pour un flash externe et certains accessoires.", "Un flash orienté vers le plafond change tout en intérieur."],
      ["Réglage dioptrique", "Adapte la netteté du viseur à ta vue.", "Une fois pour toutes."],
      ["Microphone stéréo", "Le son intégré des vidéos.", "Pour mieux, une prise micro externe existe."]
    ],
    dos: [
      ["Écran tactile orientable", "Visée, menus, visualisation. Mise au point et déclenchement au doigt.", "Vers l'avant pour le vlog."],
      ["Viseur électronique", "Tu vois exactement la photo avant de la prendre.", "Plus lisible que l'écran en plein soleil."],
      ["Détecteur oculaire", "Bascule auto vers le viseur.", "S'il ne bascule plus : soufflette."],
      ["Mode moniteur", "Automatique, viseur seul, écran seul…", "Écran noir ? Appuie ici."],
      ["DISP", "Fait défiler les affichages d'informations.", "Un affichage montre l'horizon virtuel."],
      ["AE-L/AF-L", "Mémorise exposition et/ou mise au point. En lecture : protège une image.", "Contre-jour : mémorise sur le visage, puis recadre."],
      ["Touche i", "Les 12 réglages les plus utilisés.", "Personnalisable (f1)."],
      ["Sélecteur multidirectionnel + OK", "Menus et déplacement du point AF.", "Plusieurs visages ? Les flèches passent de l'un à l'autre."],
      ["MENU", "Tous les menus.", "Le menu personnalisé garde tes favoris."],
      ["Visualisation", "Revoir photos et vidéos.", "Mi-course sur le déclencheur pour revenir à la prise de vue."],
      ["Loupe arrière / imagettes / aide", "Dézoome ; sur un menu, affiche l'aide de la rubrique.", "L'aide intégrée remplace le manuel papier."],
      ["Loupe avant", "Zoome pour vérifier la netteté.", "Après un portrait, zoome sur l'œil."],
      ["Déclenchement / retardateur", "Maintiens + molette principale : vue par vue, rafales, retardateur.", "Voir la leçon Rafale."]
    ],
    avant: [
      ["Molette secondaire", "Ouverture en A et M ; second réglage quand tu maintiens une touche.", "La molette de l'index."],
      ["Illuminateur d'assistance AF", "Aide la mise au point dans le noir, témoin du retardateur.", "Coupe-le pour les animaux et les oiseaux (réglage a11), comme le conseille le manuel."],
      ["Flash intégré", "Nombre guide d'environ 7 à 100 ISO.", "À contre-jour, baisse sa puissance pour déboucher un visage."],
      ["Fn1", "Par défaut : balance des blancs.", "Modifiable (f2)."],
      ["Fn2", "Par défaut : mode et zone de mise au point.", "Pour passer d'AF-S à AF-C en une seconde."],
      ["Déverrouillage de l'objectif", "Maintiens pour tourner et retirer l'objectif.", "Appareil éteint."],
      ["Monture Z et capteur", "Le capteur DX de 20,9 Mpx.", "Ne jamais le toucher."]
    ]
  };
  var POS = null;
  function charger(vue) {
    var panneau = document.getElementById(vue), img = $("img", panneau);
    if (img.dataset.src && !img.getAttribute("src")) img.src = img.dataset.src;
    if (!POS) return;
    var zone = $(".points", panneau), fiche = $(".fiche", panneau);
    if (zone.children.length) return;
    var liste = vue === "eclatee" ? ORDRE_ECLATEE.map(function (n) { var d = PIECES[n]; return [d[0], d[1], d[2], d[3], POS.eclatee[n]]; })
      : CMD[vue].map(function (c, i) { return [c[0], c[1], c[2], null, POS[vue][i]]; });
    zone.innerHTML = liste.map(function (c, i) { return c[4] ? '<button type="button" class="pt" style="left:' + c[4][0] + "%;top:" + c[4][1] + '%" aria-label="' + G.echapper((i + 1) + " : " + c[0]) + '">' + (i + 1) + "</button>" : ""; }).join("");
    // on resserre l'image autour des numéros pour qu'ils ne se chevauchent pas
    var xs = liste.filter(function (c) { return c[4]; }).map(function (c) { return c[4][0]; });
    var x0 = Math.max(0, Math.min.apply(null, xs) - 13), x1 = Math.min(100, Math.max.apply(null, xs) + 11), f = Math.max((x1 - x0) / 100, innerWidth > 600 ? .74 : .56);
    if (x0 + f * 100 > 100) x0 = 100 - f * 100;
    $(".visuel", panneau).style.setProperty("--zw", (100 / f).toFixed(2) + "%");
    $(".visuel", panneau).style.setProperty("--zx", (-x0 / f).toFixed(2) + "%");
    var sel = 0;
    function montrer(i) {
      sel = (i + liste.length) % liste.length; var c = liste[sel];
      fiche.innerHTML = '<div class="num">' + (sel + 1) + " / " + liste.length + "</div><h3>" + G.echapper(c[0]) + '</h3><p class="role">' + G.echapper(c[1]) + '</p><p class="astuce"><strong>Astuce · </strong>' + G.echapper(c[2]) + "</p>" + (c[3] ? '<a class="lien" href="' + c[3] + '">En savoir plus →</a>' : "") + '<div class="nav-fiche"><button class="bouton clair" type="button" data-d="-1">←</button><button class="bouton" type="button" data-d="1">Suivant →</button></div>';
      $$("button[data-d]", fiche).forEach(function (b) { b.addEventListener("click", function () { montrer(sel + +b.dataset.d); }); });
      $$(".pt", zone).forEach(function (b, j) { b.classList.toggle("actif", j === sel); });
    }
    $$(".pt", zone).forEach(function (b, i) { b.addEventListener("click", function () { montrer(i); }); });
    montrer(0);
  }
  var courant = "eclatee";
  G.onglets($("#vues"), function (v) { courant = v; charger(v); });
  fetch("img/points.json").then(function (r) { return r.json(); }).then(function (j) { POS = j; charger(courant); }).catch(function () {});
})();
