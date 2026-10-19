/* Blok Rallisi — Sayı Bahçesi'nin yarış oyunu. Oyuncak blok arabalar, üç şerit, sayı kapıları ve eşyalar.
   Tek dosya, kütüphane yok. Mantıksal çözünürlük 864x400 (iPhone yatay). */
'use strict';
// ================= temel çizim yardımcıları (Kartopu Savaşı ile aynı stil)
const INK = '#1E2233', OL = 2.2, TAU = Math.PI * 2;
const FONT = '"Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, u) => a + (b - a) * u;
const sstep = u => (u = clamp(u, 0, 1), u * u * (3 - 2 * u));
function hash(i, s = 0) { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); }
function kf(arr, t, smooth = true) {
  if (t <= arr[0][0]) return arr[0][1];
  for (let i = 0; i < arr.length - 1; i++) {
    const [a, va] = arr[i], [b, vb] = arr[i + 1];
    if (t < b) { const u = (t - a) / (b - a); return lerp(va, vb, smooth ? sstep(u) : u); }
  }
  return arr[arr.length - 1][1];
}
function rr(c, x, y, w, h, r) {
  const R = Array.isArray(r) ? r : [r, r, r, r];
  c.beginPath(); c.moveTo(x + R[0], y);
  c.lineTo(x + w - R[1], y); c.quadraticCurveTo(x + w, y, x + w, y + R[1]);
  c.lineTo(x + w, y + h - R[2]); c.quadraticCurveTo(x + w, y + h, x + w - R[2], y + h);
  c.lineTo(x + R[3], y + h); c.quadraticCurveTo(x, y + h, x, y + h - R[3]);
  c.lineTo(x, y + R[0]); c.quadraticCurveTo(x, y, x + R[0], y); c.closePath();
}
function ell(c, x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), rot, 0, TAU); }
function lin(c, x0, y0, x1, y1, stops) { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); return g; }
function shade(hex, a) { const n = parseInt(hex.slice(1), 16), f = v => clamp(v + a, 0, 255) | 0; return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; }
function rgba(hex, al) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${al})`; }
const lighten = (h, a) => shade(h, a);
function drawShape(c, parts) {
  c.fillStyle = INK; c.strokeStyle = INK; c.lineWidth = OL * 2; c.lineJoin = 'round';
  for (const p of parts) if (p[2]) { p[0](); c.fill(); c.stroke(); }
  for (const p of parts) { p[0](); c.fillStyle = p[1]; c.fill(); }
}
function closedEyes(c, x1, y1, x2, y2) {
  c.strokeStyle = INK; c.lineWidth = 2; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(x1 - 3, y1 - 2.5); c.lineTo(x1 + 1.5, y1); c.lineTo(x1 - 3, y1 + 2.5); c.stroke();
  c.beginPath(); c.moveTo(x2 + 3, y2 - 2.5); c.lineTo(x2 - 1.5, y2); c.lineTo(x2 + 3, y2 + 2.5); c.stroke();
}
function cheeks(c, dx, y) { c.fillStyle = 'rgba(247,120,150,.4)'; [-dx, dx].forEach(x => { ell(c, x, y, 2.6, 1.8); c.fill(); }); }
function snowPile(c, y) {
  const blobs = [[-8, y + 3, 7, 5], [0, y, 9, 6.5], [8, y + 3, 7, 5], [3, y - 5, 5, 4]];
  c.fillStyle = INK; blobs.forEach(([x, yy, rx, ry]) => { ell(c, x, yy, rx + OL, ry + OL); c.fill(); });
  c.fillStyle = '#FFFFFF'; blobs.forEach(([x, yy, rx, ry]) => { ell(c, x, yy, rx, ry); c.fill(); });
  c.fillStyle = 'rgba(175,205,230,.6)'; ell(c, 2, y + 4, 9, 2.2); c.fill();
}
function goggles(c, y, sep) {
  // yarış gözlüğü alnın üstünde
  c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(-sep - 7, y + 1); c.lineTo(sep + 7, y + 1); c.stroke();
  c.strokeStyle = '#3B4660'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(-sep - 7, y + 1); c.lineTo(sep + 7, y + 1); c.stroke();
  [-sep, sep].forEach(x => { ell(c, x, y, 4.6, 3.6); c.fillStyle = INK; c.fill(); ell(c, x, y, 3.3, 2.4); c.fillStyle = lin(c, 0, y - 3, 0, y + 3, ['#BFF0FF', '#4FB7E8']); c.fill(); ell(c, x - 1.2, y - 1, 1, .7); c.fillStyle = '#fff'; c.fill(); });
}
function penguinArt(c, hit, team = '#2F7DE1', look = 1) {
  const body = lin(c, -18, -40, 18, 0, ['#4A5B82', '#2B3550', '#1E2540']);
  const belly = lin(c, 0, -18, 0, 0, ['#FFFFFF', '#DCE6F3']);
  const orange = lin(c, 0, -6, 0, 0, ['#FFC04D', '#F08C1E']);
  const scarf = lin(c, 0, -19, 0, -12, [lighten(team, 30), team]);
  drawShape(c, [
    [() => ell(c, -16.5, -17, 4.6, 10, .35), body, true],
    [() => ell(c, 16.5, -17, 4.6, 10, -.35), body, true],
    [() => ell(c, 0, -20, 17, 20), body, true],
    [() => ell(c, 0, -8.5, 11.5, 8.5), belly],
    [() => ell(c, -5.2, -29.5, 6.8, 7.3), '#FFFFFF'],
    [() => ell(c, 5.2, -29.5, 6.8, 7.3), '#FFFFFF'],
    [() => { c.beginPath(); c.moveTo(-4, -24.5); c.quadraticCurveTo(0, -26, 4, -24.5); c.quadraticCurveTo(1.5, -19.5, 0, -19.5); c.quadraticCurveTo(-1.5, -19.5, -4, -24.5); c.closePath(); }, orange],
    [() => rr(c, -15.5, -18.5, 31, 6.5, 3.2), scarf],
  ]);
  if (hit) closedEyes(c, -5.2, -29.5, 5.2, -29.5);
  else [-5.2, 5.2].forEach(ex => {
    ell(c, ex + .4 + look, -28.9, 3.3, 3.6); c.fillStyle = '#11131C'; c.fill();
    ell(c, ex - .8 + look, -30.4, 1.25, 1.25); c.fillStyle = '#FFFFFF'; c.fill();
  });
  cheeks(c, 10.5, -23.5);
  goggles(c, -38.5, 5.6);
  if (hit) snowPile(c, -42);
}
function catArt(c, hit, team = '#E5483B', look = 1) {
  const fur = lin(c, -16, -44, 16, 0, ['#FFB45E', '#F39A3B', '#DE7A22']);
  const cream = lin(c, 0, -26, 0, 0, ['#FFFFFF', '#F7E6D2']);
  const scarf = lin(c, 0, -15, 0, -9, [lighten(team, 30), team]);
  drawShape(c, [
    [() => ell(c, 0, -9, 12, 9.5), fur, true],
    [() => ell(c, 0, -6, 6.5, 6), cream],
    [() => { c.beginPath(); c.moveTo(-15, -33); c.lineTo(-12.5, -47); c.lineTo(-3, -39); c.closePath(); }, fur, true],
    [() => { c.beginPath(); c.moveTo(15, -33); c.lineTo(12.5, -47); c.lineTo(3, -39); c.closePath(); }, fur, true],
    [() => ell(c, 0, -28, 16.5, 14), fur, true],
    [() => { c.beginPath(); c.moveTo(-12, -36); c.lineTo(-11.5, -43); c.lineTo(-6.5, -38.5); c.closePath(); }, '#F7A1B5'],
    [() => { c.beginPath(); c.moveTo(12, -36); c.lineTo(11.5, -43); c.lineTo(6.5, -38.5); c.closePath(); }, '#F7A1B5'],
    [() => ell(c, 0, -21.5, 8, 5.5), cream],
    [() => rr(c, -12.5, -15.5, 25, 5.5, 2.75), scarf],
  ]);
  c.strokeStyle = '#C96A1E'; c.lineWidth = 1.8; c.lineCap = 'round';
  [-4, 0, 4].forEach(dx => { c.beginPath(); c.moveTo(dx, -40); c.lineTo(dx, -36); c.stroke(); });
  c.fillStyle = '#F07C98'; c.beginPath(); c.moveTo(-2, -24); c.lineTo(2, -24); c.lineTo(0, -22); c.closePath(); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.1;
  c.beginPath(); c.moveTo(0, -22); c.quadraticCurveTo(-1.5, -19.5, -3.2, -20.5); c.moveTo(0, -22); c.quadraticCurveTo(1.5, -19.5, 3.2, -20.5); c.stroke();
  c.strokeStyle = 'rgba(30,34,51,.55)'; c.lineWidth = .9;
  [[-8, -22, -17, -24], [-8, -20.5, -17, -19.5], [8, -22, 17, -24], [8, -20.5, 17, -19.5]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); });
  if (hit) closedEyes(c, -6, -29, 6, -29);
  else [-6, 6].forEach(ex => {
    ell(c, ex, -29, 3.6, 4.2); c.fillStyle = '#8BD96A'; c.fill();
    ell(c, ex + look * .8, -28.6, 1.5, 3.3); c.fillStyle = '#11131C'; c.fill();
    ell(c, ex - 1.2 + look * .8, -30.5, 1, 1); c.fillStyle = '#FFFFFF'; c.fill();
  });
  cheeks(c, 11, -24);
  goggles(c, -38, 6.5);
  if (hit) snowPile(c, -44);
}
function snowballArt(c, r) {
  ell(c, 0, 0, r + OL, r + OL); c.fillStyle = INK; c.fill();
  const g = c.createRadialGradient(-r * .4, -r * .4, r * .1, 0, 0, r);
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(.6, '#F1F7FC'); g.addColorStop(1, '#B9D4EA');
  ell(c, 0, 0, r, r); c.fillStyle = g; c.fill();
}
function starPath(c, R, r = R * .48, n = 5) {
  c.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, d = i % 2 ? r : R; c.lineTo(Math.cos(a) * d, Math.sin(a) * d); }
  c.closePath();
}
function starArt(c, r, col = '#FFC21F') {
  c.lineJoin = 'round'; c.lineWidth = OL * 2; c.strokeStyle = INK; starPath(c, r); c.stroke();
  starPath(c, r); c.fillStyle = lin(c, 0, -r, 0, r, ['#FFF1A8', col]); c.fill();
}
function burstPath(c, R, r, n, rot = 0) {
  c.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, d = i % 2 ? r : R * (0.9 + 0.2 * hash(i, 9)); c.lineTo(Math.cos(a) * d, Math.sin(a) * d); }
  c.closePath();
}

// ================= araba
function wheel(c, x, y, r, rot, style, blur, rim) {
  ell(c, x, y, r + OL, r + OL); c.fillStyle = INK; c.fill();
  ell(c, x, y, r, r); c.fillStyle = lin(c, 0, y - r, 0, y + r, ['#4A5272', '#2A2F45']); c.fill();
  const hr = r * .58, rc = rim || '#E9EEF5';
  ell(c, x, y, hr, hr); c.fillStyle = lin(c, 0, y - hr, 0, y + hr, ['#FFFFFF', rc]); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
  c.save(); c.translate(x, y); c.rotate(rot);
  c.globalAlpha = 1 - clamp(blur, 0, .8);
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (style === 'star') { starPath(c, hr * .85, hr * .38); c.fillStyle = '#FFC21F'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke(); }
  else if (style === 'flame') {
    for (let k = 0; k < 3; k++) { c.rotate(TAU / 3); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(hr * .7, -hr * .1, hr * .55, -hr * .75); c.lineWidth = 3.4; c.strokeStyle = INK; c.stroke(); c.lineWidth = 1.8; c.strokeStyle = '#FF7A2E'; c.stroke(); }
  } else {
    c.strokeStyle = INK; c.lineWidth = 2;
    for (let k = 0; k < 5; k++) { const a = k * TAU / 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * hr * .85, Math.sin(a) * hr * .85); c.stroke(); }
  }
  c.globalAlpha = 1;
  if (blur > .12) {
    c.strokeStyle = `rgba(255,255,255,${.45 * blur})`; c.lineWidth = 2.2;
    for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(0, 0, r * (.68 + k * .1), k * 2.1, k * 2.1 + 1.4); c.stroke(); }
  }
  c.restore();
  ell(c, x, y, r * .17, r * .17); c.fillStyle = INK; c.fill();
}
function flame(c, x, y, k, t) {
  if (k <= 0) return;
  c.save(); c.globalCompositeOperation = 'lighter';
  const L = (30 + 10 * Math.sin(t * 47) + 6 * Math.sin(t * 31)) * k;
  const g = c.createRadialGradient(x - L * .3, y, 2, x - L * .3, y, L);
  g.addColorStop(0, 'rgba(255,190,80,.55)'); g.addColorStop(1, 'rgba(255,90,30,0)');
  c.fillStyle = g; ell(c, x - L * .3, y, L, L * .7); c.fill();
  [['rgba(255,96,40,.85)', 1, 8], ['rgba(255,190,70,.9)', .7, 5.5], ['rgba(255,255,220,.95)', .4, 3]].forEach(([col, s, h]) => {
    c.fillStyle = col; c.beginPath(); c.moveTo(x + 2, y - h); c.quadraticCurveTo(x - L * s * .6, y - h * 1.1, x - L * s, y); c.quadraticCurveTo(x - L * s * .6, y + h * 1.1, x + 2, y + h); c.closePath(); c.fill();
  });
  c.restore();
}
function scarfTail(c, team, t, k) {
  const y0 = -15, w = Math.sin(t * 17), w2 = Math.sin(t * 17 + 1.6);
  const path = () => { c.beginPath(); c.moveTo(-6, y0); c.quadraticCurveTo(-20, y0 - 4 + w * 2 * k, -30, y0 - 3 + w2 * 3 * k); c.quadraticCurveTo(-38, y0 - 2 + w * 4 * k, -46 * (0.6 + .4 * k), y0 + 2 + w2 * 5 * k); };
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = INK; c.lineWidth = 6 + OL * 2; path(); c.stroke();
  c.strokeStyle = team; c.lineWidth = 6; path(); c.stroke();
}
function carArt(c, o) {
  const t = o.t || 0, col = o.color, lt = shade(col, 75), dk = shade(col, -60);
  const body = lin(c, 0, -46, 0, -8, [lt, col, shade(col, -30)]);
  const bob = o.bob || 0;
  // gece farı
  if (o.lights) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(52, 0, 230, 0); g.addColorStop(0, 'rgba(255,240,170,.42)'); g.addColorStop(1, 'rgba(255,240,170,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(50, -28 + bob); c.lineTo(230, -60 + bob); c.lineTo(230, 6 + bob); c.closePath(); c.fill(); c.restore();
  }
  flame(c, -60, -17 + bob, o.turbo || 0, t);
  c.save(); c.translate(0, bob);
  if (o.spoiler !== false) drawShape(c, [[() => rr(c, -47, -54, 6, 16, 2), dk, true], [() => rr(c, -62, -60, 30, 8, [4, 4, 3, 3]), body, true]]);
  // sürücü
  c.save(); c.translate(-5, -23 + (o.hop || 0)); c.rotate(o.lean || 0); c.scale(.74, .74);
  scarfTail(c, o.team, t, o.speedK == null ? 1 : o.speedK);
  if (o.char === 'cat') catArt(c, o.hit, o.team, o.look == null ? 1 : o.look); else penguinArt(c, o.hit, o.team, o.look == null ? 1 : o.look);
  c.restore();
  // ön cam
  c.beginPath(); c.moveTo(12, -34); c.lineTo(17, -50); c.lineTo(23, -50); c.lineTo(21, -34); c.closePath();
  c.fillStyle = 'rgba(200,236,255,.55)'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.lineJoin = 'round'; c.stroke();
  drawShape(c, [
    [() => rr(c, -45, -45, 8, 6, 2), lt, true], [() => rr(c, -33, -45, 8, 6, 2), lt, true],
    [() => rr(c, 25, -41, 8, 6, 2), lt, true], [() => rr(c, 37, -41, 8, 6, 2), lt, true],
    [() => rr(c, -51, -42, 31, 32, [9, 5, 0, 10]), body, true],
    [() => rr(c, 13, -38, 39, 16, [4, 12, 0, 0]), body, true],
    [() => rr(c, -53, -27, 108, 19, [6, 10, 9, 9]), body, true],
    [() => rr(c, -62, -21, 11, 7, 3.5), '#A9B2C6', true],
  ]);
  // parlama, şerit, numara
  c.fillStyle = 'rgba(255,255,255,.55)'; rr(c, -47, -39, 18, 3.5, 1.7); c.fill(); rr(c, 17, -35, 22, 3, 1.5); c.fill(); rr(c, -48, -24, 40, 2.6, 1.3); c.fill();
  c.fillStyle = o.stripe || 'rgba(255,255,255,.92)'; rr(c, -14, -21, 54, 4.6, 2.3); c.fill();
  c.fillStyle = 'rgba(20,24,40,.22)'; rr(c, -51, -13, 104, 4, 2); c.fill();
  ell(c, -33, -26, 8.5, 8.5); c.fillStyle = INK; c.fill(); ell(c, -33, -26, 6.8, 6.8); c.fillStyle = '#fff'; c.fill();
  c.fillStyle = INK; c.font = `800 11px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(o.num ?? 1), -33, -25.2);
  ell(c, 52, -28, 3.2, 4.4); c.fillStyle = '#FFE58A'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
  // çamurluk boşlukları
  [-30, 33].forEach(x => { c.save(); c.beginPath(); c.rect(x - 20, -60, 40, 52); c.clip(); ell(c, x, -13, 17.5, 16.5); c.fillStyle = INK; c.fill(); ell(c, x, -13, 15.5, 14.5); c.fillStyle = dk; c.fill(); c.restore(); });
  c.restore();
  wheel(c, -30, -13, 13, o.wrot || 0, o.wheel, o.blur || 0, o.rim);
  wheel(c, 33, -13, 13, o.wrot || 0, o.wheel, o.blur || 0, o.rim);
}

