/* Nikon Z50II en 3D, construit en code. Le boîtier vient de modeles/z50ii-corps.bin
   (formes mathématiques converties en maillage par outils3d/z50ii/corps.py) ; toutes les
   commandes sont des pièces séparées construites ici. Unité : le centimètre.
   x : droite vu de face (poignée à x < 0) ; y : haut ; z : avant. three.js r160 (MIT). */
import * as THREE from 'three';
import { RoundedBoxGeometry } from './three/addons/RoundedBoxGeometry.js';
import { toCreasedNormals } from './three/addons/BufferGeometryUtils.js';

const POLICE = '"Inter", "Helvetica Neue", Arial, sans-serif';
const MX = 1.6, MY = 3.96, ZF = 1.6, ZB = -1.6, H = 7.3;

export async function chargerCorps(url) {
  const buf = await (await fetch(url)).arrayBuffer(), dv = new DataView(buf), hl = dv.getUint32(0, true);
  const H = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hl))), base = 4 + hl, out = {};
  for (const m of H.mailles) {
    let o = base + m.debut;
    const pos = new Int16Array(buf.slice(o, o + m.sommets * 6)); o += m.sommets * 6;
    const nor = new Int16Array(buf.slice(o, o + m.sommets * 6)); o += m.sommets * 6 + m.pad;
    let uv = null; if (m.uv) { uv = new Float32Array(buf.slice(o, o + m.sommets * 8)); o += m.sommets * 8; }
    const idx = m.i16 ? new Uint16Array(buf.slice(o, o + m.triangles * 6)) : new Uint32Array(buf.slice(o, o + m.triangles * 12));
    const g = new THREE.BufferGeometry(), P = new Float32Array(m.sommets * 3), k = H.echelle / 32767;
    for (let i = 0; i < P.length; i++) P[i] = pos[i] * k;
    g.setAttribute('position', new THREE.BufferAttribute(P, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3, true));
    if (uv) g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    out[m.nom] = g;
  }
  return out;
}

/* éclairage de studio : boîtes à lumière autour d'un fond sombre (pour les reflets sur le noir) */
export function studio() {
  const s = new THREE.Scene();
  const mur = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ color: 0x08080a, side: THREE.BackSide })); mur.scale.setScalar(40); s.add(mur);
  const p = (w, h, x, y, z, i, c) => { const mt = new THREE.MeshBasicMaterial(); mt.color.set(c || 0xffffff).multiplyScalar(i); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mt); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  p(16, 9, 0, 13, 4, 10);               // grande boîte à lumière au-dessus
  p(3.5, 16, -13, 2, 5, 9, 0xdfe8ff);   // bande à gauche
  p(3.5, 16, 13, 3, 3, 6, 0xfff1e0);    // bande à droite
  p(12, 3, 0, 5, -13, 6);               // contre-jour
  p(10, 3, 0, -11, 6, 1.5);             // rebond du sol
  return s;
}

function grain(taille, force) {
  const c = document.createElement('canvas'); c.width = c.height = taille;
  const g = c.getContext('2d'), h = new Float32Array(taille * taille);
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < taille * taille * 0.55; k++) {
    const x = rnd() * taille | 0, y = rnd() * taille | 0, r = 1.2 + rnd() * 2.6;
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
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
    im.data[i * 4] = (-dx * n * 0.5 + 0.5) * 255; im.data[i * 4 + 1] = (dy * n * 0.5 + 0.5) * 255; im.data[i * 4 + 2] = (n * 0.5 + 0.5) * 255; im.data[i * 4 + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

export function matieres() {
  return {
    peinture: new THREE.MeshPhysicalMaterial({ color: 0x0d0d0e, roughness: 0.5, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.45 }),
    cuir: new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.82, normalMap: grain(256, 3.4), normalScale: new THREE.Vector2(1.1, 1.1) }),
    joint: new THREE.MeshBasicMaterial({ color: 0x020202 }),
    gomme: new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.93 }),
    bouton: new THREE.MeshPhysicalMaterial({ color: 0x131315, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
    metal: new THREE.MeshStandardMaterial({ color: 0xd5d7db, roughness: 0.24, metalness: 1 }),
    metalSombre: new THREE.MeshStandardMaterial({ color: 0x3a3b40, roughness: 0.32, metalness: 1 }),
    rouge: new THREE.MeshPhysicalMaterial({ color: 0xd3141c, roughness: 0.35, clearcoat: 0.6 }),
    vitre: new THREE.MeshPhysicalMaterial({ color: 0x020203, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03 }),
    collerette: new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.62 }),
    noirSatin: new THREE.MeshStandardMaterial({ color: 0x070708, roughness: 0.5 }),
    noirMat: new THREE.MeshStandardMaterial({ color: 0x030303, roughness: 0.95 }),
    chrome: new THREE.MeshPhysicalMaterial({ color: 0xdfe1e6, roughness: 0.26, metalness: 1, anisotropy: 0.55 }),
    or: new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.3, metalness: 1 }),
    blanc: new THREE.MeshBasicMaterial({ color: 0xe6e6e6 }),
    capteur: new THREE.MeshPhysicalMaterial({ color: 0x0b1f1a, roughness: 0.14, metalness: 0.55, clearcoat: 1, clearcoatRoughness: 0.05, iridescence: 1, iridescenceIOR: 1.9, iridescenceThicknessRange: [220, 720] }),
    verreObj: new THREE.MeshPhysicalMaterial({ color: 0x04060b, roughness: 0.03, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [180, 520], envMapIntensity: 0.6 }),
    diffuseur: new THREE.MeshPhysicalMaterial({ color: 0xf2f2ee, roughness: 0.3, clearcoat: 0.6, emissive: 0xffffff, emissiveIntensity: 0 }),
  };
}


