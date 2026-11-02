/* Apprendre : simulateur d'exposition, sélecteur de mode, mise au point,
   balance des blancs, Picture Control, rafale, quiz. */
(function () {
  "use strict";
  var G = window.GZ, $ = G.$, $$ = G.$$, B = G.bornes;
  G.onglets($("#lecons"));

  /* -------------------------------------------------- 1. lumière */
  var OUV = [1.8, 2.8, 4, 5.6, 8, 11, 16, 22];
  var VIT = [1 / 4000, 1 / 2000, 1 / 1000, 1 / 500, 1 / 250, 1 / 125, 1 / 60, 1 / 30, 1 / 15, 1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8, 15, 30];
  var ISO = [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600];
  var simF = $("#sim-floue"), simN = $("#sim-nette"), voile = $("#sim-voile"), grain = $("#sim-grain"), gx = grain.getContext("2d");
  [simF, simN].forEach(function (c) { c.style.backgroundImage = "url(photos/m/portrait.webp)"; });
  var vit = function (t) { return t >= 1 ? t + " s" : "1/" + Math.round(1 / t) + " s"; };
  var iris = $("#iris"), ix = iris.getContext("2d");
  function dessinerIris(N) {
    var w = iris.width, c = w / 2, R = w * .46, r = R * B(1.8 / N * .92, .08, .92), n = 7, rot = (1 - r / R) * .9;
    ix.clearRect(0, 0, w, w);
    var g = ix.createRadialGradient(c, c, 0, c, c, R); g.addColorStop(0, "#2a3558"); g.addColorStop(1, "#06070c");
    ix.fillStyle = g; ix.beginPath(); ix.arc(c, c, R, 0, 7); ix.fill();
    ix.save(); ix.beginPath(); ix.arc(c, c, R, 0, 7); ix.clip();
    for (var k = 0; k < n; k++) {
      var a = k / n * Math.PI * 2 + rot;
      ix.fillStyle = k % 2 ? "#1f1f24" : "#2a2a30"; ix.beginPath();
      ix.moveTo(c + Math.cos(a) * r, c + Math.sin(a) * r);
      ix.lineTo(c + Math.cos(a + Math.PI * 2 / n) * r, c + Math.sin(a + Math.PI * 2 / n) * r);
      ix.lineTo(c + Math.cos(a + Math.PI * 2 / n + .9) * R * 1.6, c + Math.sin(a + Math.PI * 2 / n + .9) * R * 1.6);
      ix.lineTo(c + Math.cos(a + .9) * R * 1.6, c + Math.sin(a + .9) * R * 1.6);
      ix.closePath(); ix.fill();
    }
    ix.restore(); ix.strokeStyle = "#1d1d1f"; ix.lineWidth = 5; ix.beginPath(); ix.arc(c, c, R, 0, 7); ix.stroke();
  }
  function bruit(f) {
    var im = gx.createImageData(grain.width, grain.height), d = im.data;
    for (var i = 0; i < d.length; i += 4) { var v = 128 + (Math.random() - .5) * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    gx.putImageData(im, 0, 0); grain.style.opacity = f.toFixed(2);
  }
  function simuler() {
    ["#sim-ouverture", "#sim-vitesse", "#sim-iso"].forEach(function (s) { G.remplir($(s)); });
    var N = OUV[+$("#sim-ouverture").value], t = VIT[+$("#sim-vitesse").value], iso = ISO[+$("#sim-iso").value], ev = +$("#sim-lumiere").value;
    $("#o-ouverture").textContent = "f/" + N; $("#o-vitesse").textContent = vit(t); $("#o-iso").textContent = iso + " ISO";
    var ecart = ev - (Math.log2(N * N / t) - Math.log2(iso / 100));
    var larg = $(".photo-sim").clientWidth || 700;
    var flou = Math.max(0, 16 / N - 1.4) * larg / 420, bouge = t >= 1 / 30 ? Math.min(14, t * 30) * larg / 700 : 0;
    var fil = "brightness(" + B(Math.pow(2, B(ecart, -5, 5)), .04, 3.2).toFixed(3) + ")" + (bouge ? " blur(" + bouge.toFixed(1) + "px)" : "");
    simF.style.filter = "blur(" + flou.toFixed(1) + "px) " + fil; simN.style.filter = fil;
    voile.style.background = ecart > 1.5 ? "rgba(255,255,255," + B((ecart - 1.5) / 3, 0, .9).toFixed(2) + ")" : "transparent";
    bruit(B((Math.log2(iso / 100) - 2) / 7, 0, .55)); dessinerIris(N);
    $("#hud").innerHTML = "<span>f/" + N + "</span><span>" + vit(t) + "</span><span>ISO " + iso + "</span>";
    $("#curseur").style.left = (50 + B(ecart, -3, 3) / 3 * 50) + "%";
    var m = [ecart > 1 ? "Trop clair : ferme le diaphragme, accélère ou baisse les ISO." : ecart < -1 ? "Trop sombre : ouvre, ralentis ou monte les ISO." : "Exposition correcte."];
    if (t >= 1 / 30) m.push("À " + vit(t) + ", la photo bouge à main levée.");
    if (iso >= 6400) m.push("Le grain devient visible.");
    if (N <= 2.8) m.push("Fond bien flou : effet portrait.");
    if (N >= 11) m.push("Tout est net, du premier plan au fond.");
    $("#verdict").textContent = m.join(" ");
  }
  ["#sim-ouverture", "#sim-vitesse", "#sim-iso", "#sim-lumiere"].forEach(function (s) { $(s).addEventListener("input", G.parImage(simuler)); });
  addEventListener("resize", simuler); simuler();
  G.quiz($("#quiz-lumiere"), [
    { q: "Tu veux un arrière-plan bien flou. Tu choisis…", opts: ["f/1.8", "f/16", "3200 ISO"], bon: 0, pourquoi: "Petit chiffre f/ = grande ouverture = fond flou." },
    { q: "Ta photo d'un enfant qui court est floue. Tu…", opts: ["passes à 1/1000 s", "fermes à f/16", "baisses les ISO"], bon: 0, pourquoi: "Une vitesse rapide fige le mouvement." },
    { q: "Monter les ISO, c'est…", opts: ["plus clair, mais plus de grain", "plus sombre", "plus de flou d'arrière-plan"], bon: 0, pourquoi: "La sensibilité éclaircit l'image au prix du « bruit »." }
  ], "gd8-quiz-lumiere");

  /* ---------------------------------------------------- 2. modes */
  var MODES = [
    ["P", "Balance des blancs, sensibilité, correction et la plupart des menus.", "Le couple vitesse/ouverture (modifiable avec la molette principale : décalage du programme).", "Les instantanés."],
    ["S", "La vitesse, de 1/8000 s à 30 s (molette principale).", "L'ouverture.", "Figer l'action (1/1000 s) ou créer un filé (1/30 s et plus lent)."],
    ["A", "L'ouverture (molette secondaire).", "La vitesse.", "Portrait (fond flou), paysage (f/8, tout net). Le plus polyvalent."],
    ["M", "Vitesse (molette principale) et ouverture (molette secondaire), guidé par l'indicateur d'exposition. Pose B.", "Rien, sauf la sensibilité si le contrôle de la sensibilité auto est activé.", "Nuit sur trépied, studio, feux d'artifice."]
  ];
  var svg = $("#molette"), sel = 2, n = MODES.length, angle = 0, NS = "http://www.w3.org/2000/svg";
  var crans = ""; for (var k = 0; k < 72; k++) { var a = k / 72 * Math.PI * 2; crans += '<line x1="' + (120 + Math.cos(a) * 104) + '" y1="' + (120 + Math.sin(a) * 104) + '" x2="' + (120 + Math.cos(a) * 112) + '" y2="' + (120 + Math.sin(a) * 112) + '" stroke="#3a3a40" stroke-width="2"/>'; }
  svg.innerHTML = '<defs><radialGradient id="mg" cx=".4" cy=".35"><stop offset="0" stop-color="#4a4a52"/><stop offset="1" stop-color="#151518"/></radialGradient></defs><circle cx="120" cy="120" r="116" fill="#1d1d1f"/><g class="disque">' + crans + '<circle cx="120" cy="120" r="100" fill="url(#mg)"/>' +
    MODES.map(function (m, i) { var a = i / n * Math.PI * 2 - Math.PI / 2; return '<text data-i="' + i + '" x="' + (120 + Math.cos(a) * 72) + '" y="' + (120 + Math.sin(a) * 72) + '" fill="#fff" font-family="Inter, sans-serif" font-weight="800" font-size="' + (m[0].length > 2 ? 15 : 20) + '" text-anchor="middle" dominant-baseline="central" style="cursor:pointer">' + m[0] + "</text>"; }).join("") +
    '<circle cx="120" cy="120" r="30" fill="#111114" stroke="#2c2c31"/></g><path d="M120 2 l9 14 h-18z" fill="#ffcc00"/>';
  var disque = $(".disque", svg);
  function redresser() { $$("text", svg).forEach(function (t) { t.setAttribute("transform", "rotate(" + (-angle) + " " + t.getAttribute("x") + " " + t.getAttribute("y") + ")"); }); }
  function choisirMode(i, anim) {
    sel = (i + n) % n; var m = MODES[sel];
    var cible = -sel / n * 360, d = ((cible - angle) % 360 + 540) % 360 - 180; angle += d;
    disque.style.transition = anim === false ? "none" : "";
    disque.style.transform = "rotate(" + angle + "deg)"; redresser();
    $$("text", svg).forEach(function (t) { t.setAttribute("fill", +t.dataset.i === sel ? "#ffcc00" : "#fff"); });
    svg.setAttribute("aria-valuetext", m[0]);
    $("#mode-titre").textContent = m[0] === "A" ? "A · Priorité ouverture" : m[0] === "S" ? "S · Priorité vitesse" : m[0] === "P" ? "P · Auto programmé" : m[0] === "M" ? "M · Manuel" : m[0];
    $("#mode-detail").innerHTML = "<div><small>Tu choisis</small>" + G.echapper(m[1]) + "</div><div><small>L'appareil choisit</small>" + G.echapper(m[2]) + "</div><div><small>Idéal pour</small>" + G.echapper(m[3]) + "</div>";
  }
  $$("text", svg).forEach(function (t) { t.addEventListener("click", function () { choisirMode(+t.dataset.i); }); });
  svg.addEventListener("keydown", function (e) { if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); choisirMode(sel + 1); } if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); choisirMode(sel - 1); } });
  var tire = null;
  svg.addEventListener("pointerdown", function (e) { var r = svg.getBoundingClientRect(); tire = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, a0: Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)), ang: angle }; svg.setPointerCapture(e.pointerId); });
  svg.addEventListener("pointermove", function (e) { if (!tire) return; var a = Math.atan2(e.clientY - tire.cy, e.clientX - tire.cx); angle = tire.ang + (a - tire.a0) * 180 / Math.PI; disque.style.transition = "none"; disque.style.transform = "rotate(" + angle + "deg)"; redresser(); });
  svg.addEventListener("pointerup", function () { if (!tire) return; tire = null; var i = Math.round(-angle / 360 * n); choisirMode(((i % n) + n) % n); });
  choisirMode(2, false);
  G.quiz($("#quiz-modes"), [
    { q: "En mode A, tu choisis…", opts: ["l'ouverture", "la vitesse", "rien du tout"], bon: 0, pourquoi: "A = priorité ouverture : l'appareil règle la vitesse." },
    { q: "Pour figer un joueur de foot, le mode le plus direct est…", opts: ["S", "A", "P"], bon: 0, pourquoi: "En S, tu imposes la vitesse (1/1000 s par exemple)." },
    { q: "Sur le D800, pour changer de mode tu…", opts: ["maintiens MODE et tournes la molette principale", "tournes une molette de mode", "passes par le menu Configuration"], bon: 0, pourquoi: "Le D800 n'a pas de molette de mode : la commande MODE, à côté du déclencheur, et la molette principale." }
  ], "gd8-quiz-modes");

  /* --------------------------------------------------- 3. netteté */
  var AF = [
    ["Portrait", "portrait", "AF-S (AF-C s'il bouge)", "AF point sélectif", "Sur l'œil le plus proche", "Choisis le point avec le sélecteur multidirectionnel et pose-le sur l'œil. En AF zone automatique, l'appareil donne la priorité aux visages qu'il détecte.", ["point", 45, 42, 7, 10]],
    ["Enfants, animaux", "animal", "AF-C", "AF zone dynamique 21 points", "Le point sur la tête", "AF-C suit la distance en continu. Pour les animaux, coupe l'illuminateur d'assistance AF (a8).", ["dynamique", 50, 45, 8, 12]],
    ["Sport", "sport", "AF-C", "AF zone dynamique 21 points", "Le point sur le joueur", "Le manuel recommande la zone dynamique 21 points pour les déplacements imprévisibles, comme des joueurs de football.", ["dynamique", 50, 50, 8, 12]],
    ["Oiseaux", "oiseau", "AF-C", "AF zone dynamique 51 points", "Le point sur l'oiseau", "Le manuel recommande la zone dynamique 51 points pour les sujets rapides et difficiles à cadrer, comme les oiseaux.", ["dynamique-l", 50, 47, 8, 12]],
    ["Tennis", "sport", "AF-C", "Suivi 3D", "Le point sur le joueur", "Le manuel recommande le suivi 3D pour les sujets qui se déplacent de façon erratique d'un côté à l'autre, comme des joueurs de tennis.", ["dynamique", 50, 50, 8, 12]],
    ["Paysage", "paysage", "AF-S", "AF point sélectif", "Au tiers de la scène", "Place le point au tiers de la scène : avec f/8, tout reste net.", ["point", 60, 40, 7, 10]],
    ["Vidéo", "portrait", "AF-F (visée écran)", "AF priorité visage ou zone large", "Sur le visage", "En visée écran, l'autofocus est plus lent qu'au viseur. AF-F fait la mise au point en continu pendant que tu filmes.", ["large", 53, 52, 50, 80]]
  ];
  var za = $("#choix-af"), asvg = $("#af-svg"), aimg = $("#af-img");
  za.innerHTML = AF.map(function (a, i) { return '<button class="puce" type="button" aria-pressed="' + (i === 0) + '" data-i="' + i + '">' + G.echapper(a[0]) + "</button>"; }).join("");
  function cadreAF(z) {
    var t = z[0], x = z[1] * 3, y = z[2] * 2, w = z[3] * 3, h = z[4] * 2, s = "", c = "#7CFC9A";
    var coin = function (x0, y0, w0, h0, col) { var L = Math.min(w0, h0) * .22; return '<path d="M' + x0 + " " + (y0 + L) + "V" + y0 + "H" + (x0 + L) + "M" + (x0 + w0 - L) + " " + y0 + "H" + (x0 + w0) + "V" + (y0 + L) + "M" + (x0 + w0) + " " + (y0 + h0 - L) + "V" + (y0 + h0) + "H" + (x0 + w0 - L) + "M" + (x0 + L) + " " + (y0 + h0) + "H" + x0 + "V" + (y0 + h0 - L) + '" fill="none" stroke="' + col + '" stroke-width="2" vector-effect="non-scaling-stroke"/>'; };
    if (t === "visage" || t === "large") { s += coin(x - w / 2, y - h / 2, w, h, t === "large" ? "#fff" : c); if (t === "visage") s += '<rect x="' + (x - w * .3) + '" y="' + (y - h * .05) + '" width="' + w * .18 + '" height="' + h * .1 + '" fill="none" stroke="' + c + '" stroke-width="2" vector-effect="non-scaling-stroke"/>'; }
    else if (t.indexOf("dynamique") === 0) { var q = t === "dynamique-l" ? 3 : 2; for (var i = -q; i <= q; i++) for (var j = -q; j <= q; j++) if (i || j) s += '<circle cx="' + (x + i * w * .7) + '" cy="' + (y + j * h * .7) + '" r=".9" fill="rgba(255,255,255,.8)"/>'; s += '<rect x="' + (x - w / 2) + '" y="' + (y - h / 2) + '" width="' + w + '" height="' + h + '" fill="none" stroke="' + c + '" stroke-width="2" vector-effect="non-scaling-stroke"/>'; }
    else s += '<rect x="' + (x - w / 2) + '" y="' + (y - h / 2) + '" width="' + w + '" height="' + h + '" fill="none" stroke="' + c + '" stroke-width="2" vector-effect="non-scaling-stroke"/>';
    asvg.innerHTML = s;
  }
  function af(i) {
    var a = AF[i];
    $$("button", za).forEach(function (b, j) { b.setAttribute("aria-pressed", j === i ? "true" : "false"); });
    aimg.src = a[1].indexOf("/") > -1 ? a[1] : "photos/m/" + a[1] + ".webp";
    aimg.style.objectFit = a[1].indexOf("/") > -1 ? "contain" : "cover"; aimg.parentNode.style.background = a[1].indexOf("/") > -1 ? "radial-gradient(#fff,#e6e7eb)" : "#000";
    $("#reponse-af").innerHTML = "<div><small>Mode</small><strong>" + G.echapper(a[2]) + "</strong></div><div><small>Zone AF</small><strong>" + G.echapper(a[3]) + "</strong></div><div><small>Où viser</small><strong>" + G.echapper(a[4]) + "</strong></div>";
    $("#pourquoi-af").textContent = a[5]; cadreAF(a[6]);
  }
  $$("button", za).forEach(function (b) { b.addEventListener("click", function () { af(+b.dataset.i); }); });
  af(0);
  G.quiz($("#quiz-nettete"), [
    { q: "Ton sujet bouge. Quel mode de mise au point ?", opts: ["AF-C", "AF-S", "MF"], bon: 0, pourquoi: "AF-C suit la distance en continu." },
    { q: "Pour des oiseaux, le manuel conseille…", opts: ["AF zone dynamique 51 points", "AF point sélectif", "AF zone automatique"], bon: 0, pourquoi: "La grande zone dynamique rattrape un sujet rapide difficile à cadrer." },
    { q: "En AF-S, si ce n'est pas net, par défaut l'appareil…", opts: ["refuse de déclencher", "déclenche quand même", "passe en vidéo"], bon: 0, pourquoi: "AF-S donne la priorité à la mise au point." }
  ], "gd8-quiz-nettete");

  /* --------------------------------------------------- 4. couleur */
  function kelvin(k) {
    var t = k / 100, r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
    var g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    var b = t >= 66 ? 255 : (t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307);
    return [r, g, b].map(function (v) { return B(v, 1, 255); });
  }
  var bdb = $("#bdb"), bc = $("#bdb-canvas"), bx = bc.getContext("2d"), src = null, photo = new Image();
  photo.onload = function () { var c = document.createElement("canvas"); c.width = bc.width; c.height = bc.height; var g = c.getContext("2d"), s = Math.max(c.width / photo.width, c.height / photo.height); g.drawImage(photo, (c.width - photo.width * s) / 2, (c.height - photo.height * s) / 2, photo.width * s, photo.height * s); try { src = g.getImageData(0, 0, c.width, c.height); } catch (e) { src = null; bx.drawImage(c, 0, 0); } dessinerBdb(); };
  photo.src = "photos/m/paysage.webp";
  function dessinerBdb() {
    var v = +bdb.value; G.remplir(bdb); $("#o-bdb").textContent = v + " K";
    $("#bdb-etiq").textContent = Math.abs(v - 3000) <= 200 ? "Le blanc est blanc ✓" : v > 3000 ? "Trop chaud : dominante orangée" : "Trop froid : dominante bleue";
    $$("#prereglages button").forEach(function (b) { b.setAttribute("aria-pressed", +b.dataset.k === v ? "true" : "false"); });
    if (!src) return;
    var s = kelvin(3000), c = kelvin(v), m = [0, 1, 2].map(function (i) { return s[i] / c[i]; }), mx = Math.max(m[0], m[1], m[2]);
    m = m.map(function (x) { return x / mx * 1.08; });
    var out = bx.createImageData(src.width, src.height), d = src.data, o = out.data;
    for (var i = 0; i < d.length; i += 4) { o[i] = d[i] * m[0]; o[i + 1] = d[i + 1] * m[1]; o[i + 2] = d[i + 2] * m[2]; o[i + 3] = 255; }
    bx.putImageData(out, 0, 0);
  }
  var PRE = [["Incandescent", 3000], ["Fluorescent", 4200], ["Ensoleillé", 5200], ["Flash", 5400], ["Nuageux", 6000], ["Ombre", 8000]];
  $("#prereglages").innerHTML = PRE.map(function (p) { return '<button class="puce" type="button" data-k="' + p[1] + '">' + p[0] + " · " + p[1] + " K</button>"; }).join("");
  $$("#prereglages button").forEach(function (b) { b.addEventListener("click", function () { bdb.value = b.dataset.k; dessinerBdb(); }); });
  bdb.addEventListener("input", G.parImage(dessinerBdb)); dessinerBdb();
  var STY = [
    ["Standard", "none", "Traitement standard pour un résultat équilibré. Recommandé dans la plupart des situations."], ["Neutre", "contrast(.9) saturate(.82)", "Traitement minimal pour un résultat naturel, si tu retouches beaucoup ensuite."],
    ["Saturé", "saturate(1.5) contrast(1.06)", "Couleurs rehaussées, pour mettre en valeur les couleurs primaires."], ["Monochrome", "grayscale(1) contrast(1.08)", "Le noir et blanc."],
    ["Portrait", "saturate(.92) brightness(1.04) contrast(.95)", "Un rendu naturel et doux de la peau."], ["Paysage", "saturate(1.32) contrast(1.1) hue-rotate(-6deg)", "Paysages naturels et urbains éclatants."]
  ];
  $("#styles").innerHTML = STY.map(function (s, i) { return '<button type="button" aria-pressed="' + (i === 0) + '" data-i="' + i + '"><img src="photos/v/paysage.webp" alt="" loading="lazy" style="filter:' + s[1] + '"><span>' + s[0] + "</span></button>"; }).join("");
  function style(i) { $("#pc-img").style.filter = STY[i][1]; $("#pc-texte").textContent = STY[i][0] + " : " + STY[i][2]; $$("#styles button").forEach(function (b, j) { b.setAttribute("aria-pressed", j === i ? "true" : "false"); }); }
  $$("#styles button").forEach(function (b) { b.addEventListener("click", function () { style(+b.dataset.i); }); });
  style(0);
  G.quiz($("#quiz-couleur"), [
    { q: "Lumière d'ampoules chaudes (3000 K) : quelle balance des blancs ?", opts: ["Incandescent", "Ombre", "Nuageux"], bon: 0, pourquoi: "Incandescent correspond à environ 3000 K." },
    { q: "Tu veux beaucoup retoucher ensuite. Quel Picture Control ?", opts: ["Neutre", "Saturé", "Portrait"], bon: 0, pourquoi: "Le manuel le conseille pour les photos qui seront ensuite très retouchées." },
    { q: "À contre-jour, quelle fonction préserve les ombres ?", opts: ["D-Lighting actif", "Déclenchement discret", "Retardateur"], bon: 0, pourquoi: "Il préserve les détails des ombres et des hautes lumières." }
  ], "gd8-quiz-couleur");

  /* ---------------------------------------------------- 5. rafale */
  var RAF = [["S · Vue par vue", 1, "Une photo par appui sur le déclencheur."], ["CL · Continu basse vitesse", 2, "2 vps par défaut, de 1 à 4 vps au choix (réglage d2) : enfants, scènes de vie."], ["CH · Continu haute vitesse", 4, "4 vps en format FX ; 5 vps en zone d'image DX ou 1,2×, et 6 vps en DX avec la poignée MB-D12 alimentée autrement que par l'EN-EL15."], ["Q · Déclenchement discret", 1, "Comme vue par vue, mais le bruit du miroir est réduit."], ["MUP · Miroir relevé", 1, "Le miroir se relève d'abord, la photo vient au second appui : moins de vibrations au téléobjectif ou en gros plan, sur trépied."]];
  var zr = $("#choix-rafale"), anim = $("#rafale-anim"), minut = null;
  zr.innerHTML = RAF.map(function (r, i) { return '<button class="puce" type="button" aria-pressed="' + (i === 2) + '" data-i="' + i + '">' + r[0] + "</button>"; }).join("");
  anim.innerHTML = new Array(31).join("<i></i>");
  var barres = $$("i", anim);
  function rafale(i) {
    var r = RAF[i], fps = r[1];
    $$("button", zr).forEach(function (b, j) { b.setAttribute("aria-pressed", j === i ? "true" : "false"); });
    $("#rafale-texte").textContent = r[2];
    clearInterval(minut); barres.forEach(function (b) { b.classList.remove("on"); });
    if (!fps) return;
    if (G.reduit) { barres.slice(0, Math.round(fps)).forEach(function (b) { b.classList.add("on"); }); return; }
    var k = 0;
    minut = setInterval(function () { if (k >= Math.ceil(fps * 1.4)) { barres.forEach(function (b) { b.classList.remove("on"); }); k = 0; return; } if (k < Math.round(fps)) barres[k].classList.add("on"); k++; }, 1000 / Math.max(fps, 1));
  }
  $$("button", zr).forEach(function (b) { b.addEventListener("click", function () { rafale(+b.dataset.i); }); });
  rafale(2);
})();
