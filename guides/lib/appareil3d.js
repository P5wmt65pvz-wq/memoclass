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
// étiquette imprimée sur une face (plan transparent)
function etiquette(txt, l, h, opts) {
  const o = opts || {};
  const t = texte((x, w, hh) => {
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
  tube(o.r - 0.05, o.r - 0.25, o.avant, M.corps, z1);            // avant
  tube(o.r - 0.25, o.r - 0.3, 0.12, M.metalSombre, z1 + o.avant); // jonc
  const z2 = z1 + o.avant + 0.12;
  const interieur = new THREE.Mesh(new THREE.CylinderGeometry(o.r - 0.42, o.r - 0.42, 0.5, 64, 1, true), M.gomme); interieur.rotation.x = Math.PI / 2; interieur.position.z = z2 - 0.25; g.add(interieur);
  const a = o.r - 0.42, Rs = a * 2.4, th = Math.asin(a / Rs);
  const lentille = new THREE.Mesh(new THREE.SphereGeometry(Rs, 96, 16, 0, Math.PI * 2, 0, th), M.verre);
  lentille.rotation.x = Math.PI / 2; lentille.position.z = z2 - 0.32 - Rs * Math.cos(th); g.add(lentille);
  // lentilles intérieures : reflets en anneaux
  [0.62, 0.38].forEach((k, i) => { const r = new THREE.Mesh(new THREE.TorusGeometry(a * k, 0.025, 8, 96), new THREE.MeshBasicMaterial({ color: i ? 0x5a3c8c : 0x2f6b4f, transparent: true, opacity: 0.6 })); r.position.z = z2 - 0.5 - i * 0.1; g.add(r); });
  // inscriptions de l'avant de l'objectif
  const t = texte((x, w, h) => {
    x.translate(w / 2, h / 2); x.fillStyle = '#cfcfd3'; x.font = '600 34px ' + POLICE; x.textAlign = 'center';
    const s = o.nom; const pas = 0.052;
    for (let i = 0; i < s.length; i++) { x.save(); x.rotate((i - s.length / 2) * pas - 0.6); x.fillText(s[i], 0, -h * 0.43); x.restore(); }
  }, 1024, 1024);
  const anneau = new THREE.Mesh(new THREE.RingGeometry(o.r - 0.42, o.r - 0.25, 96), new THREE.MeshStandardMaterial({ color: 0x111113, map: t, roughness: 0.6 }));
  anneau.position.z = z2 - 0.01; g.add(anneau);
  g.userData.bague = bague;
  g.userData.longueur = z2;
  return g;
}

/* ------------------------------------------------------------------ Nikon Z50II */
function z50ii() {
  const M = matieres(), A = new THREE.Group(), C = {}, N = {};     // C : commandes interactives, N : pièces nommées
  const n = (o, nom) => { o.userData.nom = nom; N[nom] = o; return o; };
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
  const hx = 0.75, hl = 4.6;
  const bossage = effiler(extrusion(profilZ([[-1.5, 6.8], [1.6, 6.8], [1.6, 7.3], [1.25, 8.4, 0.5, 9.12], [-0.6, 9.25], [-1.35, 9.25, -1.5, 8.6]]), hl, 0.42, M.corps, 'x'), hx - hl / 2, 6.9, 9.3, 0.74);
  A.add(bossage); n(bossage, 'Flash intégré');
  const logo = etiquette('Nikon', 3.0, 0.8, { style: 'italic 800 ', taille: 210 });
  logo.position.set(hx, 8.3, 1.2); logo.rotation.x = -0.54; A.add(logo);
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
  const dalle = boite(8.7, 5.9, 0.42, 0.22, M.corps); dalle.position.set(1.25, 3.35, zB - 0.25); ecran.add(dalle); n(dalle, 'Écran tactile orientable');
  const vitre = boite(7.6, 5.05, 0.06, 0.08, M.vitre); vitre.position.set(1.25, 3.35, zB - 0.48); ecran.add(vitre);
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
  // molettes de commande (principale à l'arrière, secondaire à l'avant de la poignée)
  const mPrinc = molette(0.85, 0.42, 36, M.gomme); mPrinc.position.set(-4.55, H + 0.15, zB + 0.25); A.add(mPrinc); C.molettePrincipale = mPrinc; n(mPrinc, 'Molette principale');
  const mSec = molette(0.75, 0.38, 32, M.gomme); mSec.position.set(-4.4, H - 0.65, 3.25); A.add(mSec); n(mSec, 'Molette secondaire');
  // dos : boutons
  const dos = (b, x, y) => { b.rotation.x = -Math.PI / 2; b.position.set(x, y, zB - 0.12); A.add(b); return b; };
  n(dos(bouton(0.36, 0.2, M.bouton, '#rafale'), 5.6, 6.6), 'Déclenchement / retardateur'); n(dos(bouton(0.36, 0.2, M.bouton, '#poubelle'), 4.6, 6.6), 'Suppression');
  n(dos(bouton(0.36, 0.2, M.bouton, 'DISP'), -1.55, 6.65), 'DISP'); n(dos(bouton(0.36, 0.2, M.bouton, '#moniteur'), -2.55, 6.65), 'Mode moniteur');
  n(dos(bouton(0.4, 0.22, M.bouton, 'AE-L'), -5.15, 6.05), 'AE-L/AF-L');
  C.i = dos(bouton(0.45, 0.24, M.bouton, 'i'), -5.0, 4.95); Object.assign(C.i.userData, { c: 'i', type: 'bouton' }); n(C.i, 'Touche i');
  // sélecteur multidirectionnel (anneau qui bascule) + OK
  const pad = new THREE.Group(); pad.rotation.x = -Math.PI / 2; pad.position.set(-4.85, 3.4, zB - 0.1); A.add(pad);
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
  n(dos(bouton(0.38, 0.2, M.bouton, '#loupe+'), -4.3, 1.75), 'Loupe avant'); C.menu = dos(bouton(0.42, 0.22, M.bouton, 'MENU'), -5.45, 1.75); Object.assign(C.menu.userData, { c: 'menu', type: 'bouton' }); n(C.menu, 'MENU');
  n(dos(bouton(0.38, 0.2, M.bouton, '#loupe-'), -4.3, 0.75), 'Loupe arrière / imagettes / aide'); n(dos(bouton(0.38, 0.2, M.bouton, '#lecture'), -5.45, 0.75), 'Visualisation');
  // façade : Fn1, Fn2, illuminateur AF, logo Z
  const face = (b, x, y) => { b.rotation.x = Math.PI / 2; b.position.set(x, y, zF + 0.08); A.add(b); return b; };
  n(face(bouton(0.28, 0.16, M.bouton), -2.65, 2.9), 'Fn1'); n(face(bouton(0.28, 0.16, M.bouton), -2.65, 2.0), 'Fn2');
  n(face(bouton(0.3, 0.18, M.bouton), hx + 3.75, 2.6), "Déverrouillage de l'objectif");
  const temoin = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), new THREE.MeshPhysicalMaterial({ color: 0x3a0a0a, clearcoat: 1 })); temoin.position.set(4.9, 6.4, zF + 0.05); A.add(temoin); n(temoin, "Témoin d'enregistrement");
  const lampe = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshPhysicalMaterial({ color: 0x2a1508, roughness: 0.1, clearcoat: 1 })); lampe.position.set(-2.55, 6.35, zF + 0.05); A.add(lampe); n(lampe, "Illuminateur d'assistance AF");
  const z = etiquette('Z', 0.9, 0.9, { style: 'italic 900 ', taille: 700 }); z.position.set(-2.25, 6.3, zF + 0.04); A.add(z);
  // anneaux de courroie
  [-W / 2 - 0.15, W / 2 + 0.15].forEach(x => { const t = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 12, 32), M.metal); t.position.set(x, 6.6, 0); t.rotation.y = Math.PI / 2; A.add(t); });
  // objectif NIKKOR Z DX 16-50 (rentré)
  const obj = objectif(M, { r: 3.25, bague: 1.25, avant: 1.0, nom: 'NIKKOR Z DX 16-50mm 1:3.5-6.3 VR' });
  obj.position.set(hx - 0.1, 3.75, zF); A.add(obj); C.objectif = obj; n(obj.userData.bague, "L'objectif"); n(obj.children[0], 'La monture Z'); N['Le capteur'] = obj; N['Les contacts'] = obj.children[0];
  return { groupe: A, commandes: C, noms: N, modes: MODES, centre: new THREE.Vector3(0, 4.6, 0.3), taille: 13 };
}

