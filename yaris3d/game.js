/* Blok Rallisi 3D: Sayı Bahçesi'nin içindeki gerçekçi görünümlü yarış (yaris3d/).
   Three.js r128 (three.min.js, MIT) yerel kopyadan yüklenir; çevrimdışı da çalışır.
   Bilet, altın, seviye, ses ve dükkândan alınan yarış eşyaları (inv.r_*) Sayı Bahçesi'nin kaydından okunur. */
'use strict';
(() => {
// Yazılar dokulara çizildiği için önce yazı tipi yüklensin, sonra pist kurulsun
const fontsReady = document.fonts && document.fonts.load ? Promise.race([Promise.all([document.fonts.load('italic 900 40px "Exo 2"'), document.fonts.load('800 20px "Exo 2"')]), new Promise(r => setTimeout(r, 2000))]) : Promise.resolve();
fontsReady.catch(() => {}).then(() => setTimeout(main, 30));
function main() {
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, u) => a + (b - a) * u;
let seed = 7;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;   // manzara için tekrarlanabilir
const rnd = (a, b) => a + rand() * (b - a);
const mr = (a, b) => a + Math.random() * (b - a);                        // oyun içi rastgelelik
const pickR = a => a[Math.floor(Math.random() * a.length)];
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), UP = V3(0, 1, 0);
const FONT = '"Exo 2", "Arial Narrow", sans-serif';

/* ================= Sayı Bahçesi kaydı ================= */
const Wallet = {
  key: 'sayi-bahcesi.v1',
  read() { try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch (e) { return {}; } },
  write(d) { try { localStorage.setItem(this.key, JSON.stringify(d)); } catch (e) {} },
  get tickets() { return this.read().tickets || 0; },
  get coins() { return this.read().coins || 0; },
  get level() { return clamp(this.read().level | 0 || 1, 1, 3); },
  get sound() { return this.read().sound !== false; },
  inv(k) { const d = this.read(); return (d.inv && d.inv[k]) || 0; },
  useItem(k) { const d = this.read(); if (d.inv && d.inv[k] > 0) { d.inv[k]--; this.write(d); return true; } return false; },
  useTicket() { const d = this.read(); if (!(d.tickets > 0)) return false; d.tickets--; this.write(d); return true; },
  addCoins(n) { const d = this.read(); d.coins = (d.coins || 0) + n; this.write(d); },
  get lastBag() { const b = this.read().race3dBag; return Array.isArray(b) ? b : []; },
  set lastBag(b) { const d = this.read(); d.race3dBag = b; this.write(d); },
};

/* ================= eşyalar =================
   Dükkân anahtarları (r_*) app.js'teki SHOP listesiyle aynı. Kutudan gelenler bedavadır, çantadakiler kullanılınca harcanır. */
const SVG = {
  turbo: '<svg viewBox="0 0 48 48"><path d="M24 4c3 8 12 12 12 24a12 12 0 0 1-24 0c0-6 3-9 5-12 1 4 3 6 5 6-2-6 0-12 2-18z" fill="#FF7A1A"/><path d="M24 22c2 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 1 2 2 3 3 3-1-3 0-5 0-8z" fill="#FFD23F"/></svg>',
  missile: '<svg viewBox="0 0 48 48"><rect x="8" y="19" width="26" height="10" rx="5" fill="#D5DAE3"/><path d="M34 19l9 5-9 5z" fill="#FF4D6D"/><path d="M8 19l-4-5h8zM8 29l-4 5h8z" fill="#FF4D6D"/><circle cx="24" cy="24" r="2.5" fill="#0E1220"/></svg>',
  tmissile: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="none" stroke="#FF4D6D" stroke-width="3"/><circle cx="24" cy="24" r="11" fill="none" stroke="#FF4D6D" stroke-width="2.5"/><path d="M24 2v9M24 37v9M2 24h9M37 24h9" stroke="#FF4D6D" stroke-width="3"/><rect x="13" y="20" width="18" height="8" rx="4" fill="#D5DAE3"/><path d="M31 20l6 4-6 4z" fill="#FFC21F"/></svg>',
  oil: '<svg viewBox="0 0 48 48"><path d="M24 6c6 9 11 15 11 22a11 11 0 0 1-22 0c0-7 5-13 11-22z" fill="#1B1E27" stroke="#8A93AD" stroke-width="2"/><path d="M19 28a6 6 0 0 0 5 6" stroke="#8A93AD" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>',
  cones: '<svg viewBox="0 0 48 48"><path d="M24 6l9 32H15z" fill="#FF6A1A"/><path d="M19.5 22h9l1.4 5h-11.8zM21.6 14h4.8l1 4h-6.8z" fill="#fff"/><rect x="9" y="37" width="30" height="5" rx="2" fill="#E2551A"/></svg>',
  snow: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="16" fill="#F4F8FF"/><path d="M13 30a16 16 0 0 0 26-2 14 14 0 0 1-26 2z" fill="#C6D6EE"/><circle cx="18" cy="18" r="3" fill="#fff"/></svg>',
  bolt: '<svg viewBox="0 0 48 48"><path d="M28 3L10 27h11l-4 18 21-26H26z" fill="#FFD23F" stroke="#FFF3B0" stroke-width="2" stroke-linejoin="round"/></svg>',
  shield: '<svg viewBox="0 0 48 48"><path d="M24 5l15 6v11c0 10-7 17-15 21-8-4-15-11-15-21V11z" fill="#3FA9FF" stroke="#BFE6FF" stroke-width="2.5"/><path d="M17 24l5 5 9-10" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  tires: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="#1A1C22"/><circle cx="24" cy="24" r="10" fill="#9AA2AE"/><circle cx="24" cy="24" r="4" fill="#1A1C22"/><path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.6 10.6l4.2 4.2M33.2 33.2l4.2 4.2M10.6 37.4l4.2-4.2M33.2 14.8l4.2-4.2" stroke="#2EE59D" stroke-width="3" stroke-linecap="round"/></svg>',
  start: '<svg viewBox="0 0 48 48"><rect x="15" y="3" width="18" height="42" rx="6" fill="#1A1C22"/><circle cx="24" cy="12" r="5" fill="#4A2228"/><circle cx="24" cy="24" r="5" fill="#4A3F22"/><circle cx="24" cy="36" r="5" fill="#2EE59D"/></svg>',
  empty: '<svg viewBox="0 0 48 48"><rect x="10" y="10" width="28" height="28" rx="4" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="3" stroke-dasharray="5 4"/></svg>',
};
// fx: oyundaki etkisi. price: app.js SHOP ile aynı (yalnızca gösterim için).
const RITEMS = {
  r_missile: { name: 'Hedef Füzesi', short: 'Füze', fx: 'tmissile', price: 4 },
  r_oil: { name: 'Yağ Birikintisi', short: 'Yağ', fx: 'oil', price: 2 },
  r_cones: { name: 'Koni Seti', short: 'Koni', fx: 'cones', price: 2 },
  r_snow: { name: 'Kartopu', short: 'Kartopu', fx: 'snow', price: 3 },
  r_bolt: { name: 'Yıldırım', short: 'Yıldırım', fx: 'bolt', price: 7 },
  r_shield: { name: 'Kalkan', short: 'Kalkan', fx: 'shield', price: 3 },
  r_tires: { name: 'Kaymaz Lastik', short: 'Lastik', fx: 'tires', price: 3 },
  r_turbo: { name: 'Turbo', short: 'Turbo', fx: 'turbo', price: 3 },
  r_start: { name: 'Süper Start', short: 'Start', fx: 'start', price: 2, passive: true },
};
const RKEYS = Object.keys(RITEMS);
const FXNAME = { turbo: 'Turbo', missile: 'Füze', tmissile: 'Hedef Füzesi', oil: 'Yağ', cones: 'Koni', snow: 'Kartopu', bolt: 'Yıldırım', shield: 'Kalkan', tires: 'Kaymaz Lastik', start: 'Süper Start' };
const BOX_KEYS = ['turbo', 'missile', 'oil', 'shield', 'snow', 'cones'];
const BAG_MAX = 3;

/* ================= ses ================= */
let SOUND = Wallet.sound, actx = null, eng = null;
function audio() { if (!SOUND) return null; try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state !== 'running') actx.resume(); } catch (e) { actx = null; } return actx; }
function beep(f, d = .12, type = 'square', vol = .05, f2) {
  const a = audio(); if (!a) return;
  try {
    const o = a.createOscillator(), g = a.createGain(), n = a.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, n); if (f2) o.frequency.exponentialRampToValueAtTime(f2, n + d);
    g.gain.setValueAtTime(vol, n); g.gain.exponentialRampToValueAtTime(.0001, n + d);
    o.connect(g); g.connect(a.destination); o.start(n); o.stop(n + d + .02);
  } catch (e) {}
}
function noiseBurst(d = .35, vol = .12, lp = 900) {
  const a = audio(); if (!a) return;
  try {
    const len = Math.floor(a.sampleRate * d), b = a.createBuffer(1, len, a.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; f.type = 'lowpass'; f.frequency.value = lp; g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(a.destination); s.start();
  } catch (e) {}
}
function engine(on) {
  const a = audio();
  if (on && a && !eng) {
    try {
      const o = a.createOscillator(), o2 = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
      o.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 420; g.gain.value = 0;
      o.connect(f); o2.connect(f); f.connect(g); g.connect(a.destination); o.start(); o2.start();
      eng = { o, o2, g };
    } catch (e) {}
  } else if (!on && eng) { try { eng.o.stop(); eng.o2.stop(); } catch (e) {} eng = null; }
}
const SFX = {
  good() { [660, 880, 1100].forEach((f, i) => setTimeout(() => beep(f, .12, 'triangle', .06), i * 70)); },
  bad() { beep(220, .25, 'sawtooth', .04, 140); },
  item() { beep(520, .08, 'square', .04); setTimeout(() => beep(780, .1, 'square', .04), 70); },
  hit() { noiseBurst(.4, .16, 700); beep(160, .3, 'sawtooth', .05, 60); },
  boom() { noiseBurst(.6, .2, 500); },
  whoosh() { noiseBurst(.5, .07, 2400); },
  zap() { noiseBurst(.25, .14, 4000); beep(1200, .2, 'sawtooth', .04, 200); },
  light(go) { beep(go ? 880 : 440, go ? .4 : .18, 'square', .05); },
  jump() { beep(300, .25, 'triangle', .05, 600); },
};

/* ================= işleyici, sahne ================= */
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
let PR = Math.min(1.5, window.devicePixelRatio || 1);
renderer.setPixelRatio(PR);
renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
const HAZE = new THREE.Color(0xC9D3DC);
scene.fog = new THREE.FogExp2(HAZE, .0011);
const camera = new THREE.PerspectiveCamera(64, 1, .3, 4000);
const SUN_DIR = V3(-.62, .30, -.45).normalize();
const MAXANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());

function cvs(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; if (draw) draw(c.getContext('2d'), w, h); return c; }
function tex(c, rep, srgb = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; t.anisotropy = MAXANISO; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.__cv = c; return t; }
function valueNoise(w, h, scale, oct) {
  const out = new Float32Array(w * h);
  for (let o = 0; o < oct; o++) {
    const cell = Math.max(1, Math.floor(scale / 2 ** o)), gw = Math.ceil(w / cell), gh = Math.ceil(h / cell), g = new Float32Array(gw * gh);
    for (let i = 0; i < g.length; i++) g[i] = rand();
    const amp = .5 ** (o + 1);
    for (let y = 0; y < h; y++) {
      const fy = y / cell, y0 = Math.floor(fy) % gh, y1 = (y0 + 1) % gh; let v = fy - Math.floor(fy); v = v * v * (3 - 2 * v);
      for (let x = 0; x < w; x++) {
        const fx = x / cell, x0 = Math.floor(fx) % gw, x1 = (x0 + 1) % gw; let u = fx - Math.floor(fx); u = u * u * (3 - 2 * u);
        out[y * w + x] += amp * lerp(lerp(g[y0 * gw + x0], g[y0 * gw + x1], u), lerp(g[y1 * gw + x0], g[y1 * gw + x1], u), v);
      }
    }
  }
  return out;
}
function normalFromHeight(hm, w, h, k) {
  const c = cvs(w, h), ctx = c.getContext('2d'), id = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const l = hm[y * w + (x - 1 + w) % w], r = hm[y * w + (x + 1) % w], u = hm[((y - 1 + h) % h) * w + x], d = hm[((y + 1) % h) * w + x];
    let nx = (l - r) * k, ny = (u - d) * k, nz = 1; const n = Math.hypot(nx, ny, nz); nx /= n; ny /= n; nz /= n;
    const i = (y * w + x) * 4; id.data[i] = (nx * .5 + .5) * 255; id.data[i + 1] = (ny * .5 + .5) * 255; id.data[i + 2] = (nz * .5 + .5) * 255; id.data[i + 3] = 255;
  }
  ctx.putImageData(id, 0, 0); return c;
}
// yuvarlatılmış kutu (three örneklerindeki RoundedBoxGeometry'nin kısası)
function rbox(w, h, d, seg = 2, r = .1) {
  seg = seg * 2 + 1; r = Math.min(w / 2, h / 2, d / 2, r);
  const g = new THREE.BoxGeometry(1, 1, 1, seg, seg, seg).toNonIndexed();
  const p = g.attributes.position.array, nm = g.attributes.normal.array, box = V3(w, h, d).divideScalar(2).subScalar(r), half = .5 / seg, n = V3();
  for (let i = 0; i < p.length; i += 3) {
    n.set(p[i], p[i + 1], p[i + 2]); n.x -= Math.sign(n.x) * half; n.y -= Math.sign(n.y) * half; n.z -= Math.sign(n.z) * half; n.normalize();
    p[i] = box.x * Math.sign(p[i]) + n.x * r; p[i + 1] = box.y * Math.sign(p[i + 1]) + n.y * r; p[i + 2] = box.z * Math.sign(p[i + 2]) + n.z * r;
    nm[i] = n.x; nm[i + 1] = n.y; nm[i + 2] = n.z;
  }
  return g;
}
// Durağan parçaları malzemeye göre birleştir: yüzlerce küçük parça birkaç çizim çağrısına iner (telefonda akıcılık için)
function collapse(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), buckets = new Map(), victims = [];
  root.traverse(o => {
    if (!o.isMesh || o === root || o.isInstancedMesh || Array.isArray(o.material) || o.userData.keep) return;
    let skip = false; for (let p = o.parent; p && p !== root; p = p.parent) if (p.userData.keep) skip = true;
    if (skip) return;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    const b = buckets.get(o.material) || { geos: [], cast: false, recv: false }; b.geos.push(g); b.cast = b.cast || o.castShadow; b.recv = b.recv || o.receiveShadow; buckets.set(o.material, b);
    victims.push(o);
  });
  victims.forEach(o => o.parent.remove(o));
  for (const [mat, b] of buckets) {
    let n = 0; b.geos.forEach(g => n += g.attributes.position.count);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let k = 0;
    b.geos.forEach(g => { pos.set(g.attributes.position.array, k * 3); nor.set(g.attributes.normal.array, k * 3); uv.set(g.attributes.uv.array, k * 2); k += g.attributes.position.count; g.dispose(); });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const m = new THREE.Mesh(geo, mat); m.castShadow = b.cast; m.receiveShadow = b.recv; root.add(m);
  }
  return root;
}
function tube(a, b, r, mat, seg = 8) { const d = b.clone().sub(a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), seg), mat); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(UP, d.normalize()); m.castShadow = true; return m; }