// ================= eşya ikonları (yaklaşık 50 birim kutu, merkez 0,0)
function itemIcon(c, type, t) {
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  if (type === 'snowball') {
    c.rotate(Math.sin(t * 2) * .2); snowballArt(c, 15);
    c.fillStyle = 'rgba(160,195,225,.8)'; ell(c, 5, 4, 3, 2); c.fill(); ell(c, -6, 6, 2, 1.5); c.fill();
  } else if (type === 'balloon') {
    const s = 1 + Math.sin(t * 6) * .04; c.scale(s, 2 - s);
    const p = () => { c.beginPath(); c.moveTo(0, -19); c.bezierCurveTo(17, -19, 18, 5, 0, 14); c.bezierCurveTo(-18, 5, -17, -19, 0, -19); c.closePath(); };
    c.strokeStyle = INK; c.lineWidth = OL * 2; p(); c.stroke();
    c.beginPath(); c.moveTo(0, 14); c.quadraticCurveTo(5, 19, 1, 23); c.lineWidth = 2; c.stroke();
    p(); c.fillStyle = lin(c, -10, -18, 10, 14, ['#9AE3FF', '#3FA9F5', '#1F78C1']); c.fill();
    c.beginPath(); c.moveTo(-3, 17); c.lineTo(3, 17); c.lineTo(0, 13); c.closePath(); c.fillStyle = '#1F78C1'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
    ell(c, -6, -9, 3.5, 5.5, -.4); c.fillStyle = 'rgba(255,255,255,.75)'; c.fill();
  } else if (type === 'hive') {
    const g = lin(c, 0, -20, 0, 18, ['#FFE07A', '#F5B52A', '#D98A12']);
    drawShape(c, [[() => ell(c, 0, 12, 14, 6), g, true], [() => ell(c, 0, 4, 17, 7), g, true], [() => ell(c, 0, -5, 15, 6.5), g, true], [() => ell(c, 0, -13, 10.5, 5.5), g, true], [() => ell(c, 0, -19, 5, 3), g, true]]);
    ell(c, 0, 6, 4.5, 4); c.fillStyle = INK; c.fill();
    for (let k = 0; k < 3; k++) {
      const a = t * 3.2 + k * TAU / 3, bx = Math.cos(a) * 23, by = Math.sin(a) * 12 - 4;
      c.save(); c.translate(bx, by); c.scale(Math.cos(a + Math.PI / 2) < 0 ? -1 : 1, 1);
      ell(c, -1, -5, 3.4, 4, -.4); c.fillStyle = 'rgba(255,255,255,.8)'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
      ell(c, 0, 0, 5.4, 4); c.fillStyle = INK; c.fill(); ell(c, 0, 0, 4.3, 3); c.fillStyle = '#FFC21F'; c.fill();
      c.fillStyle = INK; c.fillRect(-1.5, -3, 1.4, 6); c.fillRect(1.2, -3, 1.2, 6);
      c.restore();
    }
  } else if (type === 'giant') {
    c.save(); c.translate(0, 2);
    c.strokeStyle = 'rgba(200,225,250,.7)'; c.lineWidth = 3;
    [[-30, -8, 12], [-34, 2, 16], [-30, 12, 10]].forEach(([x, y, l]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(x + l, y); c.stroke(); });
    c.rotate(t * 3); snowballArt(c, 20);
    c.fillStyle = 'rgba(150,185,220,.75)'; [[6, 5, 4], [-8, 3, 3], [2, -9, 2.5], [-3, 11, 2]].forEach(([x, y, r]) => { ell(c, x, y, r, r * .7); c.fill(); });
    c.restore();
  } else if (type === 'bolt') {
    const p = () => { c.beginPath(); c.moveTo(5, -22); c.lineTo(-11, 3); c.lineTo(-1, 3); c.lineTo(-6, 22); c.lineTo(12, -5); c.lineTo(2, -5); c.lineTo(9, -22); c.closePath(); };
    const fl = .6 + .4 * Math.abs(Math.sin(t * 9));
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(0, 0, 2, 0, 0, 30); g.addColorStop(0, `rgba(255,230,90,${.5 * fl})`); g.addColorStop(1, 'rgba(255,230,90,0)'); c.fillStyle = g; c.fillRect(-32, -32, 64, 64); c.restore();
    c.strokeStyle = INK; c.lineWidth = OL * 2; p(); c.stroke(); p(); c.fillStyle = lin(c, 0, -22, 0, 22, ['#FFF6B0', '#FFD23F', '#F5A524']); c.fill();
  } else if (type === 'umbrella') {
    c.rotate(Math.sin(t * 2.4) * .15);
    c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(0, -16); c.lineTo(0, 14); c.quadraticCurveTo(0, 20, -5, 20); c.quadraticCurveTo(-9, 20, -9, 15); c.stroke();
    c.strokeStyle = '#8A5D39'; c.lineWidth = 2.4; c.stroke();
    const can = () => { c.beginPath(); c.moveTo(-22, -4); c.quadraticCurveTo(-22, -24, 0, -24); c.quadraticCurveTo(22, -24, 22, -4); for (let k = 0; k < 4; k++) { const x0 = 22 - k * 11; c.quadraticCurveTo(x0 - 5.5, -9, x0 - 11, -4); } c.closePath(); };
    c.strokeStyle = INK; c.lineWidth = OL * 2; can(); c.stroke();
    c.save(); can(); c.clip();
    for (let k = 0; k < 4; k++) { c.fillStyle = k % 2 ? '#FFFFFF' : '#E5483B'; c.beginPath(); c.moveTo(0, -24); c.lineTo(-22 + k * 11, 0); c.lineTo(-11 + k * 11, 0); c.closePath(); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.3)'; ell(c, -8, -18, 8, 3, -.3); c.fill();
    c.restore();
  } else if (type === 'rocket') {
    c.rotate(-.7 + Math.sin(t * 5) * .05);
    flame(c, -13, 0, .55, t);
    drawShape(c, [
      [() => { c.beginPath(); c.moveTo(-10, -4); c.lineTo(-18, -12); c.lineTo(-6, -8); c.closePath(); }, '#E5483B', true],
      [() => { c.beginPath(); c.moveTo(-10, 4); c.lineTo(-18, 12); c.lineTo(-6, 8); c.closePath(); }, '#E5483B', true],
      [() => { c.beginPath(); c.moveTo(-13, -8); c.lineTo(8, -8); c.quadraticCurveTo(22, -6, 24, 0); c.quadraticCurveTo(22, 6, 8, 8); c.lineTo(-13, 8); c.closePath(); }, lin(c, 0, -8, 0, 8, ['#FFFFFF', '#E3E9F2']), true],
      [() => { c.beginPath(); c.moveTo(12, -7.2); c.quadraticCurveTo(22, -6, 24, 0); c.quadraticCurveTo(22, 6, 12, 7.2); c.closePath(); }, '#E5483B'],
    ]);
    ell(c, 2, 0, 4, 4); c.fillStyle = INK; c.fill(); ell(c, 2, 0, 2.8, 2.8); c.fillStyle = '#7FD3FF'; c.fill();
  }
  c.restore();
}
// ================= pist temaları
const THEMES = {
  meadow: { sky: ['#4FB6EE', '#9EDDF7', '#FFF0C2'], sun: '#FFF3B8', sunY: 92, glow: 'rgba(255,236,160,.55)', cloud: '#FFFFFF', cloudSh: '#D6ECF8',
    far: ['#8CC2E6', '#B5DBF0'], far2: ['#6FBF8A', '#95D3A3'], mid: ['#58C46D', '#3E9E57'], midEdge: '#2C7A44',
    road: ['#606781', '#4A5068'], tex: 'asphalt', lane: 'rgba(255,255,255,.78)', curb: ['#E5483B', '#FFFFFF'],
    fg: ['#3AAE59', '#24803F'], verge: '#45B864', smoke: 'rgba(235,238,245,', amb: 'petal', props: 'tree', fgProp: 'bush' },
  snow: { sky: ['#2F62C2', '#7CB0EC', '#E0EEFC'], sun: '#FFFFFF', sunY: 80, glow: 'rgba(220,240,255,.55)', cloud: '#FFFFFF', cloudSh: '#C9DCF2',
    far: ['#8FA9DA', '#BACDEC'], far2: ['#C8DAF2', '#E6EFFA'], mid: ['#F2F7FD', '#C9DAEE'], midEdge: '#8FA9CC',
    road: ['#C7DDF2', '#A2C1E0'], tex: 'ice', lane: 'rgba(255,255,255,.95)', curb: ['#2F7DE1', '#FFFFFF'],
    fg: ['#F5F9FE', '#D4E2F2'], verge: '#E8F0FA', smoke: 'rgba(255,255,255,', amb: 'snow', props: 'pine', fgProp: 'snowpile' },
  castle: { sky: ['#2A2160', '#B4527F', '#FFA45C'], sun: '#FFD08A', sunY: 210, glow: 'rgba(255,160,90,.6)', cloud: '#F7A3A8', cloudSh: '#B9638A',
    far: ['#5A3B7E', '#7A4D8A'], far2: ['#4A3168', '#62407A'], mid: ['#45603E', '#2F4630'], midEdge: '#22331F',
    road: ['#8A7B70', '#675A52'], tex: 'cobble', lane: 'rgba(255,236,190,.65)', curb: ['#FFC21F', '#5A3A2A'],
    fg: ['#3F5A35', '#2A3E25'], verge: '#4A6A3E', smoke: 'rgba(230,220,230,', amb: 'firefly', props: 'house', fgProp: 'torch', lights: true },
  pirate: { sky: ['#1E9AD6', '#78D2F0', '#FFF2C9'], sun: '#FFF6C8', sunY: 70, glow: 'rgba(255,245,200,.6)', cloud: '#FFFFFF', cloudSh: '#CBE9F4',
    far: ['#2BA3C9', '#58C3DD'], far2: ['#E9CB86', '#F4DCA0'], mid: ['#F0D08A', '#DDB466'], midEdge: '#B98A45',
    road: ['#CF9256', '#A96E39'], tex: 'plank', lane: 'rgba(255,248,225,.7)', curb: ['#FFFFFF', '#2AA6D8'],
    fg: ['#F3D490', '#DDB46A'], verge: '#F0CF86', smoke: 'rgba(255,250,235,', amb: 'spray', props: 'palm', fgProp: 'barrel' },
};
const LY = [272, 312, 352], LS = [.84, .92, 1];
const laneY = l => l <= 1 ? lerp(LY[0], LY[1], clamp(l, 0, 1)) : lerp(LY[1], LY[2], clamp(l - 1, 0, 1));
const laneS = l => l <= 1 ? lerp(LS[0], LS[1], clamp(l, 0, 1)) : lerp(LS[1], LS[2], clamp(l - 1, 0, 1));
const ROAD_T = 238, ROAD_B = 372;

