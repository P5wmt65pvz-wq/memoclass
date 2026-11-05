import * as THREE from 'three';

const canvas = document.querySelector('#webgl');
let scene, camera, renderer, modelPivot, bgMaterial, sparkParticles;
const clock = new THREE.Clock();
let currentScroll = 0;
let mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;
let cursorX = window.innerWidth / 2, cursorY = window.innerHeight / 2;
let outerCursorX = window.innerWidth / 2, outerCursorY = window.innerHeight / 2;
const shaderUniforms = {
  uTime: { value: 0 },
  uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  uMouse: { value: new THREE.Vector2(0, 0) },
  uScroll: { value: 0 }
};
// Appareil modeste (Chromebook 4 Go, téléphone) : moins d'étincelles, résolution plafonnée
const modeste = (navigator.deviceMemory && navigator.deviceMemory <= 4) || window.innerWidth < 800;
const sparkCount = modeste ? 220 : 450;
const maxDpr = modeste ? 1 : 2;
const sparkData = [];
const sizes = { width: window.innerWidth, height: window.innerHeight };

function createBackgroundShader() {
  const vertexShader = `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `;
  const fragmentShader = `
    varying vec2 vUv;
    uniform float uTime; uniform vec2 uResolution; uniform vec2 uMouse; uniform float uScroll;
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
      float aspect = uResolution.x / uResolution.y;
      float time = uTime * 0.08;
      float scroll = uScroll;
      float angle1 = 0.6; float angle2 = -0.7; float angle3 = 1.2;
      float freq1 = 2.4; float freq2 = 3.2; float freq3 = 4.0;
      vec2 warpedUv = uv;
      float scrollDeform = scroll * 5.0;
      warpedUv.x += sin(uv.y * 2.5 + time * 0.2 + scrollDeform) * 0.35;
      warpedUv.y += cos(uv.x * 2.5 - time * 0.15 - scrollDeform * 0.8) * 0.35;
      warpedUv.x += sin(uv.y * 1.2 - time * 0.1 - scrollDeform * 1.5) * 0.25;
      warpedUv.y += cos(uv.x * 1.2 + time * 0.18 + scrollDeform * 1.2) * 0.25;
      vec2 scrollDrift = vec2(scroll * 0.04, -scroll * 0.02);
      vec2 mouseShift = vec2(uMouse.x * aspect * 0.05, uMouse.y * 0.05);
      warpedUv += scrollDrift + mouseShift;
      vec2 dir1 = vec2(cos(angle1), sin(angle1));
      vec2 dir2 = vec2(cos(angle2), sin(angle2));
      vec2 dir3 = vec2(cos(angle3), sin(angle3));
      float w1 = sin(dot(warpedUv, dir1) * freq1 + time * 1.0);
      float w2 = cos(dot(warpedUv, dir2) * freq2 - time * 1.4 + w1 * 0.4);
      float w3 = sin(dot(warpedUv, dir3) * freq3 + time * 1.8 + w2 * 0.5);
      float waveField = w1 * 0.50 + w2 * 0.35 + w3 * 0.15;
      float wideSheen = pow(max(0.0, 1.0 - abs(waveField - 0.1)), 2.5);
      float crispSpecular = pow(max(0.0, 1.0 - abs(waveField - 0.15)), 8.0);
      float crest = wideSheen * 0.5 + crispSpecular * 0.9;
      vec3 c0_shadow = vec3(0.0010, 0.0006, 0.0004);
      vec3 c0_wave1  = vec3(0.085, 0.040, 0.015);
      vec3 c0_wave2  = vec3(0.050, 0.022, 0.008);
      vec3 c0_crest  = vec3(0.45, 0.30, 0.18);
      vec3 c1_shadow = vec3(0.0004, 0.0006, 0.0012);
      vec3 c1_wave1  = vec3(0.015, 0.035, 0.065);
      vec3 c1_wave2  = vec3(0.008, 0.020, 0.045);
      vec3 c1_crest  = vec3(0.18, 0.35, 0.55);
      float t = smoothstep(0.0, 1.0, scroll);
      vec3 colShadow = mix(c0_shadow, c1_shadow, t);
      vec3 colWave1  = mix(c0_wave1, c1_wave1, t);
      vec3 colWave2  = mix(c0_wave2, c1_wave2, t);
      vec3 colCrest  = mix(c0_crest, c1_crest, t);
      vec3 color = colShadow;
      color = mix(color, colWave2, smoothstep(-0.6, 0.2, waveField));
      color = mix(color, colWave1, smoothstep(0.0, 0.8, waveField));
      color += colCrest * crest * 1.4;
      float vignette = 1.0 - dot(uv, uv) * 0.12;
      color *= vignette;
      gl_FragColor = vec4(color, 1.0);
    }
  `;
  bgMaterial = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms: shaderUniforms, depthWrite: false, depthTest: false });
  const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), bgMaterial);
  bgMesh.position.set(0.0, 0.0, -8.0);
  bgMesh.renderOrder = -10;
  camera.add(bgMesh);
}

