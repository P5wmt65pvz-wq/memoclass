/* Page d'un appareil : la vue éclatée qu'on ouvre du doigt, puis le viseur
   où l'on essaie les vraies commandes. Tout bouge en CSS (transform, opacity,
   filter) : la carte graphique s'en charge, rien ne rame. */
(function () {
  "use strict";
  var A = window.APPAREIL, $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  /* ---------------------------------------------------------- vue éclatée */
  var ecl = $("#eclate");
  if (ecl) fetch("pieces/pieces.json").then(function (r) { return r.json(); }).then(function (J) {
    ecl.style.aspectRatio = J.W + " / " + J.H;
    var b = J.pieces.boitier, ratio = J.H / J.W, noms = Object.keys(J.pieces);
    ecl.innerHTML = noms.map(function (n, i) {
      var p = J.pieces[n], d = A.pieces[n] || { z: 1, k: .9 };
      // décalage « fermé » : la pièce rentre vers le centre du boîtier
      var dx = (b.cx - p.cx) * d.k, dy = (b.cy - p.cy) * d.k * ratio;
      return '<button type="button" class="piece" data-n="' + n + '" style="left:' + p.x + "%;top:" + p.y + "%;width:" + p.w + "%;z-index:" + d.z + ";--dx:" + dx.toFixed(2) + "cqw;--dy:" + dy.toFixed(2) + "cqw;--r:" + i * 45 + 'ms" aria-label="' + esc(d.nom || n) + '"><img src="pieces/' + n + '.webp" alt="" draggable="false"></button>';
    }).join("") + noms.map(function (n) {
      var p = J.pieces[n], d = A.pieces[n]; if (!d || !d.nom) return "";
      return '<span class="etiq" data-n="' + n + '" style="left:' + p.cx + "%;top:" + (p.y + p.h + 2) + '%">' + esc(d.nom) + "</span>";
    }).join("");
    var bulle = $("#bulle-piece"), bouton = $("#ouvrir");
    function basculer(o) { ecl.classList.toggle("ouvert", o); bouton.textContent = o ? "Refermer" : "Ouvrir l'appareil"; bouton.setAttribute("aria-pressed", o); if (!o) bulle.hidden = true; }
    bouton.addEventListener("click", function () { basculer(!ecl.classList.contains("ouvert")); });
    $$(".piece", ecl).forEach(function (el) {
      el.addEventListener("click", function () {
        if (!ecl.classList.contains("ouvert")) return basculer(true);
        var d = A.pieces[el.dataset.n]; bulle.hidden = false; bulle.innerHTML = "<b>" + esc(d.nom) + "</b> " + esc(d.dit);
        $$(".piece", ecl).forEach(function (x) { x.classList.toggle("choisie", x === el); });
      });
    });
    // s'ouvre tout seul la première fois qu'on le voit
    var vu = false;
    new IntersectionObserver(function (e) { if (e[0].isIntersecting && !vu) { vu = true; setTimeout(function () { basculer(true); }, reduit ? 0 : 900); } }, { threshold: .5 }).observe(ecl);
    // il tourne doucement avec la souris (ordinateur)
    var scene = $(".eclate-scene");
    if (matchMedia("(hover: hover)").matches && !reduit) scene.addEventListener("pointermove", function (e) {
      var r = scene.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      ecl.style.transform = "rotateY(" + (x * 14).toFixed(2) + "deg) rotateX(" + (-y * 8).toFixed(2) + "deg)";
    });
  });

  /* --------------------------------------------------------------- viseur */
  var V = $("#viseur"); if (!V) return;
  var F = [3.5, 4, 4.5, 5, 5.6, 6.3, 7.1, 8, 9, 10, 11, 13, 16, 22], S = [30, 60, 125, 250, 500, 1000, 2000, 4000], ISO = [100, 200, 400, 800, 1600, 3200, 6400, 12800];
  var E, defi = null, etape = 0, tenu = null, ouvertDial = null;
  var ecran = $(".vf-ecran", V), panneau = $(".vf-commandes", V), consigne = $(".vf-consigne", V), hud = $(".vf-hud", V), puces = $(".vf-defis", V), fin = $(".vf-fin", V);
  var IMG = { paysage: "../../photos/paysage.webp", portrait: "../../photos/portrait.webp", sport: "../../photos/sport.webp", ville: "../../photos/ville.webp" };

  // grain : une petite texture faite une fois
  var c = document.createElement("canvas"); c.width = c.height = 160; var g = c.getContext("2d"), d = g.createImageData(160, 160);
  for (var i = 0; i < d.data.length; i += 4) { var v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); $(".vf-grain", V).style.backgroundImage = "url(" + c.toDataURL() + ")";

  // les commandes posées sur la vraie photo
  panneau.insertAdjacentHTML("beforeend", Object.keys(A.commandes).map(function (k) {
    var m = A.commandes[k], dial = /principale|secondaire|mode/.test(k);
    return '<button type="button" class="cmd' + (dial ? " dial" : "") + '" data-c="' + k + '" style="left:' + m.x + "%;top:" + m.y + '%" aria-label="' + esc(m.nom) + '"><i></i></button>' +
      (dial ? '<span class="tourner" data-c="' + k + '" style="left:' + m.x + "%;top:" + m.y + '%" hidden><button type="button" data-s="-1" aria-label="Tourner à gauche">◀</button><button type="button" data-s="1" aria-label="Tourner à droite">▶</button></span>' : "");
  }).join("") + '<span class="vf-nom" hidden></span>');
  var nomCmd = $(".vf-nom", panneau);

  function montrerNom(k) {
    var m = A.commandes[k]; nomCmd.hidden = false; nomCmd.innerHTML = "<b>" + esc(m.nom) + "</b> " + esc(m.dit);
    nomCmd.style.left = m.x + "%"; nomCmd.style.top = m.y + "%"; nomCmd.style.setProperty("--ax", m.x > 62 ? "-90%" : m.x < 25 ? "-10%" : "-50%");
    clearTimeout(montrerNom.t); montrerNom.t = setTimeout(function () { nomCmd.hidden = true; }, 2600);
  }
  function attendue() { if (!defi) return []; var e = defi.etapes[etape]; return e ? [].concat(e.cmd) : []; }
  function cibler() {
    var a = attendue();
    $$(".cmd", panneau).forEach(function (b) { b.classList.toggle("cible", a.indexOf(b.dataset.c) > -1); b.classList.toggle("tenu", b.dataset.c === tenu); });
    // la molette à tourner montre directement ses flèches
    var dl = a.filter(function (k) { return /principale|secondaire|mode/.test(k); });
    if (dl.length && dl.indexOf(ouvertDial) < 0) ouvrirDial(dl[0]);
  }
  function ouvrirDial(k) { ouvertDial = k; $$(".tourner", panneau).forEach(function (t) { t.hidden = t.dataset.c !== k; }); }

  $$(".cmd", panneau).forEach(function (b) {
    b.addEventListener("click", function () {
      var k = b.dataset.c, e = defi && defi.etapes[etape];
      montrerNom(k);
      if (k === "declencheur") return declencher();
      if (k === "correction" || k === "iso") { tenu = tenu === k ? null : k; if (e && e.tenir && [].concat(e.cmd).indexOf(k) > -1 && tenu === k) etape++; rendre(); return; }
      if (b.classList.contains("dial")) ouvrirDial(ouvertDial === k ? null : k);
      if (k === "rec") { ecran.classList.add("rec"); setTimeout(function () { ecran.classList.remove("rec"); }, 900); }
    });
  });
  $$(".tourner button", panneau).forEach(function (bt) {
    bt.addEventListener("click", function (ev) { ev.stopPropagation(); tourner(bt.parentNode.dataset.c, +bt.dataset.s); });
  });

  function tourner(k, s) {
    if (k === "mode") { E.mode = (E.mode + s + A.modes.length) % A.modes.length; }
    else if (tenu === "correction") E.comp = Math.max(-15, Math.min(15, E.comp + s));
    else if (tenu === "iso" && k === "principale") E.iso = Math.max(0, Math.min(ISO.length - 1, E.iso + s));
    else {
      var m = A.modes[E.mode];
      if (k === "secondaire" && (m === "A" || m === "M")) E.f = Math.max(0, Math.min(F.length - 1, E.f - s));
      else if (k === "principale" && (m === "S" || m === "M")) E.s = Math.max(0, Math.min(S.length - 1, E.s + s));
      else montrerNom(k);
    }
    // l'étape « tourner » est faite quand on tourne la bonne commande (ou la molette de mode jusqu'au bon mode)
    var e = defi && defi.etapes[etape];
    if (e && !e.tenir && [].concat(e.cmd).indexOf(k) > -1) { if (!e.vers || A.modes[E.mode] === e.vers) etape++; }
    rendre();
  }

  function etat(def) {
    var base = { mode: A.modes.indexOf(def.mode), f: 7, s: 3, iso: 2, comp: 0 };
    if (def.id === "fige") base.s = 1;
    if (def.id === "nuit") { base.iso = 0; base.f = 0; base.s = 2; }
    return base;
  }
  function reussi() {
    if (!defi) return false;
    var m = A.modes[E.mode];
    if (defi.id === "clair") return E.comp >= 5;
    if (defi.id === "flou") return m === "A" && F[E.f] <= 4;
    if (defi.id === "fige") return m === "S" && S[E.s] >= 1000;
    if (defi.id === "nuit") return ISO[E.iso] >= 3200;
  }
  function rendre() {
    if (!defi) return;
    var m = A.modes[E.mode], lum = 1, flouFond = 0, flouSujet = 0, grain = 0;
    if (defi.id === "clair") lum = Math.pow(2, E.comp / 3 - 1.7);
    if (defi.id === "flou") flouFond = m === "A" || m === "M" ? Math.max(0, 11 / F[E.f] - 1) * 5 : 1.5;
    if (defi.id === "fige") flouSujet = Math.min(9, 60 / S[E.s] * 3.2);
    if (defi.id === "nuit") { lum = Math.pow(2, Math.log2(ISO[E.iso] / 3200) * .55); grain = Math.max(0, Math.log2(ISO[E.iso] / 400)) * .06; }
    ecran.style.setProperty("--lum", lum.toFixed(3));
    ecran.style.setProperty("--flou-fond", flouFond.toFixed(1) + "px");
    ecran.style.setProperty("--flou-sujet", flouSujet.toFixed(1) + "px");
    ecran.style.setProperty("--grain", grain.toFixed(3));
    var comp = E.comp ? (E.comp > 0 ? "+" : "−") + (Math.abs(E.comp) / 3).toFixed(1).replace(".", ",") : "0";
    hud.innerHTML = '<b class="m">' + m + "</b><span>1/" + S[E.s] + "</span><span>f/" + String(F[E.f]).replace(".", ",") + "</span><span>ISO " + ISO[E.iso] + '</span><span class="' + (tenu === "correction" ? "vif" : "") + '">± ' + comp + "</span>";
    var ok = reussi(), e = defi.etapes[etape];
    var val = { clair: "± " + comp, flou: "f/" + String(F[E.f]).replace(".", ","), fige: "1/" + S[E.s] + " s", nuit: ISO[E.iso] + " ISO" }[defi.id];
    consigne.innerHTML = ok ? "✓ " + esc(defi.reussi.replace("{v}", val)) : e ? esc(e.txt) : esc(defi.but);
    consigne.classList.toggle("ok", !!ok);
    fin.hidden = !ok; if (ok) { fin.innerHTML = '<p>' + esc(defi.vraie) + '</p><button type="button" class="bouton jaune">Défi suivant →</button>'; $("button", fin).onclick = suivant; tenu = null; etape = defi.etapes.length; marquer(defi.id); }
    cibler();
  }
  function declencher() {
    ecran.classList.remove("flash"); void ecran.offsetWidth; ecran.classList.add("flash");
  }
  var faits = (function () { try { return JSON.parse(localStorage.getItem("app-defis-" + A.id) || "[]"); } catch (e) { return []; } })();
  function marquer(id) { if (faits.indexOf(id) < 0) { faits.push(id); try { localStorage.setItem("app-defis-" + A.id, JSON.stringify(faits)); } catch (e) {} } puces.querySelector('[data-d="' + id + '"]').classList.add("fait"); }
  function choisir(i) {
    defi = A.defis[i]; etape = 0; tenu = null; E = etat(defi); ouvrirDial(null);
    $$(".vf-photo", ecran).forEach(function (im) { im.src = IMG[defi.scene]; });
    ecran.dataset.scene = defi.scene;
    $$("button", puces).forEach(function (b, j) { b.classList.toggle("ici", j === i); });
    $(".vf-titre", V).textContent = defi.but;
    rendre();
  }
  function suivant() { var i = A.defis.indexOf(defi); choisir((i + 1) % A.defis.length); }
  puces.innerHTML = A.defis.map(function (d, i) { return '<button type="button" data-d="' + d.id + '" class="' + (faits.indexOf(d.id) > -1 ? "fait" : "") + '">' + esc(d.titre) + "</button>"; }).join("");
  $$("button", puces).forEach(function (b, i) { b.addEventListener("click", function () { choisir(i); }); });
  document.addEventListener("click", function (e) { if (!e.target.closest(".cmd, .tourner")) ouvrirDial(null); });
  choisir(0);
})();