/* ================= dokular ================= */
const AS = 1024, asH = valueNoise(AS, AS, 6, 3);
const asphaltC = cvs(AS, AS, (c, w, h) => {
  const id = c.createImageData(w, h), big = valueNoise(w, h, 256, 3);
  for (let i = 0; i < w * h; i++) {
    const v = 50 + asH[i] * 18 + (big[i] - .5) * 16, x = i % w;
    const groove = [.27, .4, .6, .73].reduce((a, cx) => a + Math.exp(-((x / w - cx) ** 2) / .0012) * 18, 0);
    id.data[i * 4] = v - groove + 2; id.data[i * 4 + 1] = v - groove + 3; id.data[i * 4 + 2] = v - groove + 9; id.data[i * 4 + 3] = 255;
  }
  c.putImageData(id, 0, 0);
  for (let k = 0; k < 4000; k++) { c.fillStyle = rand() < .5 ? 'rgba(200,200,210,.08)' : 'rgba(10,10,14,.15)'; const s = rnd(1, 3); c.fillRect(rand() * w, rand() * h, s, s); }
  c.fillStyle = 'rgba(240,240,236,.95)'; c.fillRect(10, 0, 14, h); c.fillRect(w - 24, 0, 14, h);
  for (const k of [1, 2, 3]) c.fillRect(k * w / 4 - 6, 0, 12, h * .42);
  for (let k = 0; k < 400; k++) { c.fillStyle = 'rgba(70,70,74,.35)'; c.fillRect(rand() * w, rand() * h, rnd(2, 6), rnd(2, 6)); }
});
const roadMat = new THREE.MeshStandardMaterial({ map: tex(asphaltC, true), normalMap: tex(normalFromHeight(asH, AS, AS, 3.2), true, false), normalScale: new THREE.Vector2(.3, .3), roughness: .9 });
const grassH = valueNoise(512, 512, 4, 3), grassBig = valueNoise(512, 512, 128, 3);
const grassMat = new THREE.MeshStandardMaterial({ roughness: 1,
  map: tex(cvs(512, 512, (c, w, h) => { const id = c.createImageData(w, h); for (let i = 0; i < w * h; i++) { const v = grassH[i], b = grassBig[i]; id.data[i * 4] = 52 + v * 40 + b * 30; id.data[i * 4 + 1] = 92 + v * 50 + b * 26; id.data[i * 4 + 2] = 34 + v * 18; id.data[i * 4 + 3] = 255; } c.putImageData(id, 0, 0); }), true),
  normalMap: tex(normalFromHeight(grassH, 512, 512, 4), true, false) });
const gravH = valueNoise(512, 512, 3, 2);
const gravelMat = new THREE.MeshStandardMaterial({ roughness: 1,
  map: tex(cvs(512, 512, (c, w, h) => { const id = c.createImageData(w, h); for (let i = 0; i < w * h; i++) { const v = gravH[i]; id.data[i * 4] = 150 + v * 70; id.data[i * 4 + 1] = 134 + v * 64; id.data[i * 4 + 2] = 104 + v * 52; id.data[i * 4 + 3] = 255; } c.putImageData(id, 0, 0); }), true),
  normalMap: tex(normalFromHeight(gravH, 512, 512, 6), true, false) });
const kerbMat = new THREE.MeshStandardMaterial({ roughness: .55, map: tex(cvs(128, 256, (c, w, h) => { c.fillStyle = '#C81E2E'; c.fillRect(0, 0, w, h / 2); c.fillStyle = '#EDEDED'; c.fillRect(0, h / 2, w, h / 2); for (let k = 0; k < 600; k++) { c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(rand() * w, rand() * h, 2, 2); } }), true) });
const concreteH = valueNoise(256, 64, 8, 3);
const wallMat = new THREE.MeshStandardMaterial({ roughness: .8, side: THREE.DoubleSide, map: tex(cvs(1024, 64, (c, w, h) => { const id = c.createImageData(w, h); for (let i = 0; i < w * h; i++) { const v = 210 + concreteH[(i % w) % 256 + Math.floor(i / w) * 256] * 30; id.data[i * 4] = v; id.data[i * 4 + 1] = v; id.data[i * 4 + 2] = v + 4; id.data[i * 4 + 3] = 255; } c.putImageData(id, 0, 0); c.fillStyle = '#1D4BA0'; c.fillRect(0, h * .55, w, h * .3); }), true) });
const fenceMat = new THREE.MeshStandardMaterial({ alphaTest: .4, metalness: .6, roughness: .4, side: THREE.DoubleSide, map: tex(cvs(64, 64, (c, w, h) => { c.strokeStyle = '#BFC6CF'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w / 2, 0); c.lineTo(w, h / 2); c.lineTo(w / 2, h); c.closePath(); c.stroke(); }), true) });
const carbonTex = tex(cvs(64, 64, (c) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.fillStyle = (x + y) % 2 ? '#202329' : '#15171C'; c.fillRect(x * 8, y * 8, 8, 8); c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(x * 8, y * 8, 8, 2); } }), true); carbonTex.repeat.set(6, 6);
const smokeTex = tex(cvs(128, 128, (c) => { const g = c.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.5, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); }));