/* ------------------------------------------------------------------ Nikon D800 */
function d800() {
  const M = matieres(), A = new THREE.Group(), C = {}, N = {};
  const n = (o, nom) => { o.userData.nom = nom; N[nom] = o; return o; };
  const W = 14.6, H = 9.0, zB = -2.1, zF = 2.1;
  const corps = extrusion([
    [-W / 2 + 0.6, 2.1], [W / 2 - 0.6, 2.1], [W / 2, 2.1, W / 2, 1.5], [W / 2, -1.6], [W / 2, -2.1, W / 2 - 0.6, -2.1],
    [-3.6, -2.1], [-3.95, -2.6, -4.05, -3.3], [-4.2, -4.6, -5.4, -4.8], [-6.8, -4.85, -7.1, -4.0], [-W / 2, -3.2, -W / 2, -1.6], [-W / 2, 1.5], [-W / 2, 2.1, -W / 2 + 0.6, 2.1]
  ], H, 0.55, M.corps, 'y');
  A.add(corps); n(corps, 'Volet des cartes mémoire');
  const cuirG = extrusion([[-W / 2 + 0.06, 0.4], [-3.65, 0.4], [-3.65, -2.12], [-4.0, -2.6, -4.1, -3.3], [-4.25, -4.65, -5.4, -4.86], [-6.8, -4.92, -7.15, -4.02], [-W / 2 - 0.06, -3.2, -W / 2 - 0.06, -1.6]], 6.6, 0.22, M.cuir, 'y');
  cuirG.position.y = 0.8; A.add(cuirG); n(cuirG, 'La poignée');
  const cuirD = boite(3.2, 6.4, 0.12, 0.05, M.cuir); cuirD.position.set(5.4, 4.1, zF + 0.04); A.add(cuirD);
  // prisme (plus haut, faces inclinées)
  const hx = 0.6, hl = 5.6;
  const prisme = effiler(extrusion(profilZ([[-1.9, 8.6], [2.0, 8.6], [2.0, 9.4], [1.55, 10.9, 0.6, 11.75], [-0.8, 11.88], [-1.75, 11.85, -1.9, 11.0]]), hl, 0.5, M.corps, 'x'), hx - hl / 2, 8.7, 11.9, 0.66);
  A.add(prisme); n(prisme, 'Flash intégré et son ouverture');
  const logo = etiquette('Nikon', 3.6, 0.95, { style: 'italic 800 ', taille: 210 }); logo.position.set(hx, 10.2, 1.66); logo.rotation.x = -0.5; A.add(logo);
  const nom = etiquette('D800', 1.6, 0.5, { style: '700 ', taille: 190 }); nom.position.set(-3.9, 8.0, zF + 0.05); A.add(nom);
  const sabot = boite(2.2, 0.12, 2.0, 0.04, M.metal); sabot.position.set(hx, 11.93, -0.2); A.add(sabot);
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
  return { groupe: A, commandes: C, noms: N, modes: ['P', 'S', 'A', 'M'], centre: new THREE.Vector3(0, 5.6, 0.6), taille: 15 };
}

