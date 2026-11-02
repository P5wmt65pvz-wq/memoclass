/* Simulateur « dans l'appareil » : l'écran et les commandes du D800, et un
   guide qui dit quelle commande presser, une étape à la fois.
   Les noms des menus et des rubriques viennent du Manuel d'utilisation Nikon D800
   (édition française, consulté le 31/10/2026). L'apparence de l'écran est simplifiée. */
(function () {
  "use strict";
  var G = window.GZ, $ = G.$, $$ = G.$$, esc = G.echapper;
  var zone = document.getElementById("sim"); if (!zone) return;

  /* ---------------- les menus (textes du Manuel d'utilisation D800, dans l'ordre) */
  var ISO_MAX = ["200", "400", "800", "1600", "3200", "6400", "Hi 1", "Hi 2"];
  var PHOTO = ["Jeux de réglages Prise de vue", "Jeux de réglages étendus", "Dossier de stockage", "Nom de fichier", "Logement principal", "Fonction logement secondaire",
    { n: "Qualité d'image", o: ["NEF (RAW) + JPEG fine", "NEF (RAW) + JPEG normal", "NEF (RAW) + JPEG basic", "NEF (RAW)", "TIFF (RVB)", "JPEG fine", "JPEG normal", "JPEG basic"] },
    "Taille d'image", "Zone d'image", "Compression JPEG", "Enregistrement NEF (RAW)", "Balance des blancs", "Régler le Picture Control", "Gérer le Picture Control",
    "Espace colorimétrique", "D-Lighting actif", "HDR (grande plage dynamique)", "Contrôle du vignetage", "Contrôle auto. de la distorsion", "Réduction du bruit", "Réduction du bruit ISO",
    { n: "Réglage de la sensibilité", s: ["Sensibilité", { n: "Contrôle sensibilité auto.", o: ["Activé", "Désactivé"] }, { n: "Sensibilité maximale", o: ISO_MAX }, "Vitesse d'obturation mini."] },
    "Surimpression", "Intervallomètre", "Accéléré", "Paramètres vidéo"];
  var CONFIG = [
    { n: "Formater la carte mémoire", fin: "Choisis la carte (SD ou CF) : le formatage supprime définitivement toutes les images de cette carte. Raccourci : maintiens MODE et Effacer ensemble." },
    "Luminosité du moniteur", "Nettoyer le capteur d'image", "Verrouiller miroir/nettoyage", "Photo de correction poussière", "HDMI", "Réduction du scintillement",
    "Fuseau horaire et date", "Langue (Language)", "Rotation auto. des images", "Informations de l'accumulateur", "Système de comm. sans fil", "Légende des images",
    { n: "Informations de copyright", s: ["Terminé", { n: "Photographe", fin: "Saisie du texte : écris ton nom (36 caractères au plus)." }, "Copyright", { n: "Joindre les infos de copyright", fin: "▶ coche la case : tes informations seront jointes à toutes les photos suivantes. Valide ensuite avec Terminé." }] },
    { n: "Enregistrer/charger réglages", fin: "Enregistrer les réglages copie tes menus sur la carte mémoire. Charger les réglages les remet, par exemple après une réinitialisation." },
    "GPS", "Horizon virtuel", "Objectif sans microprocesseur", "Réglage précis de l'AF", "Transfert Eye-Fi", "Version du firmware"];
  function groupe(code, nom, items) { return { n: code + " " + nom, s: items.map(function (x, i) { return typeof x === "string" ? code + (i + 1) + " " + x : (x.n = code + (i + 1) + " " + x.n, x); }) }; }
  var PERSO = ["Jeux de réglages perso",
    groupe("a", "Autofocus", ["Priorité en mode AF-C", "Priorité en mode AF-S", "Suivi MAP avec Lock-On", "Activation AF", "Éclairage du point AF", "Rotation du point AF", "Nombre de points AF", { n: "Illuminateur d'assistance AF", o: ["Activé", "Désactivé"] }]),
    groupe("b", "Mesure/exposition", ["Incrément de la sensibilité", "Incrément de l'exposition", "Incrément corr. expo./flash", "Correction d'exposition", "Zone pondérée centrale", "Réglage précis expo. opti."]),
    groupe("c", "Tempo./mémo. exposition", ["Mémo expo par déclencheur", "Délai arrêt mesure auto.", "Retardateur", { n: "Extinction du moniteur", s: ["Visualisation", "Menus", "Affichage des informations", { n: "Affichage des images", fin: "Par défaut 4 s : la durée d'affichage de la photo juste après la prise. Une durée plus longue use un peu plus la batterie." }, "Visée écran"] }]),
    groupe("d", "Prise de vue/affichage", [{ n: "Signal sonore", s: [{ n: "Volume", o: ["3", "2", "1", "Désactivé"] }, "Hauteur"] }, "Cadence prise de vue en CL", "Nombre de vues maximal", "Temporisation miroir levé", "Séquence numérique images", { n: "Quadrillage dans le viseur", o: ["Activé", "Désactivé"] }, "Affichage et réglage ISO", "Aide", "Affichage des informations", "Éclairage écran de contrôle", "Piles pour la MB-D12", "Ordre d'alimentation"]),
    groupe("e", "Bracketing/flash", ["Vitesse de synchro. flash", "Vitesse d'obturation flash", "Contrôle du flash intégré", "Mode lampe pilote", "Réglage du bracketing auto", "Bracketing auto (mode M)", "Sens du bracketing"]),
    groupe("f", "Commandes", ["Commutateur marche-arrêt", "Bouton central du sélecteur", "Sélecteur multidirectionnel", "Régler la commande Fn", "Régler commande d'aperçu", "Régler commande AE-L/AF-L", "Mémo. vitesse & ouverture", "Régler la commande BKT", "Perso. molettes commande", "Commande lâchée + molette", "Photo si carte absente ?", "Inverser les indicateurs", "Régler AF-ON pour MB-D12"]),
    groupe("g", "Vidéo", ["Régler la commande Fn", "Régler commande d'aperçu", "Régler commande AE-L/AF-L", "Régler le déclencheur"])];
  function nonSimule(t) { return [t + " (non simulé dans ce guide)"]; }
  var ONGLETS = [
    { n: "Visualisation", c: "VISU", l: nonSimule("Menu Visualisation") },
    { n: "Prise de vue", c: "PHOTO", l: PHOTO },
    { n: "Réglages personnalisés", c: "PERSO", l: PERSO },
    { n: "Configuration", c: "CONFIG", l: CONFIG },
    { n: "Retouche", c: "RETOUCHE", l: nonSimule("Menu Retouche") },
    { n: "Menu personnalisé", c: "MON MENU", l: nonSimule("Menu personnalisé") }];
  var MODES = ["P", "S", "A", "M"];
  function nom(x) { return typeof x === "string" ? x : x.n; }

  /* ---------------- les missions */
  var MISSIONS = [
    { t: "Formater la carte", p: "À faire avec chaque nouvelle carte : l'appareil la prépare pour lui.", b: [{ m: [3, "Formater la carte mémoire"] }] },
    { t: "Passer en RAW + JPEG fine", p: "Le JPEG pour partager tout de suite, le RAW (NEF) pour tout rattraper plus tard.", b: [{ m: [1, "Qualité d'image"], f: "NEF (RAW) + JPEG fine" }] },
    { t: "Activer la sensibilité auto", p: "L'appareil monte la sensibilité tout seul quand la lumière baisse, sans dépasser ta limite.", b: [{ m: [1, "Réglage de la sensibilité", "Contrôle sensibilité auto."], f: "Activé" }, { m: [1, "Réglage de la sensibilité", "Sensibilité maximale"], f: "6400" }] },
    { t: "Choisir le mode A", p: "Tu choisis l'ouverture (le flou d'arrière-plan), l'appareil s'occupe du reste. Sur le vrai D800 : maintiens MODE et tourne la molette principale.", b: [{ d: "A" }] },
    { t: "Afficher le quadrillage", p: "Des lignes dans le viseur pour garder l'horizon droit et composer au tiers.", b: [{ m: [2, "d Prise de vue/affichage", "d6 Quadrillage dans le viseur"], f: "Activé" }] },
    { t: "Revoir la photo plus longtemps", p: "La photo reste affichée plus longtemps après la prise (4 s par défaut).", b: [{ m: [2, "c Tempo./mémo. exposition", "c4 Extinction du moniteur", "Affichage des images"] }] },
    { t: "Signer tes photos", p: "Ton nom est inscrit dans chaque fichier.", b: [{ m: [3, "Informations de copyright", "Photographe"] }, { m: [3, "Informations de copyright", "Joindre les infos de copyright"] }] },
    { t: "Couper l'illuminateur AF", p: "La petite lampe avant ne s'allume plus : mieux pour les animaux et au spectacle.", b: [{ m: [2, "a Autofocus", "a8 Illuminateur d'assistance AF"], f: "Désactivé" }] },
    { t: "Sauvegarder tes réglages", p: "Tes menus sont copiés sur la carte : tu les retrouves en un instant.", b: [{ m: [3, "Enregistrer/charger réglages"] }] }];

  /* ---------------- état */
  var cle = "gd8-sim", faits = (G.lire(cle) || "").split(",").filter(Boolean).map(Number);
  var E = { ecran: "vue", tab: 1, focus: "liste", pile: [{ l: ONGLETS[1].l, s: 0 }], iSel: 0, opt: null, msg: null, mode: 0, val: {} };
  var mi = -1, bi = 0;

  zone.innerHTML =
    '<div class="sim">' +
    '<div class="sim-missions" role="list" aria-label="Réglages à faire"></div>' +
    '<div class="sim-centre">' +
    '<div class="sim-guide" aria-live="polite"></div>' +
    '<div class="sim-boitier">' +
    '<div class="sim-haut"><button type="button" class="sim-b molette" data-c="dial" aria-label="Commande MODE + molette principale : changer de mode"><span class="cran"></span><b></b></button>' +
    '<button type="button" class="sim-b declencheur" data-c="half" aria-label="Déclencheur à mi-course">Déclencheur</button></div>' +
    '<div class="sim-dos"><div class="sim-ecran"></div>' +
    '<div class="sim-cmd">' +
    '<button type="button" class="sim-b rond" data-c="menu">MENU</button>' +
    '<button type="button" class="sim-b rond" data-c="info"><i>info</i></button>' +
    '<div class="sim-croix" role="group" aria-label="Sélecteur multidirectionnel">' +
    '<button type="button" class="sim-b fl h" data-c="up" aria-label="Haut">▲</button><button type="button" class="sim-b fl g" data-c="left" aria-label="Gauche">◀</button>' +
    '<button type="button" class="sim-b ok" data-c="ok">OK</button>' +
    '<button type="button" class="sim-b fl d" data-c="right" aria-label="Droite">▶</button><button type="button" class="sim-b fl b" data-c="down" aria-label="Bas">▼</button></div>' +
    "</div></div></div>" +
    '<p class="sim-note"><span class="clavier">Clavier : flèches, Entrée = OK, M = MENU. </span>Écrans simplifiés : les noms des menus sont ceux du manuel officiel.</p>' +
    "</div></div>";
  var ecran = $(".sim-ecran", zone), guide = $(".sim-guide", zone), liste = $(".sim-missions", zone), molette = $(".molette b", zone);

  /* ---------------- écran */
  function niveau() { return E.pile[E.pile.length - 1]; }
  function rendre() {
    molette.textContent = MODES[E.mode];
    var h = "";
    if (E.ecran === "vue" || E.ecran === "imenu") {
      var q = E.val["Qualité d'image"] || "", iso = E.val["Contrôle sensibilité auto."] === "Activé" ? "ISO-AUTO" + (E.val["Sensibilité maximale"] ? " ≤ " + E.val["Sensibilité maximale"] : "") : "ISO";
      h = '<div class="vue"><div class="infos"><span class="mode">' + MODES[E.mode] + "</span><span>" + esc(q) + "</span><span>" + iso + "</span></div>" + (E.val["d6 Quadrillage dans le viseur"] === "Activé" ? '<span class="cadre-af"></span>' : "") + "</div>";
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
    if (c === "info") { E.ecran = "vue"; E.opt = null; E.msg = { t: "Affichage des informations", p: "Sur le D800, info affiche les réglages sur l'écran. Les réglages de ce guide se font avec MENU." }; return rendre(); }
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
    if (b.d) return cible(["dial"], "Maintiens <b>MODE</b> et tourne la <b>molette principale</b> jusqu'à <b>" + b.d + "</b> (ici : touche la molette).");
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
    E.ecran = "vue"; E.opt = null; E.msg = null; E.focus = "liste"; E.tab = 1; E.pile = [{ l: ONGLETS[1].l, s: 0 }];
    missions(); rendre();
    if (innerWidth <= 860) $(".sim-boitier", zone).scrollIntoView({ block: "center", behavior: G.reduit ? "auto" : "smooth" });
  }
  function missions() {
    liste.innerHTML = '<div class="sur">Que veux-tu régler ?</div>' + MISSIONS.map(function (m, k) {
      return '<button type="button" role="listitem" class="mission' + (k === mi ? " ici" : "") + (faits.indexOf(k) > -1 ? " fait" : "") + '" data-k="' + k + '"><span>' + (faits.indexOf(k) > -1 ? "✓" : k + 1) + "</span>" + esc(m.t) + "</button>";
    }).join("") + '<p class="muted petit">Avant tout : règle la netteté du viseur avec la commande de réglage dioptrique, à droite du viseur (tire-la, tourne, repousse-la).</p>';
    $$(".mission", liste).forEach(function (b) { b.addEventListener("click", function () { choisir(+b.dataset.k); }); });
  }

  $$(".sim-b", zone).forEach(function (b) { b.addEventListener("click", function () { presser(b.dataset.c); }); });
  zone.addEventListener("keydown", function (e) {
    var t = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", Enter: "ok", m: "menu", M: "menu" }[e.key];
    if (!t || !e.target.closest(".sim-boitier") || (e.target.tagName === "BUTTON" && e.key === "Enter")) return; // Entrée sur un bouton : son propre clic suffit
    e.preventDefault(); presser(t);
  });
  ecran.tabIndex = 0; ecran.setAttribute("role", "application"); ecran.setAttribute("aria-label", "Écran de l'appareil simulé : utilise les flèches, Entrée et M");
  missions(); rendre();
})();
