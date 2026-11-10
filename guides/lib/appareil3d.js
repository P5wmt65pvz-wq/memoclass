/* Appareils photo en 3D, construits ici en géométrie (aucun fichier de modèle).
   Unité : le centimètre. Proportions relevées sur les photos des guides
   (img/vrai/ et img/3d/ de chaque appareil). Les commandes sont des pièces
   séparées : elles tournent et s'enfoncent pour de vrai.
   three.js r160 (MIT), servi par le site. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from './three/addons/RoundedBoxGeometry.js';
import { toCreasedNormals, mergeGeometries } from './three/addons/BufferGeometryUtils.js';

/* ------------------------------------------------------------------ matières */
function grain(taille, force) {
  // carte de relief « similicuir » : bruit de grains, en carte normale
  const c = document.createElement('canvas'); c.width = c.height = taille;
  const g = c.getContext('2d'), h = new Float32Array(taille * taille);
  for (let k = 0; k < taille * taille * 0.9; k++) {
    const x = Math.random() * taille | 0, y = Math.random() * taille | 0, r = 1 + Math.random() * 2.2;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const d = Math.hypot(dx, dy); if (d > r) continue;
      const i = ((y + dy + taille) % taille) * taille + ((x + dx + taille) % taille);
      h[i] = Math.max(h[i], Math.cos(d / r * Math.PI / 2));
    }
  }
  const im = g.createImageData(taille, taille);
  for (let y = 0; y < taille; y++) for (let x = 0; x < taille; x++) {
    const i = y * taille + x;
    const dx = (h[y * taille + (x + 1) % taille] - h[y * taille + (x - 1 + taille) % taille]) * force;
    const dy = (h[((y + 1) % taille) * taille + x] - h[((y - 1 + taille) % taille) * taille + x]) * force;
    const n = 1 / Math.hypot(dx, dy, 1);
    im.data[i * 4] = (-dx * n * 0.5 + 0.5) * 255; im.data[i * 4 + 1] = (dy * n * 0.5 + 0.5) * 255;
    im.data[i * 4 + 2] = (n * 0.5 + 0.5) * 255; im.data[i * 4 + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3);
  return t;
}
function texte(dessin, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); dessin(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
const POLICE = '"Inter", "Helvetica Neue", Arial, sans-serif';
function matieres() {
  const cuir = grain(256, 3.2);
  return {
    corps: new THREE.MeshPhysicalMaterial({ color: 0x101113, roughness: 0.38, metalness: 0.05, clearcoat: 0.5, clearcoatRoughness: 0.28 }),
    cuir: new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.78, metalness: 0, normalMap: cuir, normalScale: new THREE.Vector2(0.9, 0.9) }),
    gomme: new THREE.MeshStandardMaterial({ color: 0x0d0d0e, roughness: 0.92, metalness: 0 }),
    bouton: new THREE.MeshPhysicalMaterial({ color: 0x18191b, roughness: 0.35, metalness: 0.1, clearcoat: 0.4 }),
    metal: new THREE.MeshStandardMaterial({ color: 0xd2d5da, roughness: 0.22, metalness: 1 }),
    metalSombre: new THREE.MeshStandardMaterial({ color: 0x3a3b3f, roughness: 0.3, metalness: 1 }),
    rouge: new THREE.MeshPhysicalMaterial({ color: 0xd3141c, roughness: 0.35, clearcoat: 0.6 }),
    verre: new THREE.MeshPhysicalMaterial({ color: 0x05070c, roughness: 0.04, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [180, 520] }),
    vitre: new THREE.MeshPhysicalMaterial({ color: 0x020203, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03 }),
  };
}

