/* Commun à toutes les pages : barre, menu, pied de page, progression,
   apparition au défilement. Aucune requête vers un autre site. */
(function () {
  "use strict";
  var PAGES = [
    ["index.html", "Accueil"],
    ["decouvrir.html", "Découvrir"],
    ["reglages.html", "Prendre en main"],
    ["apprendre.html", "Apprendre"],
    ["situations.html", "Photographier"],
    ["video.html", "Filmer"],
    ["aide.html", "Aide"]
  ];
  var ici = (location.pathname.split("/").pop() || "index.html");
  var G = window.GZ = {};
  G.$ = function (s, r) { return (r || document).querySelector(s); };
  G.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  G.lire = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  G.ecrire = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  G.echapper = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  G.bornes = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  // au plus un calcul par image affichée, même si le curseur envoie plus d'événements
  G.parImage = function (f) { var att = false; return function () { if (att) return; att = true; requestAnimationFrame(function () { att = false; f(); }); }; };
  G.reduit = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  G.PAGES = PAGES;

  var logo = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="9" width="28" height="19" rx="5" fill="#1d1d1f"/><path d="M11 9l2-4h6l2 4z" fill="#1d1d1f"/><circle cx="16" cy="18.5" r="6.5" fill="#fff"/><circle cx="16" cy="18.5" r="4.4" fill="#1d1d1f"/><circle cx="14.6" cy="17.1" r="1.3" fill="#ffcc00"/><circle cx="25" cy="13" r="1.4" fill="#ffcc00"/></svg>';
  var liens = PAGES.slice(1).map(function (p) { return '<a href="' + p[0] + '"' + (p[0] === ici ? ' aria-current="page"' : "") + ">" + p[1] + "</a>"; }).join("");
  var barre = document.createElement("header");
  barre.className = "barre";
  barre.innerHTML = '<a class="logo" href="index.html">' + logo + 'Guide Z50II</a><nav aria-label="Pages">' + liens + '</nav><button class="bouton-menu" aria-expanded="false" aria-controls="tiroir" aria-label="Ouvrir le menu">☰</button>';
  document.body.insertBefore(barre, document.body.firstChild);
  var saut = document.createElement("a"); saut.className = "saut"; saut.href = "#contenu"; saut.textContent = "Aller au contenu";
  document.body.insertBefore(saut, document.body.firstChild);
  var tiroir = document.createElement("nav");
  tiroir.className = "tiroir"; tiroir.id = "tiroir"; tiroir.setAttribute("aria-label", "Menu");
  tiroir.innerHTML = PAGES.map(function (p) { return '<a href="' + p[0] + '">' + p[1] + (G.lire("gz3-vu-" + p[0]) ? " <span aria-label=\"déjà vu\">✓</span>" : "") + "</a>"; }).join("");
  barre.after(tiroir);
  var bm = G.$(".bouton-menu");
  bm.addEventListener("click", function () { var o = tiroir.classList.toggle("ouvert"); bm.setAttribute("aria-expanded", o ? "true" : "false"); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { tiroir.classList.remove("ouvert"); bm.setAttribute("aria-expanded", "false"); } });

  var pied = document.createElement("footer");
  pied.innerHTML = "<span>Guide gratuit et indépendant, ni affilié ni approuvé par Nikon. Nikon et Z50II sont des marques de Nikon Corporation.</span><a href=\"mentions.html\">Mentions légales, confidentialité et crédits</a><span>Vérifié dans le <a href=\"https://onlinemanual.nikonimglib.com/z50II/fr/\" rel=\"noopener\">manuel officiel</a></span>";
  document.body.appendChild(pied);

  // page vue
  if (ici !== "index.html") G.ecrire("gz3-vu-" + ici, "1");

  // la page suivante du parcours
  var rang = PAGES.map(function (p) { return p[0]; }).indexOf(ici);
  var suite = G.$("#suite");
  if (suite && rang > -1 && rang < PAGES.length - 1) {
    var s = PAGES[rang + 1];
    suite.innerHTML = '<div><p>Étape suivante : ' + s[1] + "</p><small>" + G.echapper(suite.dataset.texte || "") + '</small></div><a class="bouton" href="' + s[0] + '">Continuer →</a>';
    suite.className = "suite bloc";
  }

  // apparition
  if ("IntersectionObserver" in window && !G.reduit) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("vu"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    G.observer = function (el) { io.observe(el); };
    G.$$(".apparait").forEach(G.observer);
  } else { G.observer = function (el) { el.classList.add("vu"); }; G.$$(".apparait").forEach(G.observer); }

  // onglets génériques : [role=tablist] dont les boutons ont data-panneau
  G.onglets = function (liste, quand) {
    var bs = G.$$("button", liste);
    function choisir(b, focus) {
      bs.forEach(function (x) { var on = x === b; x.setAttribute("aria-selected", on ? "true" : "false"); x.tabIndex = on ? 0 : -1; var p = document.getElementById(x.dataset.panneau); if (p) p.hidden = !on; });
      if (focus) b.focus();
      if (liste.scrollWidth > liste.clientWidth) liste.scrollTo({ left: b.offsetLeft - 20, behavior: "smooth" });
      if (quand) quand(b.dataset.panneau);
      if (history.replaceState) history.replaceState(null, "", "#" + b.dataset.panneau);
    }
    bs.forEach(function (b, i) {
      b.addEventListener("click", function () { choisir(b); });
      b.addEventListener("keydown", function (e) {
        var j = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
        if (j !== null) { e.preventDefault(); choisir(bs[(j + bs.length) % bs.length], true); }
      });
    });
    function bord() { liste.classList.toggle("deborde", liste.scrollLeft + liste.clientWidth < liste.scrollWidth - 2); }
    liste.addEventListener("scroll", bord, { passive: true }); addEventListener("resize", bord); setTimeout(bord, 50);
    var depart = bs.filter(function (b) { return "#" + b.dataset.panneau === location.hash; })[0] || bs[0];
    choisir(depart);
  };

  // curseurs : remplissage
  G.remplir = function (r) { r.style.setProperty("--p", ((r.value - r.min) / (r.max - r.min) * 100) + "%"); };

  // quiz : [{q, opts:[...], bon: index, pourquoi}]
  G.quiz = function (zone, questions, cle) {
    var i = 0, score = 0;
    function montrer() {
      if (i >= questions.length) {
        zone.innerHTML = '<div class="carte"><p class="q" style="font-size:22px;font-weight:800">' + score + " / " + questions.length + (score === questions.length ? " — parfait." : " — relis le passage et réessaie.") + '</p><button class="bouton clair" type="button">Recommencer</button></div>';
        G.$("button", zone).addEventListener("click", function () { i = 0; score = 0; montrer(); });
        if (cle && score === questions.length) G.ecrire(cle, "1");
        return;
      }
      var q = questions[i];
      zone.innerHTML = '<div class="carte"><div class="muted" style="font-size:13px;font-weight:700">Question ' + (i + 1) + " / " + questions.length + '</div><p class="q">' + G.echapper(q.q) + '</p><div class="opts">' + q.opts.map(function (o, k) { return '<button type="button" data-k="' + k + '">' + G.echapper(o) + "</button>"; }).join("") + '</div><p class="retour" aria-live="polite"></p></div>';
      var fini = false;
      G.$$(".opts button", zone).forEach(function (b) {
        b.addEventListener("click", function () {
          if (fini) return; fini = true;
          var k = +b.dataset.k, ok = k === q.bon;
          if (ok) score++;
          b.classList.add(ok ? "bon" : "faux");
          G.$$(".opts button", zone)[q.bon].classList.add("bon");
          G.$(".retour", zone).textContent = (ok ? "Exact. " : "Pas tout à fait. ") + q.pourquoi;
          var suiv = document.createElement("button"); suiv.type = "button"; suiv.className = "bouton"; suiv.style.marginTop = "12px";
          suiv.textContent = i + 1 < questions.length ? "Question suivante →" : "Voir mon score";
          suiv.addEventListener("click", function () { i++; montrer(); });
          G.$(".carte", zone).appendChild(suiv); suiv.focus();
        });
      });
    }
    montrer();
  };
})();