function createSparkTexture() {
  const c = document.createElement('canvas'); c.width = 16; c.height = 16;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  g.addColorStop(0, 'rgba(255, 255, 255, 1)');
  g.addColorStop(0.25, 'rgba(255, 255, 255, 0.85)');
  g.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 16, 16);
  return new THREE.CanvasTexture(c);
}

function createSparks() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(sparkCount * 3);
  const colors = new Float32Array(sparkCount * 3);
  for (let i = 0; i < sparkCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 6.5;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 5.0 - 0.5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6.5;
    if (Math.random() < 0.6) {
      colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.4 + Math.random() * 0.15; colors[i * 3 + 2] = 0.05 + Math.random() * 0.1;
    } else {
      colors[i * 3] = 0.55 + Math.random() * 0.15; colors[i * 3 + 1] = 0.82 + Math.random() * 0.12; colors[i * 3 + 2] = 1.0;
    }
    sparkData.push({
      speedX: (Math.random() - 0.5) * 0.4, speedY: 0.15 + Math.random() * 0.3, speedZ: (Math.random() - 0.5) * 0.4,
      swaySpeed: 0.5 + Math.random() * 1.5, swayRadius: 0.05 + Math.random() * 0.15, phase: Math.random() * Math.PI * 2
    });
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.025, vertexColors: true, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false, map: createSparkTexture()
  });
  sparkParticles = new THREE.Points(geometry, material);
  scene.add(sparkParticles);
}

/* L'appareil : vrai modèle 3D fait ici, en formes simples (boîtier, bossage, objectif, molettes,
   écran). Il tourne donc sous tous les angles, sans couches de photos. Inspiré du Nikon Z50II. */