/* ================= gökyüzü, ışık ================= */
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { sunDir: { value: SUN_DIR }, t: { value: 0 } },
  vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform vec3 sunDir; uniform float t; varying vec3 vD;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }
  void main(){
    vec3 d = normalize(vD); float h = d.y;
    vec3 top = vec3(0.10, 0.30, 0.66), mid = vec3(0.38, 0.58, 0.84), hor = vec3(0.84, 0.82, 0.78);
    vec3 c = mix(hor, mid, smoothstep(0.0, 0.22, h)); c = mix(c, top, smoothstep(0.18, 0.95, h));
    float s = max(dot(d, sunDir), 0.0);
    c += vec3(1.0, 0.80, 0.55) * pow(s, 5.0) * 0.30 + vec3(1.0, 0.93, 0.80) * pow(s, 60.0) * 0.5 + vec3(1.0) * pow(s, 2000.0) * 6.0;
    if (h > 0.0) {
      vec2 uv = d.xz / (h + 0.08) * 0.9 + vec2(t * 0.004, 0.0);
      float n = fbm(uv * 1.3 + vec2(4.0, 2.0)), cl = smoothstep(0.50, 0.80, n) * smoothstep(0.0, 0.10, h);
      float shade = fbm(uv * 1.3 + vec2(4.03, 2.03) + sunDir.xz * 0.06);
      vec3 cc = mix(vec3(0.62, 0.64, 0.70), vec3(1.0, 0.97, 0.92), clamp((n - shade) * 6.0 + 0.6, 0.0, 1.0));
      cc += vec3(1.0, 0.75, 0.5) * pow(s, 3.0) * 0.35;
      c = mix(c, cc, cl * 0.92);
    } else c = hor * 0.92;
    gl_FragColor = vec4(c, 1.0);
  }`,
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(3500, 48, 24), skyMat); scene.add(sky);
(() => { // yansımalar için düz bir gökyüzü + yer görüntüsü
  const c = cvs(1024, 512, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#244E8F'); g.addColorStop(.42, '#9EBBD8'); g.addColorStop(.5, '#DCD8D0'); g.addColorStop(.52, '#5D6B4E'); g.addColorStop(1, '#2E3626'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    const sx = (Math.atan2(SUN_DIR.x, SUN_DIR.z) / (2 * Math.PI) + .5) * w, sy = (.5 - Math.asin(SUN_DIR.y) / Math.PI) * h;
    const rg = c.createRadialGradient(sx, sy, 2, sx, sy, 90); rg.addColorStop(0, 'rgba(255,250,235,1)'); rg.addColorStop(.15, 'rgba(255,230,190,.8)'); rg.addColorStop(1, 'rgba(255,220,180,0)'); c.fillStyle = rg; c.fillRect(0, 0, w, h);
    for (let k = 0; k < 30; k++) { c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(rand() * w, rnd(.15, .45) * h, rnd(30, 90), rnd(6, 16), 0, 0, 7); c.fill(); }
  });
  const t = tex(c); t.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(t).texture; pm.dispose(); t.dispose();
})();
scene.add(new THREE.HemisphereLight(0xBFD6F0, 0x4E5E3A, .35));
const sun = new THREE.DirectionalLight(0xFFE2B8, 3.0);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 1, far: 500 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .04; sun.shadow.camera.updateProjectionMatrix();
scene.add(sun, sun.target);

/* ================= pist ================= */
const CTRL = [[0, 0, 0], [170, 2, -4], [290, 7, -50], [330, 13, -160], [280, 17, -260], [170, 12, -300], [80, 5, -250], [10, 2, -310], [-70, 6, -400], [-200, 11, -390], [-280, 7, -290], [-240, 2, -180], [-300, 0, -80], [-230, 0, 30], [-110, 0, 30]];
const curve = new THREE.CatmullRomCurve3(CTRL.map(([x, y, z]) => V3(x, y, z)), true, 'catmullrom', .5);
const L = curve.getLength();
const LANES = 4, LANE = 5.5, W = LANES * LANE, HALF = W / 2, MAXLAT = HALF - 1.4;
const LANE_COL = ['#FF3355', '#FFB800', '#22E08A', '#2E9BFF'];
const laneC = ln => (ln - (LANES - 1) / 2) * LANE;
const laneOf = lat => clamp(Math.floor(lat / LANE + LANES / 2), 0, LANES - 1);
const N = 2000, P = [], T = [], R = [];
for (let i = 0; i <= N; i++) { const u = (i % N) / N, p = curve.getPointAt(u), t = curve.getTangentAt(u).normalize(); P.push(p); T.push(t); R.push(V3().crossVectors(t, UP).normalize()); }
const _f = { p: V3(), t: V3(), r: V3() };
function frameAt(s, out) { // out verilirse yeni nesne üretmez (her karede yüzlerce çağrı)
  const f = (((s % L) + L) % L) / L * N, i = Math.floor(f), k = f - i, j = i + 1, o = out || { p: V3(), t: V3(), r: V3() };
  o.p.copy(P[i]).lerp(P[j], k); o.t.copy(T[i]).lerp(T[j], k).normalize(); o.r.copy(R[i]).lerp(R[j], k).normalize(); return o;
}
const yawOf = t => Math.atan2(t.x, t.z);
const sOf = d => ((d % L) + L) % L;
function ribbon(off0, off1, y0, y1, uvLen, mat, s0 = 0, s1 = L, step = L / N, vert = false, uvW = 1) {
  const pos = [], uv = [], idx = []; let n = 0;
  for (let s = s0; s <= s1 + 1e-6; s += step) {
    const f = frameAt(s), a = f.p.clone().addScaledVector(f.r, off0), b = f.p.clone().addScaledVector(f.r, off1);
    if (vert) pos.push(a.x, a.y + y0, a.z, a.x, a.y + y1, a.z); else pos.push(a.x, a.y + y0, a.z, b.x, b.y + y1, b.z);
    uv.push(0, (s - s0) / uvLen, uvW, (s - s0) / uvLen);
    if (n) { const q = (n - 1) * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); } n++;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m;
}
scene.add(ribbon(-HALF, HALF, .03, .03, 22, roadMat));
scene.add(ribbon(-HALF - 1.4, -HALF, .02, .14, 6, kerbMat), ribbon(HALF, HALF + 1.4, .14, .02, 6, kerbMat));
scene.add(ribbon(-HALF - 3.4, -HALF - 1.4, -.03, .02, 6, grassMat, 0, L, L / N, false, .3), ribbon(HALF + 1.4, HALF + 3.4, .02, -.03, 6, grassMat, 0, L, L / N, false, .3));
scene.add(ribbon(-HALF - 11, -HALF - 3.4, -.02, -.03, 8, gravelMat, 0, L, L / N, false, 1.2), ribbon(HALF + 3.4, HALF + 11, -.03, -.02, 8, gravelMat, 0, L, L / N, false, 1.2));
scene.add(ribbon(-HALF - 11.2, -HALF - 11.2, 0, 1.15, 30, wallMat, 0, L, L / N, true), ribbon(HALF + 11.2, HALF + 11.2, 0, 1.15, 30, wallMat, 0, L, L / N, true));
scene.add(ribbon(-HALF - 11.3, -HALF - 11.3, 1.15, 4.6, .5, fenceMat, 0, L, L / N, true, 6), ribbon(HALF + 11.3, HALF + 11.3, 1.15, 4.6, .5, fenceMat, 0, L, L / N, true, 6));
(function posts() { const g = new THREE.CylinderGeometry(.06, .06, 4.6, 6), m = new THREE.MeshStandardMaterial({ color: 0x9AA2AE, metalness: .7, roughness: .35 }); const n = Math.floor(L / 5) * 2, im = new THREE.InstancedMesh(g, m, n), mx = new THREE.Matrix4(); let k = 0; for (let s = 0; s < L - 1 && k < n; s += 5) for (const sd of [-1, 1]) { const f = frameAt(s), p = f.p.clone().addScaledVector(f.r, sd * (HALF + 11.3)); mx.makeTranslation(p.x, p.y + 2.3, p.z); im.setMatrixAt(k++, mx); } im.count = k; scene.add(im); })();
// zemin: pistin hemen dışı düz, uzaklaştıkça tepelenir
const coarse = P.filter((_, i) => i % 4 === 0);
const hn = (x, z) => Math.sin(x * .004) * Math.cos(z * .005) * 30 + Math.sin(x * .011 + 2) * Math.sin(z * .009) * 12 + Math.sin((x + z) * .02) * 4;
function groundH(x, z) { let d = 1e9, py = 0; for (const p of coarse) { const dd = (p.x - x) ** 2 + (p.z - z) ** 2; if (dd < d) { d = dd; py = p.y; } } d = Math.sqrt(d); const k = clamp((d - 30) / 260, 0, 1); return lerp(py - .6, Math.max(-.5, hn(x, z) + 10), k * k); }
(function terrain() {
  const g = new THREE.PlaneGeometry(3000, 3000, 180, 180); g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, groundH(pos.getX(i), pos.getZ(i)));
  g.computeVertexNormals();
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 140, uv.getY(i) * 140);
  const m = new THREE.Mesh(g, grassMat); m.receiveShadow = true; scene.add(m);
})();
function farFromTrack(x, z, d) { for (let i = 0; i < N; i += 10) { const p = P[i]; if ((p.x - x) ** 2 + (p.z - z) ** 2 < d * d) return false; } return true; }
(function trees() {
  const pts = []; for (let k = 0; k < 12000 && pts.length < 700; k++) { const x = rnd(-650, 650), z = rnd(-760, 360); if (farFromTrack(x, z, 26)) pts.push([x, z]); }
  const blobG = new THREE.IcosahedronGeometry(1, 1); { const p = blobG.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + (rand() - .5) * .3; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); } blobG.computeVertexNormals(); }
  const coneG = new THREE.ConeGeometry(1, 1, 9, 2, true); { const p = coneG.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < .49) { const k = 1 + (rand() - .5) * .3; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } coneG.computeVertexNormals(); }
  const trunkG = new THREE.CylinderGeometry(.18, .32, 1, 6);
  const leafMat = new THREE.MeshStandardMaterial({ roughness: .9 }), pineMat = new THREE.MeshStandardMaterial({ roughness: .95, side: THREE.DoubleSide }), barkMat = new THREE.MeshStandardMaterial({ color: 0x4A3626, roughness: 1 });
  const blobs = [], cones = [], trunks = [];
  for (const [x, z] of pts) {
    const y = groundH(x, z), pine = rand() < .5, k = rnd(.8, 1.5);
    if (pine) { const hgt = 14 * k; trunks.push([x, y, z, .9 * k, hgt * .3]); for (let l = 0; l < 4; l++) { const u = l / 4; cones.push([x, y + hgt * (.24 + u * .6), z, (3.4 - u * 2.4) * k, hgt * .36, rand()]); } }
    else { const hgt = 6 * k; trunks.push([x, y, z, k, hgt * .55]); for (let l = 0; l < 6; l++) blobs.push([x + rnd(-2, 2) * k, y + hgt * rnd(.6, 1.05), z + rnd(-2, 2) * k, rnd(1.8, 3) * k, rand()]); }
  }
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = V3(), c = new THREE.Color(), e = new THREE.Euler();
  const bi = new THREE.InstancedMesh(blobG, leafMat, blobs.length); blobs.forEach(([x, y, z, r, h], i) => { m.compose(V3(x, y, z), q.setFromEuler(e.set(rand() * 3, rand() * 3, 0)), s.set(r, r * .85, r)); bi.setMatrixAt(i, m); bi.setColorAt(i, c.setHSL(.22 + h * .08, .45 + h * .15, .2 + h * .12)); });
  const ci = new THREE.InstancedMesh(coneG, pineMat, cones.length); cones.forEach(([x, y, z, r, hgt, h], i) => { m.compose(V3(x, y, z), q.setFromAxisAngle(UP, h * 6), s.set(r, hgt, r)); ci.setMatrixAt(i, m); ci.setColorAt(i, c.setHSL(.36 + h * .04, .4, .13 + h * .06)); });
  const ti = new THREE.InstancedMesh(trunkG, barkMat, trunks.length); trunks.forEach(([x, y, z, k, hgt], i) => { m.compose(V3(x, y + hgt / 2, z), q.identity(), s.set(k, hgt, k)); ti.setMatrixAt(i, m); });
  [bi, ci, ti].forEach(o => { o.receiveShadow = true; scene.add(o); });
})();
(function mountains() {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, flatShading: true }), all = new THREE.Group();
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * Math.PI * 2 + rnd(-.06, .06), d = rnd(1250, 1600), h = rnd(220, 480), r = h * rnd(1.2, 1.7);
    const g = new THREE.ConeGeometry(r, h, 36, 14), p = g.attributes.position, col = [];
    for (let v = 0; v < p.count; v++) {
      const x = p.getX(v), y = p.getY(v), z = p.getZ(v), ang = Math.atan2(z, x), u = (y + h / 2) / h;
      const n = 1 + .22 * Math.sin(ang * 5 + i) + .12 * Math.sin(ang * 13 + u * 9) + .06 * Math.sin(ang * 29 + u * 21);
      if (u < .999) { p.setX(v, x * n); p.setZ(v, z * n); }
      p.setY(v, y + Math.sin(ang * 7 + i * 3) * h * .03 * (1 - u));
      const cc = u > .62 + .08 * Math.sin(ang * 9 + i) ? new THREE.Color(0xF2F5F8) : new THREE.Color().setHSL(.6, .12, .32 + u * .12);
      col.push(cc.r, cc.g, cc.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.position.set(Math.cos(a) * d, h / 2 - 20, Math.sin(a) * d - 180); all.add(m);
  }
  // birleştirirken renk niteliği kaybolmasın diye dağlar ayrı tutulur (26 çizim, uzakta ucuz)
  scene.add(all);
})();
const ADS = [['SAYI BAHÇESİ', '#FFC21F', '#0E1220'], ['BLOK RALLİSİ', '#0E1220', '#FF3355'], ['TURBO', '#22E08A', '#0E1220'], ['PENGUEN RACING', '#FFFFFF', '#1D4BA0'], ['KEDİ MOTORSPOR', '#E8213A', '#FFFFFF'], ['3 + 4 = 7', '#2E9BFF', '#FFFFFF']];
(function boards() {
  const mats = ADS.map(([t, bg, fg]) => new THREE.MeshStandardMaterial({ roughness: .45, map: tex(cvs(1024, 128, (c, w, h) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.font = `italic 900 92px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = fg; c.fillText(t, w / 2, h / 2 + 6); })) }));
  const g = new THREE.PlaneGeometry(14, 1.75), grp = new THREE.Group();
  for (let i = 0; i < 70; i++) { const s = (i + .5) / 70 * L; for (const sd of [-1, 1]) { const f = frameAt(s), m = new THREE.Mesh(g, mats[(i * 2 + (sd > 0 ? 1 : 0)) % mats.length]); m.position.copy(f.p).addScaledVector(f.r, sd * (HALF + 11.15)).add(V3(0, 2.05, 0)); m.lookAt(m.position.clone().addScaledVector(f.r, -sd)); m.receiveShadow = true; grp.add(m); } }
  scene.add(collapse(grp));
})();
(function stands() { // başlangıç düzlüğünde tribünler
  const conc = new THREE.MeshStandardMaterial({ color: 0xB5B9C0, roughness: .85 }), roofM = new THREE.MeshStandardMaterial({ color: 0xE8ECF0, metalness: .4, roughness: .35 }), colM = new THREE.MeshStandardMaterial({ color: 0xCCD2DA, metalness: .7, roughness: .3 });
  const bodyG = new THREE.CylinderGeometry(.2, .24, .8, 6), headG = new THREE.SphereGeometry(.14, 8, 6), bodyM = new THREE.MeshStandardMaterial({ roughness: .8 }), headM = new THREE.MeshStandardMaterial({ roughness: .7 });
  for (const [off, sd] of [[-60, -1], [-110, -1], [-160, -1], [-85, 1]]) {
    const f = frameAt(L + off), g = new THREE.Group();
    for (let r = 0; r < 9; r++) { const st = new THREE.Mesh(new THREE.BoxGeometry(48, .7, 1.6), conc); st.position.set(0, r * .7 + .35, r * 1.6); st.castShadow = st.receiveShadow = true; g.add(st); }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(50, .4, 17), roofM); roof.position.set(0, 12, 7); roof.rotation.x = -.05; roof.castShadow = true; g.add(roof);
    for (const x of [-24, -8, 8, 24]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 12, 10), colM); c.position.set(x, 6, 15); g.add(c); }
    collapse(g);
    const n = 9 * 36, bodies = new THREE.InstancedMesh(bodyG, bodyM, n), heads = new THREE.InstancedMesh(headG, headM, n), m = new THREE.Matrix4(), c = new THREE.Color();
    let k = 0; for (let r = 0; r < 9; r++) for (let i = 0; i < 36; i++) { if (rand() < .12) continue; const x = -23 + i * 1.3 + rnd(-.2, .2), y = r * .7 + 1.15, z = r * 1.6 + .3; m.makeTranslation(x, y, z); bodies.setMatrixAt(k, m); bodies.setColorAt(k, c.setHSL(rand(), rnd(.3, .8), rnd(.3, .6))); m.makeTranslation(x, y + .58 + (rand() < .2 ? .25 : 0), z); heads.setMatrixAt(k, m); heads.setColorAt(k, c.setHSL(.07, rnd(.3, .5), rnd(.35, .75))); k++; }
    bodies.count = heads.count = k; g.add(bodies, heads);
    g.position.copy(f.p).addScaledVector(f.r, sd * (HALF + 15)); g.lookAt(g.position.clone().addScaledVector(f.r, sd)); scene.add(g);
  }
})();