/* ------------------------------------------------------------------ formes */
function lisse(g, angle) { return toCreasedNormals(g, angle || Math.PI / 3); }
function boite(w, h, d, r, mat) {
  return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2, h / 2, d / 2) - 1e-4), mat);
}
// contour 2D (u, v) extrudé le long d'un axe, avec arrondi
function extrusion(points, profondeur, arrondi, mat, axe) {
  const s = new THREE.Shape();
  points.forEach((p, i) => {
    if (p.length === 4) s.quadraticCurveTo(p[0], p[1], p[2], p[3]);
    else if (i === 0) s.moveTo(p[0], p[1]); else s.lineTo(p[0], p[1]);
  });
  let g = new THREE.ExtrudeGeometry(s, { depth: profondeur - 2 * arrondi, bevelEnabled: true, bevelThickness: arrondi, bevelSize: arrondi, bevelOffset: -arrondi, bevelSegments: 5, curveSegments: 18 });
  g.translate(0, 0, arrondi);
  g = lisse(g, Math.PI / 4);
  const m = new THREE.Mesh(g, mat);
  if (axe === 'y') m.rotation.x = -Math.PI / 2;      // (u, v) = (x, -z), extrudé vers +y
  if (axe === 'x') m.rotation.y = Math.PI / 2;       // (u, v) = (-z, y), extrudé vers +x
  return m;
}
// profil donné en (z, y) : converti en (u, v) = (-z, y) pour une extrusion le long de x
function profilZ(pts) { return pts.map(p => p.length === 4 ? [-p[0], p[1], -p[2], p[3]] : [-p[0], p[1]]); }
// rétrécit vers le haut une pièce extrudée le long de x (bossage du viseur)
function effiler(m, x0, yBas, yHaut, k) {
  m.position.x = x0; m.updateMatrix(); m.geometry.applyMatrix4(m.matrix);
  m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); m.updateMatrix();
  const p = m.geometry.attributes.position; m.geometry.computeBoundingBox();
  const cx = (m.geometry.boundingBox.min.x + m.geometry.boundingBox.max.x) / 2;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), t = THREE.MathUtils.clamp((y - yBas) / (yHaut - yBas), 0, 1);
    p.setX(i, cx + (p.getX(i) - cx) * (1 - (1 - k) * t * t));
  }
  m.geometry = lisse(m.geometry.toNonIndexed ? m.geometry : m.geometry, Math.PI / 4);
  return m;
}
// molette crantée (axe y) : un cylindre et des stries
function molette(rayon, haut, stries, mat, matHaut) {
  const g = new THREE.Group();
  const c = new THREE.Mesh(new THREE.CylinderGeometry(rayon * 0.97, rayon * 0.97, haut, 64), mat); g.add(c);
  const geoS = new RoundedBoxGeometry(rayon * 0.09, haut * 0.86, rayon * 0.12, 2, rayon * 0.03);
  for (let i = 0; i < stries; i++) {
    const a = i / stries * Math.PI * 2, s = new THREE.Mesh(geoS, mat);
    s.position.set(Math.cos(a) * rayon * 0.985, 0, Math.sin(a) * rayon * 0.985); s.rotation.y = -a; g.add(s);
  }
  g.userData.molette = true;
  if (matHaut) { const t = new THREE.Mesh(new THREE.CircleGeometry(rayon * 0.95, 64), matHaut); t.rotation.x = -Math.PI / 2; t.position.y = haut / 2 + 0.002; g.add(t); }
  return g;
}
function bouton(rayon, haut, mat, label, couleur) {
  const g = new THREE.Group(); g.userData.appui = true;
  const geo = lisse(new THREE.CylinderGeometry(rayon, rayon * 1.02, haut, 40, 1), Math.PI / 3);
  const b = new THREE.Mesh(geo, mat); g.add(b);
  if (label) {
    const t = texte((x, w, h) => {
      x.fillStyle = x.strokeStyle = couleur || '#e8e8ea'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 12; x.lineCap = x.lineJoin = 'round';
      if (label[0] === '#') { icone(x, label.slice(1), w, h); return; }
      const fs = label.length > 3 ? 54 : label.length > 1 ? 70 : 110;
      x.font = (label === 'i' ? 'italic 800 ' : '700 ') + fs + 'px ' + (label === 'i' ? 'Georgia, serif' : POLICE);
      x.fillText(label, w / 2, h / 2 + 4);
    }, 256, 256);
    const p = new THREE.Mesh(new THREE.CircleGeometry(rayon * 0.9, 40), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.5, depthWrite: false }));
    p.rotation.set(-Math.PI / 2, 0, Math.PI); p.position.y = haut / 2 + 0.003; g.add(p);
  }
  return g;
}
function icone(x, n, w, h) {
  x.translate(w / 2, h / 2);
  const b = () => x.beginPath();
  if (n === 'poubelle') { b(); x.moveTo(-40, -38); x.lineTo(40, -38); x.moveTo(-14, -50); x.lineTo(14, -50); x.stroke(); b(); x.moveTo(-32, -26); x.lineTo(-24, 50); x.lineTo(24, 50); x.lineTo(32, -26); x.stroke(); }
  else if (n === 'lecture') { b(); x.moveTo(-26, -40); x.lineTo(40, 0); x.lineTo(-26, 40); x.closePath(); x.fill(); }
  else if (n === 'rafale') { x.strokeRect(-42, -22, 56, 44); x.strokeRect(-24, -40, 56, 44); }
  else if (n === 'loupe+' || n === 'loupe-') { b(); x.arc(-8, -8, 34, 0, 7); x.stroke(); b(); x.moveTo(18, 18); x.lineTo(46, 46); x.moveTo(-26, -8); x.lineTo(10, -8); if (n === 'loupe+') { x.moveTo(-8, -26); x.lineTo(-8, 10); } x.stroke(); }
  else if (n === 'moniteur') { x.strokeRect(-44, -30, 88, 60); b(); x.arc(0, 0, 12, 0, 7); x.fill(); }
  else if (n === 'pc') { x.strokeRect(-40, -32, 80, 64); b(); x.moveTo(-28, 20); x.lineTo(-6, -6); x.lineTo(8, 8); x.lineTo(28, -14); x.stroke(); }
  else if (n === 'cle') { b(); x.arc(-18, 0, 20, 0, 7); x.stroke(); b(); x.moveTo(2, 0); x.lineTo(46, 0); x.moveTo(30, 0); x.lineTo(30, 16); x.moveTo(42, 0); x.lineTo(42, 14); x.stroke(); }
  else if (n === 'lv') { x.font = '800 62px ' + POLICE; x.fillText('Lv', 0, 4); }
}
function grille(l, h, cols, rangs) {
  cols = cols || 6; rangs = rangs || 4;
  const t = texte((x, w, hh) => { x.fillStyle = '#000'; for (let i = 0; i < cols; i++) for (let j = 0; j < rangs; j++) { x.beginPath(); x.arc(w / cols * (i + .5), hh / rangs * (j + .5), Math.min(w / cols, hh / rangs) * .22, 0, 7); x.fill(); } }, 256, 176);
  return new THREE.Mesh(new THREE.PlaneGeometry(l, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
}
// étiquette imprimée sur une face (plan transparent)
function etiquette(txt, l, h, opts) {
  const o = opts || {};
  const t = texte((x, w, hh) => {
    if (o.fond) { x.fillStyle = o.fond; x.beginPath(); x.roundRect(0, 0, w, hh, hh * 0.25); x.fill(); }
    x.fillStyle = o.couleur || '#dcdcdf'; x.textAlign = o.align || 'center'; x.textBaseline = 'middle';
    x.font = (o.style || '700 ') + (o.taille || 150) + 'px ' + (o.police || POLICE);
    x.fillText(txt, o.align === 'left' ? 10 : w / 2, hh / 2 + 6);
  }, 1024, Math.round(1024 * h / l));
  return new THREE.Mesh(new THREE.PlaneGeometry(l, h), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
}
function textureCadran(modes, couleurs) {
  return texte((x, w, h) => {
    x.translate(w / 2, h / 2);
    modes.forEach((m, i) => {
      x.save(); x.rotate(i / modes.length * Math.PI * 2);
      x.fillStyle = couleurs && couleurs[m] || '#f1f1f3'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = '800 ' + (m.length > 2 ? 64 : 86) + 'px ' + POLICE;
      x.fillText(m, 0, -h * 0.36);
      x.restore();
    });
    x.fillStyle = '#2a2b2f'; x.beginPath(); x.arc(0, 0, w * 0.22, 0, Math.PI * 2); x.fill();
  }, 1024, 1024);
}

/* ------------------------------------------------------------------ objectif (axe +z) */
function objectif(M, o) {
  const g = new THREE.Group();
  const tube = (r1, r2, l, mat, z, seg) => { const m = new THREE.Mesh(lisse(new THREE.CylinderGeometry(r2, r1, l, seg || 96, 1)), mat); m.rotation.x = Math.PI / 2; m.position.z = z + l / 2; g.add(m); return m; };
  tube(o.r + 0.1, o.r + 0.1, 0.18, M.metal, 0);                  // baïonnette
  tube(o.r, o.r, 0.6, M.corps, 0.18);                             // base
  const bague = new THREE.Group(); g.add(bague);                 // bague de zoom striée (tourne)
  const nb = 90, geoS = new RoundedBoxGeometry(0.09, 0.08, o.bague, 2, 0.03);
  const fond = new THREE.Mesh(new THREE.CylinderGeometry(o.r + 0.02, o.r + 0.02, o.bague, 96), M.gomme); fond.rotation.x = Math.PI / 2; fond.position.z = 0.78 + o.bague / 2; bague.add(fond);
  for (let i = 0; i < nb; i++) { const a = i / nb * Math.PI * 2, s = new THREE.Mesh(geoS, M.gomme); s.position.set(Math.cos(a) * (o.r + 0.06), Math.sin(a) * (o.r + 0.06), 0.78 + o.bague / 2); s.rotation.z = a; bague.add(s); }
  const z1 = 0.78 + o.bague;
  // tube intérieur, visible quand l'objectif se déplie
  tube(o.r - 0.36, o.r - 0.36, 1.5, M.corps, z1 - 0.2);
  const avantG = new THREE.Group(); g.add(avantG);
  const tubeA = (r1, r2, l, mat, z) => { const m = new THREE.Mesh(lisse(new THREE.CylinderGeometry(r2, r1, l, 96, 1)), mat); m.rotation.x = Math.PI / 2; m.position.z = z + l / 2; avantG.add(m); return m; };
  tubeA(o.r - 0.05, o.r - 0.25, o.avant, M.corps, z1);            // avant
  tubeA(o.r - 0.25, o.r - 0.3, 0.12, M.metalSombre, z1 + o.avant); // jonc
  const z2 = z1 + o.avant + 0.12;
  const interieur = new THREE.Mesh(new THREE.CylinderGeometry(o.r - 0.42, o.r - 0.42, 0.5, 64, 1, true), M.gomme); interieur.rotation.x = Math.PI / 2; interieur.position.z = z2 - 0.25; avantG.add(interieur);
  const a = o.r - 0.42, Rs = a * 2.4, th = Math.asin(a / Rs);
  const lentille = new THREE.Mesh(new THREE.SphereGeometry(Rs, 96, 16, 0, Math.PI * 2, 0, th), M.verre);
  lentille.rotation.x = Math.PI / 2; lentille.position.z = z2 - 0.32 - Rs * Math.cos(th); avantG.add(lentille);
  // lentilles intérieures : reflets en anneaux
  [0.62, 0.38].forEach((k, i) => { const r = new THREE.Mesh(new THREE.TorusGeometry(a * k, 0.025, 8, 96), new THREE.MeshBasicMaterial({ color: i ? 0x5a3c8c : 0x2f6b4f, transparent: true, opacity: 0.6 })); r.position.z = z2 - 0.5 - i * 0.1; avantG.add(r); });
  // inscriptions de l'avant de l'objectif
  const t = texte((x, w, h) => {
    x.translate(w / 2, h / 2); x.fillStyle = '#cfcfd3'; x.font = '600 34px ' + POLICE; x.textAlign = 'center';
    const s = o.nom; const pas = 0.052;
    for (let i = 0; i < s.length; i++) { x.save(); x.rotate((i - s.length / 2) * pas - 0.6); x.fillText(s[i], 0, -h * 0.43); x.restore(); }
  }, 1024, 1024);
  const anneau = new THREE.Mesh(new THREE.RingGeometry(o.r - 0.42, o.r - 0.25, 96), new THREE.MeshStandardMaterial({ color: 0x111113, map: t, roughness: 0.6 }));
  anneau.position.z = z2 - 0.01; avantG.add(anneau);
  g.userData.bague = bague;
  g.userData.avant = avantG; g.userData.course = o.course || 0;
  g.userData.longueur = z2;
  return g;
}

/* ------------------------------------------------------------------ Nikon Z50II */
function z50ii() {
  const M = matieres(), A = new THREE.Group(), C = {}, N = {};     // C : commandes interactives, N : pièces nommées
  const n = (o, nom) => { o.userData.nom = nom; N[nom] = o; return o; };
  const vue = (nom, l, t) => { if (N[nom]) N[nom].userData.vue = [l, t]; };
  const W = 12.65, H = 7.3, zB = -1.6, zF = 1.6;
  // corps vu de dessus : bloc + poignée bombée (à gauche vu de face)
  const corps = extrusion([
    [-W / 2 + 0.5, 1.6], [W / 2 - 0.5, 1.6], [W / 2, 1.6, W / 2, 1.1], [W / 2, -1.1], [W / 2, -1.6, W / 2 - 0.5, -1.6],
    [-3.0, -1.6], [-3.35, -2.0, -3.45, -2.6], [-3.6, -3.55, -4.6, -3.75], [-5.7, -3.8, -6.1, -3.2], [-W / 2, -2.6, -W / 2, -1.4], [-W / 2, 1.1], [-W / 2, 1.6, -W / 2 + 0.5, 1.6]
  ], H, 0.45, M.corps, 'y');
  A.add(corps); n(corps, 'Le boîtier');
  // similicuir : façade gauche (poignée) et droite
  const cuirG = extrusion([[-W / 2 + 0.06, 0.4], [-3.05, 0.4], [-3.05, -1.62], [-3.4, -2.0, -3.5, -2.6], [-3.65, -3.6, -4.6, -3.81], [-5.7, -3.86, -6.15, -3.22], [-W / 2 - 0.06, -2.6, -W / 2 - 0.06, -1.4]], 5.0, 0.2, M.cuir, 'y');
  cuirG.position.y = 0.9; A.add(cuirG); n(cuirG, 'La poignée');
  const cuirD = boite(2.4, 5.0, 0.12, 0.05, M.cuir); cuirD.position.set(4.85, 3.4, zF + 0.04); A.add(cuirD);
  // bossage du viseur (profil de côté, extrudé en x)
  const hx = 1.6, hl = 4.6;   // bossage décalé comme sur le vrai boîtier (photos de face et de dos)
  const bossage = effiler(extrusion(profilZ([[-1.5, 6.8], [1.6, 6.8], [1.6, 7.3], [1.25, 8.4, 0.5, 9.12], [-0.6, 9.25], [-1.35, 9.25, -1.5, 8.6]]), hl, 0.42, M.corps, 'x'), hx - hl / 2, 6.9, 9.3, 0.74);
  A.add(bossage);
  const flash = new THREE.Group(); flash.position.set(hx, 9.12, -0.45); A.add(flash); flash.userData.flash = true;   // charnière à l'arrière de la tête
  const tete = boite(2.5, 0.36, 1.1, 0.12, M.corps); tete.position.set(0, 0, 0.55); flash.add(tete);
  const diffuseur = boite(2.1, 0.22, 0.05, 0.05, new THREE.MeshPhysicalMaterial({ color: 0xf4f4f0, roughness: 0.35, transmission: 0.2, clearcoat: 0.6 })); diffuseur.position.set(0, -0.04, 1.0); flash.add(diffuseur);
  n(flash, 'Flash intégré');
  const logo = etiquette('Nikon', 3.0, 0.8, { style: 'italic 800 ', taille: 210 });
  logo.position.set(hx, 8.3, 1.2); logo.rotation.x = -0.54; A.add(logo); logo.userData.etiquette = true;
  // sabot porte-accessoire
  const sabot = boite(2.0, 0.12, 1.9, 0.04, M.metal); sabot.position.set(hx, 9.32, -0.2); A.add(sabot); n(sabot, 'Griffe flash');
  const diop = new THREE.Mesh(lisse(new THREE.CylinderGeometry(0.28, 0.28, 0.3, 24)), M.bouton); diop.rotation.z = Math.PI / 2; diop.position.set(hx - 2.55, 8.2, -0.9); A.add(diop); n(diop, 'Réglage dioptrique');
  [-0.85, 0.85].forEach(dx => { const r = boite(0.18, 0.22, 1.9, 0.05, M.metal); r.position.set(hx + dx, 9.42, -0.2); A.add(r); });
  // viseur : œilleton en caoutchouc + oculaire + capteur d'œil
  const oeil = boite(3.3, 2.3, 1.2, 0.45, M.gomme); oeil.position.set(hx, 8.0, zB - 0.55); A.add(oeil); n(oeil, 'Viseur électronique');
  const ocu = boite(1.9, 1.25, 0.1, 0.2, M.vitre); ocu.position.set(hx, 8.1, zB - 1.17); A.add(ocu);
  const capt = new THREE.Mesh(new THREE.CircleGeometry(0.09, 20), new THREE.MeshBasicMaterial({ color: 0x5a1a7a })); capt.position.set(hx, 7.25, zB - 1.18); capt.rotation.y = Math.PI; A.add(capt); n(capt, 'Détecteur oculaire');
  // écran orientable
  const ecran = new THREE.Group(); A.add(ecran);
  ecran.position.set(5.6, 3.35, zB - 0.25); ecran.userData.orientable = true;   // charnière à gauche, vu de dos
  const dalle = boite(8.7, 5.9, 0.42, 0.22, M.corps); dalle.position.set(1.25 - 5.6, 0, 0); ecran.add(dalle); n(ecran, 'Écran tactile orientable');
  const vitre = boite(7.6, 5.05, 0.06, 0.08, M.vitre); vitre.position.set(1.25 - 5.6, 0, -0.23); ecran.add(vitre);
  const charn = new THREE.Mesh(lisse(new THREE.CylinderGeometry(0.16, 0.16, 4.6, 24)), M.metalSombre); charn.position.set(0.05, 0, 0.05); ecran.add(charn);
  C.ecran = { centre: new THREE.Vector3(1.25, 3.35, zB - 0.52), l: 7.2, h: 4.8 };
  // dessus : molette de mode, déclencheur + commutateur, boutons
  const MODES = ['AUTO', 'P', 'S', 'A', 'M', 'U1', 'U2', 'U3', 'SCN'];
  const cadran = molette(1.15, 0.62, 44, M.bouton, new THREE.MeshStandardMaterial({ map: textureCadran(MODES, { AUTO: '#39d36a' }), roughness: 0.45 }));
  cadran.position.set(-2.35, H + 0.75, -0.25); Object.assign(cadran.userData, { c: 'dial', type: 'cadran', modes: MODES }); A.add(cadran); C.dial = cadran; n(cadran, 'Sélecteur de mode');
  const ph = boite(0.55, 0.16, 0.3, 0.06, M.bouton); ph.position.set(-3.35, H + 0.5, -1.15); ph.rotation.y = 0.5; A.add(ph); n(ph, 'Sélecteur photo/vidéo');
  const repere = boite(0.08, 0.05, 0.35, 0.02, new THREE.MeshBasicMaterial({ color: 0xffffff })); repere.position.set(-2.35, H + 0.47, -1.6); A.add(repere);
  const socle = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.3, 0.3, 64), M.corps); socle.position.set(-2.35, H + 0.35, -0.25); A.add(socle);
  const col = new THREE.Mesh(lisse(new THREE.CylinderGeometry(0.95, 1.0, 0.36, 48)), M.bouton); col.position.set(-4.75, H + 0.6, 1.9); A.add(col);
  const levier = boite(0.9, 0.16, 0.38, 0.07, M.bouton); levier.position.set(-4.0, H + 0.55, 2.55); levier.rotation.y = -0.5; A.add(levier);
  const decl = bouton(0.62, 0.28, M.metalSombre); decl.position.set(-4.75, H + 0.92, 1.9); Object.assign(decl.userData, { c: 'half', type: 'bouton' }); A.add(decl); C.half = decl; n(decl, 'Déclencheur et marche-arrêt'); N['Commutateur marche-arrêt et déclencheur'] = decl;
  const recD = bouton(0.22, 0.18, M.rouge); recD.position.set(-4.5, H + 0.42, 2.6); A.add(recD); n(recD, 'Enregistrement vidéo');
  const corrD = bouton(0.26, 0.18, M.bouton, '±'); corrD.position.set(-4.3, H + 0.45, 1.85); A.add(corrD); n(corrD, "Correction d'exposition ±"); n(decl, 'Déclencheur et marche-arrêt');
  const rec = bouton(0.33, 0.22, M.rouge); rec.position.set(-3.45, H + 0.55, 2.35); A.add(rec); n(rec, 'Enregistrement vidéo');
  const iso = bouton(0.36, 0.22, M.bouton, 'ISO'); iso.position.set(-3.55, H + 0.55, 1.15); A.add(iso); n(iso, 'Touche ISO');
  const corr = bouton(0.36, 0.22, M.bouton, '±'); corr.position.set(-4.5, H + 0.55, 0.45); A.add(corr); n(corr, "Correction d'exposition ±");
  const pcb = bouton(0.34, 0.2, M.bouton, '#pc'); pcb.position.set(-3.6, H + 0.5, 0.05); A.add(pcb); n(pcb, 'Touche Picture Control');
  const zlogo = etiquette('Z 50II', 2.4, 0.6, { style: 'italic 800 ', taille: 170 }); zlogo.rotation.set(-Math.PI / 2, 0, Math.PI); zlogo.position.set(4.7, H + 0.46, 0.4); A.add(zlogo);
  const hp = grille(0.9, 0.6); hp.rotation.x = -Math.PI / 2; hp.position.set(5.2, H + 0.46, -0.9); A.add(hp); n(hp, 'Haut-parleur');
  // molettes de commande (principale à l'arrière, secondaire à l'avant de la poignée)
  const mPrinc = molette(0.85, 0.42, 36, M.gomme); mPrinc.position.set(-4.55, H + 0.15, zB + 0.25); A.add(mPrinc); C.molettePrincipale = mPrinc; n(mPrinc, 'Molette principale');
  const mSec = molette(0.75, 0.38, 32, M.gomme); mSec.position.set(-4.4, H - 0.65, 3.25); A.add(mSec); n(mSec, 'Molette secondaire');
  // dos : boutons
  const dos = (b, x, y) => { b.rotation.x = -Math.PI / 2; b.position.set(x, y, zB - 0.12); A.add(b); return b; };
  n(dos(bouton(0.36, 0.2, M.bouton, '#rafale'), 5.08, 6.55), 'Déclenchement / retardateur'); n(dos(bouton(0.36, 0.2, M.bouton, '#poubelle'), 4.17, 6.55), 'Suppression');
  n(dos(bouton(0.36, 0.2, M.bouton, 'DISP'), -1.33, 6.62), 'DISP'); n(dos(bouton(0.38, 0.2, M.bouton, '#moniteur'), -1.98, 6.55), 'Mode moniteur');
  n(dos(bouton(0.42, 0.22, M.bouton, 'AE-L'), -3.79, 6.5), 'AE-L/AF-L');
  C.i = dos(bouton(0.42, 0.24, M.bouton, 'i'), -3.69, 4.7); Object.assign(C.i.userData, { c: 'i', type: 'bouton' }); n(C.i, 'Touche i');
  // sélecteur multidirectionnel (anneau qui bascule) + OK
  const pad = new THREE.Group(); pad.rotation.x = -Math.PI / 2; pad.position.set(-4.22, 3.25, zB - 0.1); A.add(pad);
  const anneau = new THREE.Mesh(lisse(new THREE.TorusGeometry(0.88, 0.2, 20, 64)), M.bouton); anneau.rotation.x = Math.PI / 2; anneau.scale.y = 0.6;
  const anneauG = new THREE.Group(); anneauG.add(anneau); pad.add(anneauG);
  const fleches = texte((x, w, h) => {
    x.fillStyle = '#d6d6da'; x.translate(w / 2, h / 2);
    for (let k = 0; k < 4; k++) { x.save(); x.rotate(k * Math.PI / 2); x.beginPath(); x.moveTo(0, -h * 0.47); x.lineTo(-18, -h * 0.40); x.lineTo(18, -h * 0.40); x.fill(); x.restore(); }
  }, 512, 512);
  const fl = new THREE.Mesh(new THREE.RingGeometry(0.7, 1.08, 64), new THREE.MeshBasicMaterial({ map: fleches, transparent: true, depthWrite: false }));
  fl.rotation.x = -Math.PI / 2; fl.position.y = 0.14; anneauG.add(fl);
  const ok = bouton(0.5, 0.24, M.bouton, 'OK'); ok.position.y = 0.02; pad.add(ok);
  Object.assign(ok.userData, { c: 'ok', type: 'bouton' }); C.ok = ok; n(anneauG, 'Sélecteur multidirectionnel + OK');
  ['up', 'right', 'down', 'left'].forEach((c, k) => {
    // zones invisibles pour cliquer sur chaque direction
    const z = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.3, 16), new THREE.MeshBasicMaterial({ visible: false }));
    const a = [Math.PI / 2, 0, -Math.PI / 2, Math.PI][k];
    z.position.set(Math.cos(a) * 0.9, 0.1, -Math.sin(a) * 0.9); pad.add(z);
    Object.assign(z.userData, { c, type: 'fleche', pad: anneauG, dir: new THREE.Vector2(Math.cos(a), -Math.sin(a)) }); C[c] = z;
  });
  n(dos(bouton(0.38, 0.2, M.bouton, '#loupe+'), -3.69, 1.88), 'Loupe avant'); C.menu = dos(bouton(0.38, 0.22, M.bouton, 'MENU'), -4.75, 1.88); Object.assign(C.menu.userData, { c: 'menu', type: 'bouton' }); n(C.menu, 'MENU');
  n(dos(bouton(0.38, 0.2, M.bouton, '#loupe-'), -3.61, 1.05), 'Loupe arrière / imagettes / aide'); n(dos(bouton(0.38, 0.2, M.bouton, '#lecture'), -4.75, 1.05), 'Visualisation');
  // façade : Fn1, Fn2, illuminateur AF, logo Z
  const face = (b, x, y) => { b.rotation.x = Math.PI / 2; b.position.set(x, y, zF + 0.08); A.add(b); return b; };
  n(face(bouton(0.28, 0.16, M.bouton), -2.2, 3.8), 'Fn1'); n(face(bouton(0.28, 0.16, M.bouton), -2.05, 1.65), 'Fn2');
  n(face(bouton(0.3, 0.18, M.bouton), 5.46, 3.83), "Déverrouillage de l'objectif");
  const temoin = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), new THREE.MeshPhysicalMaterial({ color: 0x3a0a0a, clearcoat: 1 })); temoin.position.set(4.9, 6.4, zF + 0.05); A.add(temoin); n(temoin, "Témoin d'enregistrement");
  const lampe = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshPhysicalMaterial({ color: 0x2a1508, roughness: 0.1, clearcoat: 1 })); lampe.position.set(-2.55, 6.35, zF + 0.05); A.add(lampe); n(lampe, "Illuminateur d'assistance AF");
  const z = etiquette('Z', 0.9, 0.9, { style: 'italic 900 ', taille: 700 }); z.position.set(-2.25, 6.3, zF + 0.04); A.add(z); z.userData.etiquette = true;
  // côté (opposé à la poignée) : trappes en caoutchouc des prises (micro, casque, USB-C, HDMI)
  [[5.2, 1.5], [2.2, 1.5]].forEach(([y, h]) => { const t = boite(0.12, h, 2.2, 0.08, M.gomme); t.position.set(W / 2 + 0.03, y, 0); A.add(t); t.userData.etiquette = true; });   // sur la photo
  // dessous : trappe batterie et carte, embase pour trépied
  const trappe = boite(4.2, 0.08, 2.6, 0.12, M.gomme); trappe.position.set(-3.6, -0.02, 0.1); A.add(trappe);
  const embase = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.38, 32), M.metal); embase.rotation.x = Math.PI / 2; embase.position.set(hx, -0.03, 0.2); A.add(embase);
  // micros stéréo : deux grilles de chaque côté du viseur, sur le dessus
  [-1.15, 1.15].forEach(dx => { const g = grille(0.5, 0.32, 3, 2); g.rotation.x = -Math.PI / 2; g.position.set(hx + dx, 9.27, 0.35); A.add(g); });
  // repose-pouce en caoutchouc au dos, à droite
  const pouce = boite(1.9, 2.0, 0.08, 0.3, M.cuir); pouce.position.set(-5.4, 5.6, zB - 0.02); A.add(pouce);
  // anneaux de courroie
  [-W / 2 - 0.15, W / 2 + 0.15].forEach(x => { const t = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 12, 32), M.metal); t.position.set(x, 6.6, 0); t.rotation.y = Math.PI / 2; A.add(t); });
  // objectif NIKKOR Z DX 16-50 (rentré)
  const obj = objectif(M, { r: 3.25, bague: 1.25, avant: 1.0, course: 1.2, nom: 'NIKKOR Z DX 16-50mm 1:3.5-6.3 VR' });
  obj.position.set(hx - 0.1, 3.75, zF); A.add(obj); C.objectif = obj; n(obj.userData.bague, "L'objectif"); n(obj.children[0], 'La monture Z'); N['Le capteur'] = obj; N['Les contacts'] = obj.children[0];

  // angles de vue pour Découvrir (lacet, tangage) : la pièce bien en face
  [['Le boîtier', 25, 15], ['La poignée', -40, 12], ['Flash intégré', 12, 38], ['Griffe flash', 195, 52], ['Réglage dioptrique', 225, 22], ['Viseur électronique', 192, 14],
   ['Détecteur oculaire', 186, 8], ['Écran tactile orientable', 145, 14], ['Sélecteur de mode', 205, 50], ['Sélecteur photo/vidéo', 210, 48], ['Déclencheur et marche-arrêt', 240, 44],
   ['Enregistrement vidéo', 245, 46], ['Touche ISO', 238, 50], ["Correction d'exposition ±", 230, 52], ['Touche Picture Control', 225, 52], ['Molette principale', 222, 36],
   ['Molette secondaire', -40, 26], ['Fn1', -28, 8], ['Fn2', -28, 6], ["Illuminateur d'assistance AF", -22, 16], ["Déverrouillage de l'objectif", 38, 8], ['La monture Z', 12, 8],
   ["L'objectif", 24, 10], ["Témoin d'enregistrement", 30, 16], ['Haut-parleur', 178, 62], ['Déclenchement / retardateur', 172, 18], ['Suppression', 174, 18]].forEach(v => vue(...v));
  dalle.userData.peauDos = true;   // l'écran pivote : sa face intérieure (vers l'avant au repos) reste noire, sans photo
  A.userData.peau = [corps, cuirG, cuirD, bossage, oeil, dalle, pouce, tete];
  return { groupe: A, commandes: C, noms: N, modes: MODES, centre: new THREE.Vector3(0, 4.6, 0.3), taille: 13 };
}