/* ------------------------------------------------------------------ outils */
function toile(dessin, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; dessin(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
let _rain = null;
function rainures(n, force) {   // carte de relief : n stries autour d'une pièce de révolution
  if (!_rain) {
    const c = document.createElement('canvas'); c.width = 32; c.height = 4; const g = c.getContext('2d'), im = g.createImageData(32, 4);
    for (let x = 0; x < 32; x++) { const s = Math.cos(x / 32 * Math.PI * 2) * 1.6, k = 1 / Math.hypot(s, 1); for (let y = 0; y < 4; y++) { const i = (y * 32 + x) * 4; im.data[i] = (-s * k * .5 + .5) * 255; im.data[i + 1] = 128; im.data[i + 2] = (k * .5 + .5) * 255; im.data[i + 3] = 255; } }
    g.putImageData(im, 0, 0); _rain = new THREE.CanvasTexture(c); _rain.wrapS = _rain.wrapT = THREE.RepeatWrapping;
  }
  const t = _rain.clone(); t.needsUpdate = true; t.repeat.set(n, 1); return { normalMap: t, normalScale: new THREE.Vector2(force || 1, force || 1) };
}
const strie = (mat, n, force) => { const m = mat.clone(); Object.assign(m, rainures(n, force)); return m; };
function tour(profil, seg, angle) {   // profil [[rayon, hauteur], …] tourné autour de y
  const g = new THREE.LatheGeometry(profil.map(p => new THREE.Vector2(Math.max(p[0], 1e-4), p[1])), seg || 64);
  return angle === 0 ? g : toCreasedNormals(g, angle || Math.PI / 5);
}
const boite = (w, h, d, r, mat) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2, h / 2, d / 2) - 1e-4), mat);
const pose = (o, x, y, z, rx, ry, rz) => { o.position.set(x, y, z); if (rx || ry || rz) o.rotation.set(rx || 0, ry || 0, rz || 0); return o; };
function uvBoite(g, ech) {            // coordonnées de texture par projection (similicuir)
  const n = g.toNonIndexed(), P = n.attributes.position, uv = new Float32Array(P.count * 2), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < P.count; i += 3) {
    a.fromBufferAttribute(P, i); b.fromBufferAttribute(P, i + 1); c.fromBufferAttribute(P, i + 2);
    const nx = Math.abs((b.y - a.y) * (c.z - a.z) - (b.z - a.z) * (c.y - a.y)), ny = Math.abs((b.z - a.z) * (c.x - a.x) - (b.x - a.x) * (c.z - a.z)), nz = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
    const ax = nx > ny && nx > nz ? 0 : ny > nz ? 1 : 2;
    [a, b, c].forEach((p, k) => { uv[(i + k) * 2] = (ax === 0 ? p.z : p.x) * ech; uv[(i + k) * 2 + 1] = (ax === 1 ? p.z : p.y) * ech; });
  }
  n.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return n;
}

/* pictogrammes gravés sur les touches (traits blancs, comme sur l'appareil) */
function picto(x, n, w, h) {
  x.translate(w / 2, h / 2); const b = () => x.beginPath(), s = w / 256; x.scale(s, s);
  if (n === 'poubelle') { b(); x.moveTo(-40, -38); x.lineTo(40, -38); x.moveTo(-14, -52); x.lineTo(14, -52); x.stroke(); b(); x.moveTo(-32, -26); x.lineTo(-24, 52); x.lineTo(24, 52); x.lineTo(32, -26); x.moveTo(-10, -12); x.lineTo(-8, 36); x.moveTo(10, -12); x.lineTo(8, 36); x.stroke(); }
  else if (n === 'lecture') { x.lineWidth = 10; x.strokeRect(-56, -40, 112, 80); b(); x.moveTo(-16, -22); x.lineTo(22, 0); x.lineTo(-16, 22); x.closePath(); x.fill(); }
  else if (n === 'rafale') { x.lineWidth = 10; x.strokeRect(-46, -14, 66, 46); b(); x.moveTo(-30, -14); x.lineTo(-30, -30); x.lineTo(36, -30); x.lineTo(36, 16); x.lineTo(20, 16); x.moveTo(-14, -30); x.lineTo(-14, -46); x.lineTo(52, -46); x.lineTo(52, 0); x.lineTo(36, 0); x.stroke(); }
  else if (n === 'loupe+' || n === 'loupe-') { b(); x.arc(-10, -10, 34, 0, 7); x.stroke(); b(); x.moveTo(16, 16); x.lineTo(46, 46); x.moveTo(-28, -10); x.lineTo(8, -10); if (n === 'loupe+') { x.moveTo(-10, -28); x.lineTo(-10, 8); } x.stroke(); }
  else if (n === 'moniteur') { x.lineWidth = 11; b(); x.moveTo(-52, -34); x.lineTo(-52, 34); x.moveTo(52, -34); x.lineTo(52, 34); x.stroke(); x.strokeRect(-30, -24, 60, 48); }
  else if (n === 'pc') { x.lineWidth = 9; x.strokeRect(-46, -34, 92, 68); b(); x.moveTo(-34, 22); x.lineTo(-10, -6); x.lineTo(6, 10); x.lineTo(20, -4); x.lineTo(34, 22); x.stroke(); b(); x.arc(22, -18, 7, 0, 7); x.fill(); }
  else if (n === 'expo') { x.lineWidth = 9; x.strokeRect(-46, -40, 92, 80); b(); x.moveTo(-46, 40); x.lineTo(46, -40); x.moveTo(-30, -14); x.lineTo(-6, -14); x.moveTo(-18, -26); x.lineTo(-18, -2); x.moveTo(8, 18); x.lineTo(32, 18); x.stroke(); }
  else if (n === 'rec') { b(); x.arc(0, 0, 44, 0, 7); x.fillStyle = '#e0252d'; x.fill(); }
  else if (n === 'cle') { x.lineWidth = 14; b(); x.arc(-34, 0, 22, 0, 7); x.stroke(); b(); x.moveTo(-10, 0); x.lineTo(60, 0); x.moveTo(34, 0); x.lineTo(34, 22); x.moveTo(54, 0); x.lineTo(54, 20); x.stroke(); }
  else if (n === 'retardateur') { x.lineWidth = 12; b(); x.arc(0, 8, 44, 0, 7); x.stroke(); b(); x.moveTo(0, 8); x.lineTo(0, -22); x.moveTo(-14, -52); x.lineTo(14, -52); x.moveTo(38, -40); x.lineTo(50, -52); x.stroke(); }
  else if (n === 'photo') { x.lineWidth = 12; b(); x.roundRect(-52, -30, 104, 70, 10); x.fill(); x.fillRect(-22, -46, 44, 20); x.globalCompositeOperation = 'destination-out'; b(); x.arc(0, 6, 20, 0, 7); x.fill(); }
  else if (n === 'video') { b(); x.roundRect(-54, -28, 74, 56, 8); x.fill(); b(); x.moveTo(24, -6); x.lineTo(54, -26); x.lineTo(54, 26); x.lineTo(24, 6); x.closePath(); x.fill(); }
}
function gravure(label, taille, couleur) {
  return toile((x, w, h) => {
    x.fillStyle = x.strokeStyle = couleur || '#e9e9ec'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 12; x.lineCap = x.lineJoin = 'round';
    if (label[0] === '#') { picto(x, label.slice(1), w, h); return; }
    const L = label.split('\n'), fs = (L.length > 1 ? 58 : label.length > 3 ? 62 : label.length > 1 ? 84 : 128) * w / 256 * (taille || 1);
    x.font = (label === 'i' ? 'italic 700 ' + fs * 1.15 + 'px Georgia, serif' : '700 ' + fs + 'px ' + POLICE);
    L.forEach((l, i) => x.fillText(l, w / 2, h / 2 + (i - (L.length - 1) / 2) * fs * 1.08 + fs * 0.06));
  }, 256, 256);
}
// plaquette imprimée (texte ou pictogramme) posée sur une surface
function imprime(label, l, h, o) {
  o = o || {};
  const t = toile((x, w, hh) => {
    x.fillStyle = x.strokeStyle = o.couleur || '#dcdcdf'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 12; x.lineCap = x.lineJoin = 'round';
    if (label[0] === '#') { picto(x, label.slice(1), w, hh); return; }
    x.font = (o.style || '700 ') + (o.taille || 0.62) * hh + 'px ' + (o.police || POLICE); x.fillText(label, w / 2, hh / 2 + hh * 0.04);
  }, o.px || 512, Math.round((o.px || 512) * h / l));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(l, h), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.55, metalness: o.metal ? 0.9 : 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.userData.etiquette = true; return m;
}