/* ================= kafes çelik köprüler, LED tabelalar ================= */
const steel = new THREE.MeshStandardMaterial({ color: 0xA8AFB8, metalness: .85, roughness: .32 });
function trussGantry(span, h) {
  const g = new THREE.Group(), w = .9;
  for (const sx of [-1, 1]) {
    const x0 = sx * span / 2;
    for (const dx of [-w / 2, w / 2]) for (const dz of [-w / 2, w / 2]) g.add(tube(V3(x0 + dx, 0, dz), V3(x0 + dx, h + .6, dz), .09, steel, 6));
    for (let y = 0; y < h; y += 1.4) { g.add(tube(V3(x0 - w / 2, y, -w / 2), V3(x0 + w / 2, y + 1.4, -w / 2), .04, steel, 5)); g.add(tube(V3(x0 - w / 2, y, w / 2), V3(x0 + w / 2, y + 1.4, w / 2), .04, steel, 5)); }
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, .5, 1.6), new THREE.MeshStandardMaterial({ color: 0x8C9096, roughness: .9 })); base.position.set(x0, .25, 0); g.add(base);
  }
  for (const y of [h - .5, h + .5]) for (const z of [-w / 2, w / 2]) g.add(tube(V3(-span / 2, y, z), V3(span / 2, y, z), .08, steel, 6));
  for (let x = -span / 2; x < span / 2 - .1; x += 1.1) { g.add(tube(V3(x, h - .5, -w / 2), V3(x + 1.1, h + .5, -w / 2), .035, steel, 5)); g.add(tube(V3(x, h - .5, w / 2), V3(x + 1.1, h + .5, w / 2), .035, steel, 5)); }
  return collapse(g);
}
function drawLed(c, w, h, num, col) {
  c.fillStyle = '#040508'; c.fillRect(0, 0, w, h);
  c.font = `italic 900 ${String(num).length > 1 ? 165 : 200}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.shadowColor = col; c.shadowBlur = 20; c.fillStyle = '#FFFFFF'; c.fillText(num, w / 2, h / 2 + 6); c.shadowBlur = 0;
  for (let y = 0; y < h; y += 4) { c.fillStyle = 'rgba(0,0,0,.26)'; c.fillRect(0, y, w, 1.5); }
  for (let x = 0; x < w; x += 4) { c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x, 0, 1.5, h); }
  c.fillStyle = col; c.fillRect(0, 0, w, 12); c.fillRect(0, h - 12, w, 12);
}
function drawDecal(c, w, h, num) { c.clearRect(0, 0, w, h); c.font = `italic 900 ${String(num).length > 1 ? 170 : 210}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(245,245,240,.88)'; c.fillText(num, w / 2, h / 2 + 10); }
function redraw(t, fn) { const c = t.__cv; fn(c.getContext('2d'), c.width, c.height); t.needsUpdate = true; }
const GATES = [.12, .37, .6, .84].map(u => ({ s: u * L }));
const ASK = 190, ZONE = 110;
const boardFrame = new THREE.MeshStandardMaterial({ color: 0x15181E, metalness: .5, roughness: .4 });
GATES.forEach(g => {
  const f = frameAt(g.s), grp = trussGantry(W + 8, 11); grp.position.copy(f.p); grp.rotation.y = yawOf(f.t); scene.add(grp);
  g.tex = []; g.dec = [];
  for (let ln = 0; ln < LANES; ln++) {
    const col = LANE_COL[ln], t = tex(cvs(256, 256, (c, w, h) => drawLed(c, w, h, '?', col))); g.tex.push(t);
    const b = new THREE.Group(), frame = new THREE.Mesh(new THREE.BoxGeometry(4.6, 4.6, .45), boardFrame); frame.castShadow = true; b.add(frame);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xFFFFFF, emissiveIntensity: 1.3, roughness: .3 })); face.position.z = -.24; face.rotation.y = Math.PI; b.add(face);
    b.position.set(-laneC(ln), 8.6, 0); grp.add(b);
    scene.add(ribbon(laneC(ln) - LANE / 2 + .3, laneC(ln) + LANE / 2 - .3, .045, .045, 10, new THREE.MeshStandardMaterial({ color: new THREE.Color(col), transparent: true, opacity: .22, roughness: .7, depthWrite: false }), g.s - ZONE, g.s - 1, 2));
    const dt = tex(cvs(256, 256, (c, w, h) => drawDecal(c, w, h, '?'))); g.dec.push(dt);
    const dm = new THREE.MeshStandardMaterial({ map: dt, transparent: true, roughness: .6, depthWrite: false });
    for (let d = 16; d < 104; d += 26) { const ff = frameAt(g.s - d), pl = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 5.2), dm); pl.position.copy(ff.p).addScaledVector(ff.r, laneC(ln)).add(V3(0, .07, 0)); pl.rotation.x = -Math.PI / 2; pl.rotation.z = yawOf(ff.t) + Math.PI; pl.receiveShadow = true; scene.add(pl); }
  }
});
// başlangıç köprüsü: ışıklar ve damalı çizgi
const startLamps = [];
(function startGantry() {
  const f = frameAt(0), g = trussGantry(W + 18, 9.5); g.position.copy(f.p); g.rotation.y = yawOf(f.t); scene.add(g);
  const line = new THREE.Mesh(new THREE.PlaneGeometry(W, 3), new THREE.MeshStandardMaterial({ roughness: .8, map: tex(cvs(512, 64, (c, w, h) => { const s = 16; for (let x = 0; x < w / s; x++) for (let y = 0; y < h / s; y++) { c.fillStyle = (x + y) % 2 ? '#111' : '#F2F2F2'; c.fillRect(x * s, y * s, s, s); } })) }));
  line.rotation.x = -Math.PI / 2; line.position.y = .06; line.receiveShadow = true; g.add(line);
  const board = new THREE.Mesh(new THREE.BoxGeometry(14, 2.2, .4), boardFrame); board.position.set(0, 11.4, 0); g.add(board);
  for (let k = 0; k < 5; k++) { const l = new THREE.Mesh(new THREE.CircleGeometry(.55, 20), new THREE.MeshBasicMaterial({ color: 0x2A2F44 })); l.position.set(-4 + k * 2, 11.4, -.22); l.rotation.y = Math.PI; g.add(l); startLamps.push(l); }
})();

/* ================= sorular (Sayı Bahçesi seviyesine göre) ================= */
function makeQuestion(lv) {
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  let a, b, ans, q;
  if (Math.random() >= .4) {
    if (lv === 1) { a = R(1, 4); b = R(1, 5 - a); } else if (lv === 2) { a = R(1, 9); b = R(1, 10 - a); } else { a = R(2, 9); b = R(2, 9); if (a + b <= 10) a = Math.min(9, a + 4); }
    ans = a + b; q = `${a} + ${b}`;
  } else {
    if (lv === 1) { a = R(2, 5); b = R(1, a); } else if (lv === 2) { a = R(3, 10); b = R(1, a); } else { a = R(11, 18); b = R(a - 9, 9); }
    ans = a - b; q = `${a} − ${b}`;
  }
  const cand = [ans - 1, ans + 1, ans - 2, ans + 2, ans + 3, ans - 3, ans + 4].filter(x => x >= 0);
  const wrong = [];
  for (const x of cand.sort(() => Math.random() - .5).sort((x, y) => Math.abs(x - ans) - Math.abs(y - ans))) if (wrong.length < LANES - 1 && !wrong.includes(x)) wrong.push(x);
  wrong.sort(() => Math.random() - .5);
  const correct = Math.floor(Math.random() * LANES);
  return { q, ans, correct, nums: [...Array(LANES)].map((_, i) => i === correct ? ans : wrong.shift()) };
}
let LV = 1;
function setQuestion(g) {
  Object.assign(g, makeQuestion(LV));
  g.nums.forEach((n, ln) => { redraw(g.tex[ln], (c, w, h) => drawLed(c, w, h, n, LANE_COL[ln])); redraw(g.dec[ln], (c, w, h) => drawDecal(c, w, h, n)); });
}

