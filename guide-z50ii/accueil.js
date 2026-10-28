/* Accueil : le parcours (le simulateur est dans sim.js). */
(function () {
  "use strict";
  var G = window.GZ, $ = G.$, $$ = G.$$;
  // parcours
  var faits = 0;
  $$("#choix .choix").forEach(function (a) { if (G.lire("gz3-vu-" + a.getAttribute("href"))) { a.classList.add("vu"); faits++; } });
  $("#parcours-texte").textContent = faits === 6 ? "Parcours terminé ✓" : faits + " / 6 étapes";
  $("#parcours-rail").style.width = faits / 6 * 100 + "%";
})();
