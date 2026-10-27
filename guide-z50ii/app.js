/* Guide Z50II v2 — interactions. Aucune requête vers un autre site, aucun traceur. */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduit = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lire = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var ecrire = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  var echapper = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var bornes = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ------------------------------------------------- sommaire mobile */
  var tiroir = $("#tiroir"), boutonMenu = $("#bouton-menu");
  boutonMenu.addEventListener("click", function () {
    var ouvert = tiroir.classList.toggle("ouvert");
    boutonMenu.setAttribute("aria-expanded", ouvert ? "true" : "false");
  });
  $$("a", tiroir).forEach(function (a) { a.addEventListener("click", function () { tiroir.classList.remove("ouvert"); boutonMenu.setAttribute("aria-expanded", "false"); }); });

  /* ------------------------------- héros : séquence d'images au défilement */
  var NB = 120;
  var heros = $("#haut"), toile = $("#sequence"), ctx = toile.getContext("2d");
  var images = [], chargees = 0, dossier = "", derniere = -1;
  var temps = $$(".temps"), indice = $("#indice"), charge = $("#chargement");

  function choisirDossier() { return window.innerWidth / window.innerHeight >= .9 ? "l" : "p"; }
  function charger() {
    var d = choisirDossier();
    if (d === dossier) return;
    dossier = d; images = []; chargees = 0; derniere = -1;
    var ordre = [];
    // d'abord une image sur 8, puis on comble : la séquence est utilisable très vite
    for (var pas = 8; pas >= 1; pas = Math.floor(pas / 2)) for (var i = 0; i < NB; i += pas) if (ordre.indexOf(i) === -1) ordre.push(i);
    ordre.forEach(function (i) {
      var im = new Image();
      im.decoding = "async";
      im.onload = function () { im.pret = true; chargees++; charge.firstElementChild.style.width = (chargees / NB * 100) + "%"; if (chargees === NB) charge.style.opacity = "0"; if (derniere === -1 || Math.abs(i - indexCourant) < 3) dessiner(true); };
      im.src = "sequence/" + d + "/" + String(i).padStart(3, "0") + ".webp";
      images[i] = im;
    });
  }
  function dimensionner() {
    var r = Math.min(window.devicePixelRatio || 1, 2);
    toile.width = Math.round(toile.clientWidth * r);
    toile.height = Math.round(toile.clientHeight * r);
    derniere = -1;
  }
  var indexCourant = 0, progression = 0;
  // cadrage de l'appareil selon l'avancée : [échelle, décalage x, décalage y] ;
  // il laisse la place au texte de chaque temps (gauche, droite, haut, bas)
  var CADRES = [[0, .72, 0, .15], [.1, .76, 0, .12], [.16, .9, .17, 0], [.3, .9, .17, 0], [.38, .92, -.17, 0], [.52, .92, -.17, 0], [.6, .9, .17, 0], [.76, .9, .17, 0], [.86, .72, 0, -.13], [1, .72, 0, -.13]];
  function cadrage(p) {
    var portrait = dossier === "p" || window.innerWidth <= 760;
    for (var i = 0; i < CADRES.length - 1 && p > CADRES[i + 1][0]; i++);
    var a = CADRES[i], b = CADRES[Math.min(i + 1, CADRES.length - 1)];
    var u = b[0] > a[0] ? bornes((p - a[0]) / (b[0] - a[0]), 0, 1) : 0;
    u = u * u * (3 - 2 * u);
    var k = a[1] + (b[1] - a[1]) * u, x = a[2] + (b[2] - a[2]) * u, y = a[3] + (b[3] - a[3]) * u;
    if (portrait) { x = 0; k *= 1.3; y = y > 0 ? y * .9 : -.13; if (p > .14 && p < .82) y = -.13; }
    return [k, x, y];
  }
  function dessiner(force) {
    var i = indexCourant, im = images[i];
    if (!im || !im.pret) { // image la plus proche déjà chargée
      for (var k = 1; k < NB; k++) {
        if (images[i - k] && images[i - k].pret) { im = images[i - k]; break; }
        if (images[i + k] && images[i + k].pret) { im = images[i + k]; break; }
      }
    }
    if (!im || !im.pret || (!force && im === dessiner.im)) return;
    dessiner.im = im; derniere = i;
    var W = toile.width, H = toile.height, c = cadrage(progression);
    var s = Math.min(W / im.naturalWidth, H / im.naturalHeight) * c[0];
    var w = im.naturalWidth * s, h = im.naturalHeight * s;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(im, (W - w) / 2 + c[1] * W, (H - h) / 2 + c[2] * H, w, h);
  }

  var barre = $("#progression"), liens = $$("#nav a");
  var sections = liens.map(function (a) { return $(a.getAttribute("href")); });
  function auDefilement() {
    var y = window.scrollY, vh = window.innerHeight;
    var doc = document.documentElement.scrollHeight - vh;
    barre.style.width = (doc > 0 ? y / doc * 100 : 0) + "%";
    var course = heros.offsetHeight - vh;
    var p = bornes(y / course, 0, 1);
    indexCourant = Math.round(p * (NB - 1));
    progression = p;
    dessiner(true);
    temps.forEach(function (el) {
      var de = +el.dataset.de, a = +el.dataset.a, f = (a - de) * .25, o;
      if (el.dataset.depart && p <= de + f) o = 1;
      else o = bornes(Math.min((p - de) / f, (a - p) / f), 0, 1);
      el.style.opacity = o.toFixed(3);
      var dy = (1 - o) * 30 * (p < (de + a) / 2 ? 1 : -1);
      var base = el.classList.contains("gauche") || el.classList.contains("droite") ? (window.innerWidth > 760 ? "translateY(-50%) " : "") : "";
      el.style.transform = base + "translateY(" + dy.toFixed(1) + "px)";
    });
    indice.style.opacity = bornes(1 - p * 12, 0, 1).toFixed(3);
    var courant = -1;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < vh * .4) courant = i; });
    liens.forEach(function (a, i) { a.setAttribute("aria-current", i === courant ? "true" : "false"); });
  }
  var attente = false;
  window.addEventListener("scroll", function () {
    if (attente) return; attente = true;
    requestAnimationFrame(function () { attente = false; auDefilement(); });
  }, { passive: true });
  window.addEventListener("resize", function () { charger(); dimensionner(); auDefilement(); dessiner(true); });
  charger(); dimensionner(); auDefilement();

  /* -------------------------------------------- apparition + compteurs */
  function compter(el) {
    var cible = parseFloat(el.dataset.compte), dec = +(el.dataset.dec || 0), t0 = null;
    var format = function (v) {
      var s = v.toFixed(dec).replace(".", ",");
      return el.dataset.milliers ? Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : s;
    };
    if (reduit) { el.textContent = format(cible); return; }
    (function pas(t) {
      if (!t0) t0 = t;
      var u = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - u, 3);
      el.textContent = format(cible * e);
      if (u < 1) requestAnimationFrame(pas);
    })(performance.now());
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("vu");
        $$("[data-compte]", e.target).forEach(compter);
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    $$(".apparait").forEach(function (el) { io.observe(el); });
  } else $$(".apparait").forEach(function (el) { el.classList.add("vu"); });

  /* ---------------------------------------------- commandes du boîtier */
  var POS = {"dessus": [[23.5, 64.29], [30.2, 64.01], [24.03, 46.35], [27.93, 37], [22.73, 35.44], [20.79, 45.31], [21.45, 27.41], [36.72, 37.77], [46.77, 38.1], [61.02, 39.4], [60.49, 23.12], [68.36, 45.86]], "dos": [[44.48, 61.3], [45.54, 19.61], [40.19, 13.48], [27.86, 35.51], [67.28, 43.98], [74, 43.98], [67.25, 49.35], [70.8, 62.35], [73.96, 49.35], [67.11, 75.15], [70.66, 77.79], [74.25, 75.15], [76.25, 62.3]], "avant": [[26.1, 33.25], [37.48, 37.5], [54.36, 20.81], [71.7, 65.78], [71.63, 72.54], [72.09, 50.61], [54.81, 64.78]]};
  var CMD = {
    dessus: [
      ["Déclencheur", "À mi-course : l'appareil fait la mise au point (et la mémorise en AF-S). Jusqu'au bout : il prend la photo.", "Garde le doigt à mi-course pour recadrer sans perdre la mise au point."],
      ["Commutateur marche-arrêt", "Autour du déclencheur : il allume et éteint l'appareil.", "Éteins avant de changer d'objectif, de batterie ou de carte."],
      ["Commande d'enregistrement vidéo", "Démarre et arrête une vidéo.", "Le témoin d'enregistrement et le cadre REC rouge (réglage g19) confirment que ça tourne."],
      ["Commande de sensibilité (ISO)", "Maintiens-la et tourne la molette principale pour la sensibilité ; la molette secondaire active ou coupe ISO AUTO.", "ISO AUTO avec une limite (ex. 6400) : la photo reste nette quand la lumière baisse."],
      ["Correction d'exposition (±)", "Maintiens-la et tourne une molette pour éclaircir (+) ou assombrir (−) : de −5 à +5 IL en photo.", "Neige ou plage : +1. Sujet sur fond noir : −1."],
      ["Commande Picture Control", "Ouvre directement le choix du style d'image : Standard, Portrait, Paysage, Monochrome, Creative…", "Voir le chapitre Couleur."],
      ["Molette de commande principale", "Vitesse en S et M, décalage du programme en P, valeur du réglage quand tu maintiens une touche.", "La molette « du pouce » : celle que tu tournes le plus."],
      ["Sélecteur de mode", "AUTO, P, S, A, M, U1 à U3 (tes réglages enregistrés) et SCN (modes scène).", "Voir le chapitre Modes."],
      ["Sélecteur photo/vidéo", "Bascule l'appareil en photo ou en vidéo : menus, affichage et réglages suivent.", "Rien ne filme ? Vérifie d'abord ce sélecteur."],
      ["Griffe flash", "Pour un flash optionnel et certains accessoires.", "Un flash orientable vers le plafond change tout en intérieur."],
      ["Réglage dioptrique", "Adapte la netteté du viseur à ta vue.", "À régler une fois, le premier jour."],
      ["Microphone stéréo", "Le son intégré des vidéos.", "Ne le couvre pas. Pour mieux, une prise micro externe existe."]
    ],
    dos: [
      ["Moniteur tactile orientable", "Visée, menus, visualisation. Il se touche : mise au point et déclenchement au doigt.", "Orienté vers l'avant pour les autoportraits et le vlog."],
      ["Viseur électronique", "Écran OLED dans l'œilleton : tu vois exactement la photo avant de la prendre.", "En plein soleil, le viseur est bien plus lisible que l'écran."],
      ["Détecteur oculaire", "Bascule automatiquement vers le viseur quand ton œil approche.", "S'il ne bascule plus, nettoie-le à la soufflette."],
      ["Commande du mode moniteur", "Sélection automatique, viseur seul, écran seul…", "Écran noir alors que l'appareil est allumé ? Appuie ici."],
      ["Commande DISP", "Fait défiler les affichages d'informations.", "Un affichage avec horizon virtuel aide à garder l'horizon droit."],
      ["Commande AE-L/AF-L", "Mémorise l'exposition et/ou la mise au point. En visualisation, protège une image contre l'effacement.", "En contre-jour : mémorise sur le visage, puis recadre."],
      ["Commande i", "Le menu i : les 12 réglages les plus utilisés.", "Personnalisable (réglage f1)."],
      ["Sélecteur multidirectionnel et OK", "Navigue dans les menus et déplace le point AF ; OK valide.", "Avec plusieurs visages détectés, les flèches passent de l'un à l'autre."],
      ["Commande MENU", "Tous les menus : visualisation, photo, vidéo, réglages perso, configuration, réseau.", "Le menu personnalisé garde tes rubriques favorites."],
      ["Commande de visualisation", "Revoir les photos et vidéos.", "Mi-course sur le déclencheur pour revenir aussitôt à la prise de vue."],
      ["Loupe arrière / imagettes / aide", "Dézoome, affiche des imagettes ; sur un menu, affiche l'aide de la rubrique.", "L'aide intégrée explique chaque rubrique sans sortir le manuel."],
      ["Loupe avant", "Zoome dans l'image en visualisation, et dans la visée pour vérifier la netteté.", "Zoome sur l'œil après un portrait : c'est là que se juge la netteté."],
      ["Mode de déclenchement / retardateur", "Maintiens-la et tourne la molette principale : vue par vue, rafales, C15/C30, retardateur.", "Voir le chapitre Rafale."]
    ],
    avant: [
      ["Molette de commande secondaire", "Ouverture en A et M ; second réglage quand tu maintiens une touche.", "La molette « de l'index », juste derrière le déclencheur."],
      ["Illuminateur d'assistance AF", "Aide la mise au point dans le noir ; témoin du retardateur et d'atténuation des yeux rouges.", "Coupe-le pour les animaux et les oiseaux (réglage a11), comme le conseille le manuel."],
      ["Flash intégré", "Flash à ouverture manuelle, nombre guide d'environ 7 à 100 ISO.", "Pour déboucher un visage à contre-jour, baisse sa puissance (correction du flash)."],
      ["Commande Fn1", "Par défaut : balance des blancs (maintenir + molette).", "Rôle modifiable (réglage perso f2)."],
      ["Commande Fn2", "Par défaut : mode et zone de mise au point (maintenir + molette).", "Le raccourci le plus utile pour passer d'AF-S à AF-C."],
      ["Déverrouillage de l'objectif", "Maintiens-le pour tourner et retirer l'objectif.", "Change d'objectif tête en bas, à l'abri du vent."],
      ["Monture Z et capteur", "Le capteur DX de 20,9 Mpx, derrière la monture.", "Ne le touche jamais : le manuel décrit le seul nettoyage autorisé."]
    ]
  };
  var vue = "dessus", sel = 0, zone = $("#points");
  function montrer(i) {
    var l = CMD[vue]; sel = (i + l.length) % l.length;
    $("#cmd-num").textContent = (sel + 1) + " / " + l.length;
    $("#cmd-nom").textContent = l[sel][0];
    $("#cmd-role").textContent = l[sel][1];
    $("#cmd-astuce").innerHTML = "<strong>Astuce · </strong>" + echapper(l[sel][2]);
    $$(".pt", zone).forEach(function (b, j) { b.classList.toggle("actif", j === sel); b.setAttribute("aria-pressed", j === sel ? "true" : "false"); });
  }
  function changerVue(v) {
    vue = v;
    $("#vue-img").src = "img/" + v + ".webp";
    zone.innerHTML = POS[v].map(function (p, i) {
      return '<button type="button" class="pt" style="left:' + p[0] + '%;top:' + p[1] + '%" aria-label="' + echapper((i + 1) + " : " + CMD[v][i][0]) + '">' + (i + 1) + "</button>";
    }).join("");
    $$(".pt", zone).forEach(function (b, i) { b.addEventListener("click", function () { montrer(i); }); });
    montrer(0);
  }
  $$("[data-vue]").forEach(function (b) {
    b.addEventListener("click", function () {
      $$("[data-vue]").forEach(function (x) { x.setAttribute("aria-selected", x === b ? "true" : "false"); });
      changerVue(b.dataset.vue);
    });
  });
  $("#cmd-prec").addEventListener("click", function () { montrer(sel - 1); });
  $("#cmd-suiv").addEventListener("click", function () { montrer(sel + 1); });
  changerVue("dessus");

  /* --------------------------------------------- premiers réglages */
  var cases = $$("#liste-reglages input");
  function compte() {
    var n = cases.filter(function (c) { return c.checked; }).length;
    $("#compte-reglages").textContent = n === cases.length ? "Ton appareil est prêt ✓" : n + " / " + cases.length;
    $("#rail-reglages").style.width = (n / cases.length * 100) + "%";
  }
  cases.forEach(function (c) {
    c.checked = lire("gz-" + c.dataset.id) === "1";
    c.addEventListener("change", function () { ecrire("gz-" + c.dataset.id, c.checked ? "1" : "0"); compte(); });
  });
  compte();

  /* ---------------------------------------------- simulateur photo */
  var OUV = [1.8, 2.8, 4, 5.6, 8, 11, 16, 22];
  var VIT = [1 / 4000, 1 / 2000, 1 / 1000, 1 / 500, 1 / 250, 1 / 125, 1 / 60, 1 / 30, 1 / 15, 1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8, 15, 30];
  var ISO = [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200];
  var simF = $("#sim-floue"), simN = $("#sim-nette"), simP = $("#photo-sim"), voile = $("#sim-voile"), grain = $("#sim-grain"), gx = grain.getContext("2d");
  [simF, simN].forEach(function (c) { c.style.backgroundImage = "url(photos/portrait.jpg)"; });
  simN.style.setProperty("--cx", "53%"); simN.style.setProperty("--cy", "52%"); simN.style.setProperty("--mx", "30%"); simN.style.setProperty("--my", "62%");
  var vitesseTxt = function (t) { return t >= 1 ? t + " s" : "1/" + Math.round(1 / t) + " s"; };
  function remplissage(r) { r.style.setProperty("--p", ((r.value - r.min) / (r.max - r.min) * 100) + "%"); }

  var iris = $("#iris"), ix = iris.getContext("2d");
  function dessinerIris(N) {
    var w = iris.width, c = w / 2, R = w * .46, r = R * bornes(1.8 / N * .92, .08, .92);
    ix.clearRect(0, 0, w, w);
    var g = ix.createRadialGradient(c, c, 0, c, c, R);
    g.addColorStop(0, "#1b2238"); g.addColorStop(1, "#05060a");
    ix.fillStyle = g; ix.beginPath(); ix.arc(c, c, R, 0, Math.PI * 2); ix.fill();
    ix.save(); ix.beginPath(); ix.arc(c, c, R, 0, Math.PI * 2); ix.clip();
    var n = 7, rot = (1 - r / R) * .9;
    for (var k = 0; k < n; k++) {
      var a = k / n * Math.PI * 2 + rot;
      ix.fillStyle = k % 2 ? "#1d1d22" : "#24242a";
      ix.beginPath();
      ix.moveTo(c + Math.cos(a) * r, c + Math.sin(a) * r);
      ix.lineTo(c + Math.cos(a + Math.PI * 2 / n) * r, c + Math.sin(a + Math.PI * 2 / n) * r);
      ix.lineTo(c + Math.cos(a + Math.PI * 2 / n + .9) * R * 1.6, c + Math.sin(a + Math.PI * 2 / n + .9) * R * 1.6);
      ix.lineTo(c + Math.cos(a + .9) * R * 1.6, c + Math.sin(a + .9) * R * 1.6);
      ix.closePath(); ix.fill();
      ix.strokeStyle = "rgba(255,255,255,.08)"; ix.stroke();
    }
    ix.restore();
    ix.strokeStyle = "#3a3a42"; ix.lineWidth = 4; ix.beginPath(); ix.arc(c, c, R, 0, Math.PI * 2); ix.stroke();
  }
  function bruit(force) {
    var im = gx.createImageData(grain.width, grain.height), d = im.data;
    for (var i = 0; i < d.length; i += 4) { var v = 128 + (Math.random() - .5) * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    gx.putImageData(im, 0, 0);
    grain.style.opacity = force.toFixed(2);
  }
  function simuler() {
    ["#sim-ouverture", "#sim-vitesse", "#sim-iso"].forEach(function (s) { remplissage($(s)); });
    var N = OUV[+$("#sim-ouverture").value], t = VIT[+$("#sim-vitesse").value], iso = ISO[+$("#sim-iso").value], ev = +$("#sim-lumiere").value;
    $("#o-ouverture").textContent = "f/" + N; $("#o-vitesse").textContent = vitesseTxt(t); $("#o-iso").textContent = iso;
    var ecart = ev - (Math.log2(N * N / t) - Math.log2(iso / 100));
    var largeur = simP.clientWidth || 800;
    var flou = Math.max(0, 16 / N - 1.4) * largeur / 420;
    var bouge = t >= 1 / 30 ? Math.min(14, t * 30) * largeur / 700 : 0;
    var lum = Math.pow(2, bornes(ecart, -5, 5));
    var fil = "brightness(" + bornes(lum, .04, 3.2).toFixed(3) + ")" + (bouge ? " blur(" + bouge.toFixed(1) + "px)" : "");
    [simF, simN].forEach(function (c, k) { c.style.filter = (k === 0 ? "blur(" + flou.toFixed(1) + "px) " : "") + fil; });
    voile.style.background = ecart > 1.5 ? "rgba(255,255,255," + bornes((ecart - 1.5) / 3, 0, .9).toFixed(2) + ")" : "transparent";
    bruit(bornes((Math.log2(iso / 100) - 2) / 7, 0, .55));
    dessinerIris(N);
    $("#hud").innerHTML = "<span>f/" + N + "</span><span>" + vitesseTxt(t) + "</span><span>ISO " + iso + "</span><span>" + (ecart >= 0 ? "+" : "−") + Math.abs(ecart).toFixed(1) + " IL</span>";
    $("#curseur-expo").style.left = (50 + bornes(ecart, -3, 3) / 3 * 50) + "%";
    var m = [];
    m.push(ecart > 1 ? "Trop clair : ferme le diaphragme, accélère, ou baisse les ISO." : ecart < -1 ? "Trop sombre : ouvre, ralentis, ou monte les ISO." : "Exposition correcte.");
    if (t >= 1 / 30) m.push("À " + vitesseTxt(t) + ", flou de bougé à main levée.");
    if (iso >= 6400) m.push("Le grain devient visible.");
    if (N <= 2.8) m.push("Fond bien flou : effet portrait.");
    if (N >= 11) m.push("Tout est net, du premier plan au fond.");
    $("#verdict").textContent = m.join(" ");
  }
  ["#sim-ouverture", "#sim-vitesse", "#sim-iso", "#sim-lumiere"].forEach(function (s) { $(s).addEventListener("input", simuler); });
  window.addEventListener("resize", simuler);
  simuler();

  /* --------------------------------------------------------- modes */
  var MODES = [
    ["AUTO", "Cadrer et déclencher.", "Vitesse, ouverture, sensibilité, balance des blancs et plusieurs autres réglages.", "Quand tu prêtes l'appareil, ou pour une photo qui ne peut pas attendre."],
    ["P", "Balance des blancs, sensibilité, correction, la plupart des menus. Décalage du programme à la molette principale.", "Le couple vitesse/ouverture.", "Les instantanés, quand tu n'as pas le temps de régler."],
    ["S", "La vitesse (molette principale), de 1/4000 s à 30 s.", "L'ouverture.", "Figer l'action (1/1000 s) ou créer un filé (1/30 s et plus lent)."],
    ["A", "L'ouverture (molette secondaire).", "La vitesse.", "Portrait (petit chiffre = fond flou), paysage (f/8 = tout net). Le plus polyvalent."],
    ["M", "Vitesse ET ouverture, guidé par l'indicateur d'exposition. Poses B et T, jusqu'à 900 s avec la plage étendue (d7).", "Rien, sauf la sensibilité si ISO AUTO est actif.", "Nuit sur trépied, studio, feux d'artifice."],
    ["U1-U3", "Tout ce que tu as enregistré : mode, vitesse, ouverture, correction, menus.", "Il te rend ta configuration d'un tour de molette.", "Tes situations récurrentes."],
    ["SCN", "Choisir la scène : portrait, paysage, enfants, sport, gros plan, nuit, fête, plage/neige, coucher de soleil, animaux, bougie, aliments…", "Les réglages adaptés à la scène.", "Débuter dans une situation précise, avant de passer à A ou S."]
  ];
  var zm = $("#choix-modes");
  zm.innerHTML = MODES.map(function (m, i) { return '<button class="puce" role="tab" aria-selected="' + (i === 3) + '" data-i="' + i + '">' + m[0] + "</button>"; }).join("");
  function mode(i) {
    var m = MODES[i];
    $$("button", zm).forEach(function (b, j) { b.setAttribute("aria-selected", j === i ? "true" : "false"); });
    $("#detail-mode").innerHTML = '<div class="reponse" style="grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr))"><div><small>Tu choisis</small>' + echapper(m[1]) + '</div><div><small>L\'appareil choisit</small>' + echapper(m[2]) + '</div><div><small>Idéal pour</small>' + echapper(m[3]) + "</div></div>";
  }
  $$("button", zm).forEach(function (b) { b.addEventListener("click", function () { mode(+b.dataset.i); }); });
  mode(3);

  /* ------------------------------------------------- assistant AF */
  // zone : [type, x, y, l, h] en % de l'image
  var AF = [
    ["Portrait", "portrait", "AF-S (AF-C s'il bouge)", "AF zone automatique", "Personnes", "La détection encadre le visage puis l'œil. Avec plusieurs personnes, les flèches passent d'un visage à l'autre.", ["visage", 53, 52, 38, 70]],
    ["Enfants, animaux", "animal", "AF-C", "AF zone automatique", "Animaux (ou Personnes)", "AF-C suit la distance en continu. Pour les animaux, coupe l'illuminateur d'assistance AF (a11).", ["visage", 50, 45, 22, 30]],
    ["Sport", "sport", "AF-C", "AF zone dynamique (M)", "Personnes ou désactivée", "Le manuel recommande la zone dynamique M pour les déplacements imprévisibles, par exemple des joueurs de football.", ["dynamique", 50, 50, 8, 12]],
    ["Oiseaux", "oiseau", "AF-C", "AF zone dynamique (L)", "Oiseaux", "Le manuel recommande la zone dynamique L pour les sujets rapides difficiles à cadrer, comme les oiseaux. Coupe l'illuminateur AF.", ["dynamique-l", 50, 47, 8, 12]],
    ["Paysage", "paysage", "AF-S", "AF point sélectif", "Désactivée", "Tu places toi-même le point au tiers de la scène : avec f/8, tout reste net.", ["point", 60, 40, 7, 10]],
    ["Objet, produit", "img/trois-quarts.webp", "AF-S", "AF zone réduite", "Désactivée", "Le manuel recommande la zone réduite pour les sujets immobiles et la photo de produits : mise au point très précise.", ["reduite", 50, 50, 4, 6]],
    ["Vlog, vidéo", "portrait", "AF-F", "AF zone large ou automatique", "Personnes", "AF-F suit en permanence en vidéo. Le mode présentation produit bascule le point sur l'objet que tu montres.", ["large", 53, 52, 50, 80]]
  ];
  var za = $("#choix-af"), svg = $("#af-svg"), afImg = $("#af-img");
  za.innerHTML = AF.map(function (a, i) { return '<button class="puce" role="tab" aria-selected="' + (i === 0) + '" data-i="' + i + '">' + echapper(a[0]) + "</button>"; }).join("");
  function cadre(z) {
    var t = z[0], x = z[1] * 3, y = z[2] * 2, w = z[3] * 3, h = z[4] * 2, s = "";
    var coin = function (x0, y0, w0, h0, c) {
      var L = Math.min(w0, h0) * .22;
      return '<path d="M' + x0 + ' ' + (y0 + L) + 'V' + y0 + 'H' + (x0 + L) + 'M' + (x0 + w0 - L) + ' ' + y0 + 'H' + (x0 + w0) + 'V' + (y0 + L) + 'M' + (x0 + w0) + ' ' + (y0 + h0 - L) + 'V' + (y0 + h0) + 'H' + (x0 + w0 - L) + 'M' + (x0 + L) + ' ' + (y0 + h0) + 'H' + x0 + 'V' + (y0 + h0 - L) + '" fill="none" stroke="' + c + '" stroke-width="1.6" vector-effect="non-scaling-stroke"/>';
    };
    if (t === "visage" || t === "large") {
      s += coin(x - w / 2, y - h / 2, w, h, t === "large" ? "#fff" : "#7be39a");
      if (t === "visage") s += '<rect x="' + (x - w * .3) + '" y="' + (y - h * .05) + '" width="' + w * .18 + '" height="' + h * .1 + '" fill="none" stroke="#7be39a" stroke-width="1.6" vector-effect="non-scaling-stroke"/>';
    } else if (t.indexOf("dynamique") === 0) {
      var n = t === "dynamique-l" ? 3 : 2;
      for (var i = -n; i <= n; i++) for (var j = -n; j <= n; j++) if (i || j) s += '<circle cx="' + (x + i * w * .7) + '" cy="' + (y + j * h * .7) + '" r=".9" fill="rgba(255,255,255,.75)"/>';
      s += '<rect x="' + (x - w / 2) + '" y="' + (y - h / 2) + '" width="' + w + '" height="' + h + '" fill="none" stroke="#7be39a" stroke-width="1.8" vector-effect="non-scaling-stroke"/>';
    } else {
      s += '<rect x="' + (x - w / 2) + '" y="' + (y - h / 2) + '" width="' + w + '" height="' + h + '" fill="none" stroke="#7be39a" stroke-width="1.8" vector-effect="non-scaling-stroke"/>';
    }
    svg.innerHTML = s;
  }
  function af(i) {
    var a = AF[i];
    $$("button", za).forEach(function (b, j) { b.setAttribute("aria-selected", j === i ? "true" : "false"); });
    afImg.src = a[1].indexOf("/") > -1 ? a[1] : "photos/" + a[1] + ".jpg";
    $("#reponse-af").innerHTML = '<div><small>Mode de mise au point</small><strong>' + echapper(a[2]) + '</strong></div><div><small>Zone AF</small><strong>' + echapper(a[3]) + '</strong></div><div><small>Détection du sujet</small><strong>' + echapper(a[4]) + "</strong></div>";
    $("#pourquoi-af").textContent = a[5];
    cadre(a[6]);
  }
  $$("button", za).forEach(function (b) { b.addEventListener("click", function () { af(+b.dataset.i); }); });
  af(0);

  /* ------------------------------------------ balance des blancs */
  function kelvin(k) {
    var t = k / 100, r, g, b;
    r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = t >= 66 ? 255 : (t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307);
    return [r, g, b].map(function (v) { return bornes(v, 1, 255); });
  }
  var bdb = $("#bdb"), bc = $("#bdb-canvas"), bx = bc.getContext("2d"), source = null;
  var photoBdb = new Image();
  photoBdb.onload = function () {
    var c = document.createElement("canvas"); c.width = bc.width; c.height = bc.height;
    var g = c.getContext("2d"), s = Math.max(c.width / photoBdb.width, c.height / photoBdb.height);
    g.drawImage(photoBdb, (c.width - photoBdb.width * s) / 2, (c.height - photoBdb.height * s) / 2, photoBdb.width * s, photoBdb.height * s);
    source = g.getImageData(0, 0, c.width, c.height); dessinerBdb();
  };
  photoBdb.src = "photos/paysage.jpg";
  function dessinerBdb() {
    var reglage = +bdb.value, scene = 3000;
    $("#o-bdb").textContent = reglage + " K"; remplissage(bdb);
    var etiquette = Math.abs(reglage - scene) <= 200 ? "Le blanc est blanc ✓" : reglage > scene ? "Trop chaud : dominante orangée" : "Trop froid : dominante bleue";
    $("#bdb-etiquette").textContent = etiquette;
    if (!source) return;
    var s = kelvin(scene), c = kelvin(reglage);
    var m = [0, 1, 2].map(function (i) { return s[i] / c[i]; });
    var mx = Math.max(m[0], m[1], m[2]); m = m.map(function (v) { return v / mx * 1.08; });
    var out = bx.createImageData(source.width, source.height), d = source.data, o = out.data;
    for (var i = 0; i < d.length; i += 4) { o[i] = d[i] * m[0]; o[i + 1] = d[i + 1] * m[1]; o[i + 2] = d[i + 2] * m[2]; o[i + 3] = 255; }
    bx.putImageData(out, 0, 0);
  }
  bdb.addEventListener("input", dessinerBdb);
  dessinerBdb();

  /* -------------------------------------------------- Picture Control */
  var STYLES = [
    ["Standard", "Équilibré. Le bon choix par défaut.", "none"],
    ["Neutre", "Traitement minimal, pour retoucher.", "contrast(.9) saturate(.82)"],
    ["Saturé", "Couleurs éclatantes.", "saturate(1.5) contrast(1.06)"],
    ["Paysage", "Bleus et verts intenses.", "saturate(1.32) contrast(1.1) hue-rotate(-6deg)"],
    ["Uniforme", "Un maximum de détails, des ombres aux hautes lumières.", "contrast(.76) saturate(.78) brightness(1.06)"],
    ["Monochrome", "Le noir et blanc classique (3 versions).", "grayscale(1) contrast(1.08)"],
    ["Creative · Sépia", "Un des 20 looks prêts à l'emploi.", "sepia(.85) contrast(1.05)"],
    ["Creative · Rêve", "Un des 20 looks prêts à l'emploi.", "brightness(1.12) contrast(.86) saturate(.9)"]
  ];
  $("#styles").innerHTML = STYLES.map(function (s) {
    return '<figure><img src="photos/paysage.jpg" alt="" loading="lazy" style="filter:' + s[2] + '"><figcaption><b>' + echapper(s[0]) + "</b>" + echapper(s[1]) + "</figcaption></figure>";
  }).join("");

  /* -------------------------------------------------------- rafale */
  var RAF = [
    ["Vue par vue", 1, "Une photo par appui."],
    ["Continu L", 5, "De 1 à 5 vps, au choix : enfants, animaux, scènes de vie."],
    ["Continu H", 5.6, "Jusqu'à 5,6 vps (9,7 en mode silencieux, hors RAW)."],
    ["Continu H (étendu)", 11, "Jusqu'à 11 vps (15 en silencieux, en JPEG) : le sport."],
    ["C15", 15, "15 vps avec prédéclenchement : l'appareil peut garder des images prises pendant l'appui à mi-course."],
    ["C30", 30, "30 vps avec prédéclenchement : l'instant imprévisible."],
    ["Retardateur", 0, "2, 5, 10 ou 20 s ; 1 à 9 vues. En 2 s sur trépied, ton doigt ne fait plus bouger l'appareil."]
  ];
  var zr = $("#choix-rafale"), anim = $("#rafale-anim"), fps = 1, minuterie = null;
  zr.innerHTML = RAF.map(function (r, i) { return '<button class="puce" role="tab" aria-selected="' + (i === 3) + '" data-i="' + i + '">' + echapper(r[0]) + "</button>"; }).join("");
  anim.innerHTML = new Array(31).join("<i></i>");
  var barres = $$("i", anim);
  function rafale(i) {
    var r = RAF[i]; fps = r[1];
    $$("button", zr).forEach(function (b, j) { b.setAttribute("aria-selected", j === i ? "true" : "false"); });
    $("#rafale-texte").textContent = r[2];
    if (minuterie) clearInterval(minuterie);
    barres.forEach(function (b) { b.classList.remove("on"); });
    if (reduit || !fps) { if (fps) barres.slice(0, Math.round(fps)).forEach(function (b) { b.classList.add("on"); }); return; }
    var k = 0;
    minuterie = setInterval(function () {
      if (k >= Math.ceil(fps) + Math.ceil(fps * .4)) { barres.forEach(function (b) { b.classList.remove("on"); }); k = 0; return; }
      if (k < Math.round(fps)) barres[k].classList.add("on");
      k++;
    }, 1000 / Math.max(fps, 1));
  }
  $$("button", zr).forEach(function (b) { b.addEventListener("click", function () { rafale(+b.dataset.i); }); });
  rafale(3);

  /* ------------------------------------------------------ recettes */
  var REC = [
    ["Portrait", "portrait", "A", "La plus petite valeur f/", "Auto (≥ 1/125 s)", "Auto, max 6400", "AF-S, zone auto + Personnes", "Picture Control Portrait", "Avec l'objectif du kit : zoome au maximum, rapproche-toi du sujet et éloigne-le du fond."],
    ["Sport", "sport", "S", "Auto", "1/1000 s", "Auto", "AF-C, zone dynamique (M)", "Continu H (étendu)", "Courtes rafales, en anticipant l'action plutôt qu'en la suivant."],
    ["Paysage", "paysage", "A", "f/8", "Auto", "100", "AF-S, point sélectif au tiers", "Picture Control Paysage", "L'horizon sur un tiers de l'image. Affiche l'horizon virtuel avec DISP."],
    ["Ville la nuit", "ville", "A", "Ouverture max", "Auto (≥ 1/30 s, objectif VR)", "Auto, max 12 800", "AF-S sur une zone éclairée", "VR : Normal", "Trois photos en rafale lente : garde la plus nette."],
    ["Pose longue", "pose-longue", "M", "f/8", "5 à 30 s (pose B au-delà)", "100", "Mise au point, puis MF", "Trépied + retardateur 2 s", "Sur trépied, beaucoup coupent la stabilisation : teste avec ton objectif."],
    ["Animaux", "animal", "S", "Auto", "1/500 s", "Auto", "AF-C, zone auto + Animaux", "Illuminateur AF coupé (a11)", "À hauteur de ses yeux : la photo change complètement."],
    ["Oiseaux en vol", "oiseau", "S", "Auto", "1/2000 s", "Auto", "AF-C, zone dynamique (L) + Oiseaux", "Continu H (étendu) ou C30", "Le prédéclenchement de C15/C30 rattrape l'envol vu trop tard."],
    ["Contre-jour", "contre-jour", "A", "f/4 à f/5.6", "Auto", "Auto", "AF-S, zone auto + Personnes", "D-Lighting actif Auto, +0,7 à +1 IL", "Ou le flash intégré à puissance réduite pour déboucher le visage."],
    ["Objet à vendre", "img/trois-quarts.webp", "A", "f/8", "Auto", "100", "AF-S, zone réduite", "Balance des blancs : pré-réglage manuel", "Trépied, fenêtre sur le côté, feuille blanche en réflecteur, retardateur 2 s."],
    ["Concert", "concert", "S", "Ouverture max", "1/250 s", "Auto, max 12 800", "AF-C, zone auto + Personnes", "Mode silencieux (sans flash)", "En RAW : la couleur des projecteurs se corrige bien mieux après."]
  ];
  var car = $("#carrousel");
  car.innerHTML = REC.map(function (r) {
    return '<article class="recette"><div class="image"><img src="' + (r[1].indexOf("/") > -1 ? r[1] : "photos/" + r[1] + ".jpg") + '" alt="" loading="lazy" onerror="this.src=\'img/trois-quarts.webp\'"><span>' + echapper(r[0]) + '</span></div><div class="corps"><dl><dt>Mode</dt><dd>' + echapper(r[2]) + "</dd><dt>Ouverture</dt><dd>" + echapper(r[3]) + "</dd><dt>Vitesse</dt><dd>" + echapper(r[4]) + "</dd><dt>ISO</dt><dd>" + echapper(r[5]) + "</dd><dt>Mise au point</dt><dd>" + echapper(r[6]) + "</dd><dt>En plus</dt><dd>" + echapper(r[7]) + '</dd></dl><p class="astuce">' + echapper(r[8]) + "</p></div></article>";
  }).join("");
  var pasCar = function () { var c = $(".recette", car); return c ? c.getBoundingClientRect().width + 16 : 300; };
  $("#rec-g").addEventListener("click", function () { car.scrollBy({ left: -pasCar(), behavior: reduit ? "auto" : "smooth" }); });
  $("#rec-d").addEventListener("click", function () { car.scrollBy({ left: pasCar(), behavior: reduit ? "auto" : "smooth" }); });

  /* ------------------------------------------------------ lexique */
  var LEX = [
    ["Ouverture (f/)", "Taille du trou de l'objectif. Petit chiffre = grande ouverture, plus de lumière, arrière-plan plus flou."],
    ["Vitesse d'obturation", "Durée d'exposition du capteur. 1/1000 s fige, 1 s laisse filer le mouvement."],
    ["ISO (sensibilité)", "Amplification du signal du capteur. Plus haut = plus clair mais plus de grain."],
    ["IL (indice de lumination)", "L'unité des écarts de lumière. +1 IL = deux fois plus de lumière."],
    ["Correction d'exposition", "Demander une photo plus claire (+) ou plus sombre (−) que ce qu'a calculé l'appareil."],
    ["RAW (NEF)", "Le fichier brut du capteur chez Nikon. Plus lourd, mais tout se rattrape à la retouche."],
    ["JPEG", "Fichier compressé, prêt à partager. Les choix de couleur sont figés."],
    ["HEIF", "Format compressé plus moderne que le JPEG, plus léger à qualité comparable."],
    ["Format DX", "Le capteur 23,5 × 15,7 mm de Nikon, équivalent APS-C : il « allonge » les focales d'environ 1,5×."],
    ["AF-S", "Autofocus ponctuel : fait le point une fois et le garde. Sujets immobiles."],
    ["AF-C", "Autofocus continu : suit le sujet qui bouge."],
    ["AF-F", "Autofocus permanent, propre à la vidéo."],
    ["Zone AF", "Où l'appareil cherche la netteté : un point, une zone, ou tout le cadre."],
    ["Détection du sujet", "L'appareil reconnaît personnes, animaux, oiseaux, véhicules ou avions, et vise leur œil ou leur avant."],
    ["Balance des blancs", "Correction de la couleur de la lumière pour qu'un blanc reste blanc."],
    ["Kelvin (K)", "Unité de température de couleur : 3000 K = lumière chaude, 8000 K = lumière froide."],
    ["Picture Control", "Le style d'image de Nikon : contraste, saturation, netteté, teinte."],
    ["D-Lighting actif", "Préserve les détails dans les ombres et les hautes lumières des scènes contrastées."],
    ["Mesure matricielle", "L'appareil évalue la lumière de toute l'image ; la mesure spot ne regarde qu'un petit cercle autour du point AF."],
    ["Histogramme", "La répartition des tons : tout à droite = blancs brûlés, tout à gauche = noirs bouchés."],
    ["VR", "La réduction de vibration (stabilisation) de l'objectif."],
    ["Poses B et T", "Poses longues en mode M : B tant que tu appuies, T entre deux appuis."],
    ["Prédéclenchement", "En C15/C30, l'appareil garde aussi des images prises pendant l'appui à mi-course."],
    ["N-Log / HLG", "Profils vidéo à grande dynamique : N-Log pour l'étalonnage, HLG pour un affichage HDR."],
    ["Monture Z", "Le système de fixation des objectifs Nikon hybrides."]
  ];
  var dl = $("#lexique-liste"), sansAccent = function (s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  function lexique(f) {
    f = sansAccent(f || "");
    var html = LEX.filter(function (l) { return !f || sansAccent(l[0] + " " + l[1]).indexOf(f) !== -1; })
      .map(function (l) { return "<div><dt>" + echapper(l[0]) + "</dt><dd>" + echapper(l[1]) + "</dd></div>"; }).join("");
    dl.innerHTML = html || "<div><dt>Aucun mot trouvé</dt><dd>Essaie un autre terme.</dd></div>";
  }
  $("#recherche-lexique").addEventListener("input", function (e) { lexique(e.target.value); });
  lexique("");

  /* -------------------------------------------------------- crédits */
  if (window.CREDITS) $("#credits").innerHTML = window.CREDITS.map(function (c) {
    return "<li>" + echapper(c.usage) + " : « " + echapper(c.titre.replace(/^File:/, "")) + " », " + echapper(c.auteur || "auteur inconnu") + ", " + (c.licence_url ? '<a href="' + echapper(c.licence_url) + '" rel="noopener">' + echapper(c.licence) + "</a>" : echapper(c.licence)) + ', via <a href="' + echapper(c.page) + '" rel="noopener">Wikimedia Commons</a>.</li>';
  }).join("");
})();