/* ================= rampalar, kutular, engeller ================= */
const RAMP_LEN = 8, RAMP_H = 1.5;
const RAMPS = [{ u: .2, l0: 0, l1: 3 }, { u: .47, l0: 1, l1: 2 }, { u: .71, l0: 0, l1: 1 }, { u: .93, l0: 2, l1: 3 }].map(o => ({ s: o.u * L, lat0: laneC(o.l0) - LANE / 2, lat1: laneC(o.l1) + LANE / 2 }));
(function buildRamps() {
  const tx = tex(cvs(256, 128, (c, w, h) => { c.fillStyle = '#F2B807'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; for (let k = -2; k < 10; k++) { c.beginPath(); c.moveTo(k * 40, h); c.lineTo(k * 40 + 20, h); c.lineTo(k * 40 + 60, 0); c.lineTo(k * 40 + 40, 0); c.closePath(); c.fill(); } }), true);
  const top = new THREE.MeshStandardMaterial({ map: tx, roughness: .5 }), side = new THREE.MeshStandardMaterial({ color: 0x3A3F48, metalness: .6, roughness: .4 });
  for (const r of RAMPS) {
    const width = r.lat1 - r.lat0, sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(RAMP_LEN, RAMP_H); sh.lineTo(RAMP_LEN, 0); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: width, bevelEnabled: false }); geo.translate(-RAMP_LEN, 0, -width / 2);
    const m = new THREE.Mesh(geo, [side, top]); m.castShadow = m.receiveShadow = true; m.rotation.y = -Math.PI / 2;
    const f = frameAt(r.s), g = new THREE.Group(); g.add(m); g.position.copy(f.p).addScaledVector(f.r, (r.lat0 + r.lat1) / 2); g.rotation.y = yawOf(f.t); scene.add(g);
  }
})();
// hediye kutuları: iki sıra (eskisinin yarısı); çantadan gelen eşyalar bunu dengeler
const boxes = [];
const boxMat = new THREE.MeshPhysicalMaterial({ roughness: .15, metalness: .1, clearcoat: 1, transparent: true, opacity: .9, emissive: 0x332200,
  map: tex(cvs(128, 128, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#FF4D6D'); g.addColorStop(.5, '#FFC21F'); g.addColorStop(1, '#3FA9FF'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16); c.font = `italic 900 92px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText('?', w / 2, h / 2 + 6); })) });
const boxGeo = rbox(1.7, 1.7, 1.7, 2, .18);
[.28, .77].forEach(u => { for (let ln = 0; ln < LANES; ln++) { const m = new THREE.Mesh(boxGeo, boxMat); m.castShadow = true; scene.add(m); boxes.push({ m, s: u * L, lat: laneC(ln), t: 0 }); } });
const hazards = [];
const coneG = new THREE.ConeGeometry(.42, 1.1, 14), coneMat = new THREE.MeshStandardMaterial({ color: 0xFF6A1A, roughness: .55 }), coneStripe = new THREE.MeshStandardMaterial({ color: 0xF4F4F4, roughness: .45 }), stripeG = new THREE.CylinderGeometry(.3, .34, .16, 14), coneBaseG = new THREE.BoxGeometry(.9, .08, .9), coneBaseM = new THREE.MeshStandardMaterial({ color: 0x1A1C22, roughness: .8 });
function addCones(s, lat, life = 0, owner = null) {
  const cones = [];
  for (let k = 0; k < 3; k++) { const g = new THREE.Group(), c = new THREE.Mesh(coneG, coneMat), st = new THREE.Mesh(stripeG, coneStripe), b = new THREE.Mesh(coneBaseG, coneBaseM); c.position.y = .6; st.position.y = .66; b.position.y = .04; c.castShadow = true; g.add(c, st, b); scene.add(g); cones.push({ g, off: V3(mr(-1.2, 1.2), 0, (k - 1) * 1.1), v: null }); }
  const h = { type: 'cones', s, lat, w: 2.2, cones, reset: 0, life, owner, born: clockT };
  hazards.push(h); placeCones(h); return h;
}
const mudMat = new THREE.MeshStandardMaterial({ color: 0x5B3E24, roughness: .95, transparent: true, opacity: .92 }), oilMat = new THREE.MeshStandardMaterial({ color: 0x050608, roughness: .04, metalness: .3, transparent: true, opacity: .94 });
function patchMesh(mat, r) { const g = new THREE.CircleGeometry(r, 18), pos = g.attributes.position; for (let i = 1; i < pos.count; i++) { const k = mr(.75, 1.15); pos.setX(i, pos.getX(i) * k); pos.setY(i, pos.getY(i) * k); } const m = new THREE.Mesh(g, mat); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return m; }
function addPatch(type, s, lat, r = 2.4, life = 0, owner = null) {
  const m = patchMesh(type === 'oil' ? oilMat : mudMat, r), f = frameAt(s);
  m.position.copy(f.p).addScaledVector(f.r, lat).add(V3(0, .07 + Math.random() * .01, 0)); m.scale.set(1, type === 'mud' ? 1.7 : 1.2, 1); m.rotation.z = yawOf(f.t); scene.add(m);
  const h = { type, s, lat, w: r * .9, len: type === 'mud' ? r * 1.6 : r * 1.1, m, life, owner, hit: new Set(), born: clockT };
  hazards.push(h); return h;
}
function placeCones(h) { const f = frameAt(h.s); h.cones.forEach(c => { c.g.position.copy(f.p).addScaledVector(f.r, h.lat + c.off.x).addScaledVector(f.t, c.off.z); c.g.rotation.set(0, yawOf(f.t), 0); }); }
function removeHazard(i) { const h = hazards[i]; if (h.m) scene.remove(h.m); if (h.cones) h.cones.forEach(c => scene.remove(c.g)); hazards.splice(i, 1); }
let clockT = 0;
[[.09, 2], [.16, 0], [.25, 3], [.33, 1], [.44, 0], [.55, 3], [.65, 2], [.75, 0], [.81, 3], [.9, 1], [.97, 2]].forEach(([u, ln], i) => {
  const s = u * L; if (i % 3 === 0) addCones(s, laneC(ln)); else addPatch(i % 3 === 1 ? 'mud' : 'oil', s, laneC(ln), i % 3 === 1 ? 2.6 : 2.2);
});

/* ================= arabalar: ayrıntılı formula ================= */
const carbonMat = new THREE.MeshStandardMaterial({ map: carbonTex, roughness: .35, metalness: .3 });
const tireMat = new THREE.MeshStandardMaterial({ color: 0x141518, roughness: .82 });
const rimMat = new THREE.MeshStandardMaterial({ color: 0x2B2F36, metalness: .9, roughness: .28 });
const hubMat = new THREE.MeshStandardMaterial({ color: 0xE0E4EA, metalness: .9, roughness: .2 });
const visorMat = new THREE.MeshStandardMaterial({ color: 0x0A0C12, metalness: 1, roughness: .08 });
const blackMat = new THREE.MeshStandardMaterial({ color: 0x07080A, roughness: .6 });
const haloMat = new THREE.MeshStandardMaterial({ color: 0x1A1C22, metalness: .6, roughness: .35 });
const brakeMat = new THREE.MeshStandardMaterial({ color: 0xFF2030, emissive: 0xFF1020, emissiveIntensity: 2.5 });
function tireGeo(r, w) { const pts = [], rr = .08, n = 5; pts.push(new THREE.Vector2(r * .62, -w / 2)); for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + i / n * Math.PI / 2; pts.push(new THREE.Vector2(r - rr + Math.cos(a) * rr, -w / 2 + rr + Math.sin(a) * rr)); } for (let i = 0; i <= n; i++) { const a = i / n * Math.PI / 2; pts.push(new THREE.Vector2(r - rr + Math.cos(a) * rr, w / 2 - rr + Math.sin(a) * rr)); } pts.push(new THREE.Vector2(r * .62, w / 2)); const g = new THREE.LatheGeometry(pts, 28); g.rotateZ(Math.PI / 2); return g; }
const TIRE_F = tireGeo(.34, .34), TIRE_R = tireGeo(.37, .44);
function wheel(r, w, paintMat, front) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(front ? TIRE_F : TIRE_R, tireMat));
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * .62, r * .62, w * .82, 24, 1, true), rimMat); rim.rotation.z = Math.PI / 2; g.add(rim);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * .14, r * .14, w * .9, 12), hubMat); hub.rotation.z = Math.PI / 2; g.add(hub);
  for (let k = 0; k < 8; k++) { const h = new THREE.Group(), sp = new THREE.Mesh(new THREE.BoxGeometry(.03, r * .5, .06), rimMat); sp.position.set(w * .38, r * .36, 0); h.rotation.x = k / 8 * Math.PI * 2; h.add(sp); g.add(h); }
  for (const sx of [1, -1]) { const st = new THREE.Mesh(new THREE.TorusGeometry(r * .78, .012, 5, 36), paintMat); st.rotation.y = Math.PI / 2; st.position.x = sx * (w / 2 + .001); g.add(st); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return collapse(g);
}
function makeCar(color, acc, num, sponsor) {
  const car = new THREE.Group(), body = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color, metalness: .55, roughness: .32, clearcoat: 1, clearcoatRoughness: .04 });
  const accent = new THREE.MeshPhysicalMaterial({ color: acc, metalness: .4, roughness: .35, clearcoat: 1, clearcoatRoughness: .05 });
  const add = (m, x, y, z) => { m.position.set(x, y, z); m.castShadow = true; body.add(m); return m; };
  const prof = new THREE.Shape(); prof.moveTo(-1.9, .28); prof.lineTo(1.2, .28); prof.quadraticCurveTo(2.9, .26, 3.05, .34); prof.quadraticCurveTo(2.6, .5, 1.0, .66); prof.lineTo(.2, .74); prof.quadraticCurveTo(-.2, .95, -.7, .98); prof.lineTo(-1.6, .9); prof.quadraticCurveTo(-2.1, .7, -2.15, .45); prof.closePath();
  const mg = new THREE.ExtrudeGeometry(prof, { depth: .5, bevelEnabled: true, bevelThickness: .2, bevelSize: .14, bevelSegments: 4, curveSegments: 12 }); mg.translate(0, 0, -.25); mg.rotateY(-Math.PI / 2);
  add(new THREE.Mesh(mg, paint), 0, 0, 0);
  const pod = rbox(.62, .46, 1.9, 3, .2), inlet = rbox(.5, .3, .1, 2, .05);
  for (const sx of [-1, 1]) { add(new THREE.Mesh(pod, paint), sx * .66, .5, -.35); add(new THREE.Mesh(inlet, blackMat), sx * .66, .55, .62); }
  add(new THREE.Mesh(rbox(.24, .06, 3.2, 2, .03), accent), 0, .66, .9).rotation.x = .05;
  for (const sx of [-1, 1]) add(new THREE.Mesh(rbox(.06, .24, 1.6, 2, .03), accent), sx * .97, .5, -.35);
  for (let k = 0; k < 3; k++) { const e = add(new THREE.Mesh(rbox(2.7 - k * .3, .04, .32, 1, .015), k === 2 ? accent : carbonMat), 0, .16 + k * .09, 2.95 - k * .2); e.rotation.x = -.12 - k * .14; }
  for (const sx of [-1, 1]) add(new THREE.Mesh(rbox(.04, .34, .8, 1, .015), carbonMat), sx * 1.36, .28, 2.85);
  add(new THREE.Mesh(rbox(.36, .36, .5, 3, .12), paint), 0, 1.15, -.55);
  const fin = new THREE.Shape(); fin.moveTo(-.4, 0); fin.lineTo(-2.1, 0); fin.lineTo(-2.1, .45); fin.quadraticCurveTo(-1, .3, -.4, 0);
  const fg = new THREE.ExtrudeGeometry(fin, { depth: .03, bevelEnabled: false }); fg.translate(0, 0, -.015); fg.rotateY(-Math.PI / 2); add(new THREE.Mesh(fg, accent), 0, .95, 0);
  for (let k = 0; k < 2; k++) { const e = add(new THREE.Mesh(rbox(1.7, .05, .42 - k * .1, 1, .02), k ? accent : carbonMat), 0, 1.22 + k * .2, -2.05 + k * .05); e.rotation.x = .2 + k * .25; }
  for (const sx of [-1, 1]) add(new THREE.Mesh(rbox(.05, .75, .85, 1, .02), carbonMat), sx * .87, 1.0, -2.05);
  add(new THREE.Mesh(new THREE.BoxGeometry(.06, .5, .1), carbonMat), 0, .95, -1.9);
  add(new THREE.Mesh(rbox(1.4, .3, .5, 1, .05), carbonMat), 0, .28, -2.2);
  add(new THREE.Mesh(new THREE.TorusGeometry(.36, .045, 8, 24, Math.PI), haloMat), 0, 1.02, .05).rotation.set(-Math.PI / 2 + .12, 0, 0);
  body.add(tube(V3(0, .82, .62), V3(0, 1.03, .41), .04, carbonMat));
  add(new THREE.Mesh(new THREE.SphereGeometry(.24, 24, 16), new THREE.MeshPhysicalMaterial({ color: acc, metalness: .2, roughness: .25, clearcoat: 1 })), 0, 1.05, -.12);
  add(new THREE.Mesh(new THREE.SphereGeometry(.245, 24, 12, Math.PI * .18, Math.PI * .64, Math.PI * .34, Math.PI * .2), visorMat), 0, 1.05, -.12);
  add(new THREE.Mesh(new THREE.CylinderGeometry(.13, .16, .16, 12), blackMat), 0, .86, -.12);
  for (const sx of [-1, 1]) { body.add(tube(V3(sx * .35, .8, .55), V3(sx * .55, .92, .6), .015, carbonMat, 5)); add(new THREE.Mesh(rbox(.18, .08, .04, 1, .015), paint), sx * .58, .93, .6); }
  for (const [z, wx] of [[1.85, 1.05], [-1.55, 1.05]]) for (const sx of [-1, 1]) { body.add(tube(V3(sx * .25, .45, z + .25), V3(sx * wx, .38, z), .025, carbonMat, 5)); body.add(tube(V3(sx * .25, .32, z - .25), V3(sx * wx, .32, z), .025, carbonMat, 5)); }
  const dec = tex(cvs(512, 256, (c, w, h) => { c.font = `italic 900 160px ${FONT}`; c.textBaseline = 'middle'; c.fillStyle = '#FFFFFF'; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 8; c.strokeText(num, 20, h / 2); c.fillText(num, 20, h / 2); c.font = `italic 900 58px ${FONT}`; c.fillText(sponsor, 170, h / 2 + 6); }));
  const decM = new THREE.MeshStandardMaterial({ map: dec, transparent: true, roughness: .3, polygonOffset: true, polygonOffsetFactor: -2 });
  for (const sx of [-1, 1]) { const d = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .7), decM); d.position.set(sx * .975, .5, -.35); d.rotation.y = sx * Math.PI / 2; body.add(d); }
  const nd = new THREE.Mesh(new THREE.PlaneGeometry(.6, .3), decM); nd.position.set(0, .7, 1.6); nd.rotation.x = -Math.PI / 2 + .12; body.add(nd);
  add(new THREE.Mesh(new THREE.BoxGeometry(.18, .08, .03), brakeMat), 0, .62, -2.36);
  collapse(body); car.add(body);
  car.userData.wheels = [];
  for (const [x, z, r, w] of [[-1.05, 1.85, .34, .34], [1.05, 1.85, .34, .34], [-1.05, -1.55, .37, .44], [1.05, -1.55, .37, .44]]) {
    const piv = new THREE.Group(), wl = wheel(r, w, accent, z > 0); piv.add(wl); piv.position.set(x, r, z); car.add(piv); car.userData.wheels.push({ piv, wl, front: z > 0 });
  }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(.22, 1.6, 10), new THREE.MeshBasicMaterial({ color: 0x66CCFF, transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false }));
  flame.rotation.x = -Math.PI / 2; flame.position.set(0, .62, -3.2); flame.visible = false; car.add(flame);
  const shield = new THREE.Mesh(new THREE.SphereGeometry(3.1, 24, 16), new THREE.MeshBasicMaterial({ color: 0x66D9FF, transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false }));
  shield.position.y = .9; shield.scale.set(.85, .55, 1.15); shield.visible = false; car.add(shield);
  const grip = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.7, 32), new THREE.MeshBasicMaterial({ color: 0x2EE59D, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  grip.rotation.x = -Math.PI / 2; grip.position.y = .08; grip.scale.set(.75, 1.25, 1); grip.visible = false; car.add(grip);
  Object.assign(car.userData, { body, flame, shield, grip });
  car.scale.setScalar(1.05);
  return car;
}

/* ================= parçacıklar (havuz: her karede yeni malzeme üretmez) ================= */
const sprites = [];
for (let i = 0; i < 140; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false })); s.visible = false; scene.add(s); sprites.push({ s, life: 0 }); }
let spI = 0;
function smoke(pos, size, color = 0xE6E6E6, op = .45, opt = {}) {
  const p = sprites[spI = (spI + 1) % sprites.length], m = p.s.material;
  p.s.visible = true; p.s.position.copy(pos); p.s.scale.setScalar(size); m.color.setHex(color); m.opacity = op; m.rotation = Math.random() * 6;
  m.blending = opt.add ? THREE.AdditiveBlending : THREE.NormalBlending;
  Object.assign(p, { life: opt.life || .8, max: opt.life || .8, op, size, grow: opt.grow ?? 1.4, v: opt.v || V3(mr(-.8, .8), mr(.6, 1.6), mr(-.8, .8)) });
}
const bits = [], bitG = new THREE.PlaneGeometry(.3, .2), sparkM = new THREE.MeshBasicMaterial({ color: 0xFFC060, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide });
const confM = [0xFFC21F, 0xFF4D6D, 0x3FA9FF, 0x2EE59D, 0xFFFFFF].map(c => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
for (let i = 0; i < 160; i++) { const m = new THREE.Mesh(bitG, sparkM); m.visible = false; scene.add(m); bits.push({ m, life: 0, v: V3(), r: V3() }); }
let bitI = 0;
function bit(pos, mat, v, life, g) { const b = bits[bitI = (bitI + 1) % bits.length]; b.m.material = mat; b.m.visible = true; b.m.position.copy(pos); b.m.scale.setScalar(1); b.v.copy(v); b.r.set(mr(-12, 12), mr(-12, 12), 0); b.life = life; b.g = g; }
const sparks = (pos, n = 14) => { for (let i = 0; i < n; i++) bit(pos, sparkM, V3(mr(-8, 8), mr(2, 9), mr(-8, 8)), mr(.3, .6), 18); };
const confetti = (pos, n = 50) => { for (let i = 0; i < n; i++) bit(pos, confM[i % 5], V3(mr(-10, 10), mr(6, 15), mr(-10, 10)), mr(1.2, 2), 16); };
// yıldırım: gökten arabaya zikzak
const bolts = [], boltMat = new THREE.MeshBasicMaterial({ color: 0xFFF6C8, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
function lightning(to) {
  const g = new THREE.Group(); let a = to.clone().add(V3(mr(-4, 4), 45, mr(-4, 4)));
  for (let k = 1; k <= 8; k++) { const b = k === 8 ? to.clone().add(V3(0, 1, 0)) : to.clone().add(V3(mr(-3, 3) * (1 - k / 8), 45 * (1 - k / 8) + 1, mr(-3, 3) * (1 - k / 8))); const t = tube(a, b, .12, boltMat, 4); t.castShadow = false; g.add(t); a = b; }
  scene.add(g); bolts.push({ g, life: .35 });
  smoke(to.clone().add(V3(0, 1, 0)), 7, 0xFFF0B0, .9, { add: true, life: .4, grow: .5, v: V3() });
}

/* ================= yarışçılar ================= */
const CARS = [
  { name: 'Sen', me: true, color: 0xF2B807, acc: 0x111318, hex: '#F2B807', num: 7, sp: 'PENGUEN' },
  { name: 'Kedi', color: 0xD8102C, acc: 0xF5F5F5, hex: '#D8102C', num: 3, sp: 'KEDİ' },
  { name: 'Mavi', color: 0x1550C8, acc: 0xF2B807, hex: '#1550C8', num: 5, sp: 'TURBO' },
  { name: 'Yeşil', color: 0x0E9A5E, acc: 0x111318, hex: '#0E9A5E', num: 9, sp: 'SAYI' },
  { name: 'Mor', color: 0x6E3BD1, acc: 0xF5F5F5, hex: '#6E3BD1', num: 2, sp: 'BLOK' },
  { name: 'Turuncu', color: 0xF26B0F, acc: 0x111318, hex: '#F26B0F', num: 4, sp: 'RALLİ' },
];
const racers = CARS.map(c => Object.assign({}, c, { car: makeCar(c.color, c.acc, c.num, c.sp) }));
racers.forEach(r => scene.add(r.car));
const me = racers[0];
const LAPS = 2;
let state = 'menu', raceT = 0, countT = 0, steerL = false, steerR = false, keyL = false, keyR = false, popT = 0, shake = 0, fov = 64, finishedAt = null, hitT = 0, flashT = 0, wentGo = false;
let bag = [];       // çantadaki eşyalar: { k: 'r_turbo', used: false }
let pendingSlot = null;
const projs = [];

function reset() {
  const grid = [[-38, laneC(1)], [-14, laneC(1)], [-14, laneC(2)], [-22, laneC(1)], [-22, laneC(2)], [-30, laneC(2)]];
  racers.forEach((r, i) => Object.assign(r, { dist: grid[i][0], lat: grid[i][1], spd: 0, steer: 0, turbo: 0, slow: 0, spin: 0, yaw: 0, finish: null, aiT: 0, aiLat: grid[i][1], gk: {}, y: 0, vy: 0, air: 0, item: null, roll: 0, hold: 0, shield: 0, grip: 0, gates: 0, mud: 0, base: r.me ? 35 : mr(33.8, 35.6), aiBag: r.me ? null : pickR(['turbo', 'oil', 'shield', 'snow', 'cones', 'missile']), aiBagT: mr(12, 40) }));
  boxes.forEach(b => { b.t = 0; b.m.visible = true; });
  for (let i = hazards.length - 1; i >= 0; i--) { const h = hazards[i]; if (h.life) removeHazard(i); else { if (h.hit) h.hit.clear(); if (h.cones) { h.reset = 0; h.cones.forEach(c => c.v = null); placeCones(h); } } }
  projs.splice(0).forEach(p => scene.remove(p.m));
  GATES.forEach(setQuestion);
  raceT = 0; finishedAt = null; wentGo = false;
}
function progress(r) { return r.finish != null ? 1e9 - r.finish : r.dist; }
function rankOf(r) { return 1 + racers.filter(o => o !== r && progress(o) > progress(r)).length; }
function nextGate(r, ahead) { const s = sOf(r.dist); let best = null, bd = 1e9; for (const g of GATES) { let d = g.s - s; if (d < 0) d += L; if (d < ahead && d < bd) { bd = d; best = g; } } return best ? { g: best, d: bd } : null; }
function popMsg(t, sub, col) { $('popT').textContent = t; $('popS').textContent = sub || ''; $('pop').style.color = col || '#2EE59D'; $('pop').classList.add('on'); popT = 1.4; }

/* ---------- eşya etkileri ---------- */
function missileMesh() {
  const g = new THREE.Group(), b = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, 1.2, 10), new THREE.MeshStandardMaterial({ color: 0xD8DDE6, roughness: .35, metalness: .5 })); b.rotation.x = Math.PI / 2; g.add(b);
  const n = new THREE.Mesh(new THREE.ConeGeometry(.18, .4, 10), new THREE.MeshStandardMaterial({ color: 0xFF3355, roughness: .4 })); n.rotation.x = Math.PI / 2; n.position.z = .8; g.add(n);
  const fl = new THREE.Mesh(new THREE.ConeGeometry(.16, .9, 8), new THREE.MeshBasicMaterial({ color: 0xFFB04D, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false })); fl.rotation.x = -Math.PI / 2; fl.position.z = -1; g.add(fl);
  return g;
}
const snowMat = new THREE.MeshStandardMaterial({ color: 0xF6F9FF, roughness: .8 });
// vurulma: kalkan varsa kalkan yutar
function hit(o, kind, by) {
  if (o.finish != null) return false;
  if (o.shield > 0) { o.shield = 0; smoke(o.car.position.clone().add(V3(0, 1, 0)), 5, 0x66D9FF, .7, { add: true, life: .5 }); if (o.me) popMsg('KALKAN KORUDU', '', '#3FA9FF'); else if (by === me) popMsg('KALKANI VARDI', o.name + ' korundu', '#3FA9FF'); SFX.item(); return false; }
  if (kind === 'spin') { o.spin = 1.2; o.spd *= .45; o.turbo = 0; }
  else if (kind === 'snow') { o.spin = .75; o.spd *= .6; o.turbo = 0; }
  else if (kind === 'bolt') { o.slow = 2.6; o.spd *= .55; o.turbo = 0; }
  else if (kind === 'cones') { o.slow = 1; o.spd *= .7; }
  if (o.me) { shake = .6; $('hit').classList.add('on'); hitT = .25; SFX.hit(); }
  else if (by === me) SFX.boom();
  return true;
}
function launch(r, type, tgt) {
  if (type === 'snow') { const m = new THREE.Mesh(new THREE.SphereGeometry(.55, 16, 12), snowMat); m.castShadow = true; scene.add(m); projs.push({ type, m, dist: r.dist + 3, lat: r.lat, life: 3, from: r, spd: Math.max(70, r.spd + 30) }); SFX.whoosh(); return; }
  const m = missileMesh(); scene.add(m); projs.push({ type: 'missile', m, dist: r.dist + 3, lat: r.lat, tgt, life: tgt && !tgt.near ? 12 : 7, from: r, spd: 80 }); SFX.whoosh();
}
function nearestAhead(r, max = 1e9) { let tgt = null, bd = max; for (const o of racers) { const d = o.dist - r.dist; if (o !== r && o.finish == null && d > 2 && d < bd) { bd = d; tgt = o; } } return tgt; }
// k: etki adı. tgt: yalnızca hedef füzesinde
function applyItem(r, k, tgt) {
  const say = (t, s, c) => { if (r.me) popMsg(t, s, c); };
  if (k === 'turbo') { r.turbo = Math.max(r.turbo, 3); say('TURBO!', '', '#FFB04D'); if (r.me) SFX.whoosh(); }
  else if (k === 'start') { r.turbo = Math.max(r.turbo, 2.6); say('SÜPER START!', '', '#2EE59D'); if (r.me) SFX.whoosh(); }
  else if (k === 'shield') { r.shield = 20; say('KALKAN', 'ilk saldırıyı yutar', '#3FA9FF'); if (r.me) SFX.item(); }
  else if (k === 'tires') { r.grip = 55; say('KAYMAZ LASTİK', 'yağ ve çamur işlemez', '#2EE59D'); if (r.me) SFX.item(); }
  else if (k === 'oil') { addPatch('oil', sOf(r.dist - 6), r.lat, 2.3, 25, r); say('YAĞ BIRAKILDI', 'arkandaki dikkat!', '#C9CED8'); }
  else if (k === 'cones') { addCones(sOf(r.dist - 9), clamp(r.lat, -MAXLAT + 1, MAXLAT - 1), 30, r); say('KONİLER DİZİLDİ', '', '#FF7A1A'); }
  else if (k === 'snow') { launch(r, 'snow'); say('KARTOPU!', 'öndekine at', '#FFFFFF'); }
  else if (k === 'missile') { const t = nearestAhead(r); launch(r, 'missile', t); say('FÜZE!', t ? t.name + ' hedefte' : '', '#FF4D6D'); }
  else if (k === 'tmissile') { launch(r, 'missile', tgt); say('FÜZE!', tgt ? `${rankOf(tgt)}. sıradaki ${tgt.name} hedefte` : '', '#FF4D6D'); }
  else if (k === 'bolt') {
    const ahead = racers.filter(o => o !== r && o.finish == null && progress(o) > progress(r));
    ahead.forEach(o => { lightning(o.car.position); hit(o, 'bolt', r); });
    if (r.me) { SFX.zap(); flashT = .12; $('flash').classList.add('on'); popMsg('YILDIRIM!', ahead.length ? `${ahead.length} araba yavaşladı` : 'önünde kimse yok', '#FFD23F'); }
    else if (ahead.includes(me)) { SFX.zap(); flashT = .12; $('flash').classList.add('on'); popMsg('YILDIRIM ÇARPTI!', r.name + ' attı', '#FFD23F'); }
  }
}
function pickBoxItem(r) {
  const rk = rankOf(r);
  const pool = rk <= 2 ? ['oil', 'oil', 'cones', 'shield', 'snow'] : rk >= 5 ? ['turbo', 'missile', 'missile', 'turbo', 'shield', 'snow'] : ['turbo', 'missile', 'oil', 'shield', 'snow', 'cones'];
  return pickR(pool);
}
function useBox(r) { const it = r.item; if (!it || r.roll > 0 || r.spin > 0) return; r.item = null; r.hold = 0; applyItem(r, it); }
// çantadaki bir eşyayı kullan (yalnızca oyuncu)
function useSlot(i) {
  const sl = bag[i]; if (!sl || sl.used || RITEMS[sl.k].passive || me.finish != null || state !== 'race') return;
  if (me.spin > 0) return;
  const fx = RITEMS[sl.k].fx;
  if (fx === 'tmissile') { openPick(i); return; }
  if (!Wallet.useItem(sl.k)) { sl.used = true; renderBagHud(); popMsg('ÇANTA BOŞ', '', '#FF4D6D'); return; }
  sl.used = true; renderBagHud(); applyItem(me, fx);
}
function openPick(i) {
  const myRank = rankOf(me), list = racers.filter(o => o !== me && o.finish == null && progress(o) > progress(me)).sort((a, b) => rankOf(a) - rankOf(b));
  if (!list.length) { popMsg('ÖNÜNDE KİMSE YOK', 'füze çantada kalsın', '#FFFFFF'); return; }
  pendingSlot = i; state = 'pick'; pointers.clear(); updSteer(); engine(false);
  $('pickMe').textContent = myRank;
  const box = $('targets'); box.innerHTML = '';
  for (const o of list) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'tg'; b.style.setProperty('--c', o.hex);
    b.innerHTML = `<b>${rankOf(o)}</b><i></i><small>${o.name}</small>`;
    b.onclick = () => { closePick(); const sl = bag[i]; if (Wallet.useItem(sl.k)) { sl.used = true; renderBagHud(); applyItem(me, 'tmissile', o); } else { sl.used = true; renderBagHud(); } };
    box.append(b);
  }
  $('pick').hidden = false;
}
function closePick() { $('pick').hidden = true; state = 'race'; pendingSlot = null; last = performance.now(); engine(true); }