// ================= sahne
class Scene {
  constructor(theme) {
    this.th = THEMES[theme]; this.name = theme;
    this.S = 0; this.t = 0; this.v = 380; this.anchor = 340;
    this.racers = []; this.objs = []; this.P = []; this.pops = []; this.proj = [];
    this.cam = { z: 1, fx: 340, fy: 300, shake: 0 };
    this.turboK = 0; this.flash = 0; this.onEvent = null; this.gen = null; this.taken = new Set();
    this.smokeAcc = 0;
  }
  sx(wx) { return wx - this.S + this.anchor; }
  addP(p) { this.P.push(Object.assign({ vx: 0, vy: 0, g: 0, drag: 0, life: 1, age: 0, size: 4, grow: 0, rot: 0, vr: 0 }, p)); }
  burst(wx, y, n, kind, cols, spd = 160) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = spd * (.35 + Math.random() * .8);
      this.addP({ type: kind, x: wx, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - spd * .3, g: kind === 'spark' ? 0 : 420, drag: kind === 'spark' ? 3 : 1, life: .6 + Math.random() * .6, size: 3 + Math.random() * 4, col: cols[i % cols.length], rot: Math.random() * TAU, vr: (Math.random() - .5) * 14 });
    }
  }
  pop(text, wx, y, o = {}) { this.pops.push(Object.assign({ text, wx, y, age: 0, col: '#FFC21F', size: 34, life: 1.3, rot: (Math.random() - .5) * .2 }, o)); }
  objectsInView() {
    const out = this.objs.slice();
    if (this.gen) { const k0 = Math.floor((this.S - 700) / 640), k1 = Math.floor((this.S + 1700) / 640); for (let k = k0; k <= k1; k++) { const o = this.gen(k); if (o) out.push(o); } }
    return out;
  }
  update(dt) {
    this.t += dt; this.S += this.v * dt;
    this.cam.shake = Math.max(0, this.cam.shake - dt * 2.2);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    const objs = this.objectsInView();
    // yarışçılar
    for (const r of this.racers) {
      const prevX = r.wx;
      r.wx = this.S + r.dx;
      const vel = r.vel = this.v + (r.dx - (r.pdx ?? r.dx)) / Math.max(dt, 1e-4); r.pdx = r.dx;
      r.wrot = (r.wrot || 0) + vel * dt / 13;
      r.turboT = Math.max(0, (r.turboT || 0) - dt);
      r.turbo = lerp(r.turbo || 0, r.turboT > 0 ? 1 : 0, 1 - Math.exp(-dt * 10));
      r.spinT = Math.max(0, (r.spinT || 0) - dt);
      r.hitT = Math.max(0, (r.hitT || 0) - dt);
      r.squash = (r.squash || 0) * Math.exp(-dt * 7);
      r.hopV = (r.hopV || 0); r.hopY = (r.hopY || 0);
      r.hopV += 900 * dt; r.hopY = Math.min(0, r.hopY + r.hopV * dt); if (r.hopY === 0) r.hopV = 0;
      const ln = Math.round(r.lane);
      // rampa
      let jump = 0, jrot = 0;
      for (const o of objs) {
        if (o.type === 'ramp' && o.lane === ln) {
          const d = r.wx + 30 - o.wx, L = o.len || 250;
          if (d > 0 && d < L) { const u = d / L; jump = (o.h || 52) * Math.sin(Math.PI * u); jrot = -.24 * Math.cos(Math.PI * u); }
        }
        const k = o.key + ':' + ln;
        if (o.type === 'box' && !r.ghost && !r.skipEvt && !this.taken.has(k) && Math.abs(r.wx + 20 - o.wx) < 26 && (r.jump || 0) < 20) {
          this.taken.add(k); this.burst(o.wx, laneY(ln) - 26, 14, 'spark', ['#FFE36B', '#FF9EC7', '#9CE7FF', '#FFFFFF'], 200);
          this.addP({ type: 'ring', x: o.wx, y: laneY(ln) - 24, life: .45, size: 10, col: '#FFFFFF' });
          this.onEvent && this.onEvent('box', r, o);
        }
        if (o.type === 'boost' && !r.ghost && !r.skipEvt && o.lane === ln && prevX + 30 < o.wx && r.wx + 30 >= o.wx) { r.turboT = Math.max(r.turboT, .9); this.onEvent && this.onEvent('boost', r, o); }
        if (o.type === 'gate' && !r.ghost && !r.skipEvt && prevX < o.wx && r.wx >= o.wx) { o.flashT = o.flashT || [0, 0, 0]; o.flashT[ln] = 1; this.onEvent && this.onEvent('gate', r, o, ln); }
        if (o.type === 'puddle' && o.lane === ln && Math.abs(r.wx - o.wx) < 40 && Math.random() < dt * 30) {
          this.addP({ type: 'drop', x: r.wx - 20 + Math.random() * 50, y: laneY(ln) - 2, vx: -60 + Math.random() * 120, vy: -150 - Math.random() * 120, g: 700, life: .6, size: 2.5 + Math.random() * 2.5, col: '#7FD3FF' });
        }
        if (o.type === 'ice' && o.lane === ln && Math.abs(r.wx - o.wx) < 70) r.wobble = 1;
      }
      r.wobble = (r.wobble || 0) * Math.exp(-dt * 2.5);
      if ((r.jump || 0) > 6 && jump === 0) { // iniş
        r.squash = 1; const y = laneY(r.lane);
        for (let i = 0; i < 10; i++) this.addP({ type: 'smoke', x: r.wx - 40 + Math.random() * 80, y: y - 3, vx: (Math.random() - .5) * 120, vy: -30 - Math.random() * 40, life: .7, size: 5, grow: 18, col: this.th.smoke });
        this.onEvent && this.onEvent('land', r);
      }
      r.jump = jump; r.jrot = jrot;
    }
    // egzoz
    this.smokeAcc += dt;
    if (this.smokeAcc > .05) {
      this.smokeAcc = 0;
      for (const r of this.racers) {
        const s = laneS(r.lane), y = laneY(r.lane) - r.jump * s;
        this.addP({ type: 'smoke', x: r.wx - 62 * s, y: y - 17 * s, vx: -30 - Math.random() * 30, vy: -14 - Math.random() * 10, life: .55 + r.turbo * .3, size: 3 * s, grow: 14 * s, col: this.th.smoke, a0: .55 });
        if (r.turbo > .3) this.addP({ type: 'spark', x: r.wx - 66 * s, y: y - 17 * s + (Math.random() - .5) * 6, vx: -260 - Math.random() * 120, vy: (Math.random() - .5) * 60, life: .3, size: 2.5, col: '#FFD27A', drag: 2 });
        if ((this.th.tex === 'ice' || this.th.tex === 'plank') && r.jump < 2 && Math.random() < .6) this.addP({ type: 'snowbit', x: r.wx - 30 * s, y: y - 2, vx: -80 - Math.random() * 60, vy: -60 - Math.random() * 70, g: 500, life: .5, size: 2 + Math.random() * 2, col: this.th.tex === 'ice' ? '#FFFFFF' : '#F3D9A8' });
      }
    }
    for (const p of this.P) {
      p.age += dt; p.vy += p.g * dt; const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    }
    this.P = this.P.filter(p => p.age < p.life && p.x > this.S - 1200);
    for (const p of this.pops) p.age += dt;
    this.pops = this.pops.filter(p => p.age < p.life);
    for (const o of this.objs) if (o.flashT) o.flashT = o.flashT.map(v => Math.max(0, v - dt * 1.6));
  }

  // -------- çizim
  render(c, W, H, view) {
    const v = Object.assign({ S: this.S, anchor: this.anchor, z: this.cam.z, fx: this.cam.fx, fy: this.cam.fy, shake: this.cam.shake, lines: this.turboK }, view || {});
    const oS = this.S, oA = this.anchor; this.S = v.S; this.anchor = v.anchor;
    const th = this.th, t = this.t, S = this.S;
    c.save();
    if (v.shake > 0) c.translate((Math.random() - .5) * 14 * v.shake, (Math.random() - .5) * 10 * v.shake);
    c.translate(v.fx, v.fy); c.scale(v.z, v.z); c.translate(-v.fx, -v.fy);
    const X0 = (v.fx - v.fx / v.z) - 20, X1 = v.fx + (W - v.fx) / v.z + 20; // görünür aralık
    this.drawSky(c, X0, X1, H, S, t);
    this.drawFar(c, X0, X1, S, t);
    this.drawMid(c, X0, X1, S, t);
    this.drawSide(c, X0, X1, S, t);
    this.drawRoad(c, X0, X1, H, S, t);
    const objs = this.objectsInView();
    for (const o of objs) if (o.type === 'finish') this.drawFinish(c, o, t);
    for (const o of objs) if (o.type === 'ramp' || o.type === 'boost' || o.type === 'puddle' || o.type === 'ice') this.drawFlat(c, o, t);
    const gate = objs.find(o => o.type === 'gate');
    if (gate) this.drawGateBack(c, gate, t);
    for (let ln = 0; ln < 3; ln++) {
      for (const o of objs) if (o.type === 'box' && !this.taken.has(o.key + ':' + ln)) this.drawBox(c, o, ln, t);
      if (this.giant && this.giant.lane === ln) this.drawGiant(c, this.giant, t);
      const rs = this.racers.filter(r => Math.round(r.lane) === ln).sort((a, b) => a.wx - b.wx);
      for (const r of rs) this.drawRacer(c, r, t);
      if (gate) this.drawGateLane(c, gate, ln, t);
    }
    for (const p of this.proj) this.drawProj(c, p, t);
    this.drawParticles(c);
    this.drawFG(c, X0, X1, H, S, t);
    this.drawPops(c);
    this.drawAmbient(c, X0, X1, H, t, S);
    c.restore();
    // hız çizgileri ve renk
    if (v.lines > .02) this.drawSpeedLines(c, W, H, t, v.lines);
    const vg = c.createRadialGradient(W / 2, H * .55, H * .35, W / 2, H * .55, W * .72);
    vg.addColorStop(0, 'rgba(10,12,30,0)'); vg.addColorStop(1, 'rgba(10,12,30,.42)');
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
    if (this.flash > 0) { c.fillStyle = `rgba(255,255,255,${this.flash * .55})`; c.fillRect(0, 0, W, H); }
    this.S = oS; this.anchor = oA;
  }
  drawSky(c, X0, X1, H, S, t) {
    const th = this.th;
    c.fillStyle = lin(c, 0, 0, 0, 250, th.sky); c.fillRect(X0, -260, X1 - X0, H + 520);
    const sx = (X0 + X1) * .5 + (X1 - X0) * .22, sy = th.sunY;
    let g = c.createRadialGradient(sx, sy, 10, sx, sy, 300); g.addColorStop(0, th.glow); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(X0, -60, X1 - X0, 360);
    // ışık hüzmeleri
    c.save(); c.globalCompositeOperation = 'lighter'; c.translate(sx, sy); c.rotate(t * .03);
    for (let i = 0; i < 12; i++) { c.rotate(TAU / 12); c.fillStyle = 'rgba(255,250,220,.045)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(520, -36); c.lineTo(520, 36); c.closePath(); c.fill(); }
    c.restore();
    ell(c, sx, sy, 34, 34); c.fillStyle = th.sun; c.fill();
    ell(c, sx, sy, 44, 44); c.fillStyle = rgba('#FFFFFF', .14); c.fill();
    if (this.name === 'castle') { // yıldızlar
      for (let i = 0; i < 40; i++) { const x = X0 + hash(i, 1) * (X1 - X0), y = hash(i, 2) * 120 - 10, a = .3 + .5 * Math.abs(Math.sin(t * 1.5 + i)); c.fillStyle = `rgba(255,255,255,${a})`; ell(c, x, y, 1.2, 1.2); c.fill(); }
      this.drawFireworks(c, X0, X1, t);
    }
    // bulutlar
    const off = S * .04 + t * 10, sp = 330;
    for (let i = Math.floor((X0 + off) / sp) - 1; i <= Math.floor((X1 + off) / sp) + 1; i++) {
      const x = i * sp - off + hash(i, 4) * 120, y = 38 + hash(i, 5) * 70, s = .7 + hash(i, 6) * .6;
      c.save(); c.translate(x, y); c.scale(s, s);
      c.fillStyle = th.cloudSh; [[0, 6, 30, 14], [28, 6, 26, 12], [-26, 8, 22, 10]].forEach(([a, b, rx, ry]) => { ell(c, a, b, rx, ry); c.fill(); });
      c.fillStyle = th.cloud; [[0, 0, 28, 18], [26, 3, 22, 14], [-24, 5, 19, 12], [8, -10, 18, 14]].forEach(([a, b, rx, ry]) => { ell(c, a, b, rx, ry); c.fill(); });
      c.restore();
    }
  }
  drawFireworks(c, X0, X1, t) {
    for (let k = 0; k < 3; k++) {
      const per = 2.6, ph = (t + k * .9) % per, id = Math.floor((t + k * .9) / per) * 3 + k;
      const x = X0 + (.15 + hash(id, 1) * .7) * (X1 - X0), y = 40 + hash(id, 2) * 70;
      const col = ['#FFD23F', '#FF7AB6', '#7FE8FF', '#B6FF7A'][id % 4];
      if (ph < .5) { // yükselen iz
        const u = ph / .5; c.strokeStyle = 'rgba(255,230,180,.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 240); c.lineTo(x, lerp(240, y, u)); c.stroke();
      } else if (ph < 1.9) {
        const u = (ph - .5) / 1.4, R = 60 * Math.sqrt(u), a = 1 - u;
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 18; i++) { const an = i * TAU / 18, px = x + Math.cos(an) * R, py = y + Math.sin(an) * R + u * u * 24; c.fillStyle = rgba(col, a); ell(c, px, py, 2.4, 2.4); c.fill(); c.strokeStyle = rgba(col, a * .5); c.lineWidth = 1.5; c.beginPath(); c.moveTo(lerp(x, px, .6), lerp(y, py, .6)); c.lineTo(px, py); c.stroke(); }
        const g = c.createRadialGradient(x, y, 0, x, y, 70); g.addColorStop(0, rgba(col, .25 * a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(x - 70, y - 70, 140, 140);
        c.restore();
      }
    }
  }
  drawFar(c, X0, X1, S, t) {
    const th = this.th, f = S * .1;
    if (this.name === 'pirate') {
      // deniz
      c.fillStyle = lin(c, 0, 168, 0, 240, ['#3CB7DD', '#1F86BE']); c.fillRect(X0, 168, X1 - X0, 80);
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 26; i++) { const x = X0 + ((hash(i, 3) * 1400 - f * 2 - t * 20) % 1400 + 1400) % 1400 - 200, y = 176 + hash(i, 4) * 56; c.fillStyle = `rgba(255,255,255,${.25 + .25 * Math.sin(t * 3 + i)})`; rr(c, x, y, 16 + hash(i, 5) * 30, 2, 1); c.fill(); }
      c.restore();
      // uzak adalar
      const sp = 700;
      for (let i = Math.floor((X0 + f) / sp) - 1; i <= Math.floor((X1 + f) / sp) + 1; i++) {
        const x = i * sp - f + hash(i, 1) * 300;
        c.fillStyle = '#2E8FB4'; ell(c, x, 172, 90, 16); c.fill();
        c.fillStyle = '#E9CB86'; ell(c, x, 170, 70, 9); c.fill();
        c.strokeStyle = '#2B7F6A'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, 168); c.quadraticCurveTo(x + 6, 150, x + 2, 138); c.stroke();
        c.fillStyle = '#2B7F6A'; [-.6, .2, 1, 1.9, 2.6].forEach(a => { ell(c, x + 2 + Math.cos(a - Math.PI / 2) * 12, 138 + Math.sin(a - Math.PI / 2) * 5 + 4, 13, 3.5, a - Math.PI / 2); c.fill(); });
      }
      // gemi
      const gx = X0 + ((t * 18 - f * .5) % 1500 + 1500) % 1500 - 200, gy = 188 + Math.sin(t * 1.6) * 2;
      this.drawShip(c, gx, gy, t);
      return;
    }
    // iki kat uzak tepe/dağ
    const band = (ff, base, amp, cols, peaks) => {
      const o = S * ff;
      c.beginPath(); c.moveTo(X0, 260);
      if (peaks) {
        const sp = 120; const pts = [];
        for (let i = Math.floor((X0 + o) / sp) - 1; i <= Math.floor((X1 + o) / sp) + 1; i++) pts.push([i * sp - o, base - (i % 2 ? amp * (.55 + hash(i, 8) * .45) : amp * .15 * hash(i, 3))]);
        pts.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(X1, 260); c.closePath();
        c.fillStyle = lin(c, 0, base - amp, 0, base, cols); c.fill();
        c.save(); c.clip();
        c.beginPath(); c.moveTo(X0, -10); pts.forEach(p => c.lineTo(p[0], p[1] + amp * .42)); c.lineTo(X1, -10); c.closePath(); c.fillStyle = 'rgba(255,255,255,.95)'; c.fill();
        c.restore();
      } else {
        for (let x = X0; x <= X1 + 12; x += 12) { const X = x + o; c.lineTo(x, base - amp * (.5 + .3 * Math.sin(X * .004) + .2 * Math.sin(X * .011 + 1.3))); }
        c.lineTo(X1, 260); c.closePath(); c.fillStyle = lin(c, 0, base - amp, 0, base, cols); c.fill();
      }
    };
    band(.06, 200, this.name === 'snow' ? 130 : 90, th.far, this.name === 'snow');
    if (this.name === 'castle') this.drawCastles(c, X0, X1, S * .1, t);
    band(.14, 222, this.name === 'snow' ? 70 : 52, th.far2, this.name === 'snow');
  }
  drawShip(c, x, y, t) {
    c.save(); c.translate(x, y); c.scale(.9, .9);
    c.fillStyle = '#7A4A2A'; c.beginPath(); c.moveTo(-50, -8); c.lineTo(52, -8); c.lineTo(38, 10); c.lineTo(-40, 10); c.closePath(); c.fill();
    c.fillStyle = '#5A341C'; c.fillRect(-46, -2, 92, 3);
    c.fillStyle = '#4A2A16'; c.fillRect(-4, -78, 4, 72); c.fillRect(-30, -58, 3, 52);
    c.fillStyle = '#F4EBD8'; c.beginPath(); c.moveTo(1, -74); c.quadraticCurveTo(30, -50, 2, -18); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-27, -54); c.quadraticCurveTo(-6, -38, -26, -20); c.closePath(); c.fill();
    c.fillStyle = '#1E2233'; c.beginPath(); c.moveTo(0, -78); c.lineTo(18, -74 + Math.sin(t * 6) * 2); c.lineTo(0, -70); c.closePath(); c.fill();
    // top atışı
    const ph = t % 4.2;
    if (ph < .6) { const u = ph / .6; c.fillStyle = `rgba(255,255,255,${.8 * (1 - u)})`; ell(c, 58 + u * 20, -4, 8 + u * 16, 6 + u * 10); c.fill(); }
    c.restore();
    const ph2 = t % 4.2;
    if (ph2 > 1 && ph2 < 1.8) { // sıçrama
      const u = (ph2 - 1) / .8, sx = x + 170; c.fillStyle = `rgba(255,255,255,${.9 * (1 - u)})`;
      for (let i = 0; i < 5; i++) { ell(c, sx + (i - 2) * 6, y + 6 - Math.sin(u * Math.PI) * (26 + i % 2 * 12), 3, 6); c.fill(); }
    }
  }
  drawCastles(c, X0, X1, o, t) {
    const sp = 620;
    for (let i = Math.floor((X0 + o) / sp) - 1; i <= Math.floor((X1 + o) / sp) + 1; i++) {
      const x = i * sp - o + hash(i, 2) * 200, b = 196;
      c.fillStyle = '#3C2858';
      const tw = (tx, w, h) => { c.fillRect(tx, b - h, w, h); for (let k = 0; k < w; k += 8) c.fillRect(tx + k, b - h - 6, 5, 6); };
      tw(x - 60, 34, 80); tw(x + 26, 34, 90); c.fillRect(x - 30, b - 54, 60, 54); for (let k = -30; k < 30; k += 9) c.fillRect(x + k, b - 60, 6, 6);
      c.beginPath(); c.moveTo(x + 22, b - 96); c.lineTo(x + 43, b - 126); c.lineTo(x + 64, b - 96); c.closePath(); c.fill();
      c.fillStyle = '#FFD27A'; [[x - 47, b - 60], [x + 39, b - 70], [x - 8, b - 36], [x + 6, b - 36]].forEach(([wx, wy]) => { rr(c, wx, wy, 7, 10, [3.5, 3.5, 0, 0]); c.fill(); });
      c.fillStyle = '#E5483B'; c.beginPath(); c.moveTo(x + 43, b - 126); c.lineTo(x + 43 + 16, b - 121 + Math.sin(t * 5 + i) * 2); c.lineTo(x + 43, b - 116); c.closePath(); c.fill();
    }
  }
  drawMid(c, X0, X1, S, t) {
    const th = this.th, o = S * .32, base = 238;
    c.beginPath(); c.moveTo(X0, 260);
    const hy = X => base - 26 - 14 * Math.sin(X * .006) - 8 * Math.sin(X * .017 + 2);
    for (let x = X0; x <= X1 + 10; x += 10) c.lineTo(x, hy(x + o));
    c.lineTo(X1, 260); c.closePath();
    c.fillStyle = lin(c, 0, 190, 0, 240, th.mid); c.fill();
    c.strokeStyle = th.midEdge; c.lineWidth = 3; c.stroke();
    const sp = 150;
    for (let i = Math.floor((X0 + o) / sp) - 1; i <= Math.floor((X1 + o) / sp) + 1; i++) {
      if (hash(i, 11) < .25) continue;
      const x = i * sp - o + hash(i, 12) * 80, y = hy(x + o) + 4, s = .75 + hash(i, 13) * .5;
      c.save(); c.translate(x, y); c.scale(s, s); this.midProp(c, th.props, i, t); c.restore();
    }
  }
  midProp(c, kind, i, t) {
    if (kind === 'tree') {
      const g = lin(c, 0, -60, 0, -10, ['#7EDB6E', '#3FAE4E']);
      drawShape(c, [[() => rr(c, -4, -22, 8, 22, 3), '#8A5D39', true], [() => ell(c, -11, -30, 14, 13), g, true], [() => ell(c, 11, -32, 14, 13), g, true], [() => ell(c, 0, -44, 17, 16), g, true]]);
      c.fillStyle = 'rgba(255,255,255,.35)'; ell(c, -5, -52, 6, 3.5, -.4); c.fill();
      if (hash(i, 2) > .5) { c.fillStyle = '#E5483B'; [[-8, -36], [9, -42], [2, -30]].forEach(([a, b]) => { ell(c, a, b, 2.6, 2.6); c.fill(); }); }
    } else if (kind === 'pine') {
      const g = lin(c, 0, -70, 0, 0, ['#3E9B6B', '#256B4A']);
      drawShape(c, [[() => rr(c, -3.5, -14, 7, 14, 2), '#7A5233', true],
        [() => { c.beginPath(); c.moveTo(-20, -12); c.lineTo(0, -40); c.lineTo(20, -12); c.closePath(); }, g, true],
        [() => { c.beginPath(); c.moveTo(-16, -30); c.lineTo(0, -56); c.lineTo(16, -30); c.closePath(); }, g, true],
        [() => { c.beginPath(); c.moveTo(-11, -46); c.lineTo(0, -68); c.lineTo(11, -46); c.closePath(); }, g, true]]);
      c.fillStyle = '#FFFFFF'; [[-12, -32, 0, -40], [-9, -49, 0, -56], [-6, -62, 0, -68]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.lineTo(-a, b); c.quadraticCurveTo(0, b - 4, a, b); c.fill(); });
    } else if (kind === 'house') {
      drawShape(c, [[() => rr(c, -18, -30, 36, 30, 3), '#B89A84', true], [() => { c.beginPath(); c.moveTo(-23, -28); c.lineTo(0, -50); c.lineTo(23, -28); c.closePath(); }, '#8C3B3B', true]]);
      c.fillStyle = '#FFD27A'; rr(c, -11, -22, 8, 9, 2); c.fill(); rr(c, 3, -22, 8, 9, 2); c.fill();
      c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(0, -18, 2, 0, -18, 40); g.addColorStop(0, 'rgba(255,200,110,.35)'); g.addColorStop(1, 'rgba(255,200,110,0)'); c.fillStyle = g; c.fillRect(-40, -58, 80, 80); c.restore();
    } else if (kind === 'palm') {
      const sw = Math.sin(t * 1.5 + i) * 2;
      c.lineCap = 'round';
      const trunk = () => { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(8, -30, 4 + sw, -58); };
      c.strokeStyle = INK; c.lineWidth = 9 + OL * 2; trunk(); c.stroke(); c.strokeStyle = '#B07A45'; c.lineWidth = 9; trunk(); c.stroke();
      const lf = [-2.6, -2, -1.2, -.4, .3];
      lf.forEach(a => { c.save(); c.translate(4 + sw, -58); c.rotate(a); ell(c, 18, 0, 20, 5.5); c.fillStyle = INK; c.fill(); ell(c, 18, 0, 18, 3.6); c.fillStyle = '#3FAE4E'; c.fill(); c.restore(); });
      ell(c, 4 + sw, -56, 4.5, 4.5); c.fillStyle = '#7A4F2A'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    }
  }
  drawSide(c, X0, X1, S, t) {
    // seyirci tribünü + bayrak ipi
    const o = S * .92, b = 236, sp = 560, th = this.th;
    for (let i = Math.floor((X0 + o) / sp) - 1; i <= Math.floor((X1 + o) / sp) + 1; i++) {
      const x0 = i * sp - o;
      if (hash(i, 21) < .55) {
        const n = 11, w = 15;
        rr(c, x0 - 6, b - 26, n * w + 12, 26, [6, 6, 0, 0]); c.fillStyle = INK; c.fill(); rr(c, x0 - 4, b - 24, n * w + 8, 24, [5, 5, 0, 0]); c.fillStyle = this.name === 'castle' ? '#6B4A6E' : '#D9E2F0'; c.fill();
        for (let k = 0; k < n; k++) {
          const h = hash(i * 31 + k, 3), jump = Math.max(0, Math.sin(t * 9 + k * 1.7 + i)) * (h > .4 ? 5 : 2);
          const hx = x0 + k * w + 3, hy = b - 26 - jump, col = ['#FFC21F', '#E5483B', '#3FA9F5', '#34C17B', '#9B6BEF', '#FF9EC7', '#F5A524'][(i * 7 + k) % 7];
          ell(c, hx, hy, 7.5, 7.5); c.fillStyle = INK; c.fill(); ell(c, hx, hy, 6, 6); c.fillStyle = col; c.fill();
          c.fillStyle = INK; ell(c, hx - 2, hy - 1, 1, 1.3); c.fill(); ell(c, hx + 2, hy - 1, 1, 1.3); c.fill();
          if (h > .72) { // bayrak sallayan
            const a = Math.sin(t * 7 + k) * .5;
            c.save(); c.translate(hx + 5, hy - 2); c.rotate(a);
            c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -18); c.stroke();
            c.fillStyle = col === '#FFC21F' ? '#E5483B' : '#FFC21F'; c.beginPath(); c.moveTo(0, -18); c.lineTo(12, -14); c.lineTo(0, -10); c.closePath(); c.fill(); c.stroke();
            c.restore();
          }
        }
      }
    }
    // bayrak ipi
    const sp2 = 240, o2 = S * .96;
    for (let i = Math.floor((X0 + o2) / sp2) - 1; i <= Math.floor((X1 + o2) / sp2) + 1; i++) {
      const xa = i * sp2 - o2, xb = xa + sp2;
      c.fillStyle = INK; c.fillRect(xa - 2.5, b - 62, 5, 62); c.fillStyle = '#E9EEF5'; c.fillRect(xa - 1.2, b - 61, 2.4, 60);
      c.strokeStyle = 'rgba(30,34,51,.8)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(xa, b - 60); c.quadraticCurveTo((xa + xb) / 2, b - 40, xb, b - 60); c.stroke();
      for (let k = 1; k < 10; k++) {
        const u = k / 10, x = lerp(xa, xb, u), y = (1 - u) * (1 - u) * (b - 60) + 2 * u * (1 - u) * (b - 40) + u * u * (b - 60);
        const sw = Math.sin(t * 6 + k + i) * 2;
        c.fillStyle = ['#E5483B', '#FFC21F', '#3FA9F5', '#34C17B'][(k + i) % 4];
        c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x + 6, y); c.lineTo(x + sw, y + 13); c.closePath(); c.fill();
        c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
      }
    }
  }
  drawRoad(c, X0, X1, H, S, t) {
    const th = this.th, W = X1 - X0;
    c.fillStyle = lin(c, 0, ROAD_T, 0, ROAD_B, th.road); c.fillRect(X0, ROAD_T, W, ROAD_B - ROAD_T);
    // doku
    if (th.tex === 'asphalt') {
      for (let i = Math.floor((X0 + S) / 26) - 1; i <= Math.floor((X1 + S) / 26) + 1; i++) {
        const x = i * 26 - S + hash(i, 1) * 26, y = ROAD_T + 8 + hash(i, 2) * (ROAD_B - ROAD_T - 16);
        c.fillStyle = hash(i, 3) > .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.12)'; ell(c, x, y, 3 + hash(i, 4) * 5, 1.4); c.fill();
      }
    } else if (th.tex === 'ice') {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = Math.floor((X0 + S) / 90) - 1; i <= Math.floor((X1 + S) / 90) + 1; i++) {
        const x = i * 90 - S + hash(i, 1) * 50, y = ROAD_T + 10 + hash(i, 2) * 110;
        c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 40 + hash(i, 3) * 60, y - 6); c.stroke();
      }
      c.restore();
    } else if (th.tex === 'plank') {
      c.strokeStyle = 'rgba(90,50,20,.45)'; c.lineWidth = 2;
      for (let row = 0; row < 6; row++) {
        const y0 = ROAD_T + row * (ROAD_B - ROAD_T) / 6;
        c.beginPath(); c.moveTo(X0, y0); c.lineTo(X1, y0); c.stroke();
        const sp = 120, of = row * 47;
        for (let i = Math.floor((X0 + S + of) / sp) - 1; i <= Math.floor((X1 + S + of) / sp) + 1; i++) {
          const x = i * sp - S - of; c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y0 + 22); c.stroke();
          c.fillStyle = 'rgba(70,40,20,.6)'; ell(c, x + 6, y0 + 6, 1.4, 1.4); c.fill(); ell(c, x + 6, y0 + 16, 1.4, 1.4); c.fill();
        }
      }
      c.fillStyle = 'rgba(255,230,190,.12)'; for (let row = 0; row < 6; row++) c.fillRect(X0, ROAD_T + row * 22.3 + 2, W, 3);
    } else if (th.tex === 'cobble') {
      for (let row = 0; row < 9; row++) {
        const y0 = ROAD_T + 2 + row * 15, of = row % 2 ? 13 : 0, sp = 26;
        for (let i = Math.floor((X0 + S + of) / sp) - 1; i <= Math.floor((X1 + S + of) / sp) + 1; i++) {
          const x = i * sp - S - of; rr(c, x + 1, y0, sp - 3, 12, 5); c.fillStyle = hash(i * 13 + row, 2) > .5 ? 'rgba(255,240,220,.08)' : 'rgba(0,0,0,.12)'; c.fill();
        }
      }
    }
    // şerit çizgileri
    c.fillStyle = th.lane;
    [292, 332].forEach((y, j) => { for (let i = Math.floor((X0 + S) / 80) - 1; i <= Math.floor((X1 + S) / 80) + 1; i++) { rr(c, i * 80 - S, y - 2.5, 42, 5, 2.5); c.fill(); } });
    // kaldırım taşları
    const curb = (y, h, f) => {
      const sp = 34, o = S * f;
      for (let i = Math.floor((X0 + o) / sp) - 1; i <= Math.floor((X1 + o) / sp) + 1; i++) {
        const x = i * sp - o; rr(c, x, y, sp, h, 2); c.fillStyle = INK; c.fill();
        rr(c, x + 1.2, y + 1.2, sp - 2.4, h - 2.4, 2); c.fillStyle = th.curb[i & 1]; c.fill();
        c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x + 3, y + 2, sp - 6, 2);
      }
    };
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(X0, ROAD_T, W, 7);
    curb(ROAD_T - 8, 10, 1);
    c.fillStyle = lin(c, 0, ROAD_B, 0, H, [th.verge, th.fg[1]]); c.fillRect(X0, ROAD_B, W, H - ROAD_B + 60);
    curb(ROAD_B - 2, 11, 1);
  }
  drawFlat(c, o, t) {
    const x = this.sx(o.wx), y = laneY(o.lane), s = laneS(o.lane);
    c.save(); c.translate(x, y); c.scale(s, s);
    if (o.type === 'ramp') {
      const L = 70, h = 22;
      c.fillStyle = 'rgba(20,22,40,.25)'; ell(c, L * .5, 2, L * .6, 6); c.fill();
      const p = () => { c.beginPath(); c.moveTo(0, 0); c.lineTo(L, -h); c.lineTo(L + 6, -h); c.lineTo(L + 6, 0); c.closePath(); };
      c.strokeStyle = INK; c.lineWidth = OL * 2; c.lineJoin = 'round'; p(); c.stroke();
      p(); c.fillStyle = '#FFC21F'; c.fill();
      c.save(); p(); c.clip(); c.fillStyle = INK; for (let k = -2; k < 8; k++) { c.beginPath(); c.moveTo(k * 14, 0); c.lineTo(k * 14 + 7, 0); c.lineTo(k * 14 + 27, -h); c.lineTo(k * 14 + 20, -h); c.closePath(); c.fill(); } c.restore();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(4, -2); c.lineTo(L, -h + 1); c.lineTo(L, -h + 4); c.lineTo(6, 0); c.closePath(); c.fill();
    } else if (o.type === 'boost') {
      const pulse = (t * 3) % 1;
      for (let k = 0; k < 3; k++) {
        const a = .35 + .65 * (1 - Math.abs(((pulse * 3 - k) % 3 + 3) % 3 - 1) / 1);
        c.save(); c.translate(k * 20, -8); c.globalAlpha = clamp(a, .3, 1);
        c.beginPath(); c.moveTo(0, -10); c.lineTo(14, 0); c.lineTo(0, 10); c.lineTo(-6, 10); c.lineTo(8, 0); c.lineTo(-6, -10); c.closePath();
        c.fillStyle = INK; c.fill(); c.scale(.8, .7); c.translate(1, 0); c.fillStyle = '#7CFFB6'; c.fill(); c.restore();
      }
      c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(20, -8, 2, 20, -8, 46); g.addColorStop(0, 'rgba(120,255,180,.35)'); g.addColorStop(1, 'rgba(120,255,180,0)'); c.fillStyle = g; c.fillRect(-30, -54, 100, 80); c.restore();
    } else if (o.type === 'puddle') {
      ell(c, 0, -4, 46, 9); c.fillStyle = INK; c.fill(); ell(c, 0, -4, 44, 7.5); c.fillStyle = lin(c, 0, -11, 0, 3, ['#9AE3FF', '#3FA9F5']); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.6; const r = (t * 1.5) % 1; ell(c, -10, -4, 10 + r * 20, 2 + r * 3); c.globalAlpha = 1 - r; c.stroke(); c.globalAlpha = 1;
    } else if (o.type === 'ice') {
      ell(c, 0, -4, 80, 10); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill(); c.strokeStyle = 'rgba(120,180,240,.8)'; c.lineWidth = 2; c.stroke();
      c.save(); c.globalCompositeOperation = 'lighter'; const sh = ((t * .8) % 1) * 160 - 80; c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.moveTo(sh - 8, -12); c.lineTo(sh + 4, -12); c.lineTo(sh - 4, 4); c.lineTo(sh - 16, 4); c.closePath(); c.fill(); c.restore();
    }
    c.restore();
  }
  drawBox(c, o, ln, t) {
    const x = this.sx(o.wx), s = laneS(ln), y = laneY(ln) - 30 * s + Math.sin(t * 4 + ln) * 4 * s;
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = 'rgba(20,22,40,.25)'; ell(c, 0, 30 - Math.sin(t * 4 + ln) * 4, 16, 4); c.fill();
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(0, 0, 4, 0, 0, 40); g.addColorStop(0, 'rgba(255,220,120,.5)'); g.addColorStop(1, 'rgba(255,220,120,0)'); c.fillStyle = g; c.fillRect(-40, -40, 80, 80); c.restore();
    c.rotate(Math.sin(t * 2.5 + ln) * .18);
    rr(c, -15 - OL, -15 - OL, 30 + OL * 2, 30 + OL * 2, 8); c.fillStyle = INK; c.fill();
    const hue = (t * 120 + ln * 60) % 360;
    rr(c, -15, -15, 30, 30, 7); c.fillStyle = lin(c, -15, -15, 15, 15, [`hsl(${hue},95%,70%)`, `hsl(${(hue + 60) % 360},95%,60%)`, `hsl(${(hue + 120) % 360},90%,55%)`]); c.fill();
    c.fillStyle = 'rgba(255,255,255,.45)'; rr(c, -11, -12, 14, 4, 2); c.fill();
    c.font = `800 22px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = INK; c.strokeText('?', 0, 2); c.fillStyle = '#FFFFFF'; c.fillText('?', 0, 2);
    c.restore();
  }
  drawGateBack(c, g, t) {
    const x = this.sx(g.wx);
    // arka direk ve soru tabelası
    c.fillStyle = INK; c.fillRect(x - 6, 120, 12, ROAD_T - 118); c.fillStyle = '#E9EEF5'; c.fillRect(x - 3.5, 122, 7, ROAD_T - 122);
    c.save(); c.translate(x, 112);
    rr(c, -100, -34, 200, 54, 14); c.fillStyle = INK; c.fill();
    rr(c, -96, -30, 192, 46, 11); c.fillStyle = lin(c, 0, -30, 0, 16, ['#3A4A9A', '#24306C']); c.fill();
    c.fillStyle = 'rgba(255,255,255,.12)'; rr(c, -90, -26, 180, 10, 5); c.fill();
    for (let k = 0; k < 12; k++) { const on = Math.floor(t * 8 + k) % 2; ell(c, -86 + k * 15.6, -32, 2.5, 2.5); c.fillStyle = on ? '#FFE36B' : '#8A7A3A'; c.fill(); }
    c.font = `800 30px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 6; c.strokeStyle = INK; c.strokeText(g.q + ' = ?', 0, -6); c.fillStyle = '#FFFFFF'; c.fillText(g.q + ' = ?', 0, -6);
    c.restore();
  }
  drawGateLane(c, g, ln, t) {
    const x = this.sx(g.wx), y = laneY(ln), s = laneS(ln), fl = (g.flashT || [0, 0, 0])[ln];
    const ok = ln === g.correct && g.solved;
    const col = ok ? '#4CFF9A' : ['#FF7AB6', '#FFC94D', '#7FD3FF'][ln];
    c.save(); c.translate(x, y); c.scale(s, s);
    // ışık perdesi
    c.save(); c.globalCompositeOperation = 'lighter';
    const g2 = c.createLinearGradient(-16, 0, 16, 0); g2.addColorStop(0, rgba(col.length === 7 ? col : '#FFFFFF', 0)); g2.addColorStop(.5, rgba(col, .35 + fl * .5)); g2.addColorStop(1, rgba(col, 0));
    c.fillStyle = g2; c.beginPath(); c.moveTo(-14, 4); c.lineTo(-6, -64); c.lineTo(14, -64); c.lineTo(6, 4); c.closePath(); c.fill();
    for (let k = 0; k < 4; k++) { const yy = -((t * 60 + k * 17) % 66); c.fillStyle = rgba(col, .5); ell(c, (yy / 66) * 8, yy, 2, 2); c.fill(); }
    c.restore();
    // sayı balonu
    const bob = Math.sin(t * 3 + ln * 2) * 2, sc = 1 + fl * .35;
    c.save(); c.translate(4, -82 + bob); c.scale(sc, sc);
    ell(c, 0, 0, 19, 19); c.fillStyle = INK; c.fill(); ell(c, 0, 0, 16.5, 16.5); c.fillStyle = col; c.fill();
    c.fillStyle = 'rgba(255,255,255,.45)'; ell(c, -5, -7, 7, 4, -.4); c.fill();
    c.font = `800 24px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = INK; c.fillText(String(g.nums[ln]), 0, 1.5);
    c.restore();
    c.restore();
  }
  drawGiant(c, g, t) {
    const x = this.sx(g.wx), y = laneY(g.lane), s = laneS(g.lane), r = 30;
    c.fillStyle = 'rgba(20,22,40,.25)'; ell(c, x, y + 1, 34 * s, 6 * s); c.fill();
    c.save(); c.translate(x, y - r * s); c.scale(s, s); c.rotate(g.rot || 0);
    snowballArt(c, r);
    c.fillStyle = 'rgba(150,185,220,.75)'; [[10, 8, 6], [-12, 4, 4.5], [3, -14, 3.6], [-5, 16, 3]].forEach(([a, b, q]) => { ell(c, a, b, q, q * .7); c.fill(); });
    c.restore();
  }
  drawFinish(c, o, t) {
    const x = this.sx(o.wx), sq = 11;
    c.fillStyle = INK; c.fillRect(x - 6, 128, 12, ROAD_T - 126); c.fillStyle = '#E9EEF5'; c.fillRect(x - 3.5, 130, 7, ROAD_T - 130);
    for (let j = 0; ROAD_T + j * sq < ROAD_B; j++) for (let i = 0; i < 3; i++) { c.fillStyle = (i + j) % 2 ? INK : '#FFFFFF'; c.fillRect(x - 16 + i * sq + j * 1.2, ROAD_T + j * sq, sq, Math.min(sq, ROAD_B - ROAD_T - j * sq)); }
    c.save(); c.translate(x, 118);
    rr(c, -74, -26, 148, 44, 13); c.fillStyle = INK; c.fill();
    c.save(); rr(c, -70, -22, 140, 36, 10); c.clip();
    for (let i = 0; i < 14; i++) for (let j = 0; j < 4; j++) { c.fillStyle = (i + j) % 2 ? '#2B3550' : '#3A4A9A'; c.fillRect(-70 + i * 10, -22 + j * 9, 10, 9); }
    c.restore();
    c.font = `800 26px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 6; c.strokeStyle = INK; c.strokeText(o.label, 0, -2); c.fillStyle = '#FFC21F'; c.fillText(o.label, 0, -2);
    c.restore();
  }
  drawRacer(c, r, t) {
    if (r.ghost) { c.save(); c.globalAlpha = .45; this.drawRacer0(c, r, t); c.restore(); } else this.drawRacer0(c, r, t);
  }
  drawRacer0(c, r, t) {
    const x = this.sx(r.wx), y0 = laneY(r.lane), s = laneS(r.lane) * (r.scale || 1);
    c.fillStyle = 'rgba(16,18,36,.3)'; ell(c, x + 2, y0 + 1, 56 * s * (1 - r.jump / 180), 7.5 * s); c.fill();
    c.save(); c.translate(x, y0 - r.jump * s); c.scale(s, s);
    const q = r.squash || 0; c.scale(1 + .14 * q, 1 - .16 * q);
    const spin = r.spinT > 0 ? TAU * 2 * sstep(1 - r.spinT / (r.spinDur || .8)) : 0;
    const wob = (r.wobble || 0) * Math.sin(t * 18) * .08;
    c.translate(0, -20); c.rotate((r.jrot || 0) + (r.rot || 0) + wob); c.translate(0, 20);
    if (spin) { c.translate(0, -24); c.scale(Math.cos(spin), 1); c.translate(0, 24); }
    const lean = (r.turbo || 0) * -.2 + (r.leanX || 0) + Math.sin(t * 9 + (r.num || 0)) * .03;
    carArt(c, { t: t + (r.num || 0), color: r.color, team: r.team, char: r.char, num: r.num, wrot: r.wrot, blur: clamp((r.vel || 0) / 600, 0, .85), turbo: r.turbo, lean, hit: r.hitT > 0, bob: Math.sin(t * 26 + (r.num || 0)) * .9, hop: r.hopY || 0, wheel: r.wheel, rim: r.rim, lights: this.th.lights, look: 1.2 });
    if (r.hitT > 0) { // baş dönmesi yıldızları
      for (let k = 0; k < 3; k++) { const a = t * 6 + k * TAU / 3; c.save(); c.translate(-5 + Math.cos(a) * 16, -62 + Math.sin(a) * 5); c.scale(.32, .32); starArt(c, 14); c.restore(); }
    }
    if (r.shieldT > 0) {
      const a = .35 + .25 * Math.sin(t * 10);
      c.save(); c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(0, -30, 20, 0, -30, 70); g.addColorStop(0, 'rgba(160,220,255,0)'); g.addColorStop(.8, `rgba(160,220,255,${a * .5})`); g.addColorStop(1, `rgba(220,245,255,${a})`);
      c.fillStyle = g; ell(c, 0, -30, 72, 46); c.fill(); c.restore();
      c.save(); c.translate(-5, -76); c.scale(.6, .6); itemIcon(c, 'umbrella', t); c.restore();
    }
    if (r.bees > 0) {
      for (let k = 0; k < 4; k++) { const a = t * 5 + k * 1.6; c.save(); c.translate(-6 + Math.cos(a) * 30, -56 + Math.sin(a * 1.3) * 12); c.scale(.55, .55); ell(c, 0, 0, 5.4, 4); c.fillStyle = INK; c.fill(); ell(c, 0, 0, 4.3, 3); c.fillStyle = '#FFC21F'; c.fill(); ell(c, -1, -5, 3.4, 4, -.4); c.fillStyle = 'rgba(255,255,255,.85)'; c.fill(); c.restore(); }
    }
    c.restore();
  }
  drawProj(c, p, t) {
    const x = this.sx(p.wx), y = p.y;
    c.save(); c.translate(x, y); c.rotate(t * 14);
    snowballArt(c, 9 * (p.s || 1)); c.restore();
  }
  drawParticles(c) {
    for (const p of this.P) {
      const u = p.age / p.life, x = this.sx(p.x), y = p.y;
      if (p.type === 'smoke') { const r = p.size + p.grow * u; c.fillStyle = p.col + ((p.a0 || .6) * (1 - u)) + ')'; ell(c, x, y, r, r * .85); c.fill(); }
      else if (p.type === 'spark') { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(p.col, 1 - u); c.lineWidth = p.size; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x - p.vx * .04, y - p.vy * .04); c.stroke(); c.restore(); }
      else if (p.type === 'snowbit' || p.type === 'drop') { c.fillStyle = p.type === 'drop' ? rgba(p.col, 1 - u * .5) : rgba(p.col, 1 - u); ell(c, x, y, p.size, p.size * (p.type === 'drop' ? 1.3 : 1)); c.fill(); }
      else if (p.type === 'snow') { const r = p.size * (1 - u * .4); ell(c, x, y, r + 1.6, r + 1.6); c.fillStyle = INK; c.fill(); ell(c, x, y, r, r); c.fillStyle = '#FFFFFF'; c.fill(); }
      else if (p.type === 'confetti') { c.save(); c.translate(x, y); c.rotate(p.rot); c.scale(1, Math.cos(p.rot * 1.7)); c.fillStyle = p.col; c.fillRect(-p.size, -p.size * .5, p.size * 2, p.size); c.restore(); }
      else if (p.type === 'star') { c.save(); c.translate(x, y); c.rotate(p.rot); c.scale(p.size / 14 * (1 - u * .5), p.size / 14 * (1 - u * .5)); starArt(c, 14, p.col); c.restore(); }
      else if (p.type === 'ring') { c.strokeStyle = rgba(p.col, 1 - u); c.lineWidth = 4 * (1 - u) + .5; ell(c, x, y, p.size + u * 60, (p.size + u * 60) * .75); c.stroke(); }
      else if (p.type === 'shard') { c.save(); c.globalCompositeOperation = 'lighter'; c.translate(x, y); c.rotate(p.rot); c.fillStyle = rgba(p.col, 1 - u); c.beginPath(); c.moveTo(0, -p.size); c.lineTo(p.size * .6, 0); c.lineTo(0, p.size); c.lineTo(-p.size * .6, 0); c.closePath(); c.fill(); c.restore(); }
    }
  }
  drawFG(c, X0, X1, H, S, t) {
    const o = S * 1.45, sp = 210, th = this.th;
    for (let i = Math.floor((X0 + o) / sp) - 1; i <= Math.floor((X1 + o) / sp) + 1; i++) {
      if (hash(i, 41) < .35) continue;
      const x = i * sp - o + hash(i, 42) * 90, s = .9 + hash(i, 43) * .5;
      c.save(); c.translate(x, H + 6); c.scale(s, s);
      if (th.fgProp === 'bush') {
        const g = lin(c, 0, -46, 0, 0, ['#5FCF6B', '#2C8E45']);
        drawShape(c, [[() => ell(c, -22, -12, 22, 18), g, true], [() => ell(c, 20, -10, 22, 16), g, true], [() => ell(c, 0, -26, 24, 22), g, true]]);
        c.fillStyle = 'rgba(255,255,255,.3)'; ell(c, -6, -38, 9, 4, -.3); c.fill();
        if (hash(i, 44) > .4) [[-14, -28, '#FF9EC7'], [10, -32, '#FFFFFF'], [22, -16, '#FFC21F']].forEach(([a, b, col]) => { ell(c, a, b, 4.5, 4.5); c.fillStyle = INK; c.fill(); ell(c, a, b, 3.2, 3.2); c.fillStyle = col; c.fill(); ell(c, a, b, 1.2, 1.2); c.fillStyle = '#F5A524'; c.fill(); });
      } else if (th.fgProp === 'snowpile') {
        drawShape(c, [[() => ell(c, -18, -8, 24, 16), '#FFFFFF', true], [() => ell(c, 16, -6, 20, 12), '#FFFFFF', true], [() => ell(c, 0, -18, 18, 14), '#FFFFFF', true]]);
        c.fillStyle = 'rgba(160,190,225,.6)'; ell(c, 4, -2, 30, 5); c.fill();
        if (hash(i, 44) > .5) { // şeker kamışı direği
          c.save(); c.translate(26, -10); c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = 9; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -60); c.arc(-8, -60, 8, 0, Math.PI, true); c.stroke(); c.strokeStyle = '#FFFFFF'; c.lineWidth = 5.4; c.stroke();
          c.strokeStyle = '#E5483B'; c.setLineDash([5, 5]); c.lineDashOffset = 0; c.stroke(); c.setLineDash([]); c.restore();
        }
      } else if (th.fgProp === 'torch') {
        c.fillStyle = INK; c.fillRect(-4, -78, 8, 78); c.fillStyle = '#7A5233'; c.fillRect(-2, -76, 4, 76);
        drawShape(c, [[() => rr(c, -9, -90, 18, 14, 4), '#5A3A2A', true]]);
        const fl = Math.sin(t * 20 + i) * 3;
        c.save(); c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(0, -100, 2, 0, -100, 70); g.addColorStop(0, 'rgba(255,170,70,.55)'); g.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = g; c.fillRect(-70, -170, 140, 140);
        c.fillStyle = 'rgba(255,120,40,.9)'; c.beginPath(); c.moveTo(-8, -90); c.quadraticCurveTo(-6, -112 - fl, 0, -122 - fl); c.quadraticCurveTo(6, -110, 8, -90); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,230,140,.95)'; c.beginPath(); c.moveTo(-4, -90); c.quadraticCurveTo(-2, -104, 0, -110 - fl * .5); c.quadraticCurveTo(3, -102, 4, -90); c.closePath(); c.fill();
        c.restore();
        const g2 = lin(c, 0, -30, 0, 0, ['#4E7A3F', '#2E4A26']); drawShape(c, [[() => ell(c, -24, -8, 18, 12), g2, true], [() => ell(c, 20, -8, 16, 11), g2, true]]);
      } else if (th.fgProp === 'barrel') {
        if (hash(i, 44) > .45) {
          drawShape(c, [[() => rr(c, -18, -44, 36, 44, 10), lin(c, -18, 0, 18, 0, ['#B5763F', '#D6995A', '#9A5F2E']), true]]);
          c.fillStyle = INK; c.fillRect(-18, -36, 36, 3.5); c.fillRect(-18, -12, 36, 3.5);
          c.fillStyle = '#E5483B'; c.font = `800 16px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('X', 0, -23);
        } else {
          drawShape(c, [[() => ell(c, 0, -8, 30, 13), '#C9B79A', true], [() => ell(c, -8, -18, 14, 10), '#D9C8AA', true]]);
          // yengeç
          c.save(); c.translate(26, -4 + Math.abs(Math.sin(t * 8 + i)) * -3);
          drawShape(c, [[() => ell(c, 0, -6, 10, 7), '#E5483B', true], [() => ell(c, -11, -13, 4, 3), '#E5483B', true], [() => ell(c, 11, -13, 4, 3), '#E5483B', true]]);
          c.fillStyle = INK; ell(c, -3, -12, 1.5, 1.8); c.fill(); ell(c, 3, -12, 1.5, 1.8); c.fill();
          c.restore();
        }
      }
      c.restore();
    }
  }
  drawPops(c) {
    for (const p of this.pops) {
      const a = p.age, x = p.screen ? p.wx : this.sx(p.wx), y = p.y - a * 18;
      const s = sstep(a * 6) * (1 + .3 * Math.sin(a * 16) * Math.exp(-a * 5)), al = 1 - sstep((a - p.life + .3) / .3);
      c.save(); c.globalAlpha = al; c.translate(x, y); c.rotate(p.rot); c.scale(s, s);
      c.font = `800 ${p.size}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      const w = c.measureText(p.text).width;
      if (p.burst !== false) { c.save(); burstPath(c, w * .62 + 22, w * .5 + 8, 12, a * 2); c.fillStyle = INK; c.fill(); c.scale(.9, .86); burstPath(c, w * .62 + 22, w * .5 + 8, 12, a * 2); c.fillStyle = p.bg || '#FFFFFF'; c.fill(); c.restore(); }
      c.lineWidth = p.size * .22; c.strokeStyle = INK; c.lineJoin = 'round'; c.strokeText(p.text, 0, 2);
      c.fillStyle = lin(c, 0, -p.size * .5, 0, p.size * .5, ['#FFFFFF', p.col]); c.fillText(p.text, 0, 2);
      if (p.sub) { c.font = `800 ${p.size * .45}px ${FONT}`; c.lineWidth = 4; c.strokeText(p.sub, 0, p.size * .78); c.fillStyle = '#FFFFFF'; c.fillText(p.sub, 0, p.size * .78); }
      c.restore();
    }
  }
  drawAmbient(c, X0, X1, H, t, S) {
    const am = this.th.amb, W = X1 - X0;
    if (am === 'snow') {
      for (let i = 0; i < 70; i++) { const sp = 30 + hash(i, 1) * 50, x = X0 + ((hash(i, 2) * W - t * (120 + sp * 3) - S * .2 * hash(i, 4)) % W + W) % W, y = ((hash(i, 3) * H + t * sp) % H); const r = 1.2 + hash(i, 5) * 2.4; c.fillStyle = `rgba(255,255,255,${.6 + hash(i, 6) * .4})`; ell(c, x, y, r, r); c.fill(); }
    } else if (am === 'petal') {
      for (let i = 0; i < 22; i++) { const x = X0 + ((hash(i, 2) * W - t * 160 * (.5 + hash(i, 7))) % W + W) % W, y = ((hash(i, 3) * 260 + t * 22 + Math.sin(t * 2 + i) * 14) % 260); c.save(); c.translate(x, y); c.rotate(t * 3 + i); c.fillStyle = ['#FF9EC7', '#FFFFFF', '#FFE36B'][i % 3]; ell(c, 0, 0, 4, 2.2); c.fill(); c.restore(); }
      for (let i = 0; i < 3; i++) { const x = X0 + ((i * 300 + t * 40) % W), y = 150 + Math.sin(t * 2 + i) * 30, f = Math.abs(Math.sin(t * 14 + i)); c.save(); c.translate(x, y); c.fillStyle = ['#FFC21F', '#9B6BEF', '#3FA9F5'][i]; ell(c, -4, -2, 6 * f + 1, 5); c.fill(); ell(c, 4, -2, 6 * f + 1, 5); c.fill(); c.fillStyle = INK; ell(c, 0, 0, 1.4, 5); c.fill(); c.restore(); }
    } else if (am === 'firefly') {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 26; i++) { const x = X0 + ((hash(i, 2) * W - t * 30 * hash(i, 8)) % W + W) % W + Math.sin(t + i) * 10, y = 150 + hash(i, 3) * 230 + Math.cos(t * 1.3 + i) * 10, a = .3 + .7 * Math.max(0, Math.sin(t * 2.4 + i * 2)); const g = c.createRadialGradient(x, y, 0, x, y, 8); g.addColorStop(0, `rgba(255,240,150,${a})`); g.addColorStop(1, 'rgba(255,240,150,0)'); c.fillStyle = g; c.fillRect(x - 8, y - 8, 16, 16); }
      c.restore();
    } else if (am === 'spray') {
      for (let i = 0; i < 4; i++) { // martılar
        const x = X0 + ((hash(i, 2) * W + t * 50 * (1 + i * .2)) % W), y = 60 + hash(i, 3) * 80 + Math.sin(t * 2 + i) * 6, f = Math.sin(t * 8 + i) * 5;
        c.strokeStyle = INK; c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - 10, y - f); c.quadraticCurveTo(x - 5, y - 4, x, y); c.quadraticCurveTo(x + 5, y - 4, x + 10, y - f); c.stroke();
      }
    }
  }
  drawSpeedLines(c, W, H, t, k) {
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 34; i++) {
      const sp = 1500 + hash(i, 1) * 1200, len = 80 + hash(i, 2) * 200, y = 20 + hash(i, 3) * (H - 40);
      const x = W + 200 - ((t * sp + hash(i, 4) * 3000) % (W + 500));
      const edge = Math.abs(y - H * .55) / (H * .5);
      const g = c.createLinearGradient(x, 0, x + len, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(255,255,255,${.55 * k * (.4 + edge)})`);
      c.strokeStyle = g; c.lineWidth = 1.5 + hash(i, 5) * 2.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + len, y); c.stroke();
    }
    c.restore();
  }
}

// ================= HUD
function panel(c, x, y, w, h, r, fill) { rr(c, x - 2.5, y - 2.5, w + 5, h + 5, r + 2); c.fillStyle = INK; c.fill(); rr(c, x, y, w, h, r); c.fillStyle = fill; c.fill(); }
function hudRank(c, x, y, rank, total, popA, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const k = 1 + .45 * Math.exp(-popA * 6) * Math.sin(popA * 22);
  const cols = { 1: ['#FFF3A0', '#FFC21F', '#E8961A'], 2: ['#FFFFFF', '#C9D4E6', '#94A3BF'], 3: ['#FFD4A8', '#E09A5B', '#B56A30'], 4: ['#BFE3FF', '#3FA9F5', '#1F78C1'] }[rank];
  panel(c, 0, 0, 96, 64, 18, 'rgba(18,23,49,.72)');
  c.translate(36, 34); c.scale(k, k);
  c.font = `800 52px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineWidth = 9; c.strokeStyle = INK; c.lineJoin = 'round'; c.strokeText(rank + '.', 0, 3);
  c.fillStyle = lin(c, 0, -22, 0, 22, cols); c.fillText(rank + '.', 0, 3);
  c.restore();
  c.save(); c.translate(x, y); c.scale(s, s);
  c.font = `800 18px ${FONT}`; c.textAlign = 'left'; c.fillStyle = '#AEB8E6'; c.fillText('/' + total, 66, 44);
  c.restore();
}
function roundBtn(c, x, y, r, pressed, draw, glow) {
  const p = pressed ? 1 : 0;
  c.save(); c.translate(x, y + p * 3);
  if (glow) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(0, 0, r * .6, 0, 0, r * 1.6); g.addColorStop(0, `rgba(255,226,107,${.35 * glow})`); g.addColorStop(1, 'rgba(255,226,107,0)'); c.fillStyle = g; c.fillRect(-r * 2, -r * 2, r * 4, r * 4); c.restore(); }
  ell(c, 0, 4 - p * 3, r + 2.5, r + 2.5); c.fillStyle = 'rgba(10,12,30,.5)'; c.fill();
  ell(c, 0, 0, r + 2.5, r + 2.5); c.fillStyle = INK; c.fill();
  ell(c, 0, 0, r, r); c.fillStyle = pressed ? 'rgba(255,226,107,.95)' : 'rgba(255,255,255,.82)'; c.fill();
  c.fillStyle = 'rgba(255,255,255,.6)'; ell(c, -r * .3, -r * .45, r * .45, r * .2, -.3); c.fill();
  draw(c); c.restore();
}
const arrow = dir => c => { c.fillStyle = INK; c.beginPath(); c.moveTo(-9, 5 * dir); c.lineTo(9, 5 * dir); c.lineTo(0, -7 * dir); c.closePath(); c.lineJoin = 'round'; c.lineWidth = 4; c.strokeStyle = INK; c.stroke(); c.fill(); };