/* ------------------------------------------------------------------ Nikon D800 */
function d800() {
  const M = matieres(), A = new THREE.Group(), C = {}, N = {};
  const n = (o, nom) => { o.userData.nom = nom; N[nom] = o; return o; };
  const vue = (nom, l, t) => { if (N[nom]) N[nom].userData.vue = [l, t]; };
  const W = 14.6, H = 9.0, zB = -2.1, zF = 2.1;
  const corps = extrusion([
    [-W / 2 + 0.6, 2.1], [W / 2 - 0.6, 2.1], [W / 2, 2.1, W / 2, 1.5], [W / 2, -1.6], [W / 2, -2.1, W / 2 - 0.6, -2.1],
    [-3.6, -2.1], [-3.95, -2.6, -4.05, -3.3], [-4.2, -4.6, -5.4, -4.8], [-6.8, -4.85, -7.1, -4.0], [-W / 2, -3.2, -W / 2, -1.6], [-W / 2, 1.5], [-W / 2, 2.1, -W / 2 + 0.6, 2.1]
  ], H, 0.95, M.corps, 'y');
  A.add(corps); n(corps, 'Volet des cartes mémoire');
  const cuirG = extrusion([[-W / 2 + 0.06, 0.4], [-3.65, 0.4], [-3.65, -2.12], [-4.0, -2.6, -4.1, -3.3], [-4.25, -4.65, -5.4, -4.86], [-6.8, -4.92, -7.15, -4.02], [-W / 2 - 0.06, -3.2, -W / 2 - 0.06, -1.6]], 6.6, 0.22, M.cuir, 'y');
  cuirG.position.y = 0.8; A.add(cuirG);
  const lisere = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.07, 8, 48, 1.15), M.rouge); lisere.position.set(-4.3, 4.6, 1.2); lisere.rotation.set(Math.PI / 2 - 0.25, 0, 0.35); A.add(lisere); n(cuirG, 'La poignée');
  const cuirD = boite(3.2, 6.4, 0.12, 0.05, M.cuir); cuirD.position.set(5.4, 4.1, zF + 0.04); A.add(cuirD);
  // prisme (plus haut, faces inclinées)
  const hx = 0.6, hl = 6.4;
  const prisme = effiler(extrusion(profilZ([[-2.0, 8.2], [2.3, 8.2], [2.3, 8.9], [1.7, 10.7, 0.55, 11.9], [-0.9, 12.0], [-1.85, 11.95, -2.0, 11.0]]), hl, 0.6, M.corps, 'x'), hx - hl / 2, 8.4, 12.0, 0.5);
  A.add(prisme); n(prisme, 'Flash intégré et son ouverture');
  const logo = etiquette('Nikon', 3.4, 0.9, { style: 'italic 800 ', taille: 210 }); logo.position.set(hx, 10.15, 1.88); logo.rotation.x = -0.62; A.add(logo);
  const nom = etiquette('D800', 1.6, 0.5, { style: '700 ', taille: 190 }); nom.position.set(-3.9, 8.0, zF + 0.05); A.add(nom);
  const sabot = boite(2.2, 0.12, 2.0, 0.04, M.metal); sabot.position.set(hx, 12.06, -0.2); A.add(sabot);
  const oeil = boite(3.0, 2.4, 1.0, 0.6, M.gomme); oeil.position.set(hx, 10.0, zB - 0.5); A.add(oeil); n(oeil, 'Viseur reflex');
  const diop = new THREE.Mesh(lisse(new THREE.CylinderGeometry(0.28, 0.28, 0.3, 24)), M.bouton); diop.rotation.z = Math.PI / 2; diop.position.set(hx + 1.75, 10.2, zB - 0.4); A.add(diop); n(diop, 'Réglage dioptrique');
  const lev = boite(0.2, 0.6, 0.2, 0.06, M.bouton); lev.position.set(hx - 1.7, 10.0, zB - 0.45); A.add(lev); n(lev, "Levier de l'obturateur d'oculaire");
  const ocu = new THREE.Mesh(new THREE.CircleGeometry(0.75, 40), M.vitre); ocu.position.set(hx, 10.0, zB - 1.02); ocu.rotation.y = Math.PI; A.add(ocu);
  const dalle = boite(8.3, 6.0, 0.25, 0.25, M.corps); dalle.position.set(1.1, 3.9, zB - 0.12); A.add(dalle); n(dalle, 'Écran (moniteur)');
  const vitre = boite(7.6, 5.4, 0.05, 0.08, M.vitre); vitre.position.set(1.1, 3.9, zB - 0.26); A.add(vitre);
  C.ecran = { centre: new THREE.Vector3(1.1, 3.9, zB - 0.3), l: 7.2, h: 4.8 };
  // dessus : écran de contrôle, déclencheur, bouton MODE ; molette de gauche
  const lcd = boite(3.0, 0.08, 2.2, 0.15, M.vitre); lcd.position.set(-4.1, H + 0.55, -0.2); A.add(lcd); n(lcd, 'Écran de contrôle');
  const decl = bouton(0.6, 0.3, M.metalSombre); decl.position.set(-5.6, H + 0.25, 2.6); decl.rotation.x = 0.25; Object.assign(decl.userData, { c: 'half', type: 'bouton' }); A.add(decl); C.half = decl; n(decl, 'Déclencheur et marche-arrêt'); N['Commutateur marche-arrêt et déclencheur'] = decl;
  const recD = bouton(0.22, 0.18, M.rouge); recD.position.set(-4.5, H + 0.42, 2.6); A.add(recD); n(recD, 'Enregistrement vidéo');
  const corrD = bouton(0.26, 0.18, M.bouton, '±'); corrD.position.set(-4.3, H + 0.45, 1.85); A.add(corrD); n(corrD, "Correction d'exposition ±");
  const col = new THREE.Mesh(lisse(new THREE.CylinderGeometry(0.95, 1.0, 0.3, 48)), M.bouton); col.position.set(-5.6, H + 0.05, 2.55); col.rotation.x = 0.25; A.add(col);
  const mode = bouton(0.36, 0.2, M.bouton, 'MODE'); mode.position.set(-3.6, H + 0.5, 1.6); A.add(mode); n(mode, 'Commande MODE');
  Object.assign(mode.userData, { c: 'dial', type: 'bouton' }); C.dialBouton = mode;
  const gauche = molette(1.45, 0.75, 48, M.bouton, new THREE.MeshStandardMaterial({ map: textureCadran(['S', 'CL', 'CH', 'Q', 'Qc', '⏲', 'MUP'], {}), roughness: 0.5 }));
  gauche.position.set(-4.85 + 9.7, H + 0.55, -0.2); A.add(gauche); n(gauche, 'Sélecteur du mode de déclenchement'); N['Sélecteur du mode de déclenchement et ISO'] = gauche;
  // molette principale (arrière, à droite vu de dos) : elle tourne quand on change de mode
  const mPrinc = molette(0.85, 0.5, 36, M.gomme); mPrinc.rotation.x = Math.PI / 2; mPrinc.rotation.z = Math.PI / 2;
  mPrinc.position.set(-6.4, H - 0.6, zB + 0.2); A.add(mPrinc); C.molettePrincipale = mPrinc; C.dial = mPrinc; n(mPrinc, 'Molette principale');
  Object.assign(mPrinc.userData, { c: 'dial', type: 'molette' });
  const dos = (b, x, y) => { b.rotation.x = -Math.PI / 2; b.position.set(x, y, zB - 0.1); A.add(b); return b; };
  // colonne de gauche vu de dos (côté +x)
  n(dos(bouton(0.36, 0.2, M.bouton, '#lecture'), 6.3, 7.2), 'Visualisation'); n(dos(bouton(0.36, 0.2, M.bouton, '#poubelle'), 6.3, 6.2), 'Effacer');
  C.menu = dos(bouton(0.4, 0.22, M.bouton, 'MENU'), 6.3, 5.2); Object.assign(C.menu.userData, { c: 'menu', type: 'bouton' }); n(C.menu, 'MENU');
  n(dos(bouton(0.36, 0.2, M.bouton, '#cle'), 6.3, 4.2), 'Clé : protection, Picture Control, aide'); n(dos(bouton(0.36, 0.2, M.bouton, '#loupe+'), 6.3, 3.2), 'Loupes'); dos(bouton(0.36, 0.2, M.bouton, '#loupe-'), 6.3, 2.2); n(dos(bouton(0.36, 0.2, M.bouton, 'OK'), 6.3, 1.2), 'OK');
  C.info = dos(bouton(0.36, 0.2, M.bouton, 'info'), -5.5, 1.2); Object.assign(C.info.userData, { c: 'info', type: 'bouton' }); n(C.info, 'info');
  n(dos(bouton(0.38, 0.2, M.bouton, '#lv'), -5.2, 2.6), 'Visée écran (Lv)');
  const hp = grille(0.9, 0.3, 3, 1); hp.rotation.y = Math.PI; hp.position.set(-5.6, 0.5, zB - 0.02); A.add(hp); n(hp, 'Haut-parleur et voyant de carte');
  n(dos(bouton(0.42, 0.22, M.bouton, 'AF-ON'), -5.9, 8.4), 'AF-ON'); n(dos(bouton(0.36, 0.2, M.bouton, 'AE-L'), -4.4, 8.4), 'Mesure et AE-L/AF-L');
  const pad = new THREE.Group(); pad.rotation.x = -Math.PI / 2; pad.position.set(-5.2, 5.2, zB - 0.08); A.add(pad);
  const disque = new THREE.Mesh(lisse(new THREE.CylinderGeometry(1.15, 1.2, 0.2, 64)), M.bouton);
  const anneauG = new THREE.Group(); anneauG.add(disque); pad.add(anneauG);
  const fleches = texte((x, w, h) => {
    x.fillStyle = '#d6d6da'; x.translate(w / 2, h / 2);
    for (let k = 0; k < 4; k++) { x.save(); x.rotate(k * Math.PI / 2); x.beginPath(); x.moveTo(0, -h * 0.45); x.lineTo(-16, -h * 0.38); x.lineTo(16, -h * 0.38); x.fill(); x.restore(); }
  }, 512, 512);
  const fl = new THREE.Mesh(new THREE.CircleGeometry(1.12, 64), new THREE.MeshBasicMaterial({ map: fleches, transparent: true, depthWrite: false }));
  fl.rotation.x = -Math.PI / 2; fl.position.y = 0.11; anneauG.add(fl);
  const ok = bouton(0.42, 0.24, M.bouton); ok.position.y = 0.06; pad.add(ok); Object.assign(ok.userData, { c: 'ok', type: 'bouton' }); C.ok = ok; n(anneauG, 'Sélecteur multidirectionnel');
  ['up', 'right', 'down', 'left'].forEach((c, k) => {
    const z = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16), new THREE.MeshBasicMaterial({ visible: false }));
    const a = [Math.PI / 2, 0, -Math.PI / 2, Math.PI][k];
    z.position.set(Math.cos(a) * 0.82, 0.1, -Math.sin(a) * 0.82); pad.add(z);
    Object.assign(z.userData, { c, type: 'fleche', pad: anneauG, dir: new THREE.Vector2(Math.cos(a), -Math.sin(a)) }); C[c] = z;
  });
  const face = (b, x, y) => { b.rotation.x = Math.PI / 2; b.position.set(x, y, zF + 0.08); A.add(b); return b; };
  n(face(bouton(0.3, 0.16, M.bouton), -3.2, 3.6), 'Aperçu de la profondeur de champ'); n(face(bouton(0.3, 0.16, M.bouton), -3.2, 2.6), 'Commande Fn');
  n(face(bouton(0.34, 0.18, M.bouton), hx + 4.05, 3.0), "Déverrouillage de l'objectif");
  const sel = boite(0.5, 0.3, 0.25, 0.08, M.bouton); sel.position.set(hx + 4.0, 1.2, zF + 0.1); A.add(sel); n(sel, 'Sélecteur du mode de mise au point');
  const lampe = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), new THREE.MeshPhysicalMaterial({ color: 0x2a1508, roughness: 0.1, clearcoat: 1 })); lampe.position.set(-3.0, 7.8, zF + 0.05); A.add(lampe); n(lampe, "Illuminateur d'assistance AF");
  const micro = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), M.gomme); micro.position.set(3.3, 8.4, zF + 0.05); A.add(micro); n(micro, 'Microphone intégré');
  const mSec = molette(0.75, 0.4, 32, M.gomme); mSec.position.set(-5.0, H - 0.75, 3.95); A.add(mSec); n(mSec, 'Molette secondaire');
  [-W / 2 - 0.15, W / 2 + 0.15].forEach(x => { const t = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.08, 12, 32), M.metal); t.position.set(x, 8.0, 0); t.rotation.y = Math.PI / 2; A.add(t); if (x > 0) n(t, 'Œillet pour courroie'); });
  const obj = objectif(M, { r: 3.6, bague: 2.0, avant: 2.4, nom: 'AF-S NIKKOR 24-120mm 1:4G ED VR' });
  obj.position.set(hx, 4.3, zF); A.add(obj); C.objectif = obj; n(obj.children[0], 'Monture F et bouchon de boîtier');

  [['Flash intégré et son ouverture', 12, 32], ['Écran (moniteur)', 196, 10], ['Viseur reflex', 190, 16], ['Volet des cartes mémoire', -62, 10], ['La poignée', -36, 10],
   ['Écran de contrôle', 232, 55], ['Réglage dioptrique', 168, 22], ["Levier de l'obturateur d'oculaire", 202, 20], ['Monture F et bouchon de boîtier', 10, 8],
   ['Sélecteur du mode de déclenchement', 150, 50], ['Microphone intégré', 22, 20], ['Œillet pour courroie', 82, 14], ['Haut-parleur et voyant de carte', 205, 8],
   ['Déclencheur et marche-arrêt', 238, 40], ['Commande MODE', 236, 46], ['Enregistrement vidéo', 240, 44], ["Correction d'exposition ±", 236, 46], ['Molette secondaire', -40, 24]].forEach(v => vue(...v));
  return { groupe: A, commandes: C, noms: N, modes: ['P', 'S', 'A', 'M'], centre: new THREE.Vector3(0, 5.6, 0.6), taille: 15 };
}