/* ================= güncelle ================= */
function crossed(prevS, s, gs) { return (prevS <= gs && s > gs) || (prevS > s && (gs >= prevS || gs < s)); }
function rampLift(r, s) { for (const rp of RAMPS) { let d = rp.s - s; if (d < 0) d += L; if (d <= RAMP_LEN && r.lat > rp.lat0 && r.lat < rp.lat1) return RAMP_H * (1 - d / RAMP_LEN); } return 0; }
const fA = { p: V3(), t: V3(), r: V3() }, fB = { p: V3(), t: V3(), r: V3() }, tmpV = V3(), tmpV2 = V3();
function update(dt) {
  clockT += dt;
  skyMat.uniforms.t.value = clockT;
  if (state === 'count') {
    const prev = countT; countT -= dt;
    const on = clamp(Math.floor((3.6 - countT) / .6), 0, 5), onPrev = clamp(Math.floor((3.6 - prev) / .6), 0, 5);
    if (on !== onPrev && countT > 0) SFX.light(false);
    document.querySelectorAll('#lights i').forEach((l, i) => l.classList.toggle('r', i < on && countT > 0));
    $('lights').classList.toggle('go', countT <= 0); $('lights').hidden = countT < -.9;
    startLamps.forEach((l, i) => l.material.color.setHex(countT <= 0 ? 0x2EE59D : i < on ? 0xFF3B3B : 0x2A2F44));
    if (countT <= 0 && !wentGo) {
      wentGo = true; SFX.light(true);
      const st = bag.findIndex(b => b.k === 'r_start' && !b.used);
      if (st >= 0 && Wallet.useItem('r_start')) { bag[st].used = true; renderBagHud(); applyItem(me, 'start'); }
    }
    if (countT <= -.9) state = 'race';
  }
  const go = state === 'race' || state === 'done' || (state === 'count' && countT <= 0);
  if (go && state !== 'done') raceT += dt;
  for (const r of racers) {
    let st = 0;
    if (r.me && state !== 'done' && r.finish == null) st = ((steerR || keyR) ? 1 : 0) - ((steerL || keyL) ? 1 : 0);
    else if (go) st = aiSteer(r, dt);
    if (r.spin > 0) st = 0;
    r.steer = lerp(r.steer, st, 1 - Math.exp(-dt * 9));
    if (r.roll > 0) { r.roll -= dt; if (r.roll <= 0 && r.me) { popMsg(FXNAME[r.item].toLocaleUpperCase('tr'), 'kullanmak için kutuya bas', '#FFC21F'); SFX.item(); } }
    if (r.item && r.roll <= 0) r.hold += dt;
    r.turbo = Math.max(0, r.turbo - dt); r.slow = Math.max(0, r.slow - dt); r.spin = Math.max(0, r.spin - dt); r.shield = Math.max(0, r.shield - dt); r.mud = Math.max(0, r.mud - dt); r.grip = Math.max(0, r.grip - dt);
    let tgt = go ? r.base : 0;
    if (!r.me) tgt += clamp((me.dist - r.dist) * .05, -3.5, 6);   // lastik bant: rakipler hep yakında
    if (r.turbo > 0) tgt += 17;
    if (r.slow > 0) tgt -= 13;
    if (r.mud > 0) tgt = Math.min(tgt, 16);
    if (r.spin > 0) tgt = Math.min(tgt, 8);
    if (nextGate(r, ZONE)) tgt = Math.min(tgt, r.turbo > 0 ? 30 : 21);
    if (r.finish != null) tgt = 18;
    r.spd = lerp(r.spd, tgt, 1 - Math.exp(-dt * (tgt > r.spd ? 1.4 : 3)));
    r.lat = clamp(r.lat + r.steer * (r.air > 0 ? 4 : 12) * dt * clamp(r.spd / 14, .3, 1), -MAXLAT, MAXLAT);
    const prevS = sOf(r.dist);
    r.dist += r.spd * dt;
    const s = sOf(r.dist);
    if (r.air > 0) {
      r.vy -= 24 * dt; r.y += r.vy * dt; r.air += dt;
      if (r.y <= 0) { r.y = 0; if (r.air > .35) { for (let k = 0; k < 5; k++) smoke(r.car.position.clone().add(V3(mr(-1.5, 1.5), .4, mr(-2, 2))), mr(2, 3.4), 0xCDBFA4, .5); if (r.me) shake = Math.max(shake, .35); } r.air = 0; r.vy = 0; }
    } else {
      r.y = rampLift(r, s);
      for (const rp of RAMPS) if (crossed(prevS, s, rp.s) && r.lat > rp.lat0 && r.lat < rp.lat1) { r.y = RAMP_H; r.vy = 7 + r.spd * .14; r.air = .001; if (r.me) { popMsg('UÇ!', '', '#FFC21F'); SFX.jump(); } }
    }
    if (!go) continue;
    for (const g of GATES) if (crossed(prevS, s, g.s)) {
      const ln = laneOf(r.lat);
      if (ln === g.correct) { r.turbo = Math.max(r.turbo, 2.4); if (r.me) { r.gates++; popMsg('DOĞRU!', 'TURBO', '#2EE59D'); confetti(frameAt(g.s).p.add(V3(0, 6, 0)), 70); shake = .3; SFX.good(); } }
      else if (r.me) { popMsg(`${g.q} = ${g.ans}`, 'sonrakini bil!', '#FFFFFF'); SFX.bad(); }
      if (r.me) setTimeout(() => setQuestion(g), 700);
    }
    for (const b of boxes) if (b.t <= 0 && crossed(prevS, s, b.s) && Math.abs(r.lat - b.lat) < 2.2 && r.y < 2.5) { b.t = 6; b.m.visible = false; sparks(b.m.position, 10); if (!r.item) { r.item = pickBoxItem(r); r.roll = r.me ? 1 : .5; r.hold = 0; if (r.me) SFX.item(); } }
    for (const h of hazards) {
      if (r.y > .6) continue;
      if (h.type === 'cones') {
        if (h.reset <= 0 && crossed(prevS, s, h.s) && Math.abs(r.lat - h.lat) < h.w + 1 && !(h.owner === r && clockT - h.born < 2)) {
          h.reset = 9; const yaw = yawOf(frameAt(h.s, fB).t);
          h.cones.forEach(c => { c.v = V3(mr(-6, 6), mr(6, 10), mr(6, 14)).applyAxisAngle(UP, yaw); c.rv = V3(mr(-8, 8), mr(-8, 8), mr(-8, 8)); });
          if (hit(r, 'cones', h.owner) && r.me) popMsg('KONİ!', 'yavaşladın', '#FF7A1A');
        }
        continue;
      }
      let ds = s - h.s; if (ds < -L / 2) ds += L; if (ds > L / 2) ds -= L;
      if (Math.abs(ds) < h.len && Math.abs(r.lat - h.lat) < h.w) {
        if (r.grip > 0) { if (r.me && !h.hit.has(r)) { h.hit.add(r); popMsg('TUTUNDUN!', 'kaymaz lastik', '#2EE59D'); } continue; }
        if (h.type === 'mud') { if (r.mud <= 0 && r.me) popMsg('ÇAMUR!', '', '#C08A55'); r.mud = .5; if (Math.random() < dt * 18) smoke(r.car.position.clone().add(V3(0, .5, 0)), 1.6, 0x6B4A2C, .7); }
        else if (h.type === 'oil' && !h.hit.has(r) && !(h.owner === r && clockT - h.born < 2)) { h.hit.add(r); if (hit(r, 'spin', h.owner) && r.me) popMsg('YAĞA BASTIN!', '', '#FF4D6D'); }
      }
    }
    if (r.finish == null && r.dist >= LAPS * L) { r.finish = raceT; if (r.me) { finishedAt = clockT; confetti(r.car.position.clone().add(V3(0, 3, 0)), 90); SFX.good(); } }
  }
  // arabalar arası çarpışma
  for (let i = 0; i < racers.length; i++) for (let j = i + 1; j < racers.length; j++) {
    const a = racers[i], b = racers[j], ds = a.dist - b.dist, dl = a.lat - b.lat;
    if (Math.abs(ds) < 4.4 && Math.abs(dl) < 2.5 && Math.abs(a.y - b.y) < 1.5) {
      const push = (2.5 - Math.abs(dl)) * .55 * (dl >= 0 ? 1 : -1); a.lat = clamp(a.lat + push, -MAXLAT, MAXLAT); b.lat = clamp(b.lat - push, -MAXLAT, MAXLAT);
      (ds > 0 ? b : a).spd *= .97;
      if ((a.me || b.me) && Math.random() < .3) { sparks(tmpV.copy(a.car.position).lerp(b.car.position, .5).add(V3(0, .6, 0)), 6); shake = Math.max(shake, .15); }
    }
  }
  // füzeler, kartopları
  for (let i = projs.length - 1; i >= 0; i--) {
    const p = projs[i]; p.life -= dt; p.dist += p.spd * dt;
    const t = p.tgt; if (p.type === 'missile' && t) p.lat = lerp(p.lat, t.lat, 1 - Math.exp(-dt * 4));
    const f = frameAt(p.dist, fA); p.m.position.copy(f.p).addScaledVector(f.r, p.lat).add(V3(0, p.type === 'snow' ? .9 : 1.1, 0)); p.m.lookAt(tmpV.copy(p.m.position).add(f.t));
    if (p.type === 'snow') p.m.rotation.x += p.dist;
    if (Math.random() < (p.type === 'snow' ? .3 : .8)) smoke(p.m.position, p.type === 'snow' ? .9 : 1.1, 0xEEEEEE, .35, { life: .6 });
    let victim = null;
    if (p.type === 'missile' && t && p.dist >= t.dist - 1 && Math.abs(p.lat - t.lat) < 3) victim = t;
    if (p.type === 'snow') for (const o of racers) if (o !== p.from && Math.abs(o.dist - p.dist) < 2.2 && Math.abs(o.lat - p.lat) < 2.4 && o.y < 2) { victim = o; break; }
    if (victim) {
      const ok = hit(victim, p.type === 'snow' ? 'snow' : 'spin', p.from);
      if (ok && victim.me) popMsg(p.type === 'snow' ? 'KARTOPU!' : 'FÜZE ÇARPTI!', p.from.name + ' attı', '#FF4D6D');
      else if (ok && p.from === me) popMsg(p.type === 'snow' ? 'İSABET!' : 'FÜZE ÇARPTI!', victim.name + ' döndü', '#FF3355');
      sparks(p.m.position, 20);
      for (let k = 0; k < 6; k++) smoke(tmpV.copy(p.m.position).add(V3(mr(-1.5, 1.5), mr(0, 1.5), mr(-1.5, 1.5))), mr(2, 3.6), p.type === 'snow' ? 0xF6F9FF : (k % 2 ? 0x8D8F94 : 0xFFB04D), .6);
      if (p.type !== 'snow') smoke(p.m.position, 6, 0xFF8A30, .9, { add: true, life: .35, grow: .6, v: V3() });
      scene.remove(p.m); projs.splice(i, 1); continue;
    }
    if (p.life <= 0) { scene.remove(p.m); projs.splice(i, 1); }
  }
  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];
    if (h.life && clockT - h.born > h.life) { removeHazard(i); continue; }
    if (h.type === 'cones' && h.reset > 0) {
      h.reset -= dt; const gy = frameAt(h.s, fB).p.y;
      h.cones.forEach(c => { if (!c.v) return; c.v.y -= 20 * dt; c.g.position.addScaledVector(c.v, dt); c.g.rotation.x += c.rv.x * dt; c.g.rotation.z += c.rv.z * dt; if (c.g.position.y < gy && c.v.y < 0) { c.g.position.y = gy; c.v.multiplyScalar(.4); c.v.y = Math.abs(c.v.y) * .3; c.rv.multiplyScalar(.5); } });
      if (h.reset <= 0) { if (h.life) { removeHazard(i); continue; } h.cones.forEach(c => c.v = null); placeCones(h); }
    }
  }
  for (const b of boxes) if (b.t > 0) { b.t -= dt; if (b.t <= 0) b.m.visible = true; }
  // arabaları yerleştir
  for (const r of racers) {
    const f = frameAt(r.dist, fA), car = r.car;
    car.position.copy(f.p).addScaledVector(f.r, r.lat); car.position.y += r.y;
    car.lookAt(tmpV.copy(car.position).add(f.t));
    if (r.spin > 0) r.yaw += dt * 13; else r.yaw = lerp(r.yaw % (Math.PI * 2), 0, 1 - Math.exp(-dt * 8));
    car.rotateY(-r.steer * .2 + r.yaw);
    const pitch = r.air > 0 ? clamp(r.vy * .025, -.3, .3) : (rampLift(r, sOf(r.dist)) > 0 ? .18 : 0);
    car.rotateX(-pitch);
    const bd = car.userData.body; bd.rotation.z = r.steer * .04; bd.position.y = Math.sin(clockT * 28 + r.dist) * .012 * clamp(r.spd / 20, 0, 1);
    car.userData.wheels.forEach(w => { w.wl.rotation.x += r.spd * dt / .36; if (w.front) w.piv.rotation.y = -r.steer * .35; });
    const fl = car.userData.flame; fl.visible = r.turbo > 0; if (fl.visible) fl.scale.set(1, .7 + Math.random() * .7, 1);
    car.userData.shield.visible = r.shield > 0; if (r.shield > 0) car.userData.shield.rotation.y += dt * 2;
    car.userData.grip.visible = r.grip > 0; if (r.grip > 0) car.userData.grip.material.opacity = .25 + Math.sin(clockT * 6) * .1;
    if (go && r.spd > 6 && Math.random() < dt * (r.turbo > 0 ? 14 : 3)) smoke(tmpV.copy(car.position).addScaledVector(f.t, -2.8).add(V3(0, .5, 0)), r.turbo > 0 ? 1.4 : 1.1, r.turbo > 0 ? 0xBFE6FF : 0xD8D8D8, r.turbo > 0 ? .35 : .16);
    if (r.spin > 0 && Math.random() < dt * 25) smoke(tmpV.copy(car.position).add(V3(mr(-1, 1), .3, mr(-1, 1))), 2, 0x9AA0AA, .45);
  }
  for (const p of sprites) if (p.life > 0) {
    p.life -= dt; if (p.life <= 0) { p.s.visible = false; continue; }
    const u = 1 - p.life / p.max; p.s.position.addScaledVector(p.v, dt); p.s.scale.setScalar(p.size * (1 + u * p.grow)); p.s.material.opacity = p.op * (1 - u);
  }
  for (const b of bits) if (b.life > 0) { b.life -= dt; if (b.life <= 0) { b.m.visible = false; continue; } b.v.y -= b.g * dt; b.m.position.addScaledVector(b.v, dt); b.m.rotation.x += b.r.x * dt; b.m.rotation.y += b.r.y * dt; }
  for (let i = bolts.length - 1; i >= 0; i--) { const b = bolts[i]; b.life -= dt; b.g.visible = Math.random() < .8; if (b.life <= 0) { scene.remove(b.g); bolts.splice(i, 1); } }
  boxes.forEach((b, i) => { if (!b.m.visible) return; const f = frameAt(b.s, fB); b.m.position.copy(f.p).addScaledVector(f.r, b.lat).add(V3(0, 1.6 + Math.sin(clockT * 3 + i) * .2, 0)); b.m.rotation.y += dt * 1.8; b.m.rotation.x = .4; });
  // kamera: arabanın arkasında, biraz yukarıda
  const f = frameAt(me.dist, fA), target = me.car.position;
  const back = tmpV2.copy(f.p).addScaledVector(f.r, me.lat * .85).addScaledVector(f.t, -8.2).add(V3(0, 3.3 + me.y * .6, 0));
  if (state === 'menu') { const a = clockT * .15; back.copy(target).add(V3(Math.cos(a) * 13, 4.5, Math.sin(a) * 13)); }
  camera.position.lerp(back, 1 - Math.exp(-dt * (state === 'menu' ? 2 : 14)));
  if (shake > 0) { shake = Math.max(0, shake - dt * 1.5); camera.position.x += mr(-.35, .35) * shake; camera.position.y += mr(-.25, .25) * shake; }
  camera.lookAt(tmpV.copy(target).addScaledVector(f.t, state === 'menu' ? 0 : 8).add(V3(0, state === 'menu' ? .6 : 1.2, 0)));
  const fovT = me.turbo > 0 ? 80 : 64 + clamp(me.spd - 30, 0, 10) * .3; fov = lerp(fov, fovT, 1 - Math.exp(-dt * 4)); camera.fov = fov; camera.updateProjectionMatrix();
  sky.position.copy(camera.position);
  sun.position.copy(target).addScaledVector(SUN_DIR, 150); sun.target.position.copy(target);
  if (hitT > 0) { hitT -= dt; if (hitT <= 0) $('hit').classList.remove('on'); }
  if (flashT > 0) { flashT -= dt; if (flashT <= 0) $('flash').classList.remove('on'); }
  if (eng) { const a = actx.currentTime, sp = me.spd + (me.turbo > 0 ? 8 : 0); eng.o.frequency.setTargetAtTime(48 + sp * 2.4, a, .08); eng.o2.frequency.setTargetAtTime(24 + sp * 1.2, a, .08); eng.g.gain.setTargetAtTime(state === 'race' || state === 'count' ? .028 : 0, a, .2); }
  hud(dt, go);
}
// rakip zekâsı: köprüde şerit seç, engelden kaç, eşyayı zamanında kullan
function aiSteer(r, dt) {
  r.aiT -= dt;
  const ng = nextGate(r, 170);
  if (ng && r.gk[ng.g.s] !== ng.g.q) { r.gk[ng.g.s] = ng.g.q; const ln = Math.random() < .62 ? ng.g.correct : Math.floor(Math.random() * LANES); r.aiLat = laneC(ln) + mr(-1, 1); }
  else if (!ng && r.aiT < 0) { r.aiT = mr(1.4, 3.2); r.aiLat = laneC(Math.floor(Math.random() * LANES)) + mr(-1, 1); }
  const s = sOf(r.dist);
  if (!ng) {
    for (const h of hazards) { if (h.owner === r) continue; let d = h.s - s; if (d < 0) d += L; if (d > 8 && d < 60 && Math.abs(r.aiLat - h.lat) < (h.w || 2) + 1.5) { r.aiLat = clamp(h.lat + (h.lat > 0 ? -1 : 1) * (LANE + 1), -MAXLAT + 1, MAXLAT - 1); break; } }
    if (!r.item) for (const b of boxes) { let d = b.s - s; if (d < 0) d += L; if (b.t <= 0 && d > 15 && d < 50 && Math.random() < .02) r.aiLat = b.lat; }
  }
  const ahead = racers.some(o => o !== r && o.dist - r.dist > 5 && o.dist - r.dist < 140), aheadLane = racers.some(o => o !== r && o.dist - r.dist > 5 && o.dist - r.dist < 45 && Math.abs(o.lat - r.lat) < 2), behind = racers.some(o => o !== r && r.dist - o.dist > 4 && r.dist - o.dist < 35);
  const wants = k => (k === 'missile' && ahead) || (k === 'snow' && aheadLane) || ((k === 'oil' || k === 'cones') && behind) || k === 'turbo' || k === 'shield';
  if (r.item && r.roll <= 0 && (wants(r.item) || r.hold > 7)) useBox(r);
  if (r.aiBag && raceT > r.aiBagT && r.spin <= 0 && wants(r.aiBag)) { applyItem(r, r.aiBag); r.aiBag = null; }
  return clamp((r.aiLat - r.lat) * .45, -1, 1);
}