function boite(w, h, d, r, mat) {
  const sh = new THREE.Shape(), x = -w / 2, y = -h / 2;
  sh.moveTo(x + r, y); sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r);
  sh.lineTo(x + w, y + h - r); sh.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  sh.lineTo(x + r, y + h); sh.quadraticCurveTo(x, y + h, x, y + h - r);
  sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y);
  const b = Math.min(r * 0.6, d / 4);
  const g = new THREE.ExtrudeGeometry(sh, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b * 0.9, bevelSegments: 8, curveSegments: 14 });
  g.translate(0, 0, -(d - 2 * b) / 2);
  return new THREE.Mesh(g, mat);
}
function cyl(rt, rb, h, mat, seg) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 48), mat);
  m.rotation.x = Math.PI / 2;           // axe le long de z
  return m;
}
function texteTexture(dessin, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  dessin(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function construireAppareil() {
  const G = new THREE.Group();
  const corps = new THREE.MeshStandardMaterial({ color: 0x202226, roughness: 0.62, metalness: 0.3 });
  const gomme = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.92, metalness: 0.0 });
  const argent = new THREE.MeshStandardMaterial({ color: 0xc4c8ce, roughness: 0.28, metalness: 0.95 });
  const verre = new THREE.MeshPhysicalMaterial({ color: 0x070a14, roughness: 0.12, metalness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.1 });
  const rouge = new THREE.MeshStandardMaterial({ color: 0xd8232a, roughness: 0.4, metalness: 0.2 });

  // boîtier + poignée (à droite de l'image quand on regarde l'avant)
  const boitier = boite(3.5, 2.0, 1.1, 0.22, corps); G.add(boitier);
  const poignee = boite(1.05, 2.0, 1.55, 0.3, corps); poignee.position.set(1.22, 0, 0.22); G.add(poignee);
  const gripGomme = boite(0.72, 1.5, 0.06, 0.2, gomme); gripGomme.position.set(1.28, -0.08, 1.02); G.add(gripGomme);
  const filet = boite(0.05, 1.5, 0.07, 0.02, rouge); filet.position.set(0.9, -0.08, 1.0); G.add(filet);
  // bossage du viseur (prisme) et sabot
  const prisme = boite(1.25, 0.62, 1.0, 0.2, corps); prisme.position.set(-0.28, 1.28, -0.02); G.add(prisme);
  const sabot = boite(0.5, 0.06, 0.42, 0.02, argent); sabot.position.set(-0.28, 1.63, -0.02); G.add(sabot);
  // dessus : molette de modes, déclencheur, bouton rouge
  const molette = cyl(0.3, 0.3, 0.2, corps, 40); molette.rotation.x = 0; molette.position.set(-1.3, 1.1, 0.0); G.add(molette);
  const molStries = cyl(0.31, 0.31, 0.12, gomme, 24); molStries.rotation.x = 0; molStries.position.set(-1.3, 1.12, 0.0); G.add(molStries);
  const decl = cyl(0.17, 0.17, 0.12, argent, 32); decl.rotation.x = 0; decl.position.set(1.25, 1.1, 0.3); G.add(decl);
  const bRouge = cyl(0.09, 0.09, 0.1, rouge, 24); bRouge.rotation.x = 0; bRouge.position.set(0.7, 1.08, 0.3); G.add(bRouge);
  // logo sur le bossage
  const logo = texteTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#e9e9ec';
    ctx.font = 'italic 800 150px Outfit, Arial, sans-serif'; ctx.textBaseline = 'middle'; ctx.fillText('Nikon', 20, h / 2);
  }, 512, 192);
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.32), new THREE.MeshBasicMaterial({ map: logo, transparent: true }));
  pl.position.set(0.0, 1.18, 0.5 + 0.12); G.add(pl);
  // objectif : baïonnette, bague striée, bague de zoom, verre
  const R = 0.8;
  const bague = cyl(R + 0.06, R + 0.06, 0.14, argent, 64); bague.position.z = 0.63; G.add(bague);
  const fut = cyl(R, R + 0.04, 0.5, corps, 64); fut.position.z = 0.92; G.add(fut);
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.05, 0.36), gomme);
    st.position.set(Math.cos(a) * (R + 0.04), Math.sin(a) * (R + 0.04), 0.95); st.rotation.z = a; G.add(st);
  }
  const fut2 = cyl(R - 0.12, R - 0.04, 0.55, corps, 64); fut2.position.z = 1.42; G.add(fut2);
  const anneau = cyl(R - 0.08, R - 0.08, 0.05, argent, 64); anneau.position.z = 1.72; G.add(anneau);
  const interieur = cyl(R - 0.16, R - 0.16, 0.1, gomme, 64); interieur.position.z = 1.72; G.add(interieur);
  const glace = new THREE.Mesh(new THREE.CircleGeometry(R - 0.2, 64), verre); glace.position.z = 1.78; G.add(glace);
  [0.5, 0.33, 0.16].forEach((r, i) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 8, 64), i % 2 ? argent : gomme); t.position.z = 1.79; G.add(t); });
  // arrière : écran, viseur, boutons
  const ecran = texteTexture((ctx, w, h) => {
    ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffcc00'; ctx.fillRect(24, 22, 92, 34);
    ctx.fillStyle = '#05060a'; ctx.font = '800 22px Outfit, Arial'; ctx.fillText('MENU', 36, 47);
    ctx.fillStyle = '#fff'; ctx.font = '800 40px Outfit, Arial'; ctx.fillText('Par où tu commences ?', 24, 112);
    const t = ['Découvrir', 'Prendre en main', 'Apprendre', 'Photographier'];
    t.forEach((x, i) => {
      const cx = 24 + (i % 2) * 262, cy = 140 + Math.floor(i / 2) * 120;
      ctx.fillStyle = '#17181d'; ctx.fillRect(cx, cy, 246, 104);
      ctx.fillStyle = '#ffcc00'; ctx.fillRect(cx + 16, cy + 16, 22, 4);
      ctx.fillStyle = '#fff'; ctx.font = '700 24px Outfit, Arial'; ctx.fillText(x, cx + 16, cy + 78);
    });
  }, 540, 400);
  const ec = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.48), new THREE.MeshStandardMaterial({ map: ecran, emissiveMap: ecran, emissive: 0xffffff, emissiveIntensity: 0.7, roughness: 0.2, metalness: 0.1 }));
  ec.rotation.y = Math.PI; ec.position.set(-0.45, -0.1, -0.605); G.add(ec);
  const cadre = boite(2.12, 1.6, 0.04, 0.1, gomme); cadre.rotation.y = Math.PI; cadre.position.set(-0.45, -0.1, -0.56); G.add(cadre);
  const oeilleton = boite(0.72, 0.5, 0.18, 0.08, gomme); oeilleton.rotation.y = Math.PI; oeilleton.position.set(-0.28, 1.28, -0.58); G.add(oeilleton);
  const oculaire = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.28), verre); oculaire.rotation.y = Math.PI; oculaire.position.set(-0.28, 1.28, -0.69); G.add(oculaire);
  [[1.1, 0.5], [1.1, 0.0], [1.1, -0.5]].forEach(([x, y]) => { const b = cyl(0.1, 0.1, 0.05, argent, 20); b.position.set(x, y, -0.58); G.add(b); });
  const molArr = cyl(0.26, 0.26, 0.05, gomme, 32); molArr.position.set(1.12, 0.95, -0.57); G.add(molArr);
  // anneaux de sangle
  [-1.78, 1.78].forEach(x => { const t = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.035, 10, 24), argent); t.position.set(x, 0.8, 0); t.rotation.y = Math.PI / 2; G.add(t); });
  return G;
}