export const MODELES = { z50ii, d800 };

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
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
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
  const o = Object.assign({ modele: 'z50ii', vue: [205, 22], zoom: 1, libre: true, limites: [140, 270, 2, 60] }, opts);
  const modeste = (navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency || 8) <= 2;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, modeste ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.domElement.className = 'a3d-canvas';
  conteneur.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.environmentIntensity = 0.75;
  const cle = new THREE.DirectionalLight(0xffffff, 1.6); cle.position.set(6, 14, 8); scene.add(cle);
  const contre = new THREE.DirectionalLight(0xdfe9ff, 1.0); contre.position.set(-10, 6, -12); scene.add(contre);
  const m = MODELES[o.modele]();
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
  const L = o.limites;
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
  const ease = t => 1 - Math.pow(1 - t, 3), ressort = t => 1 - Math.exp(-6 * t) * Math.cos(9 * t);
  function enfoncer(obj) {
    const base = obj.userData.base || (obj.userData.base = obj.position.clone());
    const n = new THREE.Vector3(0, 1, 0).applyQuaternion(obj.quaternion).multiplyScalar(-0.09);
    animer(260, t => { const k = t < 0.3 ? t / 0.3 : 1 - ease((t - 0.3) / 0.7); obj.position.copy(base).addScaledVector(n, k / 0.09 * 0.09); });
  }
  function basculer(z) {
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
    const obj = m.noms && m.noms[nom];
    if (!obj) { cibler([]); return false; }
    cibler([obj]);
    const d = normale(obj);
    let l = THREE.MathUtils.radToDeg(Math.atan2(d.x, d.z)) + 14, t = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(d.y, -1, 1))) * 0.8 + 10;
    while (l - lacet > 180) l -= 360; while (l - lacet < -180) l += 360;
    cibleVue = [THREE.MathUtils.clamp(l, L[0], L[1]), THREE.MathUtils.clamp(t, L[2], L[3])];
    actionner(obj);
    demander(); return true;
  }
  function actionner(obj) {
    if (obj === m.commandes.dial && obj.userData.type === 'cadran') { const k = obj.userData.k = ((obj.userData.k || 0) + 1) % obj.userData.modes.length; tournerCadran(k); return; }
    if (obj === m.commandes.molettePrincipale || obj.userData.molette) { tournerMolette(1, obj); return; }
    if (m.commandes.objectif && obj === m.commandes.objectif.userData.bague) { tournerBague(1); return; }
    if (obj.userData.type === 'fleche' || obj.userData.type === 'bouton' || obj.userData.appui) { enfoncer(obj); return; }
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
      if (h.object.material && h.object.material.visible === false && !h.object.userData.c) continue;
      let x = h.object; while (x && !x.userData.c && !x.userData.nom) x = x.parent;
      if (x) return tout ? x : x.userData.c;
      if (tout) return null;
    }
    return null;
  }
  let bas = null, glisse = false, dernier = null;
  const surface = css ? css.domElement : renderer.domElement;
  surface.style.touchAction = o.libre ? 'pan-y' : 'auto';
  surface.addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest('.a3d-ecran')) return; bas = { x: e.clientX, y: e.clientY, t: performance.now() }; dernier = bas; glisse = false; });
  window.addEventListener('pointermove', e => {
    if (!bas) { if (e.pointerType === 'mouse' && e.target === surface) surface.style.cursor = viser(e, !!o.onSelection) ? 'pointer' : (o.libre ? 'grab' : 'default'); return; }
    const dx = e.clientX - dernier.x, dy = e.clientY - dernier.y;
    if (!glisse && Math.hypot(e.clientX - bas.x, e.clientY - bas.y) > 6) glisse = true;
    if (glisse && o.libre) { vL = -dx * 0.35; vT = dy * 0.25; lacet += vL; tangage += vT; borner(); cibleVue = null; demander(); }
    dernier = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('pointerup', e => {
    if (!bas) return;
    if (!glisse) {
      if (o.onSelection) { const x = viser(e, true); if (x) { let y = x; while (y && !y.userData.nom) y = y.parent; if (y) o.onSelection(y.userData.nom); } }
      else { const c = viser(e); if (c && o.onCommande) o.onCommande(c); }
    }
    bas = null; demander();
  });
  function borner() { lacet = THREE.MathUtils.clamp(lacet, L[0], L[1]); tangage = THREE.MathUtils.clamp(tangage, L[2], L[3]); }

  // ---------- rendu à la demande (rien ne tourne quand rien ne bouge)
  let enCours = false;
  function demander() { if (!enCours) { enCours = true; requestAnimationFrame(image); } }
  function image(now) {
    enCours = false;
    let encore = false;
    for (let i = anims.length - 1; i >= 0; i--) {
      const a = anims[i], t = Math.min(1, (now - a.t0) / a.duree); a.f(t);
      if (t >= 1) { anims.splice(i, 1); if (a.fin) a.fin(); } else encore = true;
    }
    if (!bas && (Math.abs(vL) > 0.02 || Math.abs(vT) > 0.02)) { vL *= 0.9; vT *= 0.9; lacet += vL; tangage += vT; borner(); encore = true; }
    if (cibleVue) {
      lacet += (cibleVue[0] - lacet) * 0.12; tangage += (cibleVue[1] - tangage) * 0.12;
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
    set vueImmediate(v) { lacet = v[0]; tangage = v[1]; demander(); },
    get vueActuelle() { return [lacet, tangage]; },
    rendre: demander,
    capture() { placer(); renderer.render(scene, camera); return renderer.domElement.toDataURL('image/png'); },
    detruire() { ro.disconnect(); renderer.dispose(); conteneur.innerHTML = ''; }
  };
}