/* touche ronde : capuchon chanfreiné, collerette, gravure. Axe d'appui : y local. */
function touche(r, h, mat, label, o) {
  o = o || {}; const g = new THREE.Group(); g.userData.appui = true; g.userData.axe = true;
  g.add(new THREE.Mesh(tour([[r, -0.06], [r, h * 0.72], [r * 0.9, h], [0, h + (o.bombe || 0)]], 40), mat));
  if (o.collerette !== false) g.add(new THREE.Mesh(tour([[r * 1.22, -0.02], [r * 1.22, 0.012], [r * 1.06, 0.03], [r * 1.02, 0.0]], 40), o.matCol || MAT.collerette));
  if (label) { const p = new THREE.Mesh(new THREE.CircleGeometry(r * 0.86, 40), new THREE.MeshStandardMaterial({ map: gravure(label, o.taille, o.couleur), transparent: true, roughness: 0.5, depthWrite: false })); p.rotation.set(-Math.PI / 2, 0, o.face === 'avant' ? 0 : Math.PI); p.position.y = h + 0.004; g.add(p); }
  return g;
}
/* molette crantée (axe y) : flanc strié, dessus légèrement creusé */
function molette(r, h, n, mat, matHaut) {
  const g = new THREE.Group(); g.userData.molette = true; g.userData.axe = true;
  const cote = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h * 0.84, 72, 1, true), strie(mat, n, 1.3)); cote.position.y = h * 0.5; g.add(cote);
  g.add(new THREE.Mesh(tour([[r, h * 0.92], [r * 0.94, h], [r * 0.5, h * 0.97], [0, h * 0.97]], 72), matHaut || mat));
  g.add(new THREE.Mesh(tour([[r * 0.97, 0], [r, h * 0.08]], 72, 0), mat));
  return g;
}
let MAT = null;

/* ------------------------------------------------------------------ objectif NIKKOR Z DX 16-50 mm (axe +z, origine : la bride) */
function objectif(M) {
  const g = new THREE.Group(), R = 3.5;
  const axe = (geo, mat, parent) => { const m = new THREE.Mesh(geo, mat); m.rotation.x = Math.PI / 2; (parent || g).add(m); return m; };
  axe(tour([[3.12, 0.0], [3.3, 0.03], [3.44, 0.2], [3.44, 0.8], [3.3, 0.8]], 96), M.peinture);                   // fût fixe
  const rep = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), M.blanc); pose(rep, 0, 3.445, 0.62, -Math.PI / 2, 0, 0); g.add(rep);   // repère des focales
  const bague = new THREE.Group(); g.add(bague);                                                                  // bague de zoom (tourne)
  axe(tour([[3.38, 0.82], [3.5, 0.88], [3.5, 1.04]], 96), M.gomme, bague);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.88, 96, 1, true), strie(M.gomme, 110, 1.6)); st.rotation.x = Math.PI / 2; st.position.z = 1.48; bague.add(st);
  axe(tour([[3.5, 1.92], [3.42, 1.98], [3.3, 1.98]], 96), M.gomme, bague);
  const foc = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.006, R + 0.006, 0.15, 96, 1, true), new THREE.MeshStandardMaterial({ transparent: true, depthWrite: false, roughness: 0.6, map: toile((x, w, h) => {
    x.fillStyle = '#dcdcdf'; x.font = '700 ' + h * 0.82 + 'px ' + POLICE; x.textAlign = 'center'; x.textBaseline = 'middle';
    ['16', '24', '35', '50'].forEach((t, i) => x.fillText(t, w * (0.5 + i * 0.043), h / 2 + 2));
  }, 4096, 64) }));
  foc.rotation.x = Math.PI / 2; foc.position.z = 0.955; bague.add(foc);
  const regl = new THREE.Mesh(new THREE.CylinderGeometry(3.38, 3.38, 0.3, 96, 1, true), strie(M.peinture, 220, 0.9)); regl.rotation.x = Math.PI / 2; regl.position.z = 2.16; g.add(regl);   // bague de réglage
  axe(tour([[3.3, 1.98], [3.38, 2.01]], 96, 0), M.peinture);
  const avant = new THREE.Group(); g.add(avant);                                                                  // partie qui se déploie
  axe(tour([[3.06, 0.3], [3.06, 2.34]], 72, 0), M.peinture, avant);
  axe(tour([[3.2, 0.5], [3.2, 2.3]], 72, 0), M.noirSatin);                                                         // manchon fixe
  const culasse = new THREE.Mesh(new THREE.RingGeometry(1.25, 3.12, 64), M.noirSatin); pose(culasse, 0, 0, 0.012, 0, Math.PI, 0); g.add(culasse);
  const bride = new THREE.Mesh(new THREE.RingGeometry(2.45, 2.72, 64), M.chrome); pose(bride, 0, 0, 0.006, 0, Math.PI, 0); g.add(bride);
  const lArr = new THREE.Mesh(new THREE.CircleGeometry(1.25, 48), M.verreObj); pose(lArr, 0, 0, 0.03, 0, Math.PI, 0); g.add(lArr);
  axe(tour([[3.3, 2.3], [3.36, 2.34], [3.36, 2.52], [3.24, 2.62], [2.42, 2.62]], 96), M.peinture, avant);
  axe(tour([[2.42, 2.62], [2.36, 2.57], [2.36, 2.3], [2.06, 2.22], [2.06, 2.12], [1.72, 2.04], [1.72, 1.94], [1.34, 1.86], [1.34, 1.8], [1.16, 1.76]], 96), M.noirSatin, avant);
  const Rs = 2.3, th = Math.asin(1.16 / Rs);
  const lentille = new THREE.Mesh(new THREE.SphereGeometry(Rs, 64, 12, 0, Math.PI * 2, 0, th), M.verreObj); lentille.rotation.x = Math.PI / 2; lentille.position.z = 1.77 - Rs * Math.cos(th); avant.add(lentille);
  [[0.78, 0x2f6b4f, 1.8], [0.46, 0x5a3c8c, 1.84]].forEach(([r, c, z]) => { const a = new THREE.Mesh(new THREE.TorusGeometry(r, 0.02, 6, 64), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55 })); a.position.z = z; avant.add(a); });
  const txt = toile((x, w, h) => {
    x.translate(w / 2, h / 2); x.fillStyle = '#cfcfd3'; x.font = '600 40px ' + POLICE; x.textAlign = 'center';
    const s = 'NIKKOR Z DX 16-50mm 1:3.5-6.3 VR', pas = 0.056;
    for (let i = 0; i < s.length; i++) { x.save(); x.rotate((i - (s.length - 1) / 2) * pas); x.fillText(s[i], 0, -h * 0.418); x.restore(); }
    x.rotate(Math.PI); x.font = '600 36px ' + POLICE; const s2 = 'Ø46'; for (let i = 0; i < s2.length; i++) { x.save(); x.rotate((i - 1) * 0.055); x.fillText(s2[i], 0, -h * 0.418); x.restore(); }
  }, 1024, 1024);
  const anneau = new THREE.Mesh(new THREE.RingGeometry(2.42, 3.24, 96), new THREE.MeshStandardMaterial({ map: txt, transparent: true, roughness: 0.6, depthWrite: false })); anneau.position.z = 2.624; avant.add(anneau);
  Object.assign(g.userData, { bague, avant, course: 1.7, longueur: 2.62 });
  return g;
}