/* ================= Sayı Bahçesi kaydı =================
   Yarış Sayı Bahçesi'nin içinde (yaris/). Bilet, altın, seviye ve ses ayarı Sayı Bahçesi'nin kaydından okunur;
   aynı site olduğu için localStorage ortak. Her yarış bir bilet harcar. Garaj seçimleri d.race altında tutulur. */
const Wallet = {
  key: 'sayi-bahcesi.v1',
  read() { try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch (e) { return {}; } },
  write(d) { try { localStorage.setItem(this.key, JSON.stringify(d)); } catch (e) {} },
  get tickets() { return this.read().tickets || 0; },
  get coins() { return this.read().coins || 0; },
  get level() { return clamp(this.read().level | 0 || 1, 1, 3); },
  get sound() { return this.read().sound !== false; },
  useTicket() { const d = this.read(); if (!(d.tickets > 0)) return false; d.tickets--; this.write(d); return true; },
  addCoins(n) { const d = this.read(); d.coins = (d.coins || 0) + n; this.write(d); },
  spend(n) { const d = this.read(); if ((d.coins || 0) < n) return false; d.coins -= n; this.write(d); return true; },
  race() {
    const r = this.read().race || {};
    return {
      owned: Array.isArray(r.owned) ? r.owned : [],
      car: { P1: Object.assign({ paint: '#FFC21F', wheel: 'star' }, r.car && r.car.P1), P2: Object.assign({ paint: '#E5483B', wheel: 'classic' }, r.car && r.car.P2) },
      theme: THEMES[r.theme] ? r.theme : 'meadow',
      who: r.who === 'P2' ? 'P2' : 'P1',
    };
  },
  saveRace(r) { const d = this.read(); d.race = r; this.write(d); },
};

