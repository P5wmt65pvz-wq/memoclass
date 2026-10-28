/* Accueil : le vrai Z50II se démonte et se remonte au défilement (vraies
   pièces qui glissent, rien ne fond), étiquettes des pièces, parcours. */
(function () {
  "use strict";
  var G = window.GZ, $ = G.$, $$ = G.$$;
  var NOMS = { objectif: "L'objectif", dessus: "Molettes et déclencheur", boitier: "Le boîtier", capteur: "Le capteur 20,9 Mpx", ecran: "L'écran orientable", batterie: "La batterie", carte: "La carte SD" };
  // où poser chaque étiquette (en % de la vue éclatée)
  var ETIQ = { dessus: [44.9, 28.1], objectif: [24, 90.9], boitier: [55, 74.5], capteur: [71.2, 70.6], ecran: [81.2, 63.9], batterie: [90.7, 56.6], carte: [97.3, 31] };
  // ordre de départ (l'objectif part en premier) et profondeur pour la rotation
  var RETARD = { lentA: 0, lentB: .04, lentC: .07, dessus: .1, capteur: .14, ecran: .17, batterie: .2, carte: .22, boitier: 0 };
  var PROF = { lentA: 70, lentB: 55, lentC: 40, dessus: 20, boitier: 0, capteur: -20, ecran: -35, batterie: -50, carte: -60 };
  var heros = $(".heros"), plateau = $("#plateau"), monde = $("#monde"), zone = $("#pieces");
  var temps = $$(".temps"), indice = $("#indice"), zoneEtiq = $("#etiquettes"), P = [], p = 0, W = 1680, H = 944;
  var lisse = function (t) { t = G.bornes(t, 0, 1); return t * t * (3 - 2 * t); };
  var doux = function (t) { t = G.bornes(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  fetch("img/vrai/couches/couches.json").then(function (r) { return r.json(); }).then(function (J) {
    W = J.W; H = J.H;
    zone.innerHTML = J.couches.map(function (c) {
      return '<img src="img/vrai/couches/' + c.n + '.webp" alt="" style="left:' + (c.x / W * 100).toFixed(3) + "%;top:" + (c.y / H * 100).toFixed(3) + "%;width:" + (c.w / W * 100).toFixed(3) + "%;transform-origin:" + ((c.ox - c.x) / c.w * 100).toFixed(1) + "% " + ((c.oy - c.y) / c.h * 100).toFixed(1) + '%">';
    }).join("");
    P = $$("img", zone).map(function (el, i) { var c = J.couches[i]; return { el: el, n: c.n, dx: c.dx / W * 100, dy: c.dy / W * 100, s: c.s, r: RETARD[c.n] || 0, z: PROF[c.n] || 0 }; });
    zoneEtiq.innerHTML = Object.keys(ETIQ).map(function (n) { return '<span data-n="' + n + '" style="left:' + ETIQ[n][0] + "%;top:" + ETIQ[n][1] + '%">' + NOMS[n] + "</span>"; }).join("");
    defiler();
  });
  function poser() {
    // 0–.16 appareil monté · .16–.32 il se démonte · ouvert · .56–.7 il se remonte · zoom sur les molettes
    var ouvert = lisse((p - .16) / .16) * (1 - lisse((p - .56) / .14));
    P.forEach(function (o) {
      var e = 1 - doux((ouvert * 1.28 - o.r) / 1.06);   // 1 = monté, 0 = éclaté
      var z = o.z * (1 - e * .7);
      o.el.style.transform = "translate3d(" + (o.dx * e).toFixed(2) + "cqw," + (o.dy * e).toFixed(2) + "cqw," + z.toFixed(1) + "px) scale(" + (1 + (o.s - 1) * e).toFixed(4) + ")";
    });
    var vis = p > .3 && p < .55 ? G.bornes(Math.min((p - .3) / .04, (.55 - p) / .04), 0, 1) : 0;
    zoneEtiq.style.opacity = vis;
    // il tourne doucement pendant tout le défilement ; puis on s'approche des molettes
    var rot = -16 + 30 * lisse(p / .9);
    var zoom = lisse((p - .66) / .14) * (1 - .55 * lisse((p - .86) / .12));
    var etroit = innerWidth / innerHeight < .9;
    var grand = (etroit ? .75 : .45) * (1 - ouvert);
    var sc = (1 + grand * (1 - .5 * zoom)) * (1 + (etroit ? .5 : .7) * zoom);
    // point fixe (≈ 46 %, 40 % : l'appareil grandit vers le bas, sous le titre) puis centre des molettes (≈ 37 %, 24 %)
    var cx = 46 - 9 * zoom, cy = 40 - 16 * zoom;
    monde.style.transformOrigin = cx + "% " + cy + "%";
    // on amène les molettes au milieu de l'écran (un peu au-dessus)
    var R = plateau.getBoundingClientRect();
    var tx = (innerWidth / 2 - (R.left + R.width * cx / 100)) * zoom, ty = (innerHeight * .56 - (R.top + R.height * cy / 100)) * zoom;
    monde.style.transform = "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) rotateY(" + rot.toFixed(2) + "deg) rotateX(" + (4 - 6 * ouvert).toFixed(2) + "deg) scale(" + (sc / 2).toFixed(4) + ")";
  }
  // inertie : l'animation rejoint le défilement en douceur, comme sur une page produit Apple
  var cible = 0, boucle = false;
  function suivre() {
    var d = cible - p;
    p = Math.abs(d) < .0004 || G.reduit ? cible : p + d * .14;
    rendre();
    if (p !== cible) requestAnimationFrame(suivre); else boucle = false;
  }
  function defiler() {
    var course = heros.offsetHeight - innerHeight;
    cible = G.bornes(scrollY / course, 0, 1);
    if (!boucle) { boucle = true; requestAnimationFrame(suivre); }
  }
  function rendre() {
    poser();
    temps.forEach(function (el) {
      var de = +el.dataset.de, a = +el.dataset.a, f = (a - de) * .25, o;
      o = el.dataset.depart && p <= de + f ? 1 : G.bornes(Math.min((p - de) / f, (a - p) / f), 0, 1);
      el.style.opacity = o.toFixed(3);
      el.style.transform = "translateY(" + ((1 - o) * 26 * (p < (de + a) / 2 ? 1 : -1)).toFixed(1) + "px)";
    });
    indice.style.opacity = G.bornes(1 - p * 14, 0, 1);
  }
  addEventListener("scroll", defiler, { passive: true });
  addEventListener("resize", defiler);
  defiler();

  // parcours
  var faits = 0;
  $$("#choix .choix").forEach(function (a) { if (G.lire("gz3-vu-" + a.getAttribute("href"))) { a.classList.add("vu"); faits++; } });
  $("#parcours-texte").textContent = faits === 6 ? "Parcours terminé ✓" : faits + " / 6 étapes";
  $("#parcours-rail").style.width = faits / 6 * 100 + "%";
})();