/* ------------------------------------------------------------------ modèles hybrides (IA + vraies photos)
   Le corps vient d'une IA « photo → 3D » (TRELLIS, à partir des photos de face et de dos du guide) ;
   le dos est la vraie photo de l'appareil, posée derrière. Les commandes sont des zones invisibles
   placées sur la photo (dos) ou sur la surface du modèle (le reste) ; la molette de mode reste une
   vraie pièce qui tourne. */
const IA = {
  z50ii: {
    base: z50ii, glb: '../modeles/z50ii-ia.glb', dos: '../modeles/z50ii-dos.webp',
    ecran: { x0: 0.1065, y0: 0.3945, x1: 0.7177, y1: 0.9648 },
    pts: { 'Écran tactile orientable': [41, 68], 'Viseur électronique': [38.5, 22.3], 'Détecteur oculaire': [39, 31.6], 'Mode moniteur': [61.8, 32], 'DISP': [69.2, 32], 'AE-L/AF-L': [79, 36.4], 'Touche i': [79.1, 52.5], 'Sélecteur multidirectionnel + OK': [82.9, 67.2], 'MENU': [86.5, 80.6], 'Visualisation': [86.3, 90], 'Loupe arrière / imagettes / aide': [78.6, 90], 'Loupe avant': [78.6, 80.6], 'Déclenchement / retardateur': [10.6, 31.2], 'Suppression': [17.7, 31.2] },
    cmd: { i: 'Touche i', menu: 'MENU', ok: 'Sélecteur multidirectionnel + OK' }, logo: [0.6, 0.855, 2.7, 1.1]
  },
  d800: {
    base: d800, glb: '../modeles/d800-ia.glb', dos: '../modeles/d800-dos.webp',
    ecran: { x0: 0.1807, y0: 0.4926, x1: 0.6024, y1: 0.8820 }, pts: {}, cmd: {}, logo: [0.3, 0.81, 3.1, 1.15, -0.55, 0.45]
  }
};
function zone(r) { return new THREE.Mesh(new THREE.SphereGeometry(r || 0.35, 12, 8), new THREE.MeshBasicMaterial({ visible: false })); }
async function hybride(id) {
  const D = IA[id], base = D.base(), A = new THREE.Group(), C = {}, N = {};
  const { GLTFLoader } = await import('./three/addons/GLTFLoader.js');
  const [gltf, tx] = await Promise.all([
    new GLTFLoader().loadAsync(new URL(D.glb, import.meta.url).href),
    new THREE.TextureLoader().loadAsync(new URL(D.dos, import.meta.url).href)
  ]);
  // repère du modèle géométrique (les positions des pièces y sont connues)
  base.groupe.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(base.groupe);
  const corps = gltf.scene; corps.traverse(o => { if (o.isMesh) { o.material.metalness = 0; o.material.roughness = 0.5; } });
  let b = new THREE.Box3().setFromObject(corps), sz = b.getSize(new THREE.Vector3());
  const k = 12.65 / sz.x; corps.scale.setScalar(k); corps.updateMatrixWorld(true);
  b = new THREE.Box3().setFromObject(corps); sz = b.getSize(new THREE.Vector3());
  corps.position.set(-(b.min.x + b.max.x) / 2, -b.min.y, bb.min.z - b.min.z);
  A.add(corps); A.updateMatrixWorld(true);
  const ia = new THREE.Box3().setFromObject(corps);
  // la vraie photo du dos, cadrée sur le corps grâce à la zone opaque de l'image
  tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
  const im = tx.image, cv = document.createElement('canvas'); cv.width = 256; cv.height = Math.round(256 * im.height / im.width);
  const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0, cv.width, cv.height);
  const px = cx.getImageData(0, 0, cv.width, cv.height).data; let x0 = cv.width, x1 = 0, y0 = cv.height, y1 = 0;
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (px[(y * cv.width + x) * 4 + 3] > 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const Wp = (ia.max.x - ia.min.x) * cv.width / (x1 - x0 + 1), Hp = Wp * im.height / im.width;
  const zDos = ia.min.z - 0.03;
  // photo (pourcentages) → point 3D sur le dos ; vu de dos, la gauche de l'image est du côté +x
  const gaucheX = ia.max.x + (x0 / cv.width) * Wp, hautY = Hp * (y1 + 1) / cv.height;   // le bas de la zone opaque posé sur y = 0
  const surDos = (p, q) => new THREE.Vector3(gaucheX - p / 100 * Wp, hautY - q / 100 * Hp, zDos - 0.05);
  const dos = new THREE.Mesh(new THREE.PlaneGeometry(Wp, Hp), new THREE.MeshStandardMaterial({ map: tx, alphaTest: 0.5, roughness: 0.45 }));
  dos.rotation.y = Math.PI; dos.position.set(gaucheX - Wp / 2, hautY - Hp / 2, zDos); A.add(dos);
  // logo Nikon net sur le bossage (l'IA l'avait déformé)
  const ray = new THREE.Raycaster();
  const toucher = (o, d) => { ray.set(o, d); const h = ray.intersectObject(corps, true)[0]; return h ? h.point : null; };
  if (D.logo) {
    const [lx, ly, lw, lh, la = -0.25, lz = 0.22] = D.logo, p = toucher(new THREE.Vector3(lx, ia.max.y * ly, 40), new THREE.Vector3(0, 0, -1));
    if (p) { const l = etiquette('Nikon', lw, lh, { style: 'italic 800 ', taille: 210, couleur: '#f2f2f4', fond: '#16161a' }); l.position.copy(p).add(new THREE.Vector3(0, 0, lz)); l.rotation.x = la; A.add(l); }
  }
  // zones nommées (Découvrir) et commandes (Prendre en main)
  const poser = (nom, src) => {
    const z = zone(); let pos, n;
    if (D.pts[nom]) { pos = surDos(...D.pts[nom]); n = new THREE.Vector3(0, 0, -1); }
    else if (src) {
      const c = new THREE.Box3().setFromObject(src).getCenter(new THREE.Vector3());
      n = (src.userData.type || src.userData.appui || src.userData.molette)
        ? new THREE.Vector3(0, 1, 0).applyQuaternion(src.getWorldQuaternion(new THREE.Quaternion()))
        : c.clone().sub(new THREE.Vector3(0, (bb.min.y + bb.max.y) / 2, 0)).normalize();
      pos = toucher(c.clone().addScaledVector(n, 25), n.clone().negate()) || c;
      pos.addScaledVector(n, 0.05);
    } else return null;
    z.position.copy(pos); z.userData.axe = true;
    z.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n.normalize());
    A.add(z); return z;
  };
  for (const [nom, src] of Object.entries(base.noms)) {
    const z = poser(nom, src); if (!z) continue;
    z.userData.nom = nom; if (src.userData.vue) z.userData.vue = src.userData.vue; N[nom] = z;
  }
  // molette de mode : la vraie pièce du modèle géométrique, posée sur le dessus du corps
  const cad = base.commandes.dial;
  if (cad && cad.userData.type === 'cadran') {
    const p = toucher(new THREE.Vector3(cad.position.x, 40, cad.position.z), new THREE.Vector3(0, -1, 0));
    base.groupe.remove(cad); cad.position.set(cad.position.x, (p ? p.y : cad.position.y) + 0.12, cad.position.z); A.add(cad);
    C.dial = cad; N['Sélecteur de mode'] = cad; cad.userData.nom = 'Sélecteur de mode';
  }
  // commandes du dos (sur la photo) et du dessus
  for (const [c, nom] of Object.entries(D.cmd)) if (N[nom]) { const z = zone(0.45); z.position.copy(N[nom].position); z.quaternion.copy(N[nom].quaternion); z.userData = { c, type: 'bouton', axe: true }; A.add(z); C[c] = z; }
  if (C.ok) [['up', 0, 1], ['down', 0, -1], ['left', 1, 0], ['right', -1, 0]].forEach(([c, dx, dy]) => {
    const z = zone(0.4); z.position.copy(C.ok.position).add(new THREE.Vector3(dx * 0.95, dy * 0.95, 0)); z.quaternion.copy(C.ok.quaternion);
    z.userData = { c, type: 'bouton', axe: true }; A.add(z); C[c] = z;
  });
  for (const c of ['menu', 'i', 'info', 'ok', 'up', 'down', 'left', 'right']) if (!C[c] && base.commandes[c]) { const z = poser('_' + c, base.commandes[c]); if (z) { z.userData = { c, type: 'bouton', axe: true }; C[c] = z; } }
  if (!C.dial && base.commandes.dial) {
    const z = poser('_dial', base.commandes.dial); if (z) { z.userData = { c: 'dial', type: 'bouton', axe: true }; C.dial = z; C.molettePrincipale = z; }
    if (base.commandes.dialBouton) { const b = poser('_mode', base.commandes.dialBouton); if (b) { b.userData = { c: 'dial', type: 'bouton', axe: true }; C.dialBouton = b; } }
  }
  if (base.commandes.half) { const z = poser('_declencheur', base.commandes.half); if (z) { z.userData = { c: 'half', type: 'bouton', axe: true }; C.half = z; } }
  // écran : zone de la photo où l'écran du simulateur vient se poser
  const e = D.ecran, p0 = surDos(e.x0 * 100, e.y0 * 100), p1 = surDos(e.x1 * 100, e.y1 * 100);
  C.ecran = { centre: p0.clone().add(p1).multiplyScalar(0.5).setZ(zDos - 0.02), l: Math.abs(p1.x - p0.x), h: Math.abs(p1.y - p0.y) };
  // centre du verre avant (pour la plongée dans l'objectif de l'accueil)
  const lentille = toucher(new THREE.Vector3(0.65, 3.75, 40), new THREE.Vector3(0, 0, -1)) || new THREE.Vector3(0.65, 3.75, ia.max.z);
  return { groupe: A, commandes: C, noms: N, modes: base.modes, centre: new THREE.Vector3(0, ia.max.y / 2, (ia.min.z + ia.max.z) / 2), taille: base.taille, lentille, ia: true };
}