/* ================= garaj kataloğu (yalnızca görünüş) ================= */
const PAINTS = [
  { id: '#FFC21F', name: 'Güneş', price: 0 }, { id: '#E5483B', name: 'Domates', price: 0 },
  { id: '#3FA9F5', name: 'Gökyüzü', price: 5 }, { id: '#34C17B', name: 'Nane', price: 6 },
  { id: '#9B6BEF', name: 'Üzüm', price: 8 }, { id: '#FF7AB6', name: 'Pembiş', price: 8 },
  { id: '#F5A524', name: 'Portakal', price: 6 }, { id: '#2B3550', name: 'Gece', price: 10 },
];
const WHEELS = [{ id: 'classic', name: 'Klasik', price: 0 }, { id: 'star', name: 'Yıldız', price: 0 }, { id: 'flame', name: 'Alev', price: 7 }];
const owns = (r, kind, id) => { const it = (kind === 'paint' ? PAINTS : WHEELS).find(x => x.id === id); return !!it && (it.price === 0 || r.owned.includes(kind + ':' + id)); };

const BASE = {
  P1: { char: 'penguin', team: '#2F7DE1', num: 7, name: 'Penguen' },
  P2: { char: 'cat', team: '#FFC21F', num: 3, name: 'Kedi' },
  C1: { char: 'penguin', color: '#34C17B', team: '#E5483B', num: 5, name: 'Yeşil' },
  C2: { char: 'cat', color: '#9B6BEF', team: '#34C17B', num: 9, wheel: 'flame', name: 'Mor' },
  C3: { char: 'penguin', color: '#3FA9F5', team: '#FF7AB6', num: 2, name: 'Mavi' },
  C4: { char: 'cat', color: '#F5A524', team: '#3FA9F5', num: 4, name: 'Turuncu' },
};
function specFor(key) {
  const b = Object.assign({}, BASE[key]);
  if (key === 'P1' || key === 'P2') {
    const r = Wallet.race(), car = r.car[key];
    b.color = owns(r, 'paint', car.paint) ? car.paint : (key === 'P1' ? '#FFC21F' : '#E5483B');
    b.wheel = owns(r, 'wheel', car.wheel) ? car.wheel : 'classic';
    if (b.wheel === 'classic') b.wheel = null;
    b.rim = b.wheel === 'star' ? '#FFF3C4' : b.wheel === 'flame' ? '#FFD9C2' : null;
    if (b.color === b.team) b.team = key === 'P1' ? '#E5483B' : '#2F7DE1';
  }
  return b;
}
// bilgisayar rakipler oyuncuların rengini almasın
function cpuKeys(taken) {
  return ['C1', 'C2', 'C3', 'C4'].filter(k => !taken.includes(BASE[k].color)).slice(0, 3);
}

