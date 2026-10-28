/* Simulateur « dans l'appareil » : l'écran et les commandes du Z50II, et un
   guide qui dit quelle commande presser, une étape à la fois.
   Les noms des menus et des rubriques viennent du Guide de référence Nikon
   (consulté le 28/10/2026). L'apparence de l'écran est simplifiée. */
(function () {
  "use strict";
  var G = window.GZ, $ = G.$, $$ = G.$$, esc = G.echapper;
  var zone = document.getElementById("sim"); if (!zone) return;

  /* ---------------- les menus (textes du manuel, dans l'ordre) */
  var ISO_MAX = ["400", "800", "1600", "3200", "6400", "12800", "25600", "51200"];
  var PHOTO = ["Réinitialiser menu PDV photo", "Dossier de stockage", "Nom de fichier", "Choisir la zone d'image", "Mode de tons",
    { n: "Qualité d'image", o: ["RAW + JPEG/HEIF fine", "RAW + JPEG/HEIF normal", "RAW + JPEG/HEIF basic", "RAW", "JPEG/HEIF fine", "JPEG/HEIF normal", "JPEG/HEIF basic"] },
    "Taille d'image", "Enregistrement RAW",
    { n: "Réglage de la sensibilité", s: ["Sensibilité", { n: "Contrôle de la sensibilité auto.", o: ["ON", "OFF"] }, { n: "Sensibilité maximale", o: ISO_MAX }, "Sensibilité maximale avec flash", "Vitesse d'obturation minimale"] },
    "Balance des blancs", "Régler le Picture Control", "Gérer le Picture Control", "Régler le Picture Control (HLG)", "Espace colorimétrique", "D-Lighting actif",
    "Réduction du bruit", "Réduction du bruit ISO", "Contrôle du vignetage", "Correction de la diffraction", "Contrôle auto. de la distorsion", "Maquillage",
    "Réglage du rendu des portraits", "Réduction du scintillement photo", "Réduc. scintill. hte fréquence", "Mesure", "Contrôle du flash", "Mode de flash",
    "Correction du flash", "Mode de déclenchement", "Mode de mise au point", "Mode de zone AF",
    { n: "Options AF/MF détection sujet", o: ["Automatique", "Personnes", "Animaux", "Oiseaux", "Véhicules", "Avions", "Détection du sujet désactivée"] },
    "Zone MF de détection du sujet", "Réduction de vibration", "Bracketing automatique", "Surimpression", "Superposition HDR", "Intervallomètre", "Time-lapse",
    "Prise vue avec décal mise au point"];
  var CONFIG = [
    { n: "Formater la carte mémoire", fin: "Le formatage supprime définitivement toutes les images et les autres données de la carte. L'appareil te demande alors de confirmer." },
    { n: "Enregistrer réglages utilisateur", o: ["U1", "U2", "U3"] },
    "Réinitialiser régl. utilisateur", "Langue (Language)", "Fuseau horaire et date", "Luminosité du moniteur", "Équilibre couleur du moniteur", "Luminosité du viseur",
    "Équilibre couleur du viseur", "Taille de l'affichage du viseur", "Limiter choix modes du moniteur", "Rotation auto. des infos", "Luminosité du témoin d'enreg.",
    "Options de réglage précis de l'AF", "Objectif sans microprocesseur", "Unités de distance", "Enregistrer position mise au point", "Enregistrer la focale (objectifs PZ)",
    "Photo de correction poussière", "Correction des pixels", "Légende des images",
    { n: "Informations de copyright", s: [{ n: "Photographe/Copyright", fin: "Saisie du texte : écris ton nom (36 caractères au plus pour Photographe, 54 pour Copyright)." }, { n: "Joindre les infos de copyright", o: ["ON", "OFF"] }] },
    "IPTC", "Fonction de la prise I", "Options d'annotation vocale",
    { n: "Sons de l'appareil photo", fin: "Ici tu règles les bips de l'appareil (mise au point, retardateur…)." },
    "Mode silencieux", "Commandes tactiles", "Mode autoportrait", "HDMI", "Priorité à la connexion USB", "Marquage de conformité", "Alimentation par USB",
    "Économie d'énergie (mode photo)", "Photo si carte absente ?", "Enregistrer/charger réglages menus", "Réinitialiser tous les réglages", "Version du firmware"];
  function groupe(code, nom, items) { return { n: code + " " + nom, s: items.map(function (x, i) { return typeof x === "string" ? code + (i + 1) + " " + x : (x.n = code + (i + 1) + " " + x.n, x); }) }; }
  var PERSO = ["Réinitialiser réglages perso.",
    groupe("a", "Mise au point", ["Priorité en mode AF-C", "Priorité en mode AF-S", "Suivi MAP avec Lock-On", "Points AF utilisés", "Points AF selon l'orientation", "Activation AF", "Persistance du point AF", "Choix limité modes de zone AF", "Rotation du point AF", "Affichage des points AF", "Illuminateur d'assistance AF", "Mise en relief de la mise au point", "Vitesse de sélection du point AF", "Bague MAP manuelle mode AF"]),
    groupe("b", "Mesure/exposition", ["Incrément de la sensibilité", "Incrément de l'exposition", "Correction d'exposition", "Détection visages mes. matricielle", "Zone pondérée centrale", "Réglage précis expo. opti."]),
    groupe("c", "Tempo./mémo. exposition", ["Mémo. expo. par déclencheur", "Retardateur", { n: "Délai d'extinction", s: ["Visualisation", "Menus", "Affichage des photos", { n: "Temporisation du mode veille", fin: "Par défaut 10 s. Une durée plus longue garde l'écran allumé, mais vide la batterie plus vite." }] }]),
    groupe("d", "Prise de vue/affichage", ["Cadence prise de vue en CL", "Vues maximales par rafale", "Options PdV pré-déclenchement", "Options déclenchement synchro.", "Temporisation de l'exposition", "Type d'obturateur", "Plage de vitesses étendue (M)", "Limiter choix des zones d'image", "Séquence numérique images", "Mode d'affichage (Lv photo)", "Affichage lumineux (Lv photo)", "Affichage couleurs chaudes", "Affichage pdt la PdV en rafale", "Indicateur moment déclenchement", "Cadre de l'image", "Type de quadrillage", "Type d'horizon virtuel", "Appui mi-course pr annuler zoom", "Écran prise de vue moniteur perso.", "Écran prise de vue viseur perso."]),
    groupe("e", "Bracketing/flash", ["Vitesse de synchro. flash", "Vitesse d'obturation flash", "Correction expo. pour flash", "Contrôle de la sensibilité auto. flash", "Bracketing auto. (mode M)", "Sens du bracketing", "Priorité en mode rafale flash"]),
    groupe("f", "Commandes", ["Personnaliser le menu i", "Commandes perso (prise de vue)", "Commandes perso (visualisation)", "Fn tactile", "Mémorisation via commandes", "Inverser rotation molette", "Commande lâchée + molette", "Inverser les indicateurs", "Inverser la bague pour la MAP", "Plage de rotation bague de MAP", "Réactivité de la bague de réglage", "Inverser rôles bagues MAP/réglage", "Options cdes zoom motorisé (PZ)", "Mvts pr visualisation plein écran"]),
    groupe("g", "Vidéo", ["Personnaliser le menu i", "Commandes personnalisées", "Mémorisation via commandes", "Choix limité modes de zone AF", "Vitesse de l'AF", "Sensibilité du suivi AF", "Vitesse du zoom haute résolution", "Options cdes zoom motorisé (PZ)", "Contrôle sensibilité fin (mode M)", "Plage de vitesses étendue (S/M)", "Aide à l'affichage", "Motif zébré", "Limiter gamme de tons motif zébré", "Type de quadrillage", "Affichage des infos de luminosité", "Appui mi-course pr annuler zoom", "Écran prise de vue moniteur perso.", "Écran prise de vue viseur perso.", "Cadre REC rouge"])];
  function nonSimule(t) { return [t + " (non simulé dans ce guide)"]; }
  var ONGLETS = [
    { n: "Prise de vue photo", c: "PHOTO", l: PHOTO },
    { n: "Enregistrement vidéo", c: "VIDÉO", l: nonSimule("Menu Enregistrement vidéo") },
    { n: "Réglages personnalisés", c: "PERSO", l: PERSO },
    { n: "Visualisation", c: "VISU", l: nonSimule("Menu Visualisation") },
    { n: "Configuration", c: "CONFIG", l: CONFIG },
    { n: "Réseau", c: "RÉSEAU", l: nonSimule("Menu Réseau") },
    { n: "Menu personnalisé", c: "PERSO.", l: nonSimule("Menu personnalisé") }];
  var IMENU = ["Régler le Picture Control", "Balance des blancs", PHOTO[5], "Taille d'image", "Mode de zone AF/détection sujet", "Mode de mise au point", "Mode de tons", "Réduction de vibration", "Commandes perso (prise de vue)", "Mesure", "Mode avion", "Mode de flash"];
  var MODES = ["AUTO", "P", "S", "A", "M", "U1", "U2", "U3", "SCN"];
  function nom(x) { return typeof x === "string" ? x : x.n; }

  /* ---------------- les missions */
  var MISSIONS = [
    { t: "Formater la carte", p: "À faire avec chaque nouvelle carte : l'appareil la prépare pour lui.", b: [{ m: [4, "Formater la carte mémoire"] }] },
    { t: "Passer en RAW + JPEG fine", p: "Le JPEG pour partager tout de suite, le RAW pour tout rattraper plus tard.", b: [{ i: "Qualité d'image", f: "RAW + JPEG/HEIF fine" }] },
    { t: "Activer ISO AUTO", p: "L'appareil monte la sensibilité tout seul quand la lumière baisse, sans dépasser ta limite.", b: [{ m: [0, "Réglage de la sensibilité", "Contrôle de la sensibilité auto."], f: "ON" }, { m: [0, "Réglage de la sensibilité", "Sensibilité maximale"], f: "6400" }] },
    { t: "Choisir le mode A", p: "Tu choisis l'ouverture (le flou d'arrière-plan), l'appareil s'occupe du reste.", b: [{ d: "A" }] },
    { t: "Activer la détection du sujet", p: "L'appareil trouve le sujet (visage, œil, animal…) et fait le point dessus.", b: [{ m: [0, "Options AF/MF détection sujet"], f: "Automatique" }] },
    { t: "Allonger la mise en veille", p: "Si l'écran s'éteint trop vite à ton goût (10 s par défaut).", b: [{ m: [2, "c Tempo./mémo. exposition", "c3 Délai d'extinction", "Temporisation du mode veille"] }] },
    { t: "Signer tes photos", p: "Ton nom est inscrit dans chaque fichier.", b: [{ m: [4, "Informations de copyright", "Photographe/Copyright"] }, { m: [4, "Informations de copyright", "Joindre les infos de copyright"], f: "ON" }] },
    { t: "Enregistrer tout sur U1", p: "Un tour de molette sur U1 et ta configuration revient.", b: [{ m: [4, "Enregistrer réglages utilisateur"], f: "U1" }] },
    { t: "Couper le bip", p: "Pratique en classe, au spectacle, ou pour les animaux.", b: [{ m: [4, "Sons de l'appareil photo"] }] }];

  /* ---------------- état */
  var cle = "gz3-sim", faits = (G.lire(cle) || "").split(",").filter(Boolean).map(Number);
  var E = { ecran: "vue", tab: 0, focus: "liste", pile: [{ l: ONGLETS[0].l, s: 0 }], iSel: 0, opt: null, msg: null, mode: 1, val: {} };
  var mi = -1, bi = 0;

  zone.innerHTML =
    '<div class="sim">' +
    '<div class="sim-missions" role="list" aria-label="Réglages à faire"></div>' +
    '<div class="sim-centre">' +
    '<div class="sim-guide" aria-live="polite"></div>' +
    '<div class="sim-boitier">' +
    '<div class="sim-haut"><button type="button" class="sim-b molette" data-c="dial" aria-label="Molette de mode : tourner"><span class="cran"></span><b></b></button>' +
    '<button type="button" class="sim-b declencheur" data-c="half" aria-label="Déclencheur à mi-course">Déclencheur</button></div>' +
    '<div class="sim-dos"><div class="sim-ecran"></div>' +
    '<div class="sim-cmd">' +
    '<button type="button" class="sim-b rond" data-c="menu">MENU</button>' +
    '<button type="button" class="sim-b rond" data-c="i"><i>i</i></button>' +
    '<div class="sim-croix" role="group" aria-label="Sélecteur multidirectionnel">' +
    '<button type="button" class="sim-b fl h" data-c="up" aria-label="Haut">▲</button><button type="button" class="sim-b fl g" data-c="left" aria-label="Gauche">◀</button>' +
    '<button type="button" class="sim-b ok" data-c="ok">OK</button>' +
    '<button type="button" class="sim-b fl d" data-c="right" aria-label="Droite">▶</button><button type="button" class="sim-b fl b" data-c="down" aria-label="Bas">▼</button></div>' +
    "</div></div></div>" +
    '<p class="sim-note"><span class="clavier">Clavier : flèches, Entrée = OK, M = MENU, I = i. </span>Écrans simplifiés : les noms des menus sont ceux du manuel officiel.</p>' +
    "</div></div>";
  var ecran = $(".sim-ecran", zone), guide = $(".sim-guide", zone), liste = $(".sim-missions", zone), molette = $(".molette b", zone);

  /* ---------------- écran */
  function niveau() { return E.pile[E.pile.length - 1]; }
  function rendre() {
    molette.textContent = MODES[E.mode];
    var h = "";
    if (E.ecran === "vue" || E.ecran === "imenu") {
      var q = E.val["Qualité d'image"] || "", iso = E.val["Contrôle de la sensibilité auto."] === "ON" ? "ISO AUTO" + (E.val["Sensibilité maximale"] ? " ≤ " + E.val["Sensibilité maximale"] : "") : "ISO";
      h = '<div class="vue"><div class="infos"><span class="mode">' + MODES[E.mode] + "</span><span>" + esc(q.replace("JPEG/HEIF ", "JPEG ")) + "</span><span>" + iso + "</span></div>" + (E.val["Options AF/MF détection sujet"] ? '<span class="cadre-af"></span>' : "") + "</div>";
      if (E.ecran === "imenu") h += '<div class="imenu">' + IMENU.map(function (x, k) { return '<div class="ic' + (k === E.iSel && !E.opt ? " sel" : "") + '">' + esc(nom(x)) + "</div>"; }).join("") + "</div>";
    } else {
      var lv = niveau(), titre = E.pile.length > 1 ? nom(E.pile[E.pile.length - 2].l[E.pile[E.pile.length - 2].s]) : ONGLETS[E.tab].n;
      h = '<div class="menu"><div class="onglets-sim">' + ONGLETS.map(function (o, k) { return '<span class="' + (k === E.tab ? "actif" : "") + (k === E.tab && E.focus === "onglets" ? " sel" : "") + '">' + o.c + "</span>"; }).join("") + "</div>" +
        '<div class="liste-sim"><div class="titre-sim">' + esc(titre) + "</div>" + fenetre(lv.l, lv.s, E.focus === "liste" && !E.opt, 8) + "</div></div>";
    }
    if (E.opt) h += '<div class="options-sim"><div class="titre-sim">' + esc(nom(E.opt.node)) + "</div>" + fenetre(E.opt.node.o, E.opt.s, true, 7) + "</div>";
    if (E.msg) h += '<div class="message-sim"><b>' + esc(E.msg.t) + "</b><p>" + esc(E.msg.p) + "</p></div>";
    ecran.innerHTML = h;
    conseiller();
  }
  function fenetre(items, sel, actif, n) {
    var debut = G.bornes(sel - Math.floor(n / 2), 0, Math.max(0, items.length - n));
    var h = items.slice(debut, debut + n).map(function (x, k) {
      var j = debut + k, v = typeof x === "object" && x.o ? E.val[x.n] : null;
      return '<div class="ligne-sim' + (j === sel ? (actif ? " sel" : " sel pale") : "") + '"><span>' + esc(nom(x)) + "</span>" + (v ? "<em>" + esc(v) + "</em>" : typeof x === "object" && (x.s || x.o || x.fin) ? "<em>▸</em>" : "") + "</div>";
    }).join("");
    return h + (items.length > n ? '<div class="defil" style="--h:' + (n / items.length * 100) + "%;--t:" + (debut / items.length * 100) + '%"></div>' : "");
  }

  /* ---------------- commandes */
  function presser(c) {
    var b = $('[data-c="' + c + '"]', zone); if (b) { b.classList.add("presse"); setTimeout(function () { b.classList.remove("presse"); }, 140); }
    if (E.msg) { E.msg = null; return rendre(); } // n'importe quelle commande ferme le message
    if (c === "dial") { E.mode = (E.mode + 1) % MODES.length; return verifier({ d: MODES[E.mode] }); }
    if (c === "half") { E.ecran = "vue"; E.opt = null; return rendre(); }
    if (c === "menu") { if (E.ecran === "menu") { E.ecran = "vue"; E.opt = null; } else { E.ecran = "menu"; E.opt = null; } return rendre(); }
    if (c === "i") { if (E.ecran === "vue") { E.ecran = "imenu"; E.iSel = 0; } else if (E.ecran === "imenu") { E.ecran = "vue"; E.opt = null; } return rendre(); }
    if (E.opt) {
      var o = E.opt;
      if (c === "up") o.s = (o.s - 1 + o.node.o.length) % o.node.o.length;
      else if (c === "down") o.s = (o.s + 1) % o.node.o.length;
      else if (c === "left") E.opt = null;
      else if (c === "ok" || c === "right") { E.val[o.node.n] = o.node.o[o.s]; var ch = o.chemin; E.opt = null; if (E.ecran === "imenu") E.ecran = "vue"; return verifier({ chemin: ch, f: E.val[o.node.n] }); }
      return rendre();
    }
    if (E.ecran === "imenu") {
      var col = E.iSel % 6, lig = Math.floor(E.iSel / 6);
      if (c === "left") col = (col + 5) % 6; else if (c === "right") col = (col + 1) % 6; else if (c === "up" || c === "down") lig = 1 - lig;
      else if (c === "ok") { var it = IMENU[E.iSel]; if (typeof it === "object" && it.o) E.opt = { node: it, s: Math.max(0, it.o.indexOf(E.val[it.n])), chemin: ["i", it.n] }; else E.msg = { t: nom(it), p: "Cet écran n'est pas simulé dans ce guide." }; return rendre(); }
      E.iSel = lig * 6 + col; return rendre();
    }
    if (E.ecran !== "menu") return rendre();
    if (E.focus === "onglets") {
      if (c === "up") E.tab = (E.tab + ONGLETS.length - 1) % ONGLETS.length;
      else if (c === "down") E.tab = (E.tab + 1) % ONGLETS.length;
      else if (c === "right" || c === "ok") E.focus = "liste";
      E.pile = [{ l: ONGLETS[E.tab].l, s: c === "up" || c === "down" ? 0 : E.pile[0].s }];
      return rendre();
    }
    var lv = niveau(), x = lv.l[lv.s];
    if (c === "up") lv.s = Math.max(0, lv.s - 1);
    else if (c === "down") lv.s = Math.min(lv.l.length - 1, lv.s + 1);
    else if (c === "left") { if (E.pile.length > 1) E.pile.pop(); else E.focus = "onglets"; }
    else if (c === "right" || c === "ok") {
      var ch2 = [E.tab].concat(E.pile.map(function (p) { return nom(p.l[p.s]); }));
      if (typeof x === "object" && x.s) E.pile.push({ l: x.s, s: 0 });
      else if (typeof x === "object" && x.o) E.opt = { node: x, s: Math.max(0, x.o.indexOf(E.val[x.n])), chemin: ch2 };
      else if (typeof x === "object" && x.fin) { E.msg = { t: x.n.replace(/^[a-g]\d+ /, ""), p: x.fin }; return verifier({ chemin: ch2 }); }
      else E.msg = { t: nom(x), p: "Cet écran n'est pas simulé dans ce guide : les réglages à faire sont dans la liste à gauche." };
    }
    rendre();
  }

  /* ---------------- guide */
  function but() { return mi > -1 ? MISSIONS[mi].b[bi] : null; }
  function verifier(fait) {
    var b = but(); var ok = false;
    if (b && b.d && fait.d === b.d) ok = true;
    if (b && b.i && fait.chemin && fait.chemin[0] === "i" && fait.chemin[1] === b.i && fait.f === b.f) ok = true;
    if (b && b.m && fait.chemin && fait.chemin.join("|") === b.m.join("|") && (b.f ? fait.f === b.f : true)) ok = true;
    if (ok) {
      bi++;
      if (bi >= MISSIONS[mi].b.length) {
        if (faits.indexOf(mi) < 0) faits.push(mi); G.ecrire(cle, faits.join(","));
        guide.dataset.bravo = "1"; missions(); rendre(); bravo(); return;
      }
    }
    rendre();
  }
  function cible(c, texte) {
    $$(".sim-b", zone).forEach(function (b) { b.classList.toggle("cible", c.indexOf(b.dataset.c) > -1); });
    return texte;
  }
  function conseiller() {
    if (mi < 0) { cible([], ""); guide.innerHTML = '<p class="etape-sim">Choisis un réglage dans la liste : je te dis sur quelle commande appuyer, une étape à la fois. Ou explore librement.</p>'; return; }
    if (guide.dataset.bravo === "1") { cible([], ""); return; }
    var M = MISSIONS[mi], b = M.b[bi], t = conseil(b);
    guide.innerHTML = '<div class="sur">Réglage ' + (mi + 1) + " / " + MISSIONS.length + (M.b.length > 1 ? " · étape " + (bi + 1) + " / " + M.b.length : "") + "</div><h3>" + esc(M.t) + '</h3><p class="etape-sim">' + t + "</p>";
  }
  function conseil(b) {
    if (E.msg) return cible(["ok"], "Appuie sur <b>OK</b> pour fermer ce message.");
    if (b.d) return cible(["dial"], "Tourne la <b>molette de mode</b> jusqu'à <b>" + b.d + "</b> (touche la molette pour la tourner).");
    if (b.i) {
      if (E.ecran === "menu") return cible(["menu"], "Ferme les menus : appuie sur <b>MENU</b>.");
      if (E.ecran === "vue") return cible(["i"], "Appuie sur la touche <b>i</b>.");
      if (E.opt) return opt(b.f);
      var k = IMENU.map(nom).indexOf(b.i);
      if (E.iSel !== k) { var dl = Math.floor(k / 6) !== Math.floor(E.iSel / 6), dc = k % 6 - E.iSel % 6; return cible(dl ? ["up", "down"] : [dc > 0 ? "right" : "left"], "Va sur <b>« " + esc(b.i) + " »</b> avec les flèches."); }
      return cible(["ok"], "Appuie sur <b>OK</b> pour ouvrir « " + esc(b.i) + " ».");
    }
    // un chemin dans les menus
    if (E.ecran === "imenu") return cible(["i"], "Ferme le menu i : appuie sur <b>i</b>.");
    if (E.ecran !== "menu") return cible(["menu"], "Appuie sur <b>MENU</b>.");
    if (E.opt) { if (E.opt.chemin.join("|") === b.m.join("|")) return opt(b.f); return cible(["left"], "Ce n'est pas le bon réglage : <b>◀</b> pour revenir."); }
    var tab = b.m[0], ch = b.m.slice(1);
    if (E.tab !== tab) {
      if (E.focus === "liste") return cible(["left"], E.pile.length > 1 ? "Reviens en arrière avec <b>◀</b>." : "<b>◀</b> pour aller dans la colonne des menus, à gauche.");
      return cible([E.tab < tab ? "down" : "up"], "Descends ou monte jusqu'au menu <b>« " + ONGLETS[tab].n + " »</b>.");
    }
    if (E.focus === "onglets") return cible(["right"], "<b>▶</b> pour entrer dans le menu « " + ONGLETS[tab].n + " ».");
    for (var k = 0; k < E.pile.length - 1; k++) if (nom(E.pile[k].l[E.pile[k].s]) !== ch[k]) return cible(["left"], "Pas ici : <b>◀</b> pour revenir.");
    var d = E.pile.length - 1, lv = niveau(), visee = ch[d];
    if (visee === undefined) return cible(["left"], "<b>◀</b> pour revenir.");
    var idx = lv.l.map(nom).indexOf(visee);
    if (lv.s !== idx) return cible([lv.s < idx ? "down" : "up"], (lv.s < idx ? "<b>▼</b> Descends" : "<b>▲</b> Monte") + " jusqu'à <b>« " + esc(visee.replace(/^[a-g]\d+ /, "")) + " »</b>" + (Math.abs(lv.s - idx) > 6 ? " (" + Math.abs(lv.s - idx) + " lignes)" : "") + ".");
    return cible(["right", "ok"], "<b>▶</b> ou <b>OK</b> pour ouvrir « " + esc(visee.replace(/^[a-g]\d+ /, "")) + " ».");
  }
  function opt(f) {
    var o = E.opt, k = o.node.o.indexOf(f);
    if (o.s !== k) return cible([o.s < k ? "down" : "up"], "Choisis <b>« " + esc(f) + " »</b> avec <b>▲ ▼</b>.");
    return cible(["ok"], "Appuie sur <b>OK</b> pour valider « " + esc(f) + " ».");
  }
  function bravo() {
    var M = MISSIONS[mi], suiv = MISSIONS.findIndex(function (m, k) { return faits.indexOf(k) < 0; });
    cible([], "");
    guide.dataset.bravo = "1";
    guide.innerHTML = '<div class="sur">Réglage ' + (mi + 1) + " / " + MISSIONS.length + '</div><h3>C\'est réglé ✓</h3><p class="etape-sim">' + esc(M.p) + " Fais la même chose sur ton appareil.</p>" +
      (suiv > -1 ? '<button type="button" class="bouton jaune" data-m="' + suiv + '">Suivant : ' + esc(MISSIONS[suiv].t) + " →</button>" : "<p><b>Les " + MISSIONS.length + " réglages sont faits. Ton appareil est prêt.</b></p>");
    var bt = $("[data-m]", guide); if (bt) bt.addEventListener("click", function () { choisir(+bt.dataset.m); });
    if (innerWidth <= 860) guide.scrollIntoView({ block: "nearest", behavior: G.reduit ? "auto" : "smooth" });
  }
  function choisir(k) {
    mi = k; bi = 0; guide.dataset.bravo = "";
    E.ecran = "vue"; E.opt = null; E.msg = null; E.focus = "liste"; E.tab = 0; E.pile = [{ l: ONGLETS[0].l, s: 0 }];
    missions(); rendre();
    if (innerWidth <= 860) $(".sim-boitier", zone).scrollIntoView({ block: "center", behavior: G.reduit ? "auto" : "smooth" });
  }
  function missions() {
    liste.innerHTML = '<div class="sur">Que veux-tu régler ?</div>' + MISSIONS.map(function (m, k) {
      return '<button type="button" role="listitem" class="mission' + (k === mi ? " ici" : "") + (faits.indexOf(k) > -1 ? " fait" : "") + '" data-k="' + k + '"><span>' + (faits.indexOf(k) > -1 ? "✓" : k + 1) + "</span>" + esc(m.t) + "</button>";
    }).join("") + '<p class="muted petit">Avant tout : règle la netteté du viseur avec la commande de réglage dioptrique, à côté du viseur.</p>';
    $$(".mission", liste).forEach(function (b) { b.addEventListener("click", function () { choisir(+b.dataset.k); }); });
  }

  $$(".sim-b", zone).forEach(function (b) { b.addEventListener("click", function () { presser(b.dataset.c); }); });
  zone.addEventListener("keydown", function (e) {
    var t = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", Enter: "ok", m: "menu", M: "menu", i: "i", I: "i" }[e.key];
    if (!t || !e.target.closest(".sim-boitier") || (e.target.tagName === "BUTTON" && e.key === "Enter")) return; // Entrée sur un bouton : son propre clic suffit
    e.preventDefault(); presser(t);
  });
  ecran.tabIndex = 0; ecran.setAttribute("role", "application"); ecran.setAttribute("aria-label", "Écran de l'appareil simulé : utilise les flèches, Entrée, M et I");
  missions(); rendre();
})();
