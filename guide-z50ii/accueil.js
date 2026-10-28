/* Accueil : séquence d'images au défilement (assemblé → éclaté → assemblé),
   étiquettes des pièces qui suivent l'appareil, parcours. */
(function () {
  "use strict";
  var G = window.GZ, $ = G.$, $$ = G.$$;
  var NB = 160;
  var NOMS = { lentilles: "Lentilles", objectif: "Objectif", capteur: "Capteur 20,9 Mpx", poignee: "Poignée", capot: "Viseur OLED et flash", commandes: "Molettes et déclencheur", ecran: "Écran tactile orientable", batterie: "Batterie EN-EL25a", carte: "Carte SD" };
  // L'animation est une vidéo LUE normalement (pas sautée image par image : sur
  // iPhone, chaque saut de position coûte cher et ça saccadait). Quand on défile,
  // la vidéo joue jusqu'à la bonne image, plus vite si on est loin ; pour revenir
  // en arrière, on joue une copie inversée. Tout est décodé par la puce vidéo.
  var heros = $(".heros"), av = $("#sequence"), ar = $("#sequence-inverse"), actif = av;
  var temps = $$(".temps"), indice = $("#indice"), charge = $("#charge"), zoneEtiq = $("#etiquettes");
  var dossier = "", p = 0, POS = null, largeurs = null, iw = 1600, ih = 1000, base = null;
  var duree = 0, sens = 1, bascule = false, boucle = false, modeSaut = false;

  function choisir() { return innerWidth / innerHeight >= .9 ? "l" : "p"; }
  function charger() {
    var d = choisir(); if (d === dossier) return;
    dossier = d; iw = d === "l" ? 1600 : 750; ih = d === "l" ? 1000 : 1200;
    duree = 0; sens = 1; actif = av; av.style.opacity = 1; ar.style.opacity = 0;
    av.src = "sequence/" + d + ".mp4"; ar.src = "sequence/" + d + "-inverse.mp4"; av.load(); ar.load();
    POS = null;
    fetch("sequence/" + d + "/etiquettes.json").then(function (r) { return r.json(); }).then(function (j) { POS = j; largeurs = null; poserEtiquettes(); }).catch(function () {});
  }
  [av, ar].forEach(function (v) {
    // iPhone : une vidéo n'affiche ses images qu'après un premier play (muet, donc autorisé)
    v.addEventListener("loadedmetadata", function () {
      if (v === av) duree = v.duration;
      var pr = v.play(); if (pr && pr.then) pr.then(function () { v.pause(); if (v === av) { v.currentTime = 0; lancer(); } }, function () { modeSaut = true; lancer(); });
    });
  });
  av.addEventListener("progress", function () { try { var f = av.buffered.length ? av.buffered.end(av.buffered.length - 1) / av.duration : 0; charge.style.width = f * 100 + "%"; if (f > .99) charge.style.opacity = 0; } catch (e) {} });
  av.addEventListener("canplaythrough", function () { charge.style.opacity = 0; });

  function position() { return actif === av ? av.currentTime : duree - ar.currentTime; }
  function lancer() { if (!boucle && duree) { boucle = true; requestAnimationFrame(suivre); } }
  function suivre() {
    var cible = p * (duree - .04), t = position(), ecart = cible - t;
    poserEtiquettes(t);
    if (modeSaut) { if (!av.seeking && Math.abs(ecart) > .01) av.currentTime = cible; boucle = false; return; }
    if (bascule) return requestAnimationFrame(suivre);
    if (Math.abs(ecart) < .03) { actif.pause(); boucle = false; return; }
    var voulu = ecart > 0 ? 1 : -1;
    if (voulu !== sens) {
      // changement de sens : l'autre vidéo se place sur la même image, puis on échange
      var autre = voulu > 0 ? av : ar; bascule = true; actif.pause();
      autre.currentTime = voulu > 0 ? t : duree - t;
      autre.addEventListener("seeked", function fini() {
        autre.removeEventListener("seeked", fini);
        autre.style.opacity = 1; actif.style.opacity = 0; actif = autre; sens = voulu; bascule = false;
      });
      return requestAnimationFrame(suivre);
    }
    actif.playbackRate = G.bornes(Math.abs(ecart) / .35, .6, 4);
    if (actif.paused) { var pr = actif.play(); if (pr && pr.catch) pr.catch(function () { modeSaut = true; }); }
    requestAnimationFrame(suivre);
  }
  function taille() {
    // place la vidéo comme le faisait le canevas : l'appareil sous le texte, un peu plus petit
    var W = innerWidth, H = innerHeight, l = dossier === "l", s = Math.min(W / iw, H / ih) * (l ? .84 : .96);
    base = { w: iw * s, h: ih * s, x: (W - iw * s) / 2, y: (H - ih * s) / 2 + H * (l ? .13 : .11) };
    [av, ar].forEach(function (v) { v.style.width = base.w + "px"; v.style.height = base.h + "px"; v.style.left = base.x + "px"; v.style.top = base.y + "px"; });
  }
  function echelle() { var fin = G.bornes((p - .84) / .16, 0, 1); return 1 - .13 * fin * fin * (3 - 2 * fin); }
  function cadre() { var k = echelle(), w = base.w * k, h = base.h * k; return { x: base.x + (base.w - w) / 2, y: base.y + (base.h - h) / 2, w: w, h: h }; }
  var etiqVisibles = true;
  function poserEtiquettes(t) {
    if (!POS || !base) return;
    if (!zoneEtiq.children.length) zoneEtiq.innerHTML = Object.keys(NOMS).map(function (n) { return '<span data-n="' + n + '">' + NOMS[n] + "</span>"; }).join("");
    var spans = $$("span", zoneEtiq);
    var visible = p > .38 && p < .62 ? G.bornes(Math.min((p - .38) / .05, (.62 - p) / .05), 0, 1) : 0;
    if (!visible) { if (etiqVisibles) { spans.forEach(function (s) { s.style.opacity = 0; }); etiqVisibles = false; } return; }
    etiqVisibles = true;
    if (!largeurs) largeurs = spans.map(function (s) { return s.offsetWidth; }); // lu une fois, pas à chaque image
    var i = duree && t !== undefined ? Math.round(t / duree * (NB - 1)) : Math.round(p * (NB - 1)), f = POS[G.bornes(i, 0, NB - 1)] || {}, c = cadre();
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
    var e = "scale(" + echelle().toFixed(4) + ")"; av.style.transform = e; ar.style.transform = e; lancer(); if (!boucle) poserEtiquettes(duree ? position() : undefined);
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