function loadModel() {
  const cam = construireAppareil();
  const box = new THREE.Box3().setFromObject(cam);
  const size = box.getSize(new THREE.Vector3()), centre = box.getCenter(new THREE.Vector3());
  const k = 3.5 / Math.max(size.x, size.y, size.z);
  cam.position.sub(centre);
  const pivotInterne = new THREE.Group(); pivotInterne.add(cam); pivotInterne.scale.setScalar(k);
  modelPivot = new THREE.Group();
  modelPivot.add(pivotInterne);
  modelPivot.position.y = -0.4;
  scene.add(modelPivot);
}

function setupScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#000000');
  scene.fog = new THREE.FogExp2('#000000', 0.01);
  camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 100);
  camera.position.set(0, 0.2, 3.0);
  scene.add(camera);
  createBackgroundShader();
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !modeste, alpha: false, powerPreference: 'high-performance' });
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 2.2;

  scene.add(new THREE.AmbientLight('#ffffff', 0.1));
  const keyLight = new THREE.SpotLight('#ffffff', 18.0);
  keyLight.position.set(4, 6, 3); keyLight.angle = Math.PI / 4; keyLight.penumbra = 0.9;
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight('#e3f2ff', 10.0);
  rimLight.position.set(-5, 3, -4); scene.add(rimLight);
  const fillLight = new THREE.DirectionalLight('#fff3e6', 0.8);
  fillLight.position.set(-2, -4, 2); scene.add(fillLight);
  // reflets : petite pièce lumineuse générée ici (aucun fichier)
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x050505);
  [[0, 6, 0, 10, 0xffffff, 3], [-6, 2, 3, 6, 0xfff0e0, 2], [6, 1, -4, 6, 0xcfe6ff, 2]].forEach(([x, y, z, sz, c, i]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
  });
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(env, 0.04).texture;
  scene.environmentIntensity = 0.22;
  createSparks();
  loadModel();
}

function onWindowResize() {
  sizes.width = window.innerWidth; sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
  shaderUniforms.uResolution.value.set(sizes.width, sizes.height);
}

function splitTitlesIntoChars() {
  document.querySelectorAll('.slide-title').forEach(title => {
    let html = '', d = 0;
    title.innerHTML.split(/(<br\s*\/?>)/i).forEach(part => {
      if (part.toLowerCase().startsWith('<br')) { html += part; return; }
      for (let i = 0; i < part.length; i++) {
        if (part[i] === ' ') html += ' ';
        else { html += `<span class="char" style="transition-delay: ${d * 0.035}s">${part[i]}</span>`; d++; }
      }
    });
    title.innerHTML = html;
  });
}

function updateGridDots(scroll) {
  document.querySelectorAll('.grid-dot').forEach((dot, i) => {
    const startY = (i * 17) % 80 + 10;
    let speed = 90 + (i * 55) % 180;
    if (i % 2 === 0) speed = -speed;
    let y = startY + scroll * speed;
    y = ((y % 100) + 100) % 100;
    dot.style.top = `${y}%`;
  });
}

function updateSlides(scroll) {
  for (let i = 1; i <= 4; i++) {
    const fill = document.getElementById(`dash-fill-${i}`);
    if (fill) {
      const start = (i - 1) * 0.25, end = i * 0.25;
      fill.style.height = `${Math.max(0, Math.min(1, (scroll - start) / (end - start))) * 100}%`;
    }
  }
  const on = (v, a, b) => v >= a && v <= b;
  const s = (id) => document.getElementById(id);
  s('slide-1').classList.toggle('active', on(scroll, -0.10, 0.12));
  const a2 = on(scroll, 0.28, 0.40);
  s('slide-2').classList.toggle('active', a2);
  s('slide-2-img').classList.toggle('active', a2);
  s('slide-3').classList.toggle('active', on(scroll, 0.56, 0.68));
  s('slide-4').classList.toggle('active', on(scroll, 0.84, 1.05));
}

