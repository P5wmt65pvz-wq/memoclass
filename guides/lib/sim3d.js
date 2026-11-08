/* Le simulateur « Prendre en main » en 3D : l'appareil entier, ses vraies commandes
   (la molette tourne, les boutons s'enfoncent, le sélecteur bascule) et son écran.
   Se branche sur le simulateur existant (sim.js) sans changer sa logique :
   un toucher sur une commande 3D = un clic sur le bouton correspondant. */
import { creerVisionneuse } from './appareil3d.js';

const zone = document.getElementById('sim');
const modele = document.documentElement.dataset.appareil || 'z50ii';
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;

function webgl() {
  try {
    const g = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl'); if (!g) return false;
    if (new URLSearchParams(location.search).get('3d') === 'force') return true;
    return false;   // 3D retirée le 08/11 à la demande d'Adrien : version en vraies photos
    // rendu logiciel (pas de carte graphique) : trop lent, on garde la version d'avant
    const info = g.getExtension('WEBGL_debug_renderer_info');
    return !/swiftshader|llvmpipe|software|softpipe/i.test(info ? String(g.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '');
  } catch (e) { return false; }
}

async function brancher() {
  const boitier = zone && zone.querySelector('.sim-boitier');
  if (!boitier || !webgl()) return;
  const ecran = boitier.querySelector('.sim-ecran');
  const large = boitier.getBoundingClientRect().width >= 620;
  const scene = document.createElement('div');
  scene.className = 'a3d' + (large ? ' a3d-large' : '');
  scene.innerHTML = '<p class="a3d-aide">Fais tourner l\'appareil · touche ses commandes</p>';
  boitier.classList.add('en3d');
  boitier.prepend(scene);
  if (large) ecran.classList.add('a3d-ecran');
  const btn = c => zone.querySelector('.sim-b[data-c="' + c + '"]');
  const vueDos = large ? [198, 14] : [204, 18], vueDessus = [204, 46];
  let v = null;
  v = await creerVisionneuse(scene, {
    modele, vue: vueDos, zoom: large ? 1.22 : 1.3,
    regard: large ? [0, -0.5, 0] : [-1.4, -0.3, 0],
    limites: [140, 260, 0, 70],
    ecranHTML: large ? ecran : null,
    onCommande(c) { const b = btn(c); if (b) b.click(); masquerAide(); },
    // molette de mode tournée au doigt : le simulateur avance d'autant de crans
    onCadran(i) {
      const lettre = zone.querySelector('.molette b'), modes = v ? v.modele.modes : [];
      const cur = lettre ? modes.indexOf(lettre.textContent) : -1; if (cur < 0) return;
      const pas = (i - cur + modes.length) % modes.length;
      for (let k = 0; k < pas; k++) btn('dial').click();
      masquerAide();
    },
    // D800 : molette principale tournée au doigt = un mode de plus par cran (MODE maintenu)
    onMolette(obj, crans) {
      if (obj !== (v && v.modele.commandes.dial) || v.modele.commandes.dial.userData.type === 'cadran') return;
      for (let k = 0; k < Math.abs(crans); k++) btn('dial').click();
      masquerAide();
    }
  });
  window.__a3d = v;
  let aideVue = false;
  function masquerAide() { if (!aideVue) { aideVue = true; scene.classList.add('a3d-vu'); } }
  scene.addEventListener('pointerdown', masquerAide, { once: true });

  // commandes visées par le guide : halo, et la vue se tourne vers elles
  const DESSUS = ['dial', 'half'];
  function suivreCibles() {
    const cibles = [...zone.querySelectorAll('.sim-b.cible')].map(b => b.dataset.c);
    v.cibler(cibles);
    if (!reduit && cibles.length) v.vue(...(cibles.some(c => DESSUS.includes(c)) ? vueDessus : vueDos));
  }
  // bouton pressé (clic 3D, clavier ou bouton HTML) : la pièce bouge
  const obs = new MutationObserver(ms => {
    let cibles = false;
    ms.forEach(m => {
      const b = m.target;
      if (!b.classList || !b.classList.contains('sim-b')) return;
      if (b.classList.contains('presse') && !(m.oldValue || '').includes('presse')) v.presser(b.dataset.c);
      if (b.classList.contains('cible') !== (m.oldValue || '').includes('cible')) cibles = true;
    });
    if (cibles) suivreCibles();
  });
  obs.observe(zone, { attributes: true, attributeFilter: ['class'], attributeOldValue: true, subtree: true });
  // molette de mode : on suit la lettre affichée par le simulateur
  const lettre = zone.querySelector('.molette b');
  const modes = v.modele.modes;
  let avant = lettre ? lettre.textContent : '';
  function suivreMode(premier) {
    const m = lettre.textContent, i = modes.indexOf(m);
    if (i < 0 || (m === avant && !premier)) return;
    avant = m;
    if (v.modele.commandes.dial && v.modele.commandes.dial.userData.type === 'cadran') v.tournerCadran(i);
    else if (!premier) v.tournerCadran(i);
  }
  if (lettre) { new MutationObserver(() => suivreMode(false)).observe(lettre, { childList: true, characterData: true, subtree: true }); suivreMode(true); }
  suivreCibles();
}
brancher();