/* ------------------------------------------------------------------ monture Z, gorge, capteur (repère du boîtier, centré sur l'axe) */
function monture(M) {
  const g = new THREE.Group();
  const axe = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.rotation.x = Math.PI / 2; g.add(m); return m; };
  const bague = axe(tour([[3.27, 1.98], [3.27, 2.17], [3.2, 2.235], [2.8, 2.235], [2.74, 2.2], [2.74, 1.9]], 96), M.chrome);
  for (let k = 0; k < 3; k++) { const t = new THREE.Mesh(new THREE.RingGeometry(2.5, 2.75, 16, 1, k * Math.PI * 2 / 3 + 0.5, 0.95), M.chrome); t.position.z = 2.12; g.add(t); }       // pattes de la baïonnette
  const vis = toile((x, w, h) => { x.fillStyle = '#b9bcc2'; x.beginPath(); x.arc(w / 2, h / 2, w * 0.46, 0, 7); x.fill(); x.strokeStyle = '#3a3c40'; x.lineWidth = w * 0.11; x.beginPath(); x.moveTo(w * 0.24, h / 2); x.lineTo(w * 0.76, h / 2); x.moveTo(w / 2, h * 0.24); x.lineTo(w / 2, h * 0.76); x.stroke(); }, 64, 64);
  const mv = new THREE.MeshStandardMaterial({ map: vis, transparent: true, metalness: 0.9, roughness: 0.35 });
  [0.72, 2.3, 3.87, 5.44].forEach(a => { const v = new THREE.Mesh(new THREE.CircleGeometry(0.105, 20), mv); v.position.set(Math.cos(a) * 3.0, Math.sin(a) * 3.0, 2.238); v.rotation.z = a; g.add(v); });
  const paroi = new THREE.Mesh(new THREE.CylinderGeometry(2.74, 2.6, 1.62, 64, 1, true), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9, side: THREE.BackSide })); paroi.rotation.x = Math.PI / 2; paroi.position.z = 1.4; g.add(paroi);
  const fond = new THREE.Mesh(new THREE.CircleGeometry(2.76, 64), M.noirMat); fond.position.z = 0.6; g.add(fond);
  const cadre = boite(3.0, 2.2, 0.14, 0.1, new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.6 })); cadre.position.z = 0.64; g.add(cadre);
  const creux = boite(2.56, 1.78, 0.06, 0.05, M.noirMat); creux.position.z = 0.7; g.add(creux);
  const capteur = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 1.57), M.capteur); capteur.position.z = 0.735; g.add(capteur);
  const contacts = new THREE.Group(); g.add(contacts);
  const bande = new THREE.Mesh(new THREE.RingGeometry(2.22, 2.62, 32, 1, Math.PI * 0.31, Math.PI * 0.38), M.noirMat); bande.position.z = 1.5; contacts.add(bande);
  for (let k = 0; k < 11; k++) { const a = Math.PI * (0.335 + k * 0.033), c = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 8), M.or); c.position.set(Math.cos(a) * 2.44, Math.sin(a) * 2.44, 1.51); c.scale.z = 0.5; contacts.add(c); }
  const pt = new THREE.Mesh(new THREE.CircleGeometry(0.075, 16), M.blanc); pt.position.set(Math.cos(0.855) * 3.43, Math.sin(0.855) * 3.43, 2.022); g.add(pt);   // repère de montage
  Object.assign(g.userData, { bague, capteur, contacts });
  return g;
}

/* ------------------------------------------------------------------ griffe porte-accessoire */
function griffe(M) {
  const g = new THREE.Group();
  const plaque = boite(2.04, 0.07, 1.9, 0.03, new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.3, map: toile((x, w, h) => {
    x.fillStyle = '#0b0b0c'; x.fillRect(0, 0, w, h); x.fillStyle = '#c9ccd1';
    [[0.5, 0.46, 0.085], [0.5, 0.72, 0.035], [0.38, 0.62, 0.035], [0.62, 0.62, 0.035]].forEach(([u, v, r]) => { x.beginPath(); x.arc(u * w, v * h, r * w, 0, 7); x.fill(); });
    x.fillStyle = '#000'; x.beginPath(); x.arc(0.5 * w, 0.26 * h, 0.03 * w, 0, 7); x.fill();
  }, 256, 256) })); plaque.position.y = 0.035; g.add(plaque);
  const s = new THREE.Shape(); [[-1.02, 0], [-1.02, 0.32], [-0.68, 0.32], [-0.68, 0.25], [-0.92, 0.25], [-0.92, 0]].forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]));
  const geo = toCreasedNormals(new THREE.ExtrudeGeometry(s, { depth: 1.9, bevelEnabled: false }), 0.6);
  const mr = M.metal.clone(); mr.side = THREE.DoubleSide;
  [1, -1].forEach(k => { const r = new THREE.Mesh(geo, mr); r.scale.x = k; r.position.z = -0.95; g.add(r); });
  const butee = boite(2.04, 0.3, 0.1, 0.03, M.metal); butee.position.set(0, 0.16, 0.92); g.add(butee);
  return g;
}

