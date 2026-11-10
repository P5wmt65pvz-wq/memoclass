/* « Découvrir » en 3D : l'appareil tourne sous tous les angles ; toucher une commande
   (ou un nom dans la liste) la montre, l'anime et l'explique. Les textes sont ceux
   de la page (decouvrir.js, vérifiés dans le manuel officiel). */
import { creerVisionneuse } from './appareil3d.js';

const modele = document.documentElement.dataset.appareil || 'z50ii';
const onglet = document.querySelector('#vues [data-panneau="en3d"]');
const panneau = document.getElementById('en3d');
const VUES = window.GZ_VUES;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function webgl() {
  try {
    const g = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl'); if (!g) return false;
    const q = new URLSearchParams(location.search).get('3d');
    if (q === 'force') return true;
    if (q === '0' || modele !== 'z50ii') return false;   // 09/11 : 3D seulement pour le Z50II (modèle net habillé des 4 vues) ; le D800 garde ses photos
    // rendu logiciel (pas de carte graphique) : trop lent, on garde la version d'avant
    const info = g.getExtension('WEBGL_debug_renderer_info');
    return !/swiftshader|llvmpipe|software|softpipe/i.test(info ? String(g.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '');
  } catch (e) { return false; }
}

let v = null, liste = [], sel = -1, lance = false;
async function demarrer() {
  if (lance || !panneau) return; lance = true;   // une seule scène (l'appel pouvait arriver deux fois pendant le chargement)
  const scene = panneau.querySelector('.a3d'), fiche = panneau.querySelector('.fiche'), puces = panneau.querySelector('.puces3d');
  // toutes les commandes de la page, dans l'ordre face → dessus → dos
  liste = [];
  Object.keys(VUES).forEach(k => (VUES[k] || []).forEach(c => { if (!liste.some(x => x[0] === c[0])) liste.push(c); }));
  v = await creerVisionneuse(scene, {
    modele, vue: [28, 16], zoom: 1.08, limites: [-100000, 100000, -8, 80], tour: 14, tourDuree: 14,
    onSelection(nom) { const i = liste.findIndex(c => c[0] === nom); if (i > -1) choisir(i, false); }
  });
  window.__a3d = v;
  // boutons de la scène : vue éclatée, mise en marche
  if (v.modele.eclats || v.modele.actions) {
    const outils = document.createElement('div'); outils.className = 'a3d-outils';
    outils.innerHTML = (v.modele.eclats ? '<button type="button" data-a="eclate" aria-pressed="false">Vue éclatée</button>' : '') + (v.modele.actions ? '<button type="button" data-a="marche" aria-pressed="false">Allumer</button>' : '');
    scene.appendChild(outils);
    outils.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const oui = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', oui ? 'true' : 'false');
      if (b.dataset.a === 'eclate') { v.cibler([]); v.eclater(oui); if (oui) v.vue(34, 18); }
      else { v.allumer(oui); b.textContent = oui ? 'Éteindre' : 'Allumer'; if (oui) v.vue(200, 14); }
      scene.classList.add('a3d-vu');
    });
  }
  const presentes = liste.map(c => !!(v.modele.noms && v.modele.noms[c[0]]));
  puces.innerHTML = liste.map((c, i) => '<button type="button" class="puce3d' + (presentes[i] ? '' : ' sans') + '" data-i="' + i + '">' + esc(c[0]) + '</button>').join('');
  puces.querySelectorAll('button').forEach(b => b.addEventListener('click', () => choisir(+b.dataset.i, true)));
  function choisir(i, depuisListe) {
    sel = (i + liste.length) % liste.length;
    const c = liste[sel];
    fiche.innerHTML = '<div class="num">' + (sel + 1) + ' / ' + liste.length + '</div><h3>' + esc(c[0]) + '</h3><p class="role">' + esc(c[1]) + '</p><p class="astuce"><strong>Astuce · </strong>' + esc(c[2]) + '</p>' +
      (c[3] ? '<a class="lien" href="' + c[3] + '">En savoir plus →</a>' : '') +
      '<div class="nav-fiche"><button class="bouton clair" type="button" data-d="-1" aria-label="Commande précédente">←</button><button class="bouton clair" type="button" data-d="1" aria-label="Commande suivante">→</button></div>';
    fiche.querySelectorAll('button[data-d]').forEach(b => b.addEventListener('click', () => choisir(sel + +b.dataset.d, true)));
    puces.querySelectorAll('button').forEach((b, j) => { b.classList.toggle('actif', j === sel); b.setAttribute('aria-pressed', j === sel ? 'true' : 'false'); });
    const b = puces.children[sel]; if (b && depuisListe) puces.scrollTo({ left: b.offsetLeft - puces.clientWidth / 2 + b.clientWidth / 2, behavior: 'smooth' });
    v.montrer(c[0]);
    scene.classList.add('a3d-vu');
  }
  fiche.innerHTML = '<h3>Fais tourner l\'appareil</h3><p class="role">Glisse pour le faire tourner, puis touche une commande : elle bouge et je t\'explique à quoi elle sert.</p>';
}

if (onglet && panneau && VUES && webgl()) {
  onglet.hidden = false;
  document.addEventListener('gz3d', demarrer);
  const h0 = window.GZ_HASH0 || '';
  if (!h0 || h0 === '#en3d') onglet.click();
  if (!panneau.hidden) demarrer();
} else if (onglet) {
  const actif = onglet.getAttribute('aria-selected') === 'true';
  onglet.remove(); if (panneau) panneau.remove();
  if (actif) { const f = document.querySelector('#vues [role=tab]'); if (f) f.click(); }
}
