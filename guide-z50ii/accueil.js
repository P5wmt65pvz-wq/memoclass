/* Accueil : séquence d'images au défilement (assemblé → éclaté → assemblé),
   étiquettes des pièces qui suivent l'appareil, parcours. */
(function () {
  "use strict";
  var G = window.GZ, $ = G.$, $$ = G.$$;
  var NB = 160;
  var NOMS = { lentilles: "Lentilles", objectif: "Objectif", capteur: "Capteur 20,9 Mpx", poignee: "Poignée", capot: "Viseur OLED et flash", commandes: "Molettes et déclencheur", ecran: "Écran tactile orientable", batterie: "Batterie EN-EL25a", carte: "Carte SD" };
  var heros = $(".heros"), toile = $("#sequence"), ctx = toile.getContext("2d");
  var temps = $$(".temps"), indice = $("#indice"), charge = $("#charge"), zoneEtiq = $("#etiquettes");
  // Les images compressées sont gardées en mémoire (≈ 36 Ko chacune) ; seules celles
  // proches de la position courante sont décodées, hors du fil principal
  // (createImageBitmap). Décoder à chaque image au moment de dessiner faisait ramer.
  var blobs = [], cartes = [], enCours = [], dossier = "", nbCharge = 0, p = 0, POS = null, dessinee = -1, largeurs = null;
  var iw = 1600, ih = 1000, FENETRE = 10, bitmapOk = "createImageBitmap" in window;

  function choisir() { return innerWidth / innerHeight >= .9 ? "l" : "p"; }
  function charger() {
    var d = choisir(); if (d === dossier) return;
    dossier = d; iw = d === "l" ? 1600 : 750; ih = d === "l" ? 1000 : 1200;
    cartes.forEach(function (c) { if (c && c.close) c.close(); });
    blobs = []; cartes = []; enCours = []; nbCharge = 0; dessinee = -1;
    var ordre = [];
    for (var pas = 16; pas >= 1; pas = Math.floor(pas / 2)) for (var i = 0; i < NB; i += pas) if (ordre.indexOf(i) < 0) ordre.push(i);
    // 6 téléchargements à la fois, dans l'ordre grossier → fin
    var file = ordre.slice(), actifs = 0;
    function suivant() {
      while (actifs < 6 && file.length) (function (i) {
        actifs++;
        fetch("sequence/" + d + "/" + String(i).padStart(3, "0") + ".webp").then(function (r) { return r.blob(); }).then(function (bl) {
          if (d !== dossier) return;
          blobs[i] = bl; nbCharge++; charge.style.width = nbCharge / NB * 100 + "%"; if (nbCharge === NB) charge.style.opacity = 0;
          preparer();
        }).catch(function () {}).then(function () { actifs--; suivant(); });
      })(file.shift());
    }
    suivant();
    POS = null;
    fetch("sequence/" + d + "/etiquettes.json").then(function (r) { return r.json(); }).then(function (j) { POS = j; largeurs = null; poserEtiquettes(); }).catch(function () {});
  }
  function decoder(i) {
    if (cartes[i] || enCours[i] || !blobs[i]) return;
    enCours[i] = true;
    var d = dossier, fini = function (c) { enCours[i] = false; if (d !== dossier) { if (c && c.close) c.close(); return; } cartes[i] = c; if (Math.abs(i - indexCourant()) <= 2 || dessinee < 0) dessiner(); };
    if (bitmapOk) createImageBitmap(blobs[i]).then(fini, function () { enCours[i] = false; });
    else { var im = new Image(); im.onload = function () { fini(im); }; im.src = URL.createObjectURL(blobs[i]); }
  }
  function preparer() {
    // décode la fenêtre autour de la position courante, libère le reste
    var c = indexCourant();
    for (var k = 0; k <= FENETRE; k++) { decoder(c + k); decoder(c - k); }
    for (var i = 0; i < NB; i++) if (cartes[i] && Math.abs(i - c) > FENETRE + 4) { if (cartes[i].close) cartes[i].close(); cartes[i] = null; }
    // tant que rien n'est prêt autour, au moins une image grossière
    if (dessinee < 0) for (var j = 0; j < NB; j += 16) if (blobs[j]) { decoder(j); break; }
  }
  function indexCourant() { return Math.round(p * (NB - 1)); }
  function taille() {
    // pas plus de pixels que l'image n'en a : moins de travail à chaque image
    var w = toile.clientWidth, h = toile.clientHeight, r = Math.min(devicePixelRatio || 1, 2, Math.max(1, iw / (Math.min(w / iw, h / ih) * iw * .84)));
    toile.width = Math.round(w * r); toile.height = Math.round(h * r); dessinee = -1;
  }
  function cadre() {
    // l'appareil sous le texte : plus petit et décalé vers le bas
    var W = toile.width, H = toile.height, l = dossier === "l", fin = G.bornes((p - .84) / .16, 0, 1), s = Math.min(W / iw, H / ih) * (l ? .84 : .96) * (1 - .13 * fin * fin * (3 - 2 * fin));
    return { s: s, x: (W - iw * s) / 2, y: (H - ih * s) / 2 + H * (l ? .13 : .11), w: iw * s, h: ih * s };
  }
  function dessiner() {
    var i = indexCourant(), j = -1;
    if (cartes[i]) j = i; else for (var k = 1; k < NB; k++) { if (cartes[i - k]) { j = i - k; break; } if (cartes[i + k]) { j = i + k; break; } }
    if (j < 0 || (j === dessinee && p < .84)) return;
    var c = cadre();
    ctx.clearRect(0, 0, toile.width, toile.height);
    ctx.drawImage(cartes[j], c.x, c.y, c.w, c.h);
    dessinee = j;
  }
  var etiqVisibles = true;
  function poserEtiquettes() {
    if (!POS) return;
    if (!zoneEtiq.children.length) zoneEtiq.innerHTML = Object.keys(NOMS).map(function (n) { return '<span data-n="' + n + '">' + NOMS[n] + "</span>"; }).join("");
    var spans = $$("span", zoneEtiq);
    var visible = p > .38 && p < .62 ? G.bornes(Math.min((p - .38) / .05, (.62 - p) / .05), 0, 1) : 0;
    if (!visible) { if (etiqVisibles) { spans.forEach(function (s) { s.style.opacity = 0; }); etiqVisibles = false; } return; }
    etiqVisibles = true;
    if (!largeurs) largeurs = spans.map(function (s) { return s.offsetWidth; }); // lu une fois, pas à chaque image
    var f = POS[indexCourant()] || {}, c = cadre(), r = toile.width / toile.clientWidth;
    var court = dossier === "p", PEU = { lentilles: 1, capteur: 1, ecran: 1, commandes: 1, carte: 1 };
    spans.forEach(function (s, k) {
      var q = f[s.dataset.n]; if (!q || (court && !PEU[s.dataset.n])) { s.style.opacity = 0; return; }
      // sur téléphone, moins d'étiquettes et jamais coupées par le bord
      var demi = largeurs[k] / 2 + 8, x = G.bornes((c.x + q[0] / 100 * c.w) / r, demi, innerWidth - demi), y = (c.y + q[1] / 100 * c.h) / r;
      s.style.transform = "translate3d(" + (x - largeurs[k] / 2).toFixed(1) + "px," + y.toFixed(1) + "px,0) translateY(-50%)";
      s.style.opacity = visible;
    });
  }
  function defiler() {
    var vh = innerHeight, course = heros.offsetHeight - vh;
    p = G.bornes(scrollY / course, 0, 1);
    preparer(); dessiner(); poserEtiquettes();
    temps.forEach(function (el) {
      var de = +el.dataset.de, a = +el.dataset.a, f = (a - de) * .25, o;
      o = el.dataset.depart && p <= de + f ? 1 : G.bornes(Math.min((p - de) / f, (a - p) / f), 0, 1);
      el.style.opacity = o.toFixed(3);
      el.style.transform = "translateY(" + ((1 - o) * 26 * (p < (de + a) / 2 ? 1 : -1)).toFixed(1) + "px)";
    });
    indice.style.opacity = G.bornes(1 - p * 14, 0, 1);
  }
  var attente = false;
  addEventListener("scroll", function () { if (attente) return; attente = true; requestAnimationFrame(function () { attente = false; defiler(); }); }, { passive: true });
  addEventListener("resize", function () { charger(); taille(); largeurs = null; defiler(); });
  charger(); taille(); defiler();

  // parcours
  var faits = 0;
  $$("#choix .choix").forEach(function (a) { if (G.lire("gz3-vu-" + a.getAttribute("href"))) { a.classList.add("vu"); faits++; } });
  $("#parcours-texte").textContent = faits === 6 ? "Parcours terminé ✓" : faits + " / 6 étapes";
  $("#parcours-rail").style.width = faits / 6 * 100 + "%";
})();