/* ------------------------------------------------------------------ Nikon Z50II */
export async function z50ii(opts) {
  const o = opts || {}, M = MAT = matieres(), A = new THREE.Group(), C = {}, N = {};
  const n = (obj, nom) => { obj.userData.nom = nom; N[nom] = obj; return obj; };
  const G = await chargerCorps(new URL(o.corps || '../modeles/z50ii-corps.bin', import.meta.url).href);
  const corps = new THREE.Mesh(G.peinture, M.peinture); A.add(corps); n(corps, 'Le boîtier');
  const cuir = new THREE.Mesh(uvBoite(G.cuir, 1 / 1.5), M.cuir); A.add(cuir); n(cuir, 'La poignée');
  A.add(new THREE.Mesh(G.joint, M.joint));
  const oeil = new THREE.Mesh(G.oeilleton, M.gomme); A.add(oeil); n(oeil, 'Viseur électronique');

  // ---------- monture, capteur, objectif
  const mt = monture(M); mt.position.set(MX, MY, 0); A.add(mt);
  n(mt.userData.bague, 'La monture Z'); n(mt.userData.capteur, 'Le capteur'); n(mt.userData.contacts, 'Les contacts');
  const nz = new THREE.Vector3(0, 0, 1); mt.userData.bague.userData.axe = true; mt.userData.capteur.userData.normale = nz; mt.userData.contacts.userData.normale = nz;
  const obj = objectif(M); obj.position.set(MX, MY, 2.236); A.add(obj); C.objectif = obj; n(obj.userData.bague, "L'objectif");
  const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
  obj.userData.retirer = k => { obj.rotation.z = 1.05 * ease(k / 0.35); const d = ease((k - 0.3) / 0.7), a = Math.sin(Math.min(1, Math.max(0, (k - 0.3) / 0.7)) * Math.PI); obj.position.set(MX + 8.6 * d, MY - 1.2 * d, 2.236 + 2.6 * a + 0.4 * d); obj.rotation.y = 0.85 * d; };
  [mt.userData.bague, mt.userData.capteur, mt.userData.contacts].forEach(x => { x.userData.anim = obj.userData.retirer; x.userData.duree = 1500; x.userData.garde = 3800; });

  // ---------- flash intégré (couvercle articulé à l'arrière)
  const flash = new THREE.Group(); flash.position.set(0, 8.84, 0.44); A.add(flash);
  const couv = new THREE.Mesh(G.flash, M.peinture); couv.position.set(0, -8.84, -0.44); flash.add(couv);
  const tube = boite(1.9, 0.05, 0.42, 0.02, M.diffuseur); tube.position.set(1.7, -0.03, 0.56); flash.add(tube);
  flash.userData.flash = true; flash.userData.anim = k => { flash.rotation.x = -0.95 * k; M.diffuseur.emissiveIntensity = 0; }; flash.userData.duree = 520; n(flash, 'Flash intégré');
  const logo = imprime('Nikon', 2.5, 0.72, { style: 'italic 800 ', taille: 0.9, couleur: '#f1f1f3', px: 1024 }); pose(logo, 1.7, 8.33, 1.795, -0.432, 0, 0); A.add(logo);

  // ---------- griffe, haut-parleur, inscription
  const gr = griffe(M); gr.position.set(1.7, 9.215, -0.62); A.add(gr); n(gr, 'Griffe flash');
  const zl = imprime('Z 50II', 2.0, 0.5, { style: 'italic 800 ', taille: 0.86, px: 1024 }); pose(zl, 4.55, H + 0.004, 0.35, -Math.PI / 2, 0, Math.PI); A.add(zl);
  const hp = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.42), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, map: toile((x, w, h) => { x.fillStyle = '#000'; [[.5, .5], [.26, .5], [.74, .5], [.38, .22], [.62, .22], [.38, .78], [.62, .78]].forEach(([u, v]) => { x.beginPath(); x.arc(u * w, v * h, w * 0.055, 0, 7); x.fill(); }); }, 128, 88) }));
  pose(hp, 5.1, H + 0.004, -0.72, -Math.PI / 2, 0, 0); A.add(hp); n(hp, 'Haut-parleur');

  // ---------- dessus : sélecteur de mode, levier photo/vidéo
  const yP = z => z > 0.4 ? H - 0.2 * (z - 0.4) : H, PENTE = Math.atan(0.2);
  const MODES = ['AUTO', 'P', 'S', 'A', 'M', 'U3', 'U2', 'U1', 'SCN'];
  const texCadran = toile((x, w, h) => {
    x.fillStyle = '#0b0b0c'; x.fillRect(0, 0, w, h); x.translate(w / 2, h / 2);
    MODES.forEach((m, i) => {
      x.save(); x.rotate(i / MODES.length * Math.PI * 2); x.textAlign = 'center'; x.textBaseline = 'middle';
      if (m === 'AUTO') { x.fillStyle = '#1fae54'; x.beginPath(); x.roundRect(-108, -h * 0.445, 216, 92, 18); x.fill(); x.fillStyle = '#fff'; x.font = '800 66px ' + POLICE; x.fillText(m, 0, -h * 0.395); }
      else { x.fillStyle = '#f1f1f3'; x.font = '800 ' + (m.length > 2 ? 84 : m.length > 1 ? 98 : 124) + 'px ' + POLICE; x.fillText(m, 0, -h * 0.375); }
      x.restore();
    });
    x.fillStyle = '#0c0c0d'; x.beginPath(); x.arc(0, 0, w * 0.2, 0, 7); x.fill(); x.fillStyle = '#e6e6e8'; x.fillRect(-w * 0.1, -9, w * 0.2, 18);
  }, 1024, 1024);
  const pied = new THREE.Group(); pose(pied, -2.1, H, -0.3, 0, Math.PI / 2, 0); A.add(pied);
  pied.add(new THREE.Mesh(tour([[1.16, -0.02], [1.16, 0.05], [1.08, 0.09], [0, 0.09]], 64), M.collerette));
  const cadran = molette(1.02, 0.6, 60, M.bouton); cadran.position.y = 0.09; pied.add(cadran);
  const dessus = new THREE.Mesh(new THREE.CircleGeometry(0.95, 64), new THREE.MeshStandardMaterial({ map: texCadran, roughness: 0.72 })); pose(dessus, 0, 0.602, 0, -Math.PI / 2, 0, 0); cadran.add(dessus);
  Object.assign(cadran.userData, { c: 'dial', type: 'cadran', modes: MODES }); C.dial = cadran; n(cadran, 'Sélecteur de mode');
  const repere = boite(0.2, 0.02, 0.055, 0.008, M.blanc); repere.position.set(-2.1 - 1.3, H + 0.006, -0.3); A.add(repere);
  const levier = new THREE.Group(); pose(levier, -2.1, H, -0.3, 0, -0.14, 0); A.add(levier);
  levier.add(new THREE.Mesh(tour([[1.24, -0.02], [1.24, 0.06], [1.14, 0.07]], 64), M.bouton));
  const ergot = boite(0.5, 0.12, 0.24, 0.05, M.bouton); ergot.position.set(-1.42, 0.05, 0); levier.add(ergot);
  levier.userData.anim = k => { levier.rotation.y = -0.14 - 0.48 * k; }; levier.userData.duree = 320; n(levier, 'Sélecteur photo/vidéo');
  [['#photo', 0.1], ['#video', 0.62]].forEach(([ic, a]) => { const e = imprime(ic, 0.3, 0.3, { px: 128 }); pose(e, -2.1 - 1.74 * Math.cos(a), H + 0.004, -0.3 - 1.74 * Math.sin(a), -Math.PI / 2, 0, Math.PI); A.add(e); });

  // ---------- dessus : pont incliné (REC, ISO, ±), Picture Control, déclencheur + marche-arrêt
  const surPente = (b, x, z) => { pose(b, x, yP(z), z, PENTE, 0, 0); A.add(b); return b; };
  n(surPente(touche(0.21, 0.1, M.bouton, '#rec', { taille: 1 }), -3.72, 1.05), 'Enregistrement vidéo');
  n(surPente(touche(0.26, 0.1, M.bouton, 'ISO'), -4.52, 1.0), 'Touche ISO');
  n(surPente(touche(0.26, 0.1, M.bouton, '#expo'), -5.32, 1.05), "Correction d'exposition ±");
  const pcb = touche(0.27, 0.1, M.bouton, '#pc'); pose(pcb, -4.5, H, -0.02); A.add(pcb); n(pcb, 'Touche Picture Control');
  const dec = new THREE.Group(); pose(dec, -4.7, yP(2.3) - 0.02, 2.3, 0.42, 0, 0); A.add(dec);
  dec.add(new THREE.Mesh(tour([[0.92, -0.3], [0.92, 0.0], [0.82, 0.08], [0, 0.08]], 48), M.peinture));
  const inter = new THREE.Group(); dec.add(inter);
  const ci = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.17, 48, 1, true), strie(M.bouton, 44, 1.3)); ci.position.y = 0.165; inter.add(ci);
  inter.add(new THREE.Mesh(tour([[0.76, 0.25], [0.7, 0.3], [0.54, 0.3]], 48), M.bouton));
  const patte = boite(0.42, 0.17, 0.2, 0.06, M.bouton); patte.position.set(-0.88, 0.165, 0.2); inter.add(patte);
  const decl = new THREE.Group(); decl.userData.appui = true; dec.add(decl);
  decl.add(new THREE.Mesh(tour([[0.5, 0.2], [0.5, 0.41], [0.44, 0.47], [0.2, 0.45], [0, 0.445]], 48), M.metalSombre));
  Object.assign(decl.userData, { c: 'half', type: 'bouton' }); C.half = decl; n(decl, 'Déclencheur et marche-arrêt'); N['Commutateur marche-arrêt et déclencheur'] = decl;
  inter.userData.nom = 'Déclencheur et marche-arrêt'; C.marche = inter;
  decl.userData.anim = k => { inter.rotation.y = 0.45 * Math.min(1, Math.max(0, k)); decl.position.y = -0.06 * Math.sin(Math.min(1, Math.max(0, k)) * Math.PI); }; decl.userData.duree = 420; decl.userData.garde = 1400; inter.userData.anim = decl.userData.anim; inter.userData.duree = 420; inter.userData.garde = 1400;
  [['OFF', -5.82, 2.0], ['ON', -5.72, 2.66]].forEach(([t, x, z]) => { const e = imprime(t, 0.44, 0.17, { taille: 0.8, px: 256 }); pose(e, x, yP(z) + 0.004, z, -Math.PI / 2 + PENTE, 0, Math.PI); A.add(e); });

  // ---------- molettes de commande et réglage dioptrique
  const mPrinc = molette(0.92, 0.44, 48, M.gomme); pose(mPrinc, -5.02, 6.92, -1.1); A.add(mPrinc); C.molettePrincipale = mPrinc; n(mPrinc, 'Molette principale');
  const mSec = molette(1.0, 0.42, 52, M.gomme); pose(mSec, -4.88, 6.125, 2.62); A.add(mSec); n(mSec, 'Molette secondaire');
  const diop = new THREE.Group(); pose(diop, -0.62, 7.78, -1.95, 0, 0, Math.PI / 2); A.add(diop);
  const dc = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 32), strie(M.bouton, 26, 1.2)); diop.add(dc); diop.userData.molette = true; n(diop, 'Réglage dioptrique');

  // ---------- viseur : oculaire, détecteur d'œil
  const cadreO = boite(1.92, 1.4, 0.05, 0.18, M.collerette); pose(cadreO, 1.6, 7.5, -2.165); A.add(cadreO);
  const ocu = boite(1.62, 1.1, 0.05, 0.12, M.vitre); pose(ocu, 1.6, 7.5, -2.185); A.add(ocu);
  const capt = boite(0.62, 0.25, 0.04, 0.08, new THREE.MeshPhysicalMaterial({ color: 0x2a0d3a, roughness: 0.1, clearcoat: 1 })); pose(capt, 1.6, 6.7, -2.17); A.add(capt); n(capt, 'Détecteur oculaire');

  // ---------- écran orientable : charnière verticale à gauche (vu de dos), puis bascule
  const ecran = new THREE.Group(); ecran.position.set(5.38, 2.98, -1.48); A.add(ecran); ecran.userData.orientable = true;
  const bascule = new THREE.Group(); ecran.add(bascule);
  const dalle = boite(8.3, 5.56, 0.36, 0.17, M.peinture); dalle.position.set(-4.2, 0, 0); bascule.add(dalle); dalle.userData.nom = 'Écran tactile orientable';
  const vitre = boite(7.9, 5.2, 0.02, 0.012, M.vitre); vitre.position.set(-4.2, 0, -0.181); bascule.add(vitre);
  const charn = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 2.7, 20), M.collerette); charn.position.set(0.02, 0, 0.02); ecran.add(charn);
  const bras = boite(0.3, 2.3, 0.3, 0.08, M.peinture); bras.position.set(-0.14, 0, 0); ecran.add(bras);
  ecran.userData.anim = k => { ecran.rotation.y = -Math.PI * ease(k / 0.55); bascule.rotation.x = Math.PI * ease((k - 0.5) / 0.5); };
  ecran.userData.duree = 1700; ecran.userData.garde = 3200; n(ecran, 'Écran tactile orientable'); ecran.userData.normale = new THREE.Vector3(0, 0, -1); capt.userData.normale = new THREE.Vector3(0, 0, -1);
  C.ecran = { centre: new THREE.Vector3(1.18, 2.98, -1.685), l: 6.9, h: 4.6 };

  // ---------- dos : touches
  const dos = (b, x, y) => { pose(b, x, y, ZB, -Math.PI / 2, 0, 0); A.add(b); return b; };
  n(dos(touche(0.31, 0.09, M.bouton, '#rafale'), 5.18, 6.5), 'Déclenchement / retardateur'); n(dos(touche(0.31, 0.09, M.bouton, '#poubelle'), 4.28, 6.5), 'Suppression');
  n(dos(touche(0.31, 0.09, M.bouton, '#moniteur'), -1.53, 6.38), 'Mode moniteur'); n(dos(touche(0.31, 0.09, M.bouton, 'DISP'), -2.48, 6.38), 'DISP');
  n(dos(touche(0.42, 0.1, M.bouton, 'AE-L\nAF-L'), -3.75, 5.95), 'AE-L/AF-L');
  C.i = dos(touche(0.36, 0.1, M.bouton, 'i'), -3.77, 4.43); Object.assign(C.i.userData, { c: 'i', type: 'bouton' }); n(C.i, 'Touche i');
  const pad = new THREE.Group(); pose(pad, -4.29, 3.07, ZB, -Math.PI / 2, 0, 0); A.add(pad);
  pad.add(new THREE.Mesh(tour([[0.92, -0.02], [0.92, 0.015], [0.82, 0.03], [0.8, 0]], 64), M.collerette));
  const anneauG = new THREE.Group(); pad.add(anneauG);
  anneauG.add(new THREE.Mesh(tour([[0.78, -0.03], [0.78, 0.07], [0.7, 0.125], [0.44, 0.09], [0.4, 0.04], [0.4, -0.03]], 64), M.bouton));
  const fl = new THREE.Mesh(new THREE.RingGeometry(0.43, 0.77, 48), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: toile((x, w, h) => { x.fillStyle = '#d6d6da'; x.translate(w / 2, h / 2); for (let k = 0; k < 4; k++) { x.save(); x.rotate(k * Math.PI / 2); x.beginPath(); x.moveTo(0, -h * 0.445); x.lineTo(-17, -h * 0.385); x.lineTo(17, -h * 0.385); x.fill(); x.restore(); } }, 512, 512) }));
  pose(fl, 0, 0.128, 0, -Math.PI / 2, 0, 0); anneauG.add(fl);
  const ok = touche(0.3, 0.14, M.bouton, 'OK', { collerette: false }); pad.add(ok); Object.assign(ok.userData, { c: 'ok', type: 'bouton' }); C.ok = ok; n(anneauG, 'Sélecteur multidirectionnel + OK');
  [['up', 0, 1], ['right', -1, 0], ['down', 0, -1], ['left', 1, 0]].forEach(([c, dx, dz]) => {
    const z = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.3, 12), new THREE.MeshBasicMaterial({ visible: false })); z.position.set(dx * 0.6, 0.1, dz * 0.6); pad.add(z);
    Object.assign(z.userData, { c, type: 'fleche', pad: anneauG, dir: new THREE.Vector2(dx, dz) }); C[c] = z;
  });
  n(dos(touche(0.3, 0.09, M.bouton, '#loupe+'), -3.73, 1.73), 'Loupe avant'); C.menu = dos(touche(0.33, 0.1, M.bouton, 'MENU'), -4.76, 1.73); Object.assign(C.menu.userData, { c: 'menu', type: 'bouton' }); n(C.menu, 'MENU');
  n(dos(touche(0.3, 0.09, M.bouton, '#loupe-'), -3.73, 0.93), 'Loupe arrière / imagettes / aide'); n(dos(touche(0.3, 0.09, M.bouton, '#lecture'), -4.74, 0.93), 'Visualisation');
  [['#cle', -3.75, 6.6, 0.36, 0.2], ['?', -4.13, 0.6, 0.2, 0.22], ['#retardateur', 5.62, 6.06, 0.24, 0.24]].forEach(([t, x, y, l, h]) => { const e = imprime(t, l, h, { px: 128, taille: 0.9 }); pose(e, x, y, ZB - 0.004, 0, Math.PI, 0); A.add(e); });

  // ---------- façade : Fn1, Fn2, déverrouillage, illuminateur AF, témoin, logo Z
  const surCol = (x, y, nom) => {
    const rx = x - MX, ry = y - MY, r = Math.hypot(rx, ry), ux = rx / r, uy = ry / r;
    const Y = new THREE.Vector3(ux * 0.5, uy * 0.5, 0.866), Z = new THREE.Vector3(-uy, ux, 0), X = new THREE.Vector3().crossVectors(Y, Z);
    const g = new THREE.Group(); g.userData.appui = true; g.userData.axe = true; g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z)); g.position.set(x, y, 1.74);
    const c = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.44, 6, 16), M.bouton); c.rotation.x = Math.PI / 2; c.scale.z = 0.55; g.add(c); A.add(g); return n(g, nom);
  };
  surCol(-2.15, 3.8, 'Fn1'); surCol(-1.52, 1.98, 'Fn2');
  const dev = new THREE.Group(); dev.userData.appui = true; dev.userData.axe = true; pose(dev, 5.54, 3.96, ZF + 0.03, Math.PI / 2, 0, 0); A.add(dev);
  dev.add(boite(0.5, 0.22, 0.96, 0.1, M.bouton)); const bz = boite(0.68, 0.05, 1.14, 0.02, M.collerette); bz.position.y = -0.06; dev.add(bz); n(dev, "Déverrouillage de l'objectif");
  const lampe = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x2a1508, roughness: 0.08, clearcoat: 1 })); pose(lampe, -2.3, 6.6, ZF - 0.02, Math.PI / 2, 0, 0); lampe.scale.y = 0.35; lampe.userData.axe = true; A.add(lampe); n(lampe, "Illuminateur d'assistance AF");
  const temoin = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x3a0a0a, roughness: 0.1, clearcoat: 1 })); pose(temoin, 4.9, 6.82, ZF - 0.01, Math.PI / 2, 0, 0); temoin.scale.y = 0.4; temoin.userData.axe = true; A.add(temoin); n(temoin, "Témoin d'enregistrement");
  const zz = imprime('Z', 0.6, 0.6, { style: 'italic 900 ', taille: 0.98, px: 256, couleur: '#c9cbd0', metal: true }); pose(zz, -1.8, 6.62, ZF + 0.004); A.add(zz);

  // ---------- flancs et dessous : œillets de courroie, trappes des prises, trappe de la batterie, pas de vis
  [-1, 1].forEach(k => {
    const b = boite(0.16, 0.5, 0.42, 0.06, M.peinture); b.position.set(k * 6.36, 6.5, 0.15); A.add(b);
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.05, 10, 28), M.metal); pose(t, k * 6.6, 6.36, 0.15, 0, Math.PI / 2 + k * 0.5, 0); A.add(t);
  });
  [[4.95, 2.2], [2.5, 2.0]].forEach(([y, h]) => { const t = boite(0.07, h, 1.9, 0.03, M.gomme); t.position.set(6.345, y, -0.08); A.add(t); const e = boite(0.07, 0.06, 0.5, 0.02, M.noirMat); e.position.set(6.36, y - h / 2 + 0.16, -0.08); A.add(e); });
  const trappe = boite(3.5, 0.03, 2.7, 0.012, M.gomme); trappe.position.set(-4.35, 0.004, 1.05); A.add(trappe);
  const verrou = boite(0.5, 0.05, 0.26, 0.02, M.bouton); verrou.position.set(-3.1, -0.01, 1.9); A.add(verrou);
  const ecrou = new THREE.Mesh(tour([[0.42, 0.0], [0.42, -0.025], [0.24, -0.025], [0.22, 0.12]], 32), M.metal); ecrou.position.set(MX, 0.012, 0.2); A.add(ecrou);

  // ---------- écran allumé (exemple d'affichage) : visible seulement quand on met l'appareil en marche
  const ui = toile((x, w, h) => {
    const c = x.createLinearGradient(0, 0, 0, h); c.addColorStop(0, '#7fb2e6'); c.addColorStop(0.55, '#f3d9b0'); c.addColorStop(0.56, '#5d7a4a'); c.addColorStop(1, '#2f4a2c'); x.fillStyle = c; x.fillRect(0, 0, w, h);
    x.fillStyle = '#3b5a37'; x.beginPath(); x.moveTo(0, h * 0.58); x.lineTo(w * 0.22, h * 0.4); x.lineTo(w * 0.42, h * 0.56); x.lineTo(w * 0.66, h * 0.34); x.lineTo(w, h * 0.6); x.lineTo(w, h); x.lineTo(0, h); x.fill();
    x.fillStyle = 'rgba(255,244,210,.95)'; x.beginPath(); x.arc(w * 0.76, h * 0.22, h * 0.07, 0, 7); x.fill();
    x.strokeStyle = '#fff'; x.lineWidth = 3; const b = h * 0.11; x.strokeRect(w / 2 - b, h / 2 - b * 0.75, b * 2, b * 1.5);
    x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(0, 0, w, h * 0.105); x.fillRect(0, h * 0.885, w, h * 0.115);
    x.fillStyle = '#fff'; x.font = '700 ' + h * 0.062 + 'px ' + POLICE; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillText('A', w * 0.03, h * 0.054); x.textAlign = 'right'; x.fillText('RAW+F', w * 0.97, h * 0.054);
    x.textAlign = 'left'; x.fillText('1/250   F5.6', w * 0.03, h * 0.945); x.textAlign = 'right'; x.fillText('ISO 400', w * 0.97, h * 0.945);
  }, 720, 480);
  const affichage = new THREE.Mesh(new THREE.PlaneGeometry(6.9, 4.6), new THREE.MeshBasicMaterial({ map: ui, transparent: true, opacity: 0, toneMapped: false })); pose(affichage, -4.2, 0, -0.194, 0, Math.PI, 0); affichage.visible = false; bascule.add(affichage);
  const actions = { allumer(k) { inter.rotation.y = 0.45 * k; affichage.visible = k > 0.01; affichage.material.opacity = k; } };

  // ---------- vue éclatée : chaque sous-ensemble dans une enveloppe qui s'écarte du boîtier
  const eclats = [];
  const ecl = (piece, x, y, z) => { const w = new THREE.Group(); w.userData.eclat = new THREE.Vector3(x, y, z); piece.parent.add(w); w.add(piece); eclats.push(w); };
  ecl(obj, 0, 0, 5.0); ecl(flash, 0, 1.3, 0.3); ecl(gr, 0, 2.5, 0); ecl(pied, 0, 2.0, 0); ecl(levier, 0, 1.2, 0); ecl(mPrinc, 0, 1.7, -0.5); ecl(mSec, 0, 0.4, 2.0); ecl(dec, 0, 1.6, 1.0); ecl(ecran, 0, 0, -3.0); ecl(oeil, 0, 0, -2.0);

  // angles de vue pour Découvrir (lacet, tangage) : la pièce bien en face
  const vue = (nom, l, t) => { if (N[nom]) N[nom].userData.vue = [l, t]; };
  [['Le boîtier', 25, 15], ['La poignée', -40, 12], ['Flash intégré', 12, 38], ['Griffe flash', 195, 52], ['Réglage dioptrique', 225, 22], ['Viseur électronique', 192, 14],
   ['Détecteur oculaire', 186, 8], ['Écran tactile orientable', 145, 14], ['Sélecteur de mode', 205, 50], ['Sélecteur photo/vidéo', 210, 48], ['Déclencheur et marche-arrêt', 240, 44],
   ['Enregistrement vidéo', 245, 46], ['Touche ISO', 238, 50], ["Correction d'exposition ±", 230, 52], ['Touche Picture Control', 225, 52], ['Molette principale', 222, 36],
   ['Molette secondaire', -40, 26], ['Fn1', -28, 8], ['Fn2', -28, 6], ["Illuminateur d'assistance AF", -22, 16], ["Déverrouillage de l'objectif", 38, 8], ['La monture Z', 12, 8], ['Le capteur', 8, 6], ['Les contacts', 8, 14],
   ["L'objectif", 24, 10], ["Témoin d'enregistrement", 30, 16], ['Haut-parleur', 178, 62], ['Déclenchement / retardateur', 172, 18], ['Suppression', 174, 18]].forEach(v => vue(...v));
  return { groupe: A, commandes: C, noms: N, modes: MODES, centre: new THREE.Vector3(0, 4.6, 0.3), taille: 13, eclats, actions };
}