/* Z50II « habillé » : formes nettes du modèle géométrique, couleurs et détails pris sur
   4 vues (face, dos, côtés) projetées sur chaque face selon son orientation.
   Repères relevés sur l'image (1082 × 976, 4 vues) : bords du boîtier et du viseur. */
const VUES_PEAU = {
  face: [14, 39.8, 422, 40.2], dos: [575, 39.45, 420, 40.0], gauche: [304, 45.5, 951, 45.7], droite: [586, 51.9, 950, 45.4]
};
async function habille(base, image) {
  const tx = await new THREE.TextureLoader().loadAsync(new URL(image, import.meta.url).href);
  tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; tx.generateMipmaps = true;
  const A = base.groupe; A.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(A.matrixWorld).invert(), rel = new THREE.Matrix4(), nm = new THREE.Matrix3();
  const V = VUES_PEAU, mats = new Map();
  const habiller = (mat, face) => {
    const cle = mat.uuid + (face ? 'f' : '');
    if (mats.has(cle)) return mats.get(cle);
    const m = mat.clone(); if (face) m.defines = Object.assign({}, m.defines, { PEAU_FACE: '' });
    m.onBeforeCompile = sh => {
      sh.uniforms.peau = { value: tx };
      sh.vertexShader = 'attribute vec3 pA;\nattribute vec3 nA;\nvarying vec3 vPA;\nvarying vec3 vNA;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvPA = pA; vNA = nA;');
      const f = (k, ax, sens) => `vec2((${V[k][0].toFixed(2)} + (${sens}) * ${V[k][1].toFixed(2)}) / 1082., 1. - (${V[k][2].toFixed(2)} - vPA.y * ${V[k][3].toFixed(2)}) / 976.)`;
      sh.fragmentShader = 'uniform sampler2D peau;\nvarying vec3 vPA;\nvarying vec3 vNA;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
  {
    vec3 nn = normalize(vNA);
    vec4 w = pow(max(vec4(nn.z, -nn.z, nn.x, -nn.x), 0.), vec4(5.));
    if (vPA.x < 2.0 && vPA.z > 1.7) { w.x += w.z; w.z = 0.; }   // flanc intérieur de la poignée : vue de face
    float wt = pow(abs(nn.y), 5.);
    #ifdef PEAU_FACE
    w = vec4(smoothstep(0.55, 0.9, nn.z), 0., 0., 0.); wt = 0.;
    #endif
    vec4 cF = texture2D(peau, ${f('face', 'x', 'vPA.x + 6.325')});
    vec4 cB = texture2D(peau, ${f('dos', 'x', '6.325 - vPA.x')});
    vec4 cG = texture2D(peau, ${f('gauche', 'z', '1.6 - vPA.z')});
    vec4 cD = texture2D(peau, ${f('droite', 'z', 'vPA.z + 2.75')});
    vec3 col = cF.rgb * cF.a * w.x + cB.rgb * cB.a * w.y + cG.rgb * cG.a * w.z + cD.rgb * cD.a * w.w;
    float aw = cF.a * w.x + cB.a * w.y + cG.a * w.z + cD.a * w.w;
    float s = w.x + w.y + w.z + w.w + wt + 1e-4;
    diffuseColor.rgb = mix(diffuseColor.rgb, col / max(aw, 1e-4) * 0.9, clamp(aw / s, 0., 1.));
  }`);
    };
    m.customProgramCacheKey = () => 'peau-' + cle;
    if (m.normalScale) m.normalScale = m.normalScale.clone().multiplyScalar(0.5);   // le grain est déjà sur la photo
    m.roughness = 0.62; m.envMapIntensity = 0.55; if ('clearcoat' in m) m.clearcoat = 0.12;
    if (face) { m.iridescence = 0; m.roughness = 0.2; m.clearcoat = 0.8; }
    mats.set(cle, m); return m;
  };
  const obj = base.commandes.objectif, avant = obj ? [obj.userData.avant] : [];
  for (const o of [...A.userData.peau, ...avant]) o.traverse(me => {
    if (!me.isMesh || me.material.transparent || me.material.type === 'MeshBasicMaterial') return;
    const face = avant.includes(o);
    rel.multiplyMatrices(inv, me.matrixWorld); nm.getNormalMatrix(rel);
    const g = me.geometry.clone(), p = g.attributes.position, n = g.attributes.normal;
    const pa = new Float32Array(p.count * 3), na = new Float32Array(p.count * 3), v = new THREE.Vector3();
    let dosSeul = false; for (let x = me; x; x = x.parent) if (x.userData && x.userData.peauDos) dosSeul = true;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(rel); pa.set([v.x, v.y, v.z], i * 3);
      v.fromBufferAttribute(n, i).applyMatrix3(nm).normalize();
      if (dosSeul && v.z > 0.3) v.set(0, 1, 0);   // traitée comme un dessus : couleur du boîtier
      na.set([v.x, v.y, v.z], i * 3);
    }
    g.setAttribute('pA', new THREE.BufferAttribute(pa, 3)); g.setAttribute('nA', new THREE.BufferAttribute(na, 3));
    me.geometry = g; me.material = habiller(me.material, face);
  });
  // les inscriptions dessinées font doublon avec la photo
  A.traverse(o => { if (o.userData.etiquette) o.visible = false; });
  base.photo = true;
  return base;
}

// Z50II : modèle net construit pièce par pièce (lib/z50ii.js, 10/11) ; l'ancien modèle géométrique reste dans GEOMETRIQUES
export const MODELES = { z50ii: async () => (await import('./z50ii.js')).z50ii(), d800: () => hybride('d800') };
export const SANS_3D = { d800: true };   // pas encore de modèle validé par Adrien
export const GEOMETRIQUES = { z50ii, d800 };

/* Regroupe toutes les pièces d'une même matière en un seul maillage (pour les vues où rien
   ne bouge, comme l'entrée de l'accueil) : des centaines d'appels de dessin deviennent une dizaine. */
export function fusionner(groupe) {
  groupe.updateMatrixWorld(true);
  const parMat = new Map(), garder = [];
  groupe.traverse(o => {
    if (!o.isMesh || !o.visible || (o.material && o.material.visible === false)) return;
    const m = o.material;
    if (m.map && !m.normalMap) { garder.push(o); return; }            // étiquettes : texture propre, on les garde
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'pA', 'nA'].includes(k)) g.deleteAttribute(k);   // pA / nA : peau photo du Z50II
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(o.matrixWorld);
    if (!parMat.has(m)) parMat.set(m, []); parMat.get(m).push(g);
  });
  const res = new THREE.Group();
  parMat.forEach((gs, m) => { const g = mergeGeometries(gs, false); if (g) res.add(new THREE.Mesh(g, m)); });
  garder.forEach(o => { const c = new THREE.Mesh(o.geometry, o.material); o.matrixWorld.decompose(c.position, c.quaternion, c.scale); res.add(c); });
  return res;
}

/* ------------------------------------------------------------------ visionneuse
   creerVisionneuse(conteneur, { modele: 'z50ii', vue: [lacet, tangage], zoom, fond: null,
                                 onCommande(c), ombre: true, libre: true })               */
export async function creerVisionneuse(conteneur, opts) {
  const { RoomEnvironment } = await import('./three/addons/RoomEnvironment.js');
  const o = Object.assign({ modele: 'z50ii', vue: [205, 22], zoom: 1, libre: true, limites: [140, 270, 2, 60] }, opts); opts = o;
  const modeste = (navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency || 8) <= 2;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, modeste ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.domElement.className = 'a3d-canvas';
  conteneur.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  const neuf = o.modele === 'z50ii';   // éclairage de studio (boîtes à lumière) pour le modèle détaillé
  scene.environment = pm.fromScene(neuf ? (await import('./z50ii.js')).studio() : new RoomEnvironment(renderer), neuf ? 0.03 : 0.04).texture;
  scene.environmentIntensity = neuf ? 1.0 : 0.75;
  const cle = new THREE.DirectionalLight(0xffffff, neuf ? 1.2 : 1.6); cle.position.set(6, 14, 8); scene.add(cle);
  const contre = new THREE.DirectionalLight(0xdfe9ff, 1.0); contre.position.set(-10, 6, -12); scene.add(contre);
  const m = await MODELES[o.modele]();
  const pivot = new THREE.Group(); pivot.add(m.groupe); m.groupe.position.sub(m.centre); scene.add(pivot);
  // ombre de contact : un dégradé doux sous l'appareil
  const ombreT = texte((x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(0.55, 'rgba(0,0,0,.18)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, 256, 256);
  const ombre = new THREE.Mesh(new THREE.PlaneGeometry(m.taille * 1.5, m.taille * 0.85), new THREE.MeshBasicMaterial({ map: ombreT, transparent: true, depthWrite: false, opacity: o.ombre === false ? 0 : 1 }));
  ombre.rotation.x = -Math.PI / 2; ombre.position.set(0, -m.centre.y - 0.55, 0.6 - m.centre.z); pivot.add(ombre);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 200);

  // écran de l'appareil : un élément HTML posé sur la vitre (CSS 3D)
  let css = null, ecranObj = null;
  if (o.ecranHTML) {
    const { CSS3DRenderer, CSS3DObject } = await import('./three/addons/CSS3DRenderer.js');
    css = new CSS3DRenderer(); css.domElement.className = 'a3d-css';
    conteneur.appendChild(css.domElement);
    const E = m.commandes.ecran, px = 720;
    o.ecranHTML.style.width = px + 'px'; o.ecranHTML.style.height = Math.round(px * E.h / E.l) + 'px';
    ecranObj = new CSS3DObject(o.ecranHTML);
    ecranObj.scale.setScalar(E.l / px);
    ecranObj.position.copy(E.centre); ecranObj.rotation.y = Math.PI;
    m.groupe.add(ecranObj);
  }

  // ---------- vue : orbite à la souris / au doigt, avec inertie
  const regard = new THREE.Vector3(...(o.regard || [0, 0, 0]));
  let lacet = o.vue[0], tangage = o.vue[1], vL = 0, vT = 0, cibleVue = null, distance = 0;
  const L = o.limites.slice();
  if (m.ia) L[3] = Math.min(L[3], 32);   // modèle hybride : le dos est une photo, on ne le regarde pas de trop haut
  function cadrer() {
    const r = conteneur.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false); renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
    if (css) css.setSize(w, h);
    camera.aspect = w / h;
    const fov = THREE.MathUtils.degToRad(camera.fov);
    distance = (m.taille * 0.62) / Math.tan(fov / 2) / Math.min(1, camera.aspect * 0.95) / o.zoom;
    camera.updateProjectionMatrix(); demander();
  }
  function placer() {
    const a = THREE.MathUtils.degToRad(lacet), b = THREE.MathUtils.degToRad(tangage);
    camera.position.set(Math.sin(a) * Math.cos(b) * distance, Math.sin(b) * distance, Math.cos(a) * Math.cos(b) * distance).add(regard);
    camera.lookAt(regard);
  }

  // ---------- animations des commandes
  const anims = [];
  function animer(duree, f, fin) { anims.push({ t0: performance.now(), duree, f, fin }); demander(); }
  const ease = t => 1 - Math.pow(1 - t, 3), ressort = t => 1 - Math.exp(-6 * t) * Math.cos(9 * t), ressortDoux = t => 1 - Math.exp(-7 * t) * Math.cos(6 * t);
  function enfoncer(obj) {
    if (obj.material && obj.material.visible === false) { const h = anneau(obj); if (h) { animer(420, t => { h.material.opacity = 1 - t; h.scale.setScalar(1 + t * 0.5); }, () => h.parent && h.parent.remove(h)); } return; }
    const base = obj.userData.base || (obj.userData.base = obj.position.clone());
    const n = new THREE.Vector3(0, 1, 0).applyQuaternion(obj.quaternion).multiplyScalar(-0.09);
    animer(260, t => { const k = t < 0.3 ? t / 0.3 : 1 - ease((t - 0.3) / 0.7); obj.position.copy(base).addScaledVector(n, k / 0.09 * 0.09); });
  }
  function basculer(z) {
    if (!z.userData.pad) return enfoncer(z);
    const p = z.userData.pad, d = z.userData.dir;
    animer(300, t => { const k = t < 0.3 ? t / 0.3 : 1 - ease((t - 0.3) / 0.7); p.rotation.set(d.y * 0.16 * k, 0, -d.x * 0.16 * k); });
  }
  let crans = 0;
  function tournerCadran(index) {
    const c = m.commandes.dial; if (!c) return;
    if (c.userData.type === 'cadran') {
      const n = c.userData.modes.length, de = c.rotation.y;
      let vers = -index / n * Math.PI * 2 + Math.PI / 2 - Math.PI / 2;
      vers = (index / n) * Math.PI * 2;
      while (vers - de > Math.PI) vers -= Math.PI * 2; while (vers - de < -Math.PI) vers += Math.PI * 2;
      animer(520, t => { c.rotation.y = de + (vers - de) * ressort(t); });
    } else {
      crans++; const de = c.rotation.y, vers = crans * Math.PI / 9;
      animer(420, t => { c.rotation.y = de + (vers - de) * ressort(t); });
    }
  }
  function tournerMolette(sens, obj) {
    const c = obj || m.commandes.molettePrincipale; if (!c) return;
    const de = c.rotation.y, vers = de + sens * Math.PI / 9;
    animer(360, t => { c.rotation.y = de + (vers - de) * ressort(t); });
  }
  function tournerBague(sens) {
    const b = m.commandes.objectif && m.commandes.objectif.userData.bague; if (!b) return;
    const de = b.rotation.z, vers = de + sens * 0.5;
    animer(600, t => { b.rotation.z = de + (vers - de) * ease(t); });
  }
  const DIAL_MOLETTE = m.commandes.dialBouton;   // D800 : le bouton MODE s'enfonce aussi
  function presser(c) {
    if (c === 'dial') { if (DIAL_MOLETTE) enfoncer(DIAL_MOLETTE); return; }
    const obj = m.commandes[c]; if (!obj) return;
    if (obj.userData.type === 'fleche') basculer(obj); else enfoncer(obj);
  }

  // ---------- commandes visées : halo jaune qui pulse
  const halos = new Map();
  function anneau(obj) {
    const b = new THREE.Box3().setFromObject(obj), sz = b.getSize(new THREE.Vector3()), ctr = b.getCenter(new THREE.Vector3());
    const t = [sz.x, sz.y, sz.z].sort((p, q) => q - p);
    if (t[0] > 4.2) return null;                       // grande pièce : pas d'anneau, la vue suffit
    const r = t[0] * 0.55 + 0.22;
    const h = new THREE.Mesh(new THREE.TorusGeometry(r, 0.07, 12, 64), new THREE.MeshBasicMaterial({ color: 0xffc400, transparent: true, opacity: 0.9, depthTest: false }));
    h.renderOrder = 10;
    const n = normale(obj);
    h.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
    ctr.addScaledVector(n, 0.15);
    m.groupe.worldToLocal(ctr); h.position.copy(ctr); m.groupe.add(h);
    return h;
  }
  // direction vers laquelle « regarde » une pièce : son axe y pour un bouton ou une molette, sinon depuis le centre
  function normale(obj) {
    if (obj.userData.normale) return obj.userData.normale.clone().applyQuaternion(obj.getWorldQuaternion(new THREE.Quaternion())).normalize();
    if (obj.userData.type || obj.userData.axe) return new THREE.Vector3(0, 1, 0).applyQuaternion(obj.getWorldQuaternion(new THREE.Quaternion())).normalize();
    const c = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());
    const d = c.sub(new THREE.Vector3(0, 0, 0)); d.y *= 0.6; return d.normalize();
  }
  function cibler(liste) {
    const cles = liste.map(x => typeof x === 'string' ? x : x.uuid);
    halos.forEach((h, c) => { if (cles.indexOf(c) < 0) { if (h) h.parent.remove(h); halos.delete(c); } });
    liste.forEach((x, k) => {
      const c = cles[k]; if (halos.has(c)) return;
      let obj = typeof x === 'string' ? m.commandes[x] : x;
      if (x === 'dial' && m.commandes.dialBouton) obj = m.commandes.dialBouton;
      if (!obj) return;
      halos.set(c, anneau(obj));
    });
    demander();
  }
  // Découvrir : montrer une pièce par son nom (la vue se tourne, la pièce s'anime)
  function montrer(nom) {
    tourActif = false;
    const obj = m.noms && m.noms[nom];
    if (!obj) { cibler([]); return false; }
    cibler([obj]);
    const d = normale(obj);
    let l = THREE.MathUtils.radToDeg(Math.atan2(d.x, d.z)) + 14, t = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(d.y, -1, 1))) * 0.8 + 10;
    if (obj.userData.vue) [l, t] = obj.userData.vue;
    while (l - lacet > 180) l -= 360; while (l - lacet < -180) l += 360;
    cibleVue = [THREE.MathUtils.clamp(l, L[0], L[1]), THREE.MathUtils.clamp(t, L[2], L[3])];
    actionner(obj);
    demander(); return true;
  }
  // mouvement aller-retour (la pièce bouge, reste un instant, puis revient)
  function allerRetour(f, aller, garde) {
    animer(aller, t => f(ressortDoux(t)), () => setTimeout(() => animer(aller * 0.8, t => f(1 - ease(t))), garde || 2600));
  }
  function actionner(obj) {
    if (obj.userData.anim) { allerRetour(obj.userData.anim, obj.userData.duree || 600, obj.userData.garde); return; }   // pièce qui fournit son propre mouvement
    if (obj.userData.orientable) { allerRetour(k => { obj.rotation.y = -2.95 * k; }, 1100); return; }
    if (obj.userData.flash) { const y0 = obj.userData.y0 ?? (obj.userData.y0 = obj.position.y); allerRetour(k => { obj.position.y = y0 + 0.62 * k; obj.rotation.x = -0.32 * k; }, 520); return; }
    if (m.commandes.objectif && obj === m.commandes.objectif.userData.bague) {
      const ob = m.commandes.objectif.userData; tournerBague(1);
      if (ob.course) allerRetour(k => { ob.avant.position.z = ob.course * k; }, 800);
      return;
    }
    if (obj === m.commandes.dial && obj.userData.type === 'cadran') { const k = obj.userData.k = ((obj.userData.k || 0) + 1) % obj.userData.modes.length; tournerCadran(k); return; }
    if (obj === m.commandes.molettePrincipale || obj.userData.molette) { tournerMolette(1, obj); return; }
    if (m.commandes.objectif && obj === m.commandes.objectif.userData.bague) { tournerBague(1); return; }
    if (obj.userData.type === 'fleche' || obj.userData.type === 'bouton' || obj.userData.appui || (obj.material && obj.material.visible === false)) { enfoncer(obj); return; }
  }

  // ---------- pointeur : glisser = tourner la vue, toucher une commande = l'actionner
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  const cliquables = []; Object.values(m.commandes).forEach(x => { if (x && x.isObject3D && x.userData.c) cliquables.push(x); });
  function viser(e, tout) {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hits = ray.intersectObjects(tout ? [m.groupe] : cliquables, true);
    for (const h of hits) {
      if (h.object.material && h.object.material.visible === false && !h.object.userData.c && !h.object.userData.nom) continue;
      let x = h.object; while (x && !x.userData.c && !x.userData.nom) x = x.parent;
      if (x) return tout ? x : x.userData.c;
      if (tout) return null;
    }
    return null;
  }
  // pièces qu'on tourne au doigt
  const rotatives = [m.commandes.dial, m.commandes.molettePrincipale, m.commandes.objectif && m.commandes.objectif.userData.bague].filter(x => x && x.isObject3D);
  let tourne = null;
  function prendre(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const h = ray.intersectObjects(rotatives, true)[0]; if (!h) return null;
    let x = h.object; while (x && rotatives.indexOf(x) < 0) x = x.parent;
    if (!x) return null;
    const bague = m.commandes.objectif && x === m.commandes.objectif.userData.bague;
    return { obj: x, bague, depart: bague ? x.rotation.z : x.rotation.y, x0: e.clientX, y0: e.clientY };
  }
  function lacher() {
    const t = tourne; tourne = null; if (!t) return;
    const o2 = t.obj;
    if (t.bague) return;
    if (o2.userData.type === 'cadran') {
      const n = o2.userData.modes.length, pas = Math.PI * 2 / n, k = Math.round(o2.rotation.y / pas), de = o2.rotation.y;
      animer(260, u => { o2.rotation.y = de + (k * pas - de) * ease(u); });
      if (opts.onCadran) opts.onCadran(((k % n) + n) % n);
    } else {
      const pas = Math.PI / 9, k = Math.round(o2.rotation.y / pas), de = o2.rotation.y, crans = Math.round((o2.rotation.y - t.depart) / pas);
      animer(220, u => { o2.rotation.y = de + (k * pas - de) * ease(u); });
      if (crans && opts.onMolette) opts.onMolette(o2, crans);
    }
  }
  let bas = null, glisse = false, dernier = null;
  const surface = css ? css.domElement : renderer.domElement;
  surface.style.touchAction = o.libre ? 'pan-y' : 'auto';
  surface.addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest('.a3d-ecran')) return; bas = { x: e.clientX, y: e.clientY, t: performance.now() }; dernier = bas; glisse = false; tourne = prendre(e); if (tourne) { try { surface.setPointerCapture(e.pointerId); } catch (x) {} } });
  window.addEventListener('pointermove', e => {
    if (!bas) { if (e.pointerType === 'mouse' && e.target === surface) surface.style.cursor = viser(e, !!o.onSelection) ? 'pointer' : (o.libre ? 'grab' : 'default'); return; }
    const dx = e.clientX - dernier.x, dy = e.clientY - dernier.y;
    if (!glisse && Math.hypot(e.clientX - bas.x, e.clientY - bas.y) > 6) glisse = true;
    if (glisse && tourne) {
      const d = (e.clientX - tourne.x0) - (e.clientY - tourne.y0) * 0.5;
      if (tourne.bague) tourne.obj.rotation.z = tourne.depart + d * 0.01; else tourne.obj.rotation.y = tourne.depart - d * 0.012;
      demander();
    } else if (glisse && o.libre) { vL = -dx * 0.35; vT = dy * 0.25; lacet += vL; tangage += vT; borner(); cibleVue = null; demander(); }
    dernier = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('pointerup', e => {
    if (!bas) return;
    if (glisse && tourne) { lacher(); bas = null; demander(); return; }
    tourne = null;
    if (!glisse) {
      if (o.onSelection) { const x = viser(e, true); if (x) { let y = x; while (y && !y.userData.nom) y = y.parent; if (y) o.onSelection(y.userData.nom); } }
      else { const c = viser(e); if (c && o.onCommande) o.onCommande(c); }
    }
    bas = null; demander();
  });
  function borner() { lacet = THREE.MathUtils.clamp(lacet, L[0], L[1]); tangage = THREE.MathUtils.clamp(tangage, L[2], L[3]); }

  // ---------- rendu à la demande (rien ne tourne quand rien ne bouge)
  // petit tour automatique au départ (Découvrir), arrêté dès qu'on touche l'appareil
  let tourActif = !!o.tour && !matchMedia('(prefers-reduced-motion: reduce)').matches, debutTour = performance.now(), visible3d = true;
  if (tourActif) new IntersectionObserver(es => { visible3d = es[0].isIntersecting; if (visible3d && tourActif) demander(); }).observe(conteneur);
  surface.addEventListener('pointerdown', () => { tourActif = false; }, { capture: true });
  let enCours = false;
  function demander() { if (!enCours) { enCours = true; if (!anims.length && !cibleVue) precedent = 0; requestAnimationFrame(image); } }
  let precedent = 0;
  function image(now) {
    enCours = false;
    let encore = false;
    const dt = precedent ? Math.min(0.1, (now - precedent) / 1000) : 1 / 60; precedent = now;
    const k60 = a => 1 - Math.pow(1 - a, dt * 60);   // même vitesse quelle que soit la cadence
    for (let i = anims.length - 1; i >= 0; i--) {
      const a = anims[i], t = Math.min(1, (now - a.t0) / a.duree); a.f(t);
      if (t >= 1) { anims.splice(i, 1); if (a.fin) a.fin(); } else encore = true;
    }
    if (!bas && (Math.abs(vL) > 0.02 || Math.abs(vT) > 0.02)) { vL *= Math.pow(0.9, dt * 60); vT *= Math.pow(0.9, dt * 60); lacet += vL; tangage += vT; borner(); encore = true; }
    if (tourActif && !bas && !cibleVue) {
      if (now - debutTour < (o.tourDuree || 12) * 1000 && visible3d) { lacet += o.tour * dt; encore = true; } else tourActif = false;
    }
    if (cibleVue) {
      lacet += (cibleVue[0] - lacet) * k60(0.12); tangage += (cibleVue[1] - tangage) * k60(0.12);
      if (Math.abs(cibleVue[0] - lacet) + Math.abs(cibleVue[1] - tangage) > 0.05) encore = true; else cibleVue = null;
    }
    if ([...halos.values()].some(Boolean)) { const k = Math.sin(now / 220); halos.forEach(h => { if (!h) return; h.material.opacity = 0.65 + 0.35 * k; h.scale.setScalar(1 + 0.08 * k); }); encore = true; }
    placer();
    renderer.render(scene, camera);
    if (css) css.render(scene, camera);
    if (encore) demander();
  }
  const ro = new ResizeObserver(cadrer); ro.observe(conteneur);
  cadrer();

  return {
    modele: m, presser, cibler, montrer, tournerCadran, tournerMolette, tournerBague,
    vue(l, t) { cibleVue = [l, t]; demander(); },
    zoomer(z) { o.zoom = z; cadrer(); },                       // rapprocher la caméra (vidéos, gros plans)
    viser(x, y, z) { regard.set(x, y, z); demander(); },       // point regardé, dans le repère centré du modèle
    set vueImmediate(v) { lacet = v[0]; tangage = v[1]; demander(); },
    get vueActuelle() { return [lacet, tangage]; },
    rendre: demander,
    // position à l'écran (px, dans le conteneur) d'une commande ou d'une pièce nommée : pour les tests
    position2D(cle) {
      const obj = m.commandes[cle] || (m.noms && m.noms[cle]); if (!obj) return null;
      placer(); camera.updateMatrixWorld();
      const c = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3()).project(camera), r = renderer.domElement.getBoundingClientRect();
      return { x: r.left + (c.x + 1) / 2 * r.width, y: r.top + (1 - c.y) / 2 * r.height };
    },
    capture() { placer(); renderer.render(scene, camera); return renderer.domElement.toDataURL('image/png'); },
    detruire() { ro.disconnect(); renderer.dispose(); conteneur.innerHTML = ''; }
  };
}
