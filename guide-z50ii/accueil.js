/* Accueil : séquence d'images au défilement (assemblé → éclaté → assemblé),
   étiquettes des pièces qui suivent l'appareil, parcours. */
(function () {
  "use strict";
  var G = window.GZ, $ = G.$, $$ = G.$$;
  var NB = 160;
  var NOMS = { lentilles: "Lentilles", objectif: "Objectif", capteur: "Capteur 20,9 Mpx", poignee: "Poignée", capot: "Viseur OLED et flash", commandes: "Molettes et déclencheur", ecran: "Écran tactile orientable", batterie: "Batterie EN-EL25a", carte: "Carte SD" };
  // L'animation est une courte vidéo (une image clé par image) que le défilement
  // fait avancer : le décodage se fait par la puce vidéo, même sur iPhone et
  // Chromebook. Les images une à une décodées par le processeur ramaient.
  var heros = $(".heros"), video = $("#sequence");
  var temps = $$(".temps"), indice = $("#indice"), charge = $("#charge"), zoneEtiq = $("#etiquettes");
  var dossier = "", p = 0, POS = null, largeurs = null, iw = 1600, ih = 1000, base = null, visee = null;

  function choisir() { return innerWidth / innerHeight >= .9 ? "l" : "p"; }
  function charger() {
    var d = choisir(); if (d === dossier) return;
    dossier = d; iw = d === "l" ? 1600 : 750; ih = d === "l" ? 1000 : 1200;
    video.src = "sequence/" + d + ".mp4"; video.load();
    POS = null;
    fetch("sequence/" + d + "/etiquettes.json").then(function (r) { return r.json(); }).then(function (j) { POS = j; largeurs = null; poserEtiquettes(); }).catch(function () {});
  }
  // iPhone : une vidéo n'affiche ses images qu'après un premier play (muet, donc autorisé)
  video.addEventListener("loadedmetadata", function () { var pr = video.play(); if (pr && pr.then) pr.then(function () { video.pause(); aller(); }, function () {}); aller(); });
  video.addEventListener("progress", function () { try { var f = video.buffered.length ? video.buffered.end(video.buffered.length - 1) / video.duration : 0; charge.style.width = f * 100 + "%"; if (f > .99) charge.style.opacity = 0; } catch (e) {} });
  video.addEventListener("canplaythrough", function () { charge.style.opacity = 0; });
  video.addEventListener("seeked", function () { if (visee !== null) { var t = visee; visee = null; video.currentTime = t; } });
  function aller() {
    if (!video.duration) return;
    var t = p * (video.duration - .04);
    if (video.seeking) visee = t; else if (Math.abs(video.currentTime - t) > .01) video.currentTime = t;
  }
  function taille() {
    // place la vidéo comme le faisait le canevas : l'appareil sous le texte, un peu plus petit
    var W = innerWidth, H = innerHeight, l = dossier === "l", s = Math.min(W / iw, H / ih) * (l ? .84 : .96);
    base = { w: iw * s, h: ih * s, x: (W - iw * s) / 2, y: (H - ih * s) / 2 + H * (l ? .13 : .11) };
    video.style.width = base.w + "px"; video.style.height = base.h + "px"; video.style.left = base.x + "px"; video.style.top = base.y + "px";
  }
  function echelle() { var fin = G.bornes((p - .84) / .16, 0, 1); return 1 - .13 * fin * fin * (3 - 2 * fin); }
  function cadre() { var k = echelle(), w = base.w * k, h = base.h * k; return { x: base.x + (base.w - w) / 2, y: base.y + (base.h - h) / 2, w: w, h: h }; }
  var etiqVisibles = true;
  function poserEtiquettes() {
    if (!POS || !base) return;
    if (!zoneEtiq.children.length) zoneEtiq.innerHTML = Object.keys(NOMS).map(function (n) { return '<span data-n="' + n + '">' + NOMS[n] + "</span>"; }).join("");
    var spans = $$("span", zoneEtiq);
    var visible = p > .38 && p < .62 ? G.bornes(Math.min((p - .38) / .05, (.62 - p) / .05), 0, 1) : 0;
    if (!visible) { if (etiqVisibles) { spans.forEach(function (s) { s.style.opacity = 0; }); etiqVisibles = false; } return; }
    etiqVisibles = true;
    if (!largeurs) largeurs = spans.map(function (s) { return s.offsetWidth; }); // lu une fois, pas à chaque image
    var f = POS[Math.round(p * (NB - 1))] || {}, c = cadre();
    var court = dossier === "p", PEU = { lentilles: 1, capteur: 1, ecran: 1, commandes: 1, carte: 1 };
    spans.forEach(function (s, k) {
      var q = f[s.dataset.n]; if (!q || (court && !PEU[s.dataset.n])) { s.style.opacity = 0; return; }
      // sur téléphone, moins d'étiquettes et jamais coupées par le bord
      var demi = largeurs[k] / 2 + 8, x = G.bornes(c.x + q[0] / 100 * c.w, demi, innerWidth - demi), y = c.y + q[1] / 100 * c.h;
      s.style.transform = "translate3d(" + (x - largeurs[k] / 2).toFixed(1) + "px," + y.toFixed(1) + "px,0) translateY(-50%)";
      s.style.opacity = visible;
    });
  }
  function defiler() {
    var vh = innerHeight, course = heros.offsetHeight - vh;
    p = G.bornes(scrollY / course, 0, 1);
    aller(); video.style.transform = "scale(" + echelle().toFixed(4) + ")"; poserEtiquettes();
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
