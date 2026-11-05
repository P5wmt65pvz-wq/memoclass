/* Entrée cinématique de l'accueil des guides.
   Reprend les deux effets demandés par Adrien et les adapte au site :
   - « Bronze and Time » : ondes de métal liquide en fond (or Nikon → bleu nuit au défilement),
     étincelles qui montent, caméra qui fait le tour de l'appareil au défilement ;
   - « Tunnel » : on plonge dans l'objectif et on traverse un tunnel de lumière
     jusqu'au choix de l'appareil.
   L'appareil est le modèle 3D du site (lib/appareil3d.js), pas une photo. */
import * as THREE from 'three';
import { MODELES } from './appareil3d.js';
import { RoomEnvironment } from './three/addons/RoomEnvironment.js';

const section = document.querySelector('.intro');
const scene3d = section && section.querySelector('.intro-scene');
const canvas = section && section.querySelector('canvas');
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
function webgl() { try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; } }

if (section && (!webgl() || reduit)) section.remove();
else if (section) demarrer();

function demarrer() {
  const modeste = (navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency || 8) <= 4 || innerWidth < 700;
  const DPR = () => Math.min(devicePixelRatio, modeste ? 1 : 1.75);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !modeste, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  renderer.autoClear = false;

  /* ---------------- scène 1 : l'appareil sur les ondes */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#000000');
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
  scene.add(camera);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.environmentIntensity = 0.45;
  const cle = new THREE.SpotLight('#ffffff', 900, 0, Math.PI / 5, 0.9); cle.position.set(18, 26, 16); scene.add(cle);
  const contre = new THREE.DirectionalLight('#e3f2ff', 3.2); contre.position.set(-20, 12, -16); scene.add(contre);
  const bas = new THREE.DirectionalLight('#fff3e6', 0.5); bas.position.set(-8, -16, 8); scene.add(bas);

  const U = { uTime: { value: 0 }, uResolution: { value: new THREE.Vector2(1, 1) }, uMouse: { value: new THREE.Vector2() }, uScroll: { value: 0 } };
  const fond = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShaderMaterial({
    uniforms: U, depthWrite: false, depthTest: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform float uTime; uniform vec2 uResolution; uniform vec2 uMouse; uniform float uScroll;
      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
        float aspect = uResolution.x / uResolution.y;
        float time = uTime * 0.08, scroll = uScroll;
        float sd = scroll * 5.0;
        vec2 w = uv;
        w.x += sin(uv.y * 2.5 + time * 0.2 + sd) * 0.35;
        w.y += cos(uv.x * 2.5 - time * 0.15 - sd * 0.8) * 0.35;
        w.x += sin(uv.y * 1.2 - time * 0.1 - sd * 1.5) * 0.25;
        w.y += cos(uv.x * 1.2 + time * 0.18 + sd * 1.2) * 0.25;
        w += vec2(scroll * 0.04, -scroll * 0.02) + vec2(uMouse.x * aspect * 0.05, uMouse.y * 0.05);
        float w1 = sin(dot(w, vec2(cos(0.6), sin(0.6))) * 2.4 + time);
        float w2 = cos(dot(w, vec2(cos(-0.7), sin(-0.7))) * 3.2 - time * 1.4 + w1 * 0.4);
        float w3 = sin(dot(w, vec2(cos(1.2), sin(1.2))) * 4.0 + time * 1.8 + w2 * 0.5);
        float f = w1 * 0.50 + w2 * 0.35 + w3 * 0.15;
        float crest = pow(max(0.0, 1.0 - abs(f - 0.1)), 2.5) * 0.5 + pow(max(0.0, 1.0 - abs(f - 0.15)), 8.0) * 0.9;
        // or Nikon (en haut) → bleu nuit (en bas), comme le bronze → saphir de la référence
        vec3 s0 = vec3(0.0012, 0.0009, 0.0003), a0 = vec3(0.095, 0.062, 0.006), b0 = vec3(0.055, 0.034, 0.004), c0 = vec3(0.55, 0.40, 0.10);
        vec3 s1 = vec3(0.0004, 0.0006, 0.0012), a1 = vec3(0.015, 0.035, 0.065), b1 = vec3(0.008, 0.020, 0.045), c1 = vec3(0.18, 0.35, 0.55);
        float t = smoothstep(0.0, 1.0, scroll);
        vec3 col = mix(s0, s1, t);
        col = mix(col, mix(b0, b1, t), smoothstep(-0.6, 0.2, f));
        col = mix(col, mix(a0, a1, t), smoothstep(0.0, 0.8, f));
        col += mix(c0, c1, t) * crest * 1.4;
        col *= 1.0 - dot(uv, uv) * 0.12;
        gl_FragColor = vec4(col, 1.0);
      }`
  }));
  fond.position.z = -8; fond.renderOrder = -10; camera.add(fond);

  // étincelles : or et bleu glacé
  const N = modeste ? 200 : 420, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), V = [];
  for (let i = 0; i < N; i++) {
    pos.set([(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 22 - 2, (Math.random() - 0.5) * 30], i * 3);
    col.set(Math.random() < 0.65 ? [1, 0.72 + Math.random() * 0.12, 0.12 + Math.random() * 0.1] : [0.55 + Math.random() * 0.15, 0.82 + Math.random() * 0.12, 1], i * 3);
    V.push({ x: (Math.random() - 0.5) * 1.8, y: 0.7 + Math.random() * 1.4, z: (Math.random() - 0.5) * 1.8, s: 0.5 + Math.random() * 1.5, r: 0.2 + Math.random() * 0.7, p: Math.random() * 6.3 });
  }
  const gEt = new THREE.BufferGeometry(); gEt.setAttribute('position', new THREE.BufferAttribute(pos, 3)); gEt.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const tEt = (() => { const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d'); const g = x.createRadialGradient(8, 8, 0, 8, 8, 8); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.85)'); g.addColorStop(0.6, 'rgba(255,255,255,.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 16, 16); return new THREE.CanvasTexture(c); })();
  const etincelles = new THREE.Points(gEt, new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, map: tEt }));
  scene.add(etincelles);

  // l'appareil
  const m = MODELES.z50ii();
  const pivot = new THREE.Group(); m.groupe.position.sub(m.centre); pivot.add(m.groupe); scene.add(pivot);
  pivot.updateMatrixWorld(true);
  const obj = m.commandes.objectif;
  const lentille = new THREE.Vector3(0, 0, obj.userData.longueur).applyMatrix4(obj.matrixWorld);   // centre du verre avant

  /* ---------------- scène 2 : le tunnel (référence « Tunnel », sans post-traitement pour rester léger) */
  const tScene = new THREE.Scene();
  tScene.fog = new THREE.Fog(0x000000, 0, 15);
  const tCam = new THREE.PerspectiveCamera(45, 1, 0.1, 400); tCam.position.set(0, 0, 20); tScene.add(tCam);
  const SNOISE = `vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){ const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx); vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy); vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + 2.0 * C.xxx; vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0); vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0; vec3 ns = n_ * D.wyz - D.xzx; vec4 j = p - 49.0 * floor(p * ns.z *ns.z); vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy; vec4 y = y_ *ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y); vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0)); vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3))); p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0); m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3))); }`;
  const TU = { uTime: { value: 0 }, uAppear: { value: 0 }, uColLow: { value: new THREE.Color('#180a3a') }, uColHigh: { value: new THREE.Color('#2bf0ff') }, uOpacity: { value: 1.44 }, uSize: { value: 5 }, uBrightness: { value: 0.55 }, uSwirl: { value: 0.39 }, uScale: { value: 0.17 }, uPix: { value: 1 } };
  const tunnel = new THREE.Points(new THREE.SphereGeometry(4.2, modeste ? 90 : 150, modeste ? 270 : 450), new THREE.ShaderMaterial({
    uniforms: TU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uTime; uniform float uSize; uniform float uSwirl; uniform float uScale; uniform float uPix;
      uniform vec3 uColLow; uniform vec3 uColHigh; varying vec3 vColor;
      ${SNOISE}
      void main() {
        vec3 wp = vec3(position.x * 7.0, 0.0, position.z * 25.0); wp.x += position.y * 6.0;
        float wn = snoise(vec3(wp.x * 0.08, wp.z * 0.08, uTime * 0.15)) * 2.0 + snoise(vec3(wp.x * 0.16, wp.z * 0.16, uTime * 0.3)) * 0.8;
        float r = sqrt(max(0.0, 17.64 - position.z * position.z));
        float ang = wp.x / (9.2195 * r + 0.001) * 3.14159265;
        ang += snoise(vec3(position.x * 15.0, position.y * 15.0, uTime * 0.1)) * 0.35 + snoise(vec3(position.x * 5.0, position.y * 5.0, uTime * 0.2)) * 3.0 * uSwirl;
        float jz = snoise(vec3(position.y * 15.0, position.z * 15.0, uTime * 0.1)) * 4.0;
        float R = 12.0 - wn;
        vec4 mv = modelViewMatrix * vec4(vec3(R * sin(ang), -R * cos(ang), wp.z + jz) * uScale, 1.0);
        vColor = mix(uColLow, uColHigh, clamp(smoothstep(-3.0, 3.0, position.y + position.x * 0.5), 0.0, 1.0));
        gl_PointSize = max(uSize * (10.0 / -mv.z) * uPix, 1.5);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `uniform float uOpacity; uniform float uBrightness; uniform float uAppear; varying vec3 vColor;
      void main() { vec2 xy = gl_PointCoord - 0.5; float ll = length(xy); if (ll > 0.5) discard;
        gl_FragColor = vec4(vColor * uBrightness, smoothstep(0.5, 0.1, ll) * uOpacity * uAppear); }`
  }));
  tunnel.frustumCulled = false;
  const roule = new THREE.Group(); roule.add(tunnel); tScene.add(roule);

  /* ---------------- textes, progression */
  const slides = [...section.querySelectorAll('.intro-slide')];
  slides.forEach(s => {
    const t = s.querySelector('.intro-titre'); let d = 0;
    t.innerHTML = t.innerHTML.split(/(<br\s*\/?>)/i).map(p => /^<br/i.test(p) ? p : [...p].map(ch => ch === ' ' ? ' ' : '<span class="car" style="transition-delay:' + (d++ * 0.03).toFixed(2) + 's">' + ch + '</span>').join('')).join('');
  });
  const traits = [...section.querySelectorAll('.intro-trait i')];
  const flash = section.querySelector('.intro-flash');
  const PLAGES = [[-0.1, 0.13], [0.2, 0.34], [0.42, 0.56], [0.64, 0.77]];

  let cible = 0, actuel = 0, mx = 0, my = 0, tmx = 0, tmy = 0, visible = true, dernier = 0;
  function lireDefil() {
    const r = section.getBoundingClientRect(), course = r.height - innerHeight;
    cible = THREE.MathUtils.clamp(-r.top / Math.max(1, course), 0, 1);
  }
  addEventListener('scroll', lireDefil, { passive: true });
  addEventListener('pointermove', e => { tmx = e.clientX / innerWidth * 2 - 1; tmy = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) requestAnimationFrame(image); }, { rootMargin: '100px' }).observe(section);
  function cadrer() {
    const w = scene3d.clientWidth, h = scene3d.clientHeight;
    renderer.setPixelRatio(DPR()); renderer.setSize(w, h, false);
    camera.aspect = tCam.aspect = w / h; camera.updateProjectionMatrix(); tCam.updateProjectionMatrix();
    U.uResolution.value.set(w * DPR(), h * DPR()); TU.uPix.value = DPR() * h / 900;
    lireDefil();
  }
  addEventListener('resize', cadrer); cadrer();

  const horloge = new THREE.Clock(), cible3 = new THREE.Vector3(), regard = new THREE.Vector3();
  let roulis = 0;
  const lisseStep = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b);
  function image(now) {
    if (!visible) return;
    requestAnimationFrame(image);
    if (modeste && now - dernier < 31) return;   // 30 images/s sur les appareils modestes
    dernier = now;
    const dt = Math.min(horloge.getDelta(), 0.1), k = a => 1 - Math.pow(1 - a, dt * 60), t = horloge.elapsedTime;
    actuel += (cible - actuel) * k(0.06);
    mx += (tmx - mx) * k(0.05); my += (tmy - my) * k(0.05);
    const s = actuel;

    // 1) tour de l'appareil (0 → 0,62), puis plongée dans l'objectif (0,62 → 0,8)
    const o = Math.min(1, s / 0.62), phi = o * Math.PI * 2 + 0.55;
    const asp = innerWidth / innerHeight, R = (asp < 1 ? 31 / Math.max(0.45, asp * 1.15) : 31) - Math.sin(o * Math.PI) * 4;
    cible3.set(R * Math.sin(phi), 3 + Math.sin(o * Math.PI) * 7, R * Math.cos(phi));
    const plonge = lisseStep(0.6, 0.8, s);
    const devant = new THREE.Vector3(lentille.x, lentille.y, lentille.z + 0.6 + (1 - plonge) * 26);
    cible3.lerp(devant, plonge);
    const large = innerWidth > 900, decal = large ? -5.2 : 0;
    regard.set(decal * (1 - plonge), (large ? -0.5 : -3.2) * (1 - plonge), 0).lerp(lentille, plonge);
    camera.position.lerp(cible3, k(plonge > 0 ? 0.2 : 0.05));
    camera.lookAt(regard);
    pivot.rotation.y = mx * 0.18 * (1 - plonge); pivot.rotation.x = my * 0.1 * (1 - plonge);

    // étincelles, plus vives quand on défile vite
    const vit = Math.abs(cible - actuel), mul = 1 + vit * 9;
    for (let i = 0; i < N; i++) {
      const d = V[i], j = i * 3;
      pos[j] += (d.x * mul + Math.sin(t * d.s + d.p) * d.r) * dt; pos[j + 1] += d.y * mul * dt; pos[j + 2] += (d.z * mul + Math.cos(t * d.s + d.p) * d.r) * dt;
      if (pos[j + 1] > 14 || Math.abs(pos[j]) > 16 || Math.abs(pos[j + 2]) > 16) { pos[j + 1] = -12; pos[j] = (Math.random() - 0.5) * 14; pos[j + 2] = (Math.random() - 0.5) * 14; }
    }
    gEt.attributes.position.needsUpdate = true;
    etincelles.material.opacity = 0.85 * (1 - plonge);
    U.uTime.value = t; U.uMouse.value.set(mx, -my); U.uScroll.value = Math.min(1, s / 0.8);

    // 2) le tunnel (0,74 → 1)
    const tun = lisseStep(0.72, 0.84, s), vol = THREE.MathUtils.clamp((s - 0.74) / 0.26, 0, 1);
    TU.uTime.value = t; TU.uAppear.value = tun;
    TU.uSwirl.value = 0.39 * (1 + vol * 1.5);
    roulis += dt * (0.065 + vol * 0.05); roule.rotation.z = roulis;
    tCam.position.set(mx * 0.12, -my * 0.12, 20 - vol * 34);
    tCam.lookAt(mx * 0.6, -my * 0.6, tCam.position.z - 12);

    renderer.clear();
    if (tun < 1) renderer.render(scene, camera);
    if (tun > 0) {
      if (tun >= 1) { renderer.setClearColor(0x05020f); renderer.clear(); }
      renderer.clearDepth(); renderer.render(tScene, tCam);
    }
    // éclair blanc à la sortie du tunnel, puis la page claire
    flash.style.opacity = lisseStep(0.9, 1.0, s).toFixed(3);

    // textes et barres de progression
    slides.forEach((el, i) => el.classList.toggle('actif', s >= PLAGES[i][0] && s <= PLAGES[i][1]));
    traits.forEach((el, i) => el.style.setProperty('--p', THREE.MathUtils.clamp((s - i * 0.25) / 0.25, 0, 1).toFixed(3)));
  }
  requestAnimationFrame(image);
}