/* ================= göstergeler ================= */
const fmtT = t => { const m = Math.floor(t / 60), s = t - m * 60; return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`; };
let lastBox = '', lastFx = '';
function renderBagHud() {
  const box = $('items'); box.querySelectorAll('.bag').forEach(b => b.remove());
  bag.forEach((sl, i) => {
    const it = RITEMS[sl.k], b = document.createElement('button'); b.type = 'button'; b.className = 'ib bag' + (it.passive ? ' passive' : '') + (sl.used ? ' used' : '');
    b.innerHTML = SVG[it.fx] + `<small>${it.passive ? 'kendiliğinden' : it.short}</small>`; b.setAttribute('aria-label', it.name + ' kullan');
    b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); useSlot(i); });
    box.append(b);
  });
}
function hud(dt, go) {
  if (state === 'menu') return;
  $('posN').textContent = rankOf(me);
  $('lapT').textContent = `TUR ${clamp(Math.floor(me.dist / L) + 1, 1, LAPS)}/${LAPS}`;
  $('timeT').textContent = fmtT(me.finish ?? raceT);
  $('spdT').textContent = Math.round(me.spd * 3.6) + ' km/sa';
  const ng = nextGate(me, ASK);
  if (ng && me.finish == null && go) { $('qT').textContent = ng.g.q + ' = ?'; $('q').classList.add('on'); } else $('q').classList.remove('on');
  $('wind').classList.toggle('on', me.turbo > 0);
  $('padL').classList.toggle('on', steerL || keyL); $('padR').classList.toggle('on', steerR || keyR);
  const rollK = me.roll > 0 ? BOX_KEYS[Math.floor(clockT * 8) % BOX_KEYS.length] : null, key = rollK ? 'r' + rollK : me.item || '';
  if (key !== lastBox) {
    lastBox = key; const k = rollK || me.item;
    $('boxIco').innerHTML = k ? SVG[k] : SVG.empty;
    $('boxName').textContent = me.item && me.roll <= 0 ? FXNAME[me.item] : '';
    $('box').classList.toggle('ready', !!me.item && me.roll <= 0); $('box').classList.toggle('roll', me.roll > 0);
  }
  const fx = (me.shield > 0 ? 's' : '') + (me.grip > 0 ? 'g' + Math.ceil(me.grip / 5) : '');
  if (fx !== lastFx) { lastFx = fx; $('fx').innerHTML = (me.shield > 0 ? `<span>${SVG.shield}Kalkan</span>` : '') + (me.grip > 0 ? `<span>${SVG.tires}Kaymaz lastik</span>` : ''); }
  if (popT > 0) { popT -= dt; if (popT <= 0) $('pop').classList.remove('on'); }
  if (finishedAt != null && clockT - finishedAt > 2.5 && state !== 'done') endRace();
}
const REWARD = [5, 4, 3, 2, 1, 1];
function endRace() {
  state = 'done'; engine(false);
  const order = racers.slice().sort((a, b) => progress(b) - progress(a)), rk = order.indexOf(me) + 1, coins = REWARD[rk - 1];
  Wallet.addCoins(coins);
  $('endT').textContent = rk === 1 ? 'KAZANDIN!' : rk + '. OLDUN';
  $('endL').innerHTML = order.map((r, i) => `<li class="${r.me ? 'me' : ''}"><b>${i + 1}</b><i style="background:${r.hex}"></i>${r.name}<em>${r.finish != null ? fmtT(r.finish) : 'yolda'}</em></li>`).join('');
  $('endC').textContent = `+${coins} altın`;
  $('endG').textContent = me.gates ? `${me.gates} sayı sorusunu bildin, her biri turbo verdi.` : 'Sayı köprüsünde doğru şeridi bulursan turbo alırsın.';
  $('again').disabled = !(Wallet.tickets > 0);
  $('end').hidden = false; $('hud').hidden = true; $('q').classList.remove('on');
}

/* ================= menü ve çanta ================= */
function renderMenu() {
  $('tChip').textContent = '🎟️ ' + Wallet.tickets; $('cChip').textContent = '🪙 ' + Wallet.coins;
  const t = Wallet.tickets > 0; $('noTicket').hidden = t; $('goBtn').disabled = !t;
  // çantadakiler eldeki sayıyı aşmasın
  const cnt = {}; bag = bag.filter(sl => { cnt[sl.k] = (cnt[sl.k] || 0) + 1; return cnt[sl.k] <= Wallet.inv(sl.k); });
  $('bagN').textContent = `${bag.length} / ${BAG_MAX}`;
  const slots = $('slots'); slots.innerHTML = '';
  for (let i = 0; i < BAG_MAX; i++) {
    const sl = bag[i], d = document.createElement(sl ? 'button' : 'div'); d.className = 'slot' + (sl ? ' on' : '');
    if (sl) { d.type = 'button'; d.innerHTML = SVG[RITEMS[sl.k].fx] + `<span>${RITEMS[sl.k].short}</span><span class="x">×</span>`; d.setAttribute('aria-label', RITEMS[sl.k].name + ' çantadan çıkar'); d.onclick = () => { bag.splice(i, 1); Wallet.lastBag = bag.map(b => b.k); renderMenu(); }; }
    else d.textContent = 'boş';
    slots.append(d);
  }
  const grid = $('grid'); grid.innerHTML = ''; let any = false;
  for (const k of RKEYS) {
    const it = RITEMS[k], have = Wallet.inv(k), inBag = bag.filter(b => b.k === k).length, left = have - inBag; if (have) any = true;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'gi' + (have ? '' : ' none') + (have && !it.passive ? ' solo' : '');
    b.innerHTML = SVG[it.fx] + `<b>${it.name}</b>${have ? (it.passive ? '<small>kendiliğinden</small>' : '') : `<small>🪙 ${it.price}</small>`}<span class="n">${left}</span>`;
    b.onclick = () => { if (left <= 0 || bag.length >= BAG_MAX) { b.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], 200); return; } bag.push({ k, used: false }); Wallet.lastBag = bag.map(x => x.k); renderMenu(); };
    grid.append(b);
  }
  $('bagHint').textContent = any ? 'Dokun, çantana koy. En fazla 3 eşya. Yalnızca kullandığın eşya harcanır.' : 'Çantan boş. Sayı Bahçesi\'nde altın kazan, dükkândan yarış eşyası al.';
}
function showMenu() {
  state = 'menu'; engine(false);
  $('end').hidden = true; $('hud').hidden = true; $('pauseScr').hidden = true; $('pick').hidden = true; $('menu').hidden = false;
  reset(); renderMenu();
}
function start() {
  if (!Wallet.useTicket()) { renderMenu(); return; }
  audio(); engine(true);
  LV = Wallet.level;
  reset(); bag.forEach(b => b.used = false); renderBagHud(); lastBox = ''; lastFx = '';
  state = 'count'; countT = 3.6;
  $('menu').hidden = true; $('end').hidden = true; $('hud').hidden = false; $('lights').hidden = false; $('lights').classList.remove('go');
  const f = frameAt(me.dist); camera.position.copy(f.p).addScaledVector(f.t, -10).add(V3(0, 4, 0));
}

/* ================= giriş ================= */
const pointers = new Map();
function updSteer() { steerL = steerR = false; for (const x of pointers.values()) { if (x < innerWidth / 2) steerL = true; else steerR = true; } }
canvas.addEventListener('pointerdown', e => { if (state !== 'race' && state !== 'count') return; pointers.set(e.pointerId, e.clientX); updSteer(); e.preventDefault(); });
addEventListener('pointermove', e => { if (pointers.has(e.pointerId)) { pointers.set(e.pointerId, e.clientX); updSteer(); } });
['pointerup', 'pointercancel'].forEach(t => addEventListener(t, e => { pointers.delete(e.pointerId); updSteer(); }));
addEventListener('blur', () => { pointers.clear(); keyL = keyR = false; updSteer(); });
$('box').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); if (state === 'race') useBox(me); });
addEventListener('keydown', e => {
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) { keyL = true; e.preventDefault(); }
  if (['ArrowRight', 'd', 'D'].includes(e.key)) { keyR = true; e.preventDefault(); }
  if ((e.key === ' ' || e.key === 'ArrowUp') && state === 'race') { useBox(me); e.preventDefault(); }
  if (['1', '2', '3'].includes(e.key) && state === 'race') useSlot(+e.key - 1);
  if (e.key === 'Escape' && state === 'race') pause();
});
addEventListener('keyup', e => { if (['ArrowLeft', 'a', 'A'].includes(e.key)) keyL = false; if (['ArrowRight', 'd', 'D'].includes(e.key)) keyR = false; });
function pause() { if (state !== 'race' && state !== 'count') return; pausedFrom = state; state = 'pause'; engine(false); pointers.clear(); updSteer(); $('pauseScr').hidden = false; }
let pausedFrom = 'race';
$('pause').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); pause(); });
$('resume').onclick = () => { $('pauseScr').hidden = true; state = pausedFrom; last = performance.now(); engine(true); };
$('quit').onclick = showMenu;
$('pickNo').onclick = closePick;
$('goBtn').onclick = start;
$('again').onclick = start;
$('toMenu').onclick = showMenu;
const toGarden = () => location.assign(new URL('../', location.href).href);
$('toHome').onclick = toGarden; $('home').onclick = toGarden;
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (state === 'race' || state === 'count') pause(); engine(false); } });
addEventListener('pageshow', e => { if (e.persisted && state === 'menu') renderMenu(); });

/* ================= döngü, kalite ayarı ================= */
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
let last = performance.now(), slowT = 0, fastT = 0, qStep = 0;
function tuneQuality(dt) { // telefon yavaşsa önce çözünürlüğü, sonra gölgeyi düşür
  if (state !== 'race') return;
  if (dt > 1 / 34) slowT += dt; else slowT = Math.max(0, slowT - dt * .5);
  if (slowT > 2.5 && qStep < 3) {
    slowT = 0; qStep++;
    if (qStep === 1 && PR > 1) { PR = 1; renderer.setPixelRatio(PR); resize(); }
    else if (qStep <= 2) { sun.shadow.mapSize.set(1024, 1024); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
    else { sun.castShadow = false; }
  }
}
function loop(now) {
  const raw = (now - last) / 1000, dt = Math.min(.05, raw); last = now;
  if (state !== 'pause' && state !== 'pick') { update(dt); tuneQuality(raw); }
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
function boot() {
  const lb = Wallet.lastBag.filter(k => RITEMS[k]); bag = lb.slice(0, BAG_MAX).map(k => ({ k, used: false }));
  $('loading').hidden = true; showMenu(); requestAnimationFrame(loop);
}
GATES.forEach(setQuestion); boot();

// test kapısı (oyunu etkilemez)
window.__k = { racers, me, start, update, showMenu, useSlot, applyItem, get bag() { return bag; }, get state() { return state; }, set steer(v) { keyL = v < 0; keyR = v > 0; }, GATES, RAMPS, L, hazards, projs, Wallet, renderer, camera, scene, frameAt, rankOf, closePick, openPick };
}
})();