let dernier = 0;
function animate(now) {
  requestAnimationFrame(animate);
  if (modeste && now - dernier < 30) return;   // ~30 i/s sur Chromebook et téléphone : fluide et léger
  dernier = now;
  const dt = Math.min(clock.getDelta(), 0.1);
  const k60 = (a) => 1 - Math.pow(1 - a, dt * 60);   // même vitesse à 60 i/s, régulier si l'appareil ralentit
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const scrollTop = window.scrollY !== undefined ? window.scrollY : document.documentElement.scrollTop;
  const targetScroll = maxScroll > 0 ? scrollTop / maxScroll : 0;
  currentScroll += (targetScroll - currentScroll) * k60(0.025);
  mouseX += (targetMouseX - mouseX) * k60(0.05);
  mouseY += (targetMouseY - mouseY) * k60(0.05);
  outerCursorX += (cursorX - outerCursorX) * k60(0.2);
  outerCursorY += (cursorY - outerCursorY) * k60(0.2);
  const co = document.querySelector('.cursor-outer');
  if (co) { co.style.left = `${outerCursorX}px`; co.style.top = `${outerCursorY}px`; }
  if (modelPivot) { modelPivot.rotation.y = mouseX * 0.25; modelPivot.rotation.x = mouseY * 0.15; }

  if (sparkParticles) {
    const pos = sparkParticles.geometry.attributes.position.array;
    const time = clock.getElapsedTime();
    const sv = Math.abs(targetScroll - currentScroll);
    const mult = 1.0 + sv * 9.0, turb = sv * 0.8;
    for (let i = 0; i < sparkCount; i++) {
      const k = i * 3, d = sparkData[i];
      pos[k] += d.speedX * dt * mult; pos[k + 1] += d.speedY * dt * mult; pos[k + 2] += d.speedZ * dt * mult;
      const sw = d.swayRadius * (1.0 + turb * 4.0);
      pos[k] += Math.sin(time * d.swaySpeed + d.phase) * sw * dt;
      pos[k + 2] += Math.cos(time * d.swaySpeed + d.phase) * sw * dt;
      if (pos[k + 1] > 3.0 || Math.abs(pos[k]) > 3.5 || Math.abs(pos[k + 2]) > 3.5) {
        pos[k + 1] = -2.5; pos[k] = (Math.random() - 0.5) * 3.0; pos[k + 2] = (Math.random() - 0.5) * 3.0;
      }
    }
    sparkParticles.geometry.attributes.position.needsUpdate = true;
  }

  const phi = currentScroll * Math.PI * 2.0;
  const y = 0.35 + Math.sin(currentScroll * Math.PI) * 0.8;
  const radius = 4.2 - Math.sin(currentScroll * Math.PI) * 0.6;
  const tp = Math.min(1.0, currentScroll / 0.28);
  const ease = (Math.cos(tp * Math.PI) + 1.0) * 0.5;
  const small = sizes.width < 800;
  const lookX = small ? 0 : -0.9 * ease;
  camera.position.lerp(new THREE.Vector3(radius * Math.sin(phi), y, radius * Math.cos(phi)), k60(0.025));
  camera.lookAt(new THREE.Vector3(lookX, small ? -0.5 : -0.15, 0));

  shaderUniforms.uTime.value = clock.getElapsedTime();
  shaderUniforms.uMouse.value.set(mouseX, -mouseY);
  shaderUniforms.uScroll.value = currentScroll;
  updateSlides(currentScroll);
  updateGridDots(currentScroll);
  renderer.render(scene, camera);
}

function setupNavigation() {
  const targets = [0.0, 0.34, 0.62, 0.94];
  document.querySelectorAll('.nav-link').forEach((link, i) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: max * targets[i], behavior: 'smooth' });
    });
  });
}

window.addEventListener('mousemove', (e) => {
  cursorX = e.clientX; cursorY = e.clientY;
  const ci = document.querySelector('.cursor-inner');
  if (ci) { ci.style.left = `${cursorX}px`; ci.style.top = `${cursorY}px`; }
  targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
  targetMouseY = (e.clientY / window.innerHeight) * 2 - 1;
});
window.addEventListener('resize', onWindowResize);

splitTitlesIntoChars();
setupScene();
onWindowResize();
requestAnimationFrame(animate);
setupNavigation();