/* ================= sayı kapısı soruları (Sayı Bahçesi seviyesine göre) ================= */
function gateQuestion(k, seed, lv) {
  let n = 0; const R = (a, b) => a + Math.floor(hash(k * 7 + n++, seed + 3) * (b - a + 1));
  let a, b, sub = hash(k, seed + 11) < .4, ans, q;
  if (!sub) {
    if (lv === 1) { a = R(1, 4); b = R(1, 5 - a); }
    else if (lv === 2) { a = R(1, 9); b = R(1, 10 - a); }
    else { a = R(2, 9); b = R(2, 9); if (a + b <= 10) a = Math.min(9, a + 4); }
    ans = a + b; q = `${a} + ${b}`;
  } else {
    if (lv === 1) { a = R(2, 5); b = R(1, a); }
    else if (lv === 2) { a = R(3, 10); b = R(1, a); }
    else { a = R(11, 18); b = R(a - 9, 9); }
    ans = a - b; q = `${a} − ${b}`;
  }
  const opts = [ans - 1, ans + 1, ans - 2, ans + 2].filter(x => x >= 0);
  const w1 = opts[Math.floor(hash(k, seed + 5) * 2)], rest = opts.filter(x => x !== w1), w2 = rest[Math.floor(hash(k, seed + 6) * rest.length)];
  const correct = Math.floor(hash(k, seed + 4) * 3), wrong = [w1, w2];
  return { q, answer: ans, correct, nums: [0, 1, 2].map(i => i === correct ? ans : wrong.shift()) };
}

/* ================= ses ================= */
let sfx = null;
function beep(f, d = .1, type = 'square', vol = .06) {
  if (!SOUND) return;
  try {
    sfx = sfx || new (window.AudioContext || window.webkitAudioContext)();
    if (sfx.state === 'suspended') sfx.resume();
    const o = sfx.createOscillator(), g = sfx.createGain(), n = sfx.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, n);
    g.gain.setValueAtTime(vol, n); g.gain.exponentialRampToValueAtTime(.0001, n + d);
    o.connect(g); g.connect(sfx.destination); o.start(n); o.stop(n + d + .02);
  } catch (e) { /* ses yok */ }
}
let SOUND = Wallet.sound;
const fmt = s => s.toFixed(1).replace('.', ',');

/* ================= yarış =================
   mode: 'single' (1 oyuncu + 3 bilgisayar), 'duo' (2 oyuncu aynı ekranda + 2 bilgisayar),
         'solo' (sırayla: tek araba, ikinci turda önceki turun hayaleti), 'demo' (menü arka planı) */
