/* Accueil : séquence d'images au défilement (assemblé → éclaté → assemblé),
   étiquettes des pièces qui suivent l'appareil, parcours. */
(function () {
  "use strict";
  var G = window.GZ, $ = G.$, $$ = G.$$;
  var NB = 160;
  var NOMS = { lentilles: "Lentilles", objectif: "Objectif", capteur: "Capteur 20,9 Mpx", poignee: "Poignée", capot: "Viseur OLED et flash", commandes: "Molettes et déclencheur", ecran: "Écran tactile orientable", batterie: "Batterie EN-EL25a", carte: "Carte SD" };
  var heros = $(".heros"), toile = $("#sequence"), ctx = toile.getContext("2d");
  var temps = $$(".temps"), indice = $("#indice"), charge = $("#charge"), zoneEtiq = $("#etiquettes");
  var images = [], dossier = "", nbCharge = 0, p = 0, POS = null;

  function choisir() { return innerWidth / innerHeight >= .9 ? "l" : "p"; }
  function charger() {
    var d = choisir(); if (d === dossier) return;
    dossier = d; images = []; nbCharge = 0;
    var ordre = [];
    for (var pas = 16; pas >= 1; pas = Math.floor(pas / 2)) for (var i = 0; i < NB; i += pas) if (ordre.indexOf(i) < 0) ordre.push(i);
    ordre.forEach(function (i) {
      var im = new Image(); im.decoding = "async";
      im.onload = function () { im.pret = true; nbCharge++; charge.style.width = nbCharge / NB * 100 + "%"; if (nbCharge === NB) charge.style.opacity = 0; dessiner(); };
      im.src = "sequence/" + d + "/" + String(i).padStart(3, "0") + ".webp";
      images[i] = im;
    });
    POS = null;
    fetch("sequence/" + d + "/etiquettes.json").then(function (r) { return r.json(); }).then(function (j) { POS = j; poserEtiquettes(); }).catch(function () {});
  }
  function taille() {
    var r = Math.min(devicePixelRatio || 1, 2);
    toile.width = Math.round(toile.clientWidth * r); toile.height = Math.round(toile.clientHeight * r);
  }
  function cadre() {
    // l'image remplit l'écran comme « contain », un peu plus petite pour laisser respirer le texte
    var im = images[0] || {}, iw = im.naturalWidth || (dossier === "l" ? 1600 : 750), ih = im.naturalHeight || (dossier === "l" ? 1000 : 1200);
    // l'appareil sous le texte : plus petit et décalé vers le bas
    var W = toile.width, H = toile.height, l = dossier === "l", fin = G.bornes((p - .84) / .16, 0, 1), s = Math.min(W / iw, H / ih) * (l ? .84 : .96) * (1 - .13 * fin * fin * (3 - 2 * fin));
    return { s: s, x: (W - iw * s) / 2, y: (H - ih * s) / 2 + H * (l ? .13 : .11), w: iw * s, h: ih * s };
  }
  function dessiner() {
    var i = Math.round(p * (NB - 1)), im = images[i];
    if (!im || !im.pret) for (var k = 1; k < NB; k++) { if (images[i - k] && images[i - k].pret) { im = images[i - k]; break; } if (images[i + k] && images[i + k].pret) { im = images[i + k]; break; } }
    if (!im || !im.pret) return;
    var c = cadre();
    ctx.clearRect(0, 0, toile.width, toile.height);
    ctx.drawImage(im, c.x, c.y, c.w, c.h);
  }
  function poserEtiquettes() {
    if (!POS) return;
    if (!zoneEtiq.children.length) zoneEtiq.innerHTML = Object.keys(NOMS).map(function (n) { return '<span data-n="' + n + '">' + NOMS[n] + "</span>"; }).join("");
    var i = Math.round(p * (NB - 1)), f = POS[i] || {}, c = cadre(), r = toile.width / toile.clientWidth;
    var visible = p > .38 && p < .62 ? G.bornes(Math.min((p - .38) / .05, (.62 - p) / .05), 0, 1) : 0;
    var court = dossier === "p", PEU = { lentilles: 1, capteur: 1, ecran: 1, commandes: 1, carte: 1 };
    $$("span", zoneEtiq).forEach(function (s) {
      var q = f[s.dataset.n]; if (!q || (court && !PEU[s.dataset.n])) { s.style.opacity = 0; return; }
      // sur téléphone, moins d'étiquettes et jamais coupées par le bord
      var demi = s.offsetWidth / 2 + 8, x = (c.x + q[0] / 100 * c.w) / r;
      s.style.left = G.bornes(x, demi, innerWidth - demi) + "px";
      s.style.top = (c.y + q[1] / 100 * c.h) / r + "px";
      s.style.opacity = visible;
    });
  }
  function defiler() {
    var vh = innerHeight, course = heros.offsetHeight - vh;
    p = G.bornes(scrollY / course, 0, 1);
    dessiner(); poserEtiquettes();
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
  addEventListener("resize", function () { charger(); taille(); defiler(); });
  charger(); taille(); defiler();

  // parcours
  var faits = 0;
  $$("#choix .choix").forEach(function (a) { if (G.lire("gz3-vu-" + a.getAttribute("href"))) { a.classList.add("vu"); faits++; } });
  $("#parcours-texte").textContent = faits === 6 ? "Parcours terminé ✓" : faits + " / 6 étapes";
  $("#parcours-rail").style.width = faits / 6 * 100 + "%";
})();
