/* Accueil : séquence d'images au défilement (assemblé → éclaté → assemblé),
   étiquettes des pièces qui suivent l'appareil, parcours. */
(function () {
  "use strict";
  var G = window.GZ, $ = G.$, $$ = G.$$;
  var NB = 160;
  var NOMS = { objectif: "L'objectif", dessus: "Molettes et déclencheur", boitier: "Le boîtier", capteur: "Le capteur 20,9 Mpx", ecran: "L'écran orientable", batterie: "La batterie", carte: "La carte SD" };
  // Le vrai Z50II (photos libres de droits) : de face, il s'ouvre en pièces
  // (vue éclatée générée par IA à partir de la vraie photo), se referme, puis
  // se retourne sur son vrai dos. Tout est transform/opacity : rien ne rame.
  var heros = $(".heros"), plateau = $("#plateau"), zone = $("#pieces"), avant = $(".vrai.avant"), dos = $(".vrai.dos");
  var temps = $$(".temps"), indice = $("#indice"), zoneEtiq = $("#etiquettes"), P = [], p = 0;
  var lisse = function (t) { t = G.bornes(t, 0, 1); return t * t * (3 - 2 * t); };
  var K = { ecran: .92, capteur: .95, batterie: .97, carte: .97, boitier: 0, dessus: .9, objectif: .8 }, Z = { ecran: 1, capteur: 2, batterie: 0, carte: 0, boitier: 3, dessus: 4, objectif: 5 };
  fetch("img/vrai/pieces/pieces.json").then(function (r) { return r.json(); }).then(function (J) {
    var b = J.pieces.boitier, ratio = J.H / J.W;
    zone.innerHTML = Object.keys(J.pieces).map(function (n) { var q = J.pieces[n]; return '<img src="img/vrai/pieces/' + n + '.webp" alt="" data-n="' + n + '" style="left:' + q.x + "%;top:" + q.y + "%;width:" + q.w + "%;z-index:" + Z[n] + '">'; }).join("");
    P = $$("img", zone).map(function (el, i) { var q = J.pieces[el.dataset.n]; return { el: el, n: el.dataset.n, q: q, dx: (b.cx - q.cx) * K[el.dataset.n], dy: (b.cy - q.cy) * K[el.dataset.n] * ratio, i: i }; });
    zoneEtiq.innerHTML = P.map(function (o) { return '<span data-n="' + o.n + '" style="left:' + o.q.cx + "%;top:" + (o.q.y + o.q.h + 1) + '%">' + NOMS[o.n] + "</span>"; }).join("");
    defiler();
  });
  function poser() {
    // 0–.16 vrai appareil · .16–.26 il éclate · .26–.58 ouvert · .58–.68 il se referme · .68–.86 il pivote · dos
    var sort = lisse((p - .16) / .1), rentre = lisse((p - .58) / .1);
    var ouvert = sort * (1 - rentre);               // 0 = fermé, 1 = grand ouvert
    // les pièces ne sont jamais montrées « rentrées » : elles partent déjà un peu écartées
    var ecart = .38 + .62 * ouvert;
    P.forEach(function (o) {
      var e = lisse(ecart * 1.12 - o.i * .02);
      o.el.style.transform = "translate(" + (o.dx * (1 - e)).toFixed(2) + "cqw," + (o.dy * (1 - e)).toFixed(2) + "cqw)";
    });
    // coupe nette (jamais deux appareils en transparence), masquée par un bref flou de mouvement
    var SEUIL = .1, coupe = ouvert >= SEUIL;
    zone.style.opacity = coupe ? 1 : 0;
    var flou = Math.max(0, 1 - Math.abs(ouvert - SEUIL) / .07) * 5;
    zone.style.filter = flou > .2 ? "blur(" + flou.toFixed(1) + "px)" : "none";
    // le retournement : l'avant pivote et s'efface, puis le dos arrive (chevauchement court)
    var tour = lisse((p - .7) / .16), sortie = lisse(tour / .58), arrivee = lisse((tour - .42) / .58);
    avant.style.opacity = coupe ? 0 : (1 - sortie).toFixed(3);
    avant.style.transform = "translate(-50%,-50%) translateX(" + (-sortie * 8).toFixed(2) + "%) rotateY(" + (-sortie * 32).toFixed(1) + "deg) scale(" + (1 + Math.min(ouvert / SEUIL, 1) * .05).toFixed(3) + ")";
    avant.style.filter = !coupe && flou > .2 ? "blur(" + flou.toFixed(1) + "px)" : "none";
    dos.style.opacity = arrivee.toFixed(3);
    dos.style.transform = "translate(-50%,-50%) translateX(" + ((1 - arrivee) * 8).toFixed(2) + "%) rotateY(" + ((1 - arrivee) * 32).toFixed(1) + "deg)";
    var vis = p > .3 && p < .56 ? G.bornes(Math.min((p - .3) / .04, (.56 - p) / .04), 0, 1) : 0;
    zoneEtiq.style.opacity = vis;
    var grand = innerWidth / innerHeight < .9 ? .75 : .06;
    plateau.style.transform = "translate(-50%,-50%) scale(" + (1 + grand * (1 - ouvert)).toFixed(3) + ")";
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