const LEN = { single: 20000, duo: 20000, solo: 15000, demo: 14000 };
class Game {
  constructor(o) {
    this.mode = o.mode; this.theme = o.theme || 'meadow'; this.onEnd = o.onEnd; this.sound = o.mode !== 'demo';
    this.len = LEN[o.mode]; this.lv = o.lv || 1;
    const s = this.s = new Scene(this.theme);
    s.anchor = 432; this.cache = new Map(); this.seed = o.seed || 1;
    s.gen = k => this.gen(k);
    s.objs = [{ type: 'finish', key: 'start', wx: 70, label: 'BAŞLA' }, { type: 'finish', key: 'fin', wx: this.len, label: 'BİTİŞ' }];
    s.onEvent = (type, r, ob, ln) => this.onEvent(type, r, ob, ln);
    this.t = o.mode === 'demo' ? 0 : -3; this.camS = 0; this.z = 1; this.projs = []; this.press = {}; this.done = false; this.endAt = null;
    const mk = (spec, x) => Object.assign({}, spec, { wx: 0, lane: 1, laneT: 1, spd: 0, base: 440, item: null, roll: null, itemHold: 0, slowT: 0, shieldT: 0 }, x);
    if (o.mode === 'solo') {
      this.me = mk(specFor(o.who), { human: true, side: 0 });
      this.racers = [this.me]; this.players = [this.me]; this.rec = [];
      if (o.ghost) { this.ghostRec = o.ghost.rec; this.ghost = mk(specFor(o.ghost.who), { ghost: true }); this.racers.unshift(this.ghost); }
    } else if (o.mode === 'single') {
      this.me = mk(specFor(o.who), { human: true, side: 0, lane: 1, laneT: 1, wx: -80 });
      const cs = cpuKeys([this.me.color, specFor(o.who === 'P1' ? 'P2' : 'P1').color]);
      const other = mk(specFor(o.who === 'P1' ? 'P2' : 'P1'), { ai: true, cpu: true, lane: 0, laneT: 0, wx: 80 });
      const c1 = mk(BASE[cs[0]], { ai: true, cpu: true, lane: 2, laneT: 2, wx: 80 });
      const c2 = mk(BASE[cs[1]], { ai: true, cpu: true, lane: 0, laneT: 0, wx: -80 });
      if (other.color === this.me.color) Object.assign(other, BASE[cs[2] || 'C4']);
      this.racers = [this.me, other, c1, c2]; this.players = [this.me];
    } else {
      const ai = o.mode === 'demo';
      const p1 = mk(specFor('P1'), { human: !ai, ai, side: 0, lane: 0, laneT: 0, base: ai ? 455 : 440 });
      const p2 = mk(specFor('P2'), { human: !ai, ai, side: 1, lane: 2, laneT: 2, base: ai ? 372 : 440 });
      if (p2.color === p1.color) p2.color = p1.color === '#E5483B' ? '#FFC21F' : '#E5483B';
      const cs = cpuKeys([p1.color, p2.color]);
      const c1 = mk(BASE[cs[0]], { ai: true, cpu: true, lane: 1, laneT: 1, wx: -100 });
      const c2 = mk(BASE[cs[1]], { ai: true, cpu: true, lane: 1, laneT: 1, wx: 100 });
      this.racers = [p1, p2, c1, c2]; this.players = [p1, p2];
    }
    s.racers = this.racers;
    this.sync(1 / 60);
  }
  gen(k) {
    if (this.cache.has(k)) return this.cache.get(k);
    let ob = null; const wx = k * 640 + hash(k, 3 + this.seed) * 160, h = hash(k + this.seed * 17, 7), ln = Math.floor(hash(k + this.seed * 5, 5) * 3);
    if (wx > 900 && wx < this.len - 500) {
      if (k % 5 === 2) ob = Object.assign({ type: 'gate', key: 'g' + k, wx, solved: false, flashT: [0, 0, 0] }, gateQuestion(k, this.seed, this.lv));
      else if (h < .32) ob = { type: 'box', key: 'k' + k, wx };
      else if (h < .52) ob = { type: 'ramp', key: 'r' + k, wx, lane: ln, h: 52, len: 240 };
      else if (h < .72) ob = { type: 'boost', key: 'b' + k, wx, lane: ln };
      else if (h < .88) ob = { type: 'puddle', key: 'p' + k, wx, lane: ln, hits: new Set() };
    }
    this.cache.set(k, ob); return ob;
  }
  rankOf(r) { return 1 + this.racers.filter(x => !x.ghost && x !== r && (x.finishT != null ? (r.finishT == null || x.finishT < r.finishT) : (r.finishT == null && x.wx > r.wx))).length; }
  pickItem(r) {
    if (this.mode === 'solo') return 'rocket';
    const rk = this.rankOf(r);
    const pool = rk === 1 ? ['snowball', 'balloon', 'umbrella', 'balloon'] : rk >= 3 ? ['rocket', 'rocket', 'snowball', 'umbrella'] : ['snowball', 'balloon', 'rocket', 'umbrella'];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  onEvent(type, r, ob, ln) {
    const s = this.s;
    if (type === 'box') { if (!r.item && r.roll == null) { r.roll = 0; r.pending = this.pickItem(r); if (r.human && this.sound) beep(660, .06); } }
    if (type === 'gate') {
      if (ln === ob.correct) {
        ob.solved = true; r.turboT = 1.6;
        if (r.human) {
          r.gates = (r.gates || 0) + 1;
          s.pop('DOĞRU!', r.wx + 110, laneY(r.lane) - 110, { col: '#4CFF9A', size: 34, sub: 'TURBO', life: 1.2 });
          s.burst(ob.wx + 30, laneY(ln) - 50, 18, 'confetti', ['#FFC21F', '#E5483B', '#3FA9F5', '#34C17B', '#FF9EC7'], 230);
          s.flash = .35; if (this.sound) { beep(784, .09); setTimeout(() => beep(1046, .14), 90); }
        }
      } else if (r.human) s.pop(ob.q + ' = ' + ob.answer, r.wx + 90, laneY(r.lane) - 100, { col: '#FFFFFF', size: 22, burst: false, life: 1.6 });
    }
    if (type === 'boost' && r.human) s.pop('HIZ!', r.wx + 70, laneY(r.lane) - 80, { col: '#7CFFB6', size: 22, life: .8, burst: false });
    if (type === 'land' && r.human) s.cam.shake = Math.max(s.cam.shake, .2);
  }
  useItem(r) {
    const it = r.item; if (!it) return; r.item = null; r.itemHold = 0; const s = this.s;
    if (it === 'rocket') { r.turboT = 2.2; s.pop('ROKET!', r.wx + 80, laneY(r.lane) - 90, { col: '#FF9A4D', size: 28, life: .9 }); if (this.sound && r.human) beep(220, .3, 'sawtooth', .05); }
    else if (it === 'umbrella') { r.shieldT = 5; if (this.sound && r.human) beep(523, .12, 'triangle'); }
    else if (it === 'balloon') {
      const p = { type: 'puddle', key: 'u' + Math.random(), wx: r.wx - 100, lane: Math.round(r.laneT), owner: r, t0: this.t, hits: new Set() };
      s.objs.push(p); s.burst(p.wx, laneY(p.lane) - 6, 10, 'snowbit', ['#7FD3FF'], 120);
      if (this.sound && r.human) beep(330, .12, 'triangle');
    } else if (it === 'snowball') {
      let tgt = null, best = 1e9;
      for (const x of this.racers) if (x !== r && !x.ghost && x.wx > r.wx + 30 && x.wx - r.wx < 900 && x.wx - r.wx < best) { best = x.wx - r.wx; tgt = x; }
      if (!tgt) for (const x of this.racers) if (x !== r && !x.ghost && r.wx - x.wx > 30 && r.wx - x.wx < 600 && r.wx - x.wx < best) { best = r.wx - x.wx; tgt = x; }
      this.projs.push({ from: r, to: tgt, u: 0, x0: r.wx, wx: r.wx, y: laneY(r.lane) - 50, dir: tgt && tgt.wx < r.wx ? -1 : 1 });
      r.leanX = .25; if (this.sound && r.human) beep(440, .08, 'triangle');
    }
  }
  hit(x) {
    const s = this.s;
    if (x.shieldT > 0) { x.shieldT = 0; s.pop('SEKTİ!', x.wx, laneY(x.lane) - 90, { col: '#FFE36B', size: 26, life: .9 }); s.addP({ type: 'ring', x: x.wx, y: laneY(x.lane) - 30, life: .5, size: 20, col: '#FFFFFF' }); return; }
    x.spinT = .8; x.spinDur = .8; x.hitT = 1.4; x.slowT = 1.1; x.hopV = -260;
    const y = laneY(x.lane) - 44 * laneS(x.lane);
    for (let i = 0; i < 16; i++) { const a = Math.random() * TAU, sp = 120 + Math.random() * 200; s.addP({ type: 'snow', x: x.wx, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, g: 600, life: .8, size: 3 + Math.random() * 4 }); }
    s.pop('PAT!', x.wx + 10, y - 50, { col: '#7FD3FF', size: 36, life: 1 });
    s.cam.shake = Math.max(s.cam.shake, .45);
    if (this.sound) beep(110, .18, 'sawtooth', .07);
  }
  ai(r, dt) {
    r.aiT = (r.aiT == null ? Math.random() * 2 : r.aiT) - dt;
    let decided = false;
    for (const ob of this.s.objectsInView().concat(this.s.objs)) {
      if (!ob) continue;
      const d = ob.wx - r.wx;
      if (ob.type === 'gate' && d > 120 && d < 650 && r.gk !== ob.key) { r.gk = ob.key; r.laneT = Math.random() < .6 ? ob.correct : Math.floor(Math.random() * 3); decided = true; }
      if (ob.type === 'puddle' && ob.lane === r.laneT && d > 40 && d < 260 && ob.owner !== r) { r.laneT = r.laneT === 1 ? (Math.random() < .5 ? 0 : 2) : 1; decided = true; }
    }
    if (!decided && r.aiT < 0) { r.aiT = 1.6 + Math.random() * 2.4; r.laneT = clamp(r.laneT + (Math.random() < .5 ? -1 : 1), 0, 2); }
    if (r.item && r.itemHold > 1 + (r.num % 3) * .5) this.useItem(r);
    if (r.cpu) { // lastik bant: bilgisayarlar oyuncuların yakınında kalsın
      const mid = this.players.reduce((n, p) => n + p.wx, 0) / this.players.length;
      r.base = r.wx > mid + 350 ? 385 : r.wx < mid - 350 ? 520 : 435;
    }
  }
  input(side, act) {
    if (this.t < -0.2 || this.done) return;
    const r = this.mode === 'duo' ? this.players[side] : this.me; if (!r || !r.human || r.finishT != null) return;
    this.press[side + act] = this.t;
    if (act === 'up') r.laneT = Math.max(0, r.laneT - 1);
    else if (act === 'down') r.laneT = Math.min(2, r.laneT + 1);
    else if (act === 'item') this.useItem(r);
  }
  step(dt) {
    if (dt <= 0) return;
    const s = this.s, prevT = this.t;
    this.t += dt;
    if (this.sound && prevT < 0 && Math.ceil(-prevT) !== Math.ceil(-this.t)) beep(this.t >= 0 ? 880 : 440, this.t >= 0 ? .3 : .12);
    const go = this.t >= 0;
    for (const r of this.racers) {
      if (r.ghost) continue;
      if (r.ai && go && r.finishT == null) this.ai(r, dt);
      r.lane += clamp(r.laneT - r.lane, -dt * 7, dt * 7);
      r.slowT = Math.max(0, r.slowT - dt); r.shieldT = Math.max(0, r.shieldT - dt);
      r.leanX = (r.leanX || 0) * Math.exp(-dt * 6);
      if (r.roll != null) { r.roll += dt; if (r.roll > .9) { r.roll = null; r.item = r.pending; if (r.human && this.sound) beep(990, .08); } }
      if (r.item) r.itemHold += dt;
      let tgt = go ? r.base + (r.turboT > 0 ? 320 : 0) - (r.slowT > 0 ? 230 : 0) : 0;
      if (r.finishT != null) tgt = 300;
      r.spd = lerp(r.spd, tgt, 1 - Math.exp(-dt * (tgt > r.spd ? 2.4 : 5)));
      r.wx += r.spd * dt;
      for (const ob of s.objs.concat([...this.cache.values()])) { // su birikintisi
        if (!ob || ob.type !== 'puddle' || ob.lane !== Math.round(r.lane) || Math.abs(r.wx - ob.wx) > 38 || (r.jump || 0) > 8) continue;
        if (ob.owner === r && this.t - ob.t0 < 1.5) continue;
        if (ob.hits.has(r)) continue; ob.hits.add(r);
        if (r.shieldT > 0) { r.shieldT = 0; continue; }
        r.slowT = Math.max(r.slowT, .8); r.wobble = 1; r.spinT = .5; r.spinDur = .5;
        if (r.human) { s.pop('ŞLAP!', r.wx, laneY(r.lane) - 80, { col: '#7FD3FF', size: 26, life: .8 }); if (this.sound) beep(180, .12, 'triangle'); }
      }
      if (r.finishT == null && r.wx >= this.len) {
        r.finishT = this.t;
        if (r.human) { s.burst(r.wx, laneY(r.lane) - 60, 30, 'confetti', ['#FFC21F', '#E5483B', '#3FA9F5', '#34C17B', '#FF9EC7'], 260); if (this.sound) beep(1046, .25, 'triangle'); }
      }
    }
    // aynı şeritte çarpışma: arkadaki öndekinin arkasında kalır
    const live = this.racers.filter(r => !r.ghost);
    for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
      const a = live[i], b = live[j];
      if (Math.abs(a.lane - b.lane) > .55 || Math.abs((a.jump || 0) - (b.jump || 0)) > 20) continue;
      const d = a.wx - b.wx; if (Math.abs(d) >= 96) continue;
      const [front, back] = d > 0 || (d === 0 && j > i) ? [a, b] : [b, a];
      back.wx = front.wx - 96; back.spd = Math.min(back.spd, front.spd * .92);
      if (!back.bumpT || this.t - back.bumpT > .6) { back.bumpT = this.t; back.hopV = -140; s.addP({ type: 'star', x: front.wx - 50, y: laneY(front.lane) - 20, vx: -40, vy: -120, g: 400, life: .5, size: 8, col: '#FFE36B', rot: 0, vr: 6 }); if (this.sound && (a.human || b.human)) beep(150, .06, 'square', .04); }
    }
    // hayalet: önceki turun kaydını oynatır
    if (this.ghost && this.ghostRec) {
      const rec = this.ghostRec, tt = Math.max(0, this.t);
      let i = this.gi || 0; while (i < rec.length - 2 && rec[i + 1][0] < tt) i++; this.gi = i;
      const a = rec[i], b = rec[Math.min(i + 1, rec.length - 1)], u = b[0] > a[0] ? clamp((tt - a[0]) / (b[0] - a[0]), 0, 1) : 0;
      this.ghost.wx = this.t < 0 ? 0 : (i >= rec.length - 2 && tt > b[0] ? b[1] + (tt - b[0]) * 300 : lerp(a[1], b[1], u));
      this.ghost.lane = lerp(a[2], b[2], u); this.ghost.laneT = Math.round(this.ghost.lane);
    }
    // kartopları
    for (const p of this.projs) {
      p.u += dt / .55;
      const tx = p.to ? p.to.wx - 14 * p.dir : p.x0 + 520, y0 = laneY(p.from.lane) - 50 * laneS(p.from.lane), y1 = p.to ? laneY(p.to.lane) - 42 * laneS(p.to.lane) : y0;
      p.wx = lerp(p.from.wx + 40 * p.dir, tx, p.u); p.y = lerp(y0, y1, p.u) - Math.sin(Math.PI * clamp(p.u, 0, 1)) * 48;
      if (Math.random() < .6) s.addP({ type: 'smoke', x: p.wx, y: p.y, vx: -20, vy: 0, life: .3, size: 3, grow: 4, col: 'rgba(255,255,255,', a0: .8 });
      if (p.u >= 1) { p.dead = true; if (p.to) this.hit(p.to); else s.burst(p.wx, laneY(p.from.lane) - 10, 8, 'snow', ['#fff'], 120); }
    }
    this.projs = this.projs.filter(p => !p.dead);
    s.proj = this.projs.map(p => ({ wx: p.wx, y: p.y, s: 1 }));
    // kamera: tek araba izlenir; iki oyuncuda ikisinin ortası, açıldıkça uzaklaşır
    if (this.mode === 'duo' || this.mode === 'demo') {
      const [a, b] = this.players, spread = Math.abs(a.wx - b.wx);
      this.camT = (a.wx + b.wx) / 2 + 40; this.zT = clamp(1 - (spread - 260) / 1400, .76, 1);
    } else { this.camT = this.me.wx + 102; this.zT = 1; }
    this.z = lerp(this.z, this.zT, 1 - Math.exp(-dt * 3));
    this.camS = this.t < 0 ? this.camT : lerp(this.camS, this.camT, 1 - Math.exp(-dt * 5));
    // geride kalan ekrandan düşmez: öndekinin yanına ışınlanır
    if ((this.mode === 'duo' || this.mode === 'demo') && go) {
      const half = 432 / this.z;
      for (const p of this.players) {
        const lead = this.players.find(x => x !== p);
        if (this.camS - p.wx > half - 70 && p.finishT == null) {
          p.wx = lead.wx - 210; p.slowT = Math.max(p.slowT, .6); p.skipEvt = true; p.pdx = null;
          s.addP({ type: 'ring', x: p.wx, y: laneY(p.lane) - 30, life: .6, size: 16, col: '#FFFFFF' });
          s.burst(p.wx, laneY(p.lane) - 30, 14, 'star', [p.color, '#FFFFFF'], 200);
          s.pop('YETİŞ!', p.wx + 20, laneY(p.lane) - 100, { col: p.color, size: 30, life: 1.1 });
          if (this.sound) { beep(523, .08, 'triangle'); setTimeout(() => beep(784, .1, 'triangle'), 70); }
        }
      }
    }
    if (this.mode === 'solo' && go && this.me.finishT == null) this.rec.push([+this.t.toFixed(3), Math.round(this.me.wx), +this.me.lane.toFixed(2)]);
    this.sync(dt);
    for (const r of this.racers) r.skipEvt = false;
    if (!this.done) {
      const ps = this.players, all = ps.every(p => p.finishT != null), first = ps.find(p => p.finishT != null);
      if (all || (first && this.t - first.finishT > 8)) {
        if (this.endAt == null) this.endAt = this.t + 1.3;
        if (this.t >= this.endAt) { this.done = true; this.onEnd && this.onEnd(this.result()); }
      }
    }
  }
  sync(dt) {
    const s = this.s;
    s.v = (this.camS - s.S) / dt;
    for (const r of this.racers) r.dx = r.wx - this.camS;
    s.cam.z = this.z; s.cam.fx = 432; s.cam.fy = 300;
    s.update(dt);
    s.S = this.camS;
  }
  result() {
    const list = this.racers.filter(r => !r.ghost).map(r => ({ r, time: r.finishT })).sort((a, b) => (a.time ?? 1e9) - (b.time ?? 1e9) || b.r.wx - a.r.wx);
    return { mode: this.mode, list, rec: this.rec, me: this.me, players: this.players };
  }
  ghostTimeAt(x) {
    const rec = this.ghostRec; if (!rec || !rec.length || x < rec[0][1]) return null;
    let lo = 0, hi = rec.length - 1; if (x > rec[hi][1]) return null;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (rec[m][1] < x) lo = m; else hi = m; }
    const a = rec[lo], b = rec[hi]; return lerp(a[0], b[0], b[1] > a[1] ? (x - a[1]) / (b[1] - a[1]) : 0);
  }
  draw(c, W, Hh) {
    const s = this.s, t = s.t;
    const lines = Math.max(...this.players.map(p => p.turbo || 0)) * .9;
    s.render(c, W, Hh, { lines });
    if (this.mode === 'demo') return;
    const pressed = (side, act) => this.t - (this.press[side + act] ?? -9) < .15;
    if (this.mode === 'duo') {
      const zone = (side, p) => {
        const x0 = side ? W - 124 : 0, cx = side ? W - 62 : 62;
        c.save(); const g = c.createLinearGradient(side ? W : 0, 0, side ? W - 124 : 124, 0); g.addColorStop(0, rgba(p.color, .3)); g.addColorStop(1, rgba(p.color, 0)); c.fillStyle = g; c.fillRect(x0, 0, 124, Hh); c.restore();
        c.fillStyle = rgba(p.color, .9); c.fillRect(side ? W - 5 : 0, 0, 5, Hh);
        hudRank(c, side ? W - 74 : 12, 10, this.rankOf(p), 4, 9, .62);
        roundBtn(c, cx, 134, 29, pressed(side, 'up'), arrow(1));
        this.itemBtn(c, cx, 226, 36, p, pressed(side, 'item'), t);
        roundBtn(c, cx, 318, 29, pressed(side, 'down'), arrow(-1));
      };
      zone(0, this.players[0]); zone(1, this.players[1]);
      for (const p of this.players) { // kimin arabası
        const sx = (s.sx(p.wx) - 432) * this.z + 432, sy = (laneY(p.lane) - (p.jump || 0) * laneS(p.lane) - 72 * laneS(p.lane) - 300) * this.z + 300 + Math.sin(t * 5 + p.side) * 2;
        if (sx < 120 || sx > W - 120) continue;
        c.fillStyle = INK; c.beginPath(); c.moveTo(sx - 7, sy); c.lineTo(sx + 7, sy); c.lineTo(sx, sy + 8); c.closePath(); c.fill();
        panel(c, sx - 19, sy - 20, 38, 18, 7, p.color); c.font = `800 12px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = p.color === '#2B3550' ? '#FFFFFF' : INK; c.fillText(p.side ? '2P' : '1P', sx, sy - 10);
      }
      this.timer(c, W / 2, 58);
    } else {
      const me = this.me;
      roundBtn(c, 56, 250, 30, pressed(0, 'up'), arrow(1));
      roundBtn(c, 56, 336, 30, pressed(0, 'down'), arrow(-1));
      this.itemBtn(c, W - 70, 316, 40, me, pressed(0, 'item'), t);
      if (this.mode === 'single') { hudRank(c, 12, 10, this.rankOf(me), 4, 9, .8); this.timer(c, W / 2, 58); }
      else {
        panel(c, 14, 14, 150, 50, 16, 'rgba(18,23,49,.72)');
        c.font = `800 14px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = '#AEB8E6'; c.fillText(me.name.toUpperCase(), 28, 30);
        c.font = `800 22px ${FONT}`; c.fillStyle = '#FFFFFF'; c.fillText(fmt(Math.max(0, me.finishT ?? this.t)) + ' sn', 28, 50);
        if (this.ghost) {
          const gt = this.ghostTimeAt(me.wx);
          if (gt != null && this.t > .5) {
            const d = (me.finishT ?? this.t) - gt, ahead = d < 0, gn = this.ghost.name;
            panel(c, 14, 74, 170, 50, 16, ahead ? 'rgba(33,168,94,.9)' : 'rgba(229,72,59,.9)');
            c.font = `800 13px ${FONT}`; c.fillStyle = '#FFFFFF'; c.fillText(ahead ? gn + 'den önde' : gn + 'den geride', 28, 90);
            c.font = `800 22px ${FONT}`; c.fillText((ahead ? '−' : '+') + fmt(Math.abs(d)) + ' sn', 28, 110);
          }
        }
      }
    }
    this.bar(c, W / 2, 26, 300);
    // soru şeridi: kapı ekrana girmeden önce sorulur
    const gate = s.objectsInView().find(o => { if (!o || o.type !== 'gate') return false; const gx = (s.sx(o.wx) - 432) * this.z + 432; return gx > W - 40 && o.wx - this.camS < 1200; });
    if (gate && this.t > 0) {
      c.save(); c.translate(W / 2, 96);
      const txt = gate.q + ' = ?'; c.font = `800 26px ${FONT}`; const w = c.measureText(txt).width + 44;
      rr(c, -w / 2 - 3, -22, w + 6, 44, 12); c.fillStyle = INK; c.fill(); rr(c, -w / 2, -19, w, 38, 10); c.fillStyle = '#E5483B'; c.fill();
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 5; c.strokeStyle = INK; c.strokeText(txt, 0, 2); c.fillStyle = '#FFFFFF'; c.fillText(txt, 0, 2);
      c.restore();
    }
    if (this.t < .8) { // geri sayım
      const n = this.t < 0 ? String(Math.ceil(-this.t)) : 'BAŞLA!', ph = this.t < 0 ? 1 - ((-this.t) % 1) : this.t / .8;
      c.save(); c.translate(W / 2, Hh / 2 - 10); const sc = (this.t < 0 ? 1.6 - .5 * sstep(ph * 3) : 1 + ph * .3); c.scale(sc, sc); c.globalAlpha = this.t < 0 ? 1 : 1 - ph;
      c.font = `800 ${this.t < 0 ? 84 : 60}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 14; c.strokeStyle = INK; c.lineJoin = 'round'; c.strokeText(n, 0, 0);
      c.fillStyle = lin(c, 0, -40, 0, 40, ['#FFF3A0', '#FFC21F', '#E8961A']); c.fillText(n, 0, 0);
      c.restore();
    }
  }
  timer(c, x, y) { c.font = `800 15px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = INK; const tx = fmt(Math.max(0, this.t)) + ' sn'; c.strokeText(tx, x, y); c.fillStyle = '#FFFFFF'; c.fillText(tx, x, y); }
  itemBtn(c, x, y, r, p, pressed, t) {
    const rolling = p.roll != null;
    roundBtn(c, x, y, r, pressed, c2 => {
      if (rolling) { const idx = Math.floor(p.roll * 14) % 4; c2.save(); c2.scale(r / 34, r / 34); itemIcon(c2, ['snowball', 'balloon', 'rocket', 'umbrella'][idx], t); c2.restore(); }
      else if (p.item) { c2.save(); c2.scale(r / 32, r / 32); itemIcon(c2, p.item, t); c2.restore(); }
      else { c2.font = `800 ${Math.round(r * .4)}px ${FONT}`; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillStyle = 'rgba(30,34,51,.4)'; c2.fillText('EŞYA', 0, 1); }
    }, p.item ? .6 + .4 * Math.sin(t * 8) : 0);
    if (p.shieldT > 0) { c.strokeStyle = `rgba(255,255,255,${.5 + .5 * Math.sin(t * 10)})`; c.lineWidth = 3; ell(c, x, y, r + 7, r + 7); c.stroke(); }
  }
  bar(c, cx, y, w) {
    const x = cx - w / 2;
    panel(c, x - 12, y - 16, w + 24, 32, 14, 'rgba(18,23,49,.72)');
    rr(c, x + 4, y - 4, w - 30, 8, 4); c.fillStyle = 'rgba(255,255,255,.18)'; c.fill();
    const fx = x + w - 12;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { c.fillStyle = (i + j) % 2 ? INK : '#FFFFFF'; c.fillRect(fx - 7 + i * 5, y - 8 + j * 5, 5, 5); }
    const order = this.racers.slice().sort((a, b) => (a.human ? 1 : 0) - (b.human ? 1 : 0));
    for (const r of order) {
      const px = x + 4 + clamp(r.wx / this.len, 0, 1) * (w - 30), R = r.human ? 8 : 6;
      c.globalAlpha = r.ghost ? .55 : 1;
      ell(c, px, y, R + 2.4, R + 2.4); c.fillStyle = INK; c.fill(); ell(c, px, y, R, R); c.fillStyle = r.color; c.fill();
      c.globalAlpha = 1;
    }
  }
}

