/* Fond animé du guide : un dégradé granuleux qui ondule lentement derrière la page.
   Adapté de « Grainient » (React Bits, https://reactbits.dev), porté sans React,
   calculé en basse résolution puis agrandi, 30 images par seconde au plus,
   arrêté quand l'onglet est caché et figé si l'on préfère réduire les animations.

   MIT + Commons Clause License Condition v1.0 — Copyright (c) 2026 David Haz
   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights
   to use, copy, modify, merge, publish, and distribute the Software as part of an
   application, website, or product, subject to the following conditions:
   The above copyright notice and this permission notice shall be included in all
   copies or substantial portions of the Software.
   Commons Clause Restriction: You may use this Software, including for any
   commercial purpose, so long as you do not sell, sublicense, or redistribute the
   components themselves-whether alone, in a bundle, or as a ported version.
   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   SOFTWARE. */
(() => {
  "use strict"
  if (document.querySelector(".fond-anime")) return
  const COULEURS = ["#f5f5f7", "#fbf1cf", "#f5f5f7", "#e6ecf7", "#f6f3fa"]
  const canvas = document.createElement("canvas")
  canvas.className = "fond-anime"
  canvas.setAttribute("aria-hidden", "true")
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" })
  if (!gl) return
  document.body.prepend(canvas)

  const VS = `#version 300 es
out vec2 vUv;
void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); vUv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`
  const CHAMP = `#version 300 es
precision highp float;
uniform float uAspect, uTime, uExtent, uFlow, uSilk;
uniform vec3 uRamp[5];
uniform vec2 uDir;
in vec2 vUv;
out vec4 o;
vec2 hash2(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.103, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy) * 2.0 - 1.0; }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(hash2(i), f), b = dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), d = dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return 0.5 + 0.5 * mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
vec2 drift(vec2 p, float t) {
  vec2 w1 = vec2(noise(p * 0.85 + vec2(t * 0.11, t * 0.07)), noise(p * 0.85 + vec2(4.1, 1.7) - vec2(t * 0.08, t * 0.12)));
  vec2 w2 = vec2(noise(p * 1.55 + w1 * 1.8 + vec2(1.3, 7.1) + t * 0.05), noise(p * 1.55 + w1 * 1.8 + vec2(6.4, 2.2) - t * 0.06));
  return (w1 - 0.5) * 1.1 + (w2 - 0.5) * 0.55;
}
float coord(vec2 p) { vec2 q = p + vec2(-uDir.y, uDir.x) * uTime * 0.45; vec2 w = p + drift(q, uTime) * uFlow; return dot(w, uDir) / uExtent + 0.5; }
vec3 labToRgb(vec3 lab) {
  float l = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z, m = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z, s = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}
vec3 encode(vec3 c) { c = clamp(c, 0.0, 1.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
void main() {
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  float raw = coord(p), s = clamp(raw, 0.0, 1.0) * 4.0;
  int i = int(min(floor(s), 3.0));
  float f = smoothstep(0.0, 1.0, s - float(i));
  vec3 lab = mix(uRamp[i], uRamp[i + 1], f);
  vec2 grad = vec2(coord(p + vec2(0.004, 0.0)) - raw, coord(p + vec2(0.0, 0.004)) - raw) / 0.004;
  vec3 n = normalize(vec3(-grad * sin(3.14159265 * clamp(raw, 0.0, 1.0)) * uSilk * 4.0, 1.0));
  vec3 L = normalize(vec3(-uDir.y, uDir.x, 1.2));
  float diff = dot(n, L) - L.z;
  lab.x += (diff * 0.35 + max(diff, 0.0) * diff * 0.6) * uSilk * 0.25;
  o = vec4(encode(labToRgb(lab)), 1.0);
}`
  const GRAIN = `#version 300 es
precision highp float;
uniform sampler2D uChamp;
uniform float uGrain, uFrame;
in vec2 vUv;
out vec4 o;
float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main() {
  vec3 c = texture(uChamp, vUv).rgb;
  vec2 px = gl_FragCoord.xy + uFrame * vec2(17.0, 59.0);
  float g = hash(px) + hash(px + 7.13) - 1.0;
  float y = dot(c, vec3(0.2126, 0.7152, 0.0722));
  o = vec4(clamp(c + g * uGrain * (0.45 + 2.2 * y * (1.0 - y)), 0.0, 1.0), 1.0);
}`
  const prog = src => {
    const p = gl.createProgram()
    for (const [t, s] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, src]]) {
      const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); gl.attachShader(p, sh)
    }
    gl.linkProgram(p)
    return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null
  }
  const champ = prog(CHAMP), grain = prog(GRAIN)
  if (!champ || !grain) { canvas.remove(); return }
  const u = (p, n) => gl.getUniformLocation(p, n)

  // couleurs en OKLab (le mélange reste doux)
  const versLin = v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  const lab = hex => {
    const [r, g, b] = [1, 3, 5].map(i => versLin(parseInt(hex.slice(i, i + 2), 16) / 255))
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
  }
  const rampe = new Float32Array(COULEURS.flatMap(lab))

  const vao = gl.createVertexArray()
  const tex = gl.createTexture(), fbo = gl.createFramebuffer()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v)
  const vue = { w: 1, h: 1, cw: 1, ch: 1 }
  const angle = 55 * Math.PI / 180, dir = [Math.sin(angle), Math.cos(angle)]
  const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches
  const faible = (navigator.deviceMemory || 8) <= 2 || (navigator.hardwareConcurrency || 8) <= 2
  let temps = 3.7, image = 0, raf = 0, dernier = 0

  function taille() {
    vue.w = innerWidth; vue.h = innerHeight
    // moitié de la résolution : le dégradé est doux, le grain reste visible une fois agrandi
    canvas.width = Math.max(1, Math.round(vue.w / 2)); canvas.height = Math.max(1, Math.round(vue.h / 2))
    const cw = Math.max(8, Math.round(vue.w / 8)), ch = Math.max(8, Math.round(vue.h / 8))
    if (cw !== vue.cw || ch !== vue.ch) {
      vue.cw = cw; vue.ch = ch
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, cw, ch, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }
    dessiner()
  }

  function dessiner() {
    const asp = vue.w / vue.h
    gl.bindVertexArray(vao)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.viewport(0, 0, vue.cw, vue.ch)
    gl.useProgram(champ)
    gl.uniform1f(u(champ, "uAspect"), asp)
    gl.uniform1f(u(champ, "uTime"), temps)
    gl.uniform1f(u(champ, "uExtent"), asp * Math.abs(dir[0]) + Math.abs(dir[1]))
    gl.uniform1f(u(champ, "uFlow"), 0.9)
    gl.uniform1f(u(champ, "uSilk"), 0.35)
    gl.uniform2f(u(champ, "uDir"), dir[0], dir[1])
    gl.uniform3fv(u(champ, "uRamp"), rampe)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.useProgram(grain)
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.uniform1i(u(grain, "uChamp"), 0)
    gl.uniform1f(u(grain, "uGrain"), 0.035)
    gl.uniform1f(u(grain, "uFrame"), image)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  // pendant le défilement, le fond se fige : toute la machine va au défilement
  let defile = 0
  addEventListener("scroll", () => { defile = performance.now() }, { passive: true })

  function boucle(t) {
    raf = 0
    if (document.hidden) return
    if (t - defile < 250) { raf = requestAnimationFrame(boucle); return }
    if (t - dernier >= 33) { // 30 images par seconde suffisent pour un mouvement aussi lent
      const dt = dernier ? Math.min(0.1, (t - dernier) / 1000) : 1 / 30
      dernier = t
      temps += dt * 0.09
      image = (image + 1) % 97
      dessiner()
    }
    raf = requestAnimationFrame(boucle)
  }
  const lancer = () => { if (!raf && !reduit && !faible && !document.hidden) { dernier = 0; raf = requestAnimationFrame(boucle) } }

  addEventListener("resize", taille, { passive: true })
  document.addEventListener("visibilitychange", lancer)
  // si la carte graphique lâche, on garde le fond fixe de la page
  canvas.addEventListener("webglcontextlost", () => { cancelAnimationFrame(raf); raf = 0; canvas.remove() })
  taille()
  lancer()
})()