/* ================= garaj çizimi ================= */
function garageDraw(c, W, Hh, t, car, hornT) {
  c.fillStyle = lin(c, 0, 0, 0, Hh, ['#1A2250', '#2B3570', '#141A3C']); c.fillRect(0, 0, W, Hh);
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) { const x = W * (.2 + i * .3), g = c.createLinearGradient(x, 0, x, 300); g.addColorStop(0, 'rgba(160,190,255,.22)'); g.addColorStop(1, 'rgba(160,190,255,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x - 14, 0); c.lineTo(x + 14, 0); c.lineTo(x + 120, 300); c.lineTo(x - 120, 300); c.closePath(); c.fill(); }
  c.restore();
  for (let j = 0; j < 4; j++) for (let i = -1; i < W / 70 + 1; i++) { const x = i * 70 + (j % 2) * 35, y = 30 + j * 46; rr(c, x + 3, y, 64, 40, 8); c.fillStyle = 'rgba(255,255,255,.035)'; c.fill(); }
  const cx = W / 2, cy = 300;
  ell(c, cx, cy + 10, 230, 46); c.fillStyle = 'rgba(0,0,0,.35)'; c.fill();
  ell(c, cx, cy, 220, 42); c.fillStyle = INK; c.fill();
  ell(c, cx, cy - 4, 214, 38); c.fillStyle = lin(c, 0, cy - 40, 0, cy + 30, ['#4A5694', '#2A3166']); c.fill();
  c.save(); ell(c, cx, cy - 4, 214, 38); c.clip();
  for (let k = 0; k < 24; k++) { const a = t * .6 + k * TAU / 24, x = cx + Math.cos(a) * 200, y = cy - 4 + Math.sin(a) * 34; c.fillStyle = Math.sin(a) > 0 ? 'rgba(255,226,107,.85)' : 'rgba(255,226,107,.3)'; ell(c, x, y, 4, 2.2); c.fill(); }
  c.restore();
  const hornA = t - hornT, hop = hornA > 0 && hornA < .5 ? -Math.sin(hornA / .5 * Math.PI) * 26 : 0;
  const o = Object.assign({ t, wrot: t * 2.2, blur: 0, turbo: 0, lean: Math.sin(t * 1.4) * .04, bob: Math.sin(t * 3) * .8, speedK: .5, look: 1.4, hop: hornA > 0 && hornA < .6 ? -Math.abs(Math.sin(hornA * 20)) * 3 : 0 }, car);
  const sc = 2.35;
  c.save(); ell(c, cx, cy - 4, 214, 38); c.clip(); c.translate(cx, cy - 6); c.scale(sc, -sc * .4); c.globalAlpha = .14; carArt(c, o); c.restore();
  c.fillStyle = 'rgba(16,18,36,.45)'; ell(c, cx, cy - 4, 130 * (1 + hop / 200), 14); c.fill();
  c.save(); c.translate(cx, cy - 6 + hop); c.scale(sc, sc); carArt(c, o); c.restore();
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) { const ph = (t * .7 + i * .37) % 1, x = cx - 150 + hash(i, 1) * 300, y = cy - 160 + hash(i, 2) * 120, s = Math.sin(ph * Math.PI) * 10; c.fillStyle = `rgba(255,255,255,${Math.sin(ph * Math.PI) * .9})`; c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * .25, y); c.lineTo(x, y + s); c.lineTo(x - s * .25, y); c.closePath(); c.fill(); c.beginPath(); c.moveTo(x - s, y); c.lineTo(x, y + s * .25); c.lineTo(x + s, y); c.lineTo(x, y - s * .25); c.closePath(); c.fill(); }
  c.restore();
  if (hornA > 0 && hornA < 1.2) {
    const a = hornA, s = sstep(a * 6) * (1 + .2 * Math.sin(a * 18) * Math.exp(-a * 5)), al = 1 - sstep((a - .9) / .3);
    c.save(); c.globalAlpha = al; c.translate(cx + 150, cy - 210); c.scale(s, s); c.rotate(-.08);
    rr(c, -74, -30, 148, 58, 26); c.fillStyle = INK; c.fill(); c.beginPath(); c.moveTo(-40, 24); c.lineTo(-62, 46); c.lineTo(-18, 26); c.closePath(); c.fill();
    rr(c, -70, -26, 140, 50, 22); c.fillStyle = '#FFFFFF'; c.fill(); c.beginPath(); c.moveTo(-38, 22); c.lineTo(-55, 39); c.lineTo(-22, 22); c.closePath(); c.fill();
    c.font = `800 32px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = INK; c.fillText('Düt düt!', 0, 2);
    c.restore();
  }
}
function honk() {
  if (!SOUND) return;
  [0, .2].forEach(d => setTimeout(() => { beep(392, .15, 'square', .05); beep(494, .15, 'square', .05); }, d * 1000));
}

/* ================= ekranlar ================= */
const $ = id => document.getElementById(id);
const cv = $('game'), ctx = cv.getContext('2d');
const gcv = $('garageCv'), gctx = gcv.getContext('2d');
let screen = 'menu', game = null, demo = null, soloTurn = null, garageKey = 'P1', hornT = -9, clock = 0;
const W = 864, H = 400;

function newDemo() { const r = Wallet.race(); demo = new Game({ mode: 'demo', theme: r.theme, seed: 1 + Math.floor(Math.random() * 50) }); for (let i = 0; i < 40; i++) demo.step(1 / 30); }
function fitCanvas() {
  const wrap = $('wrap'), cs = getComputedStyle(wrap);
  const aw = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), ah = wrap.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const w = Math.max(1, Math.min(aw, ah * W / H)), h = w * H / W, dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
  if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
  const gw = gcv.clientWidth || 300, gh = gw * 400 / 640;
  if (gcv.width !== Math.round(gw * dpr)) { gcv.width = Math.round(gw * dpr); gcv.height = Math.round(gh * dpr); }
}
function show(id) {
  screen = id;
  for (const p of document.querySelectorAll('.panel')) p.hidden = p.id !== id;
  document.body.classList.toggle('playing', id === 'play');
  if (id === 'menu') renderMenu();
  if (id === 'garage') renderGarage();
}
function chips() { for (const e of document.querySelectorAll('.tickets')) e.textContent = '🎟️ ' + Wallet.tickets; for (const e of document.querySelectorAll('.coins')) e.textContent = '🪙 ' + Wallet.coins; }
function renderMenu() {
  chips();
  const r = Wallet.race();
  for (const b of document.querySelectorAll('[data-theme-pick]')) b.setAttribute('aria-pressed', String(b.dataset.themePick === r.theme));
  for (const b of document.querySelectorAll('[data-who]')) b.setAttribute('aria-pressed', String(b.dataset.who === r.who));
  $('noTicketNote').hidden = Wallet.tickets > 0;
  for (const b of document.querySelectorAll('[data-mode]')) b.classList.toggle('dim', !(Wallet.tickets > 0));
}
function setRace(fn) { const r = Wallet.race(); fn(r); Wallet.saveRace(r); }

function start(mode, opts = {}) {
  if (opts.turn !== 1) { // sırayla modunun ikinci turu aynı bilettir
    if (!Wallet.useTicket()) { show('noticket'); return; }
  }
  try { sfx = sfx || new (window.AudioContext || window.webkitAudioContext)(); sfx.resume(); } catch (e) {}
  const r = Wallet.race(), lv = Wallet.level;
  overlay('');
  if (mode === 'solo') {
    const seed = opts.turn === 1 ? soloTurn.seed : 1 + Math.floor(Math.random() * 50);
    const first = opts.turn === 1 ? soloTurn.first : r.who, who = opts.turn === 1 ? (first === 'P1' ? 'P2' : 'P1') : first;
    game = new Game({ mode, who, theme: r.theme, lv, seed, ghost: opts.turn === 1 ? { rec: soloTurn.rec, who: first } : null, onEnd: res => endSolo(res, opts.turn || 0) });
    if (opts.turn !== 1) soloTurn = { seed, first };
  } else game = new Game({ mode, who: r.who, theme: r.theme, lv, seed: 1 + Math.floor(Math.random() * 50), onEnd: endRace });
  show('play');
}
const REWARD_SINGLE = [5, 4, 3, 2];
function endRace(res) {
  let html;
  const rows = res.list.map((x, i) => `<li><span class="dot" style="background:${x.r.color}"></span><b>${i + 1}.</b> ${x.r.name}${x.r.human ? '' : ' <small>bilgisayar</small>'}<em>${x.time != null ? fmt(x.time) + ' sn' : '—'}</em></li>`).join('');
  if (res.mode === 'single') {
    const rank = res.list.findIndex(x => x.r === res.me) + 1, coins = REWARD_SINGLE[rank - 1];
    Wallet.addCoins(coins);
    html = `<h3>${rank === 1 ? 'Birinci oldun!' : rank + '. oldun'}</h3><ol class="res">${rows}</ol><p class="gain">+${coins} altın${res.me.gates ? ` · ${res.me.gates} doğru kapı` : ''}</p>`;
  } else {
    const pl = res.list.filter(x => x.r.human), tie = pl[0].time != null && pl[1].time != null && Math.abs(pl[0].time - pl[1].time) < .05;
    Wallet.addCoins(5);
    const acc = { Penguen: 'Pengueni', Kedi: 'Kediyi' };
    html = `<h3>${tie ? 'Berabere!' : pl[0].r.name + ' ' + acc[pl[1].r.name] + ' geçti!'}</h3><ol class="res">${rows}</ol><p class="gain">+5 altın</p>`;
  }
  overlay(`<div class="card">${html}<div class="btns"><button type="button" class="btn" data-act="again">Tekrar <small>🎟️ 1</small></button><button type="button" class="btn alt" data-act="menu">Menü</button></div></div>`);
  chips();
}
function endSolo(res, turn) {
  const me = res.me;
  if (turn === 0) {
    soloTurn.rec = res.rec; soloTurn.time = me.finishT; soloTurn.firstName = me.name;
    const next = soloTurn.first === 'P1' ? 'Kedi' : 'Penguen';
    overlay(`<div class="card"><h3>${me.name}: ${fmt(me.finishT)} sn</h3><p>Şimdi sıra ${next === 'Kedi' ? 'Kedide' : 'Penguende'}. Saydam araba ${me.name === 'Penguen' ? 'Penguenin' : 'Kedinin'} yarışı; onu geçmeye çalış.</p><div class="btns"><button type="button" class="btn" data-act="solo1">${next} başlasın</button></div></div>`);
  } else {
    const a = soloTurn.time, b = me.finishT, d = Math.abs(a - b);
    const win = d < .05 ? 'Berabere!' : (a < b ? soloTurn.firstName : me.name) + ' kazandı!';
    Wallet.addCoins(5);
    overlay(`<div class="card"><h3>${win}</h3><ol class="res"><li><span class="dot" style="background:${specFor(soloTurn.first).color}"></span>${soloTurn.firstName}<em>${fmt(a)} sn</em></li><li><span class="dot" style="background:${me.color}"></span>${me.name}<em>${fmt(b)} sn</em></li></ol><p>Fark: ${fmt(d)} saniye</p><p class="gain">+5 altın</p><div class="btns"><button type="button" class="btn" data-act="againSolo">Tekrar <small>🎟️ 1</small></button><button type="button" class="btn alt" data-act="menu">Menü</button></div></div>`);
    chips();
  }
}
function overlay(html) { $('ov').innerHTML = html; $('ov').hidden = !html; }
let lastMode = 'single';

/* ----- garaj ----- */
function renderGarage() {
  chips();
  const r = Wallet.race(), car = r.car[garageKey];
  for (const b of document.querySelectorAll('[data-gkey]')) b.setAttribute('aria-pressed', String(b.dataset.gkey === garageKey));
  const mk = (host, list, kind) => {
    const el = $(host); el.innerHTML = '';
    for (const it of list) {
      const b = document.createElement('button'); b.type = 'button';
      const own = owns(r, kind, it.id), on = car[kind] === it.id;
      if (kind === 'paint') { b.className = 'sw'; b.style.setProperty('--c', it.id); b.setAttribute('aria-label', it.name); b.innerHTML = own ? '' : `<span class="price">${it.price}</span>`; }
      else { b.className = 'opt'; b.innerHTML = it.name + (own ? '' : ` <span class="price">🪙 ${it.price}</span>`); }
      b.setAttribute('aria-pressed', String(on));
      b.onclick = () => pickGarage(kind, it);
      el.appendChild(b);
    }
  };
  mk('paints', PAINTS, 'paint'); mk('wheels', WHEELS, 'wheel');
  $('buy').hidden = true;
}
let pendingBuy = null;
function pickGarage(kind, it) {
  const r = Wallet.race();
  if (owns(r, kind, it.id)) { setRace(x => { x.car[garageKey][kind] = it.id; }); pendingBuy = null; beep(660, .05, 'triangle'); renderGarage(); return; }
  pendingBuy = { kind, it };
  renderGarage();
  const b = $('buy'), can = Wallet.coins >= it.price;
  b.hidden = false; b.disabled = !can;
  b.textContent = can ? `${it.name} al: 🪙 ${it.price}` : `${it.name}: 🪙 ${it.price} gerek (sende ${Wallet.coins})`;
}
function buy() {
  if (!pendingBuy) return;
  const { kind, it } = pendingBuy;
  if (!Wallet.spend(it.price)) return;
  setRace(x => { x.owned.push(kind + ':' + it.id); x.car[garageKey][kind] = it.id; });
  pendingBuy = null; beep(784, .08, 'triangle'); setTimeout(() => beep(1046, .12, 'triangle'), 80);
  renderGarage();
}
function garageCar() {
  const sp = specFor(garageKey), r = Wallet.race(), car = r.car[garageKey];
  if (pendingBuy) { if (pendingBuy.kind === 'paint') sp.color = pendingBuy.it.id; else { sp.wheel = pendingBuy.it.id === 'classic' ? null : pendingBuy.it.id; sp.rim = sp.wheel === 'star' ? '#FFF3C4' : sp.wheel === 'flame' ? '#FFD9C2' : null; } }
  if (sp.color === sp.team) sp.team = garageKey === 'P1' ? '#E5483B' : '#2F7DE1';
  return { color: sp.color, team: sp.team, char: sp.char, num: sp.num, wheel: sp.wheel, rim: sp.rim };
}

/* ----- giriş ----- */
function pointer(e) {
  if (screen !== 'play' || !game || !$('ov').hidden) return;
  e.preventDefault();
  const rc = cv.getBoundingClientRect(), x = (e.clientX - rc.left) / rc.width * W, y = (e.clientY - rc.top) / rc.height * H;
  if (game.mode === 'duo') {
    const side = x < 300 ? 0 : x > W - 300 ? 1 : -1; if (side < 0) return;
    game.input(side, y < 180 ? 'up' : y < 272 ? 'item' : 'down');
  } else if (x > W - 300 && y > 200) game.input(0, 'item');
  else game.input(0, y < 293 ? 'up' : 'down');
}
function key(e) {
  if (e.key === 'Escape') { if (screen === 'play') askQuit(); else if (screen !== 'menu') show('menu'); return; }
  if (screen !== 'play' || !game) return;
  const k = e.key.toLowerCase();
  if (game.mode === 'duo') {
    const m1 = { w: 'up', s: 'down', d: 'item' }, m2 = { arrowup: 'up', arrowdown: 'down', arrowleft: 'item', enter: 'item' };
    if (m1[k]) game.input(0, m1[k]); else if (m2[k]) game.input(1, m2[k]); else return;
  } else {
    const m = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', ' ': 'item', enter: 'item', d: 'item' };
    if (m[k]) game.input(0, m[k]); else return;
  }
  e.preventDefault();
}
function askQuit() {
  if (!game || game.done) { show('menu'); return; }
  overlay(`<div class="card"><h3>Yarıştan çıkılsın mı?</h3><p>Bu yarışın bileti geri gelmez.</p><div class="btns"><button type="button" class="btn" data-act="resume">Devam et</button><button type="button" class="btn alt" data-act="menu">Çık</button></div></div>`);
  game.paused = true;
}
function wire() {
  cv.addEventListener('pointerdown', pointer);
  addEventListener('keydown', key);
  addEventListener('resize', fitCanvas);
  $('back').onclick = () => { location.assign(new URL('../', location.href).href); };
  for (const b of document.querySelectorAll('[data-mode]')) b.onclick = () => { lastMode = b.dataset.mode; start(b.dataset.mode); };
  for (const b of document.querySelectorAll('[data-theme-pick]')) b.onclick = () => { setRace(r => { r.theme = b.dataset.themePick; }); newDemo(); renderMenu(); };
  for (const b of document.querySelectorAll('[data-who]')) b.onclick = () => { setRace(r => { r.who = b.dataset.who; }); renderMenu(); };
  for (const b of document.querySelectorAll('[data-gkey]')) b.onclick = () => { garageKey = b.dataset.gkey; pendingBuy = null; renderGarage(); };
  $('garageBtn').onclick = () => show('garage');
  for (const b of document.querySelectorAll('.toMenu')) b.onclick = () => show('menu');
  $('buy').onclick = buy;
  $('horn').onclick = () => { hornT = clock; honk(); };
  $('quit').onclick = askQuit;
  $('ov').addEventListener('click', e => {
    const a = e.target.closest('[data-act]'); if (!a) return;
    const act = a.dataset.act;
    if (act === 'menu') { game = null; overlay(''); show('menu'); }
    else if (act === 'again') start(lastMode);
    else if (act === 'againSolo') start('solo');
    else if (act === 'solo1') start('solo', { turn: 1 });
    else if (act === 'resume') { overlay(''); game.paused = false; }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && screen === 'play' && game && !game.done && $('ov').hidden) askQuit(); });
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now; clock += dt;
  fitCanvas();
  const k = cv.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  if (screen === 'play' && game) {
    if (!game.paused) { if (!game.done) game.step(dt); else game.s.update(dt); }
    game.draw(ctx, W, H);
  } else {
    if (!demo || demo.done || demo.t > 50) newDemo();
    demo.step(dt); demo.draw(ctx, W, H);
  }
  if (screen === 'garage') {
    const g = gcv.width / 640; gctx.setTransform(g, 0, 0, g, 0, 0);
    garageDraw(gctx, 640, 400, clock, garageCar(), hornT);
  }
  requestAnimationFrame(frame);
}
function boot() {
  wire(); newDemo(); show('menu'); fitCanvas();
  requestAnimationFrame(frame);
}
window.__race = { get screen() { return screen; }, get game() { return game; }, start, show, Wallet, Game, gateQuestion };
if (document.fonts && document.fonts.load) document.fonts.load(`800 20px "Baloo 2"`).catch(() => {}).finally(boot); else boot();
