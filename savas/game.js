/* War of Blocks — 6 yaş için sıra tabanlı kartopu oyunu.
   Her şey tek bir canvas'a, sabit 864x400 mantıksal çözünürlükte çiziliyor. */
'use strict';
(() => {

/* ================= Sabitler ================= */
const W = 864, H = 400, B = 16, COLS = 54, ROWS = 25;
const INK = '#1E2233';
const GRAV = 520;          // mermi yerçekimi (px/s²)
const VMAX = 640;          // en güçlü atış hızı
const WIND_ACC = 30;       // rüzgâr kademesi başına yatay ivme
const SIM_DT = 1 / 120;
const PULL_MAX = 150;      // tam güç için parmağın çekilmesi gereken mesafe
const WALK_BUDGET = 90;    // tur başına yürüme mesafesi (px)
const AIM_MIN = 18;        // atış sayılması için en az çekme mesafesi (px)
const FONT = '"Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

/* ================= Sprite'lar ================= */
const SPR = {
  penguin: { map: [
    "..KKKKKKKK..",
    ".KKKKKKKKKK.",
    ".KWWWKKWWWK.",
    ".KWPWKKWPWK.",
    ".KWWWOOWWWK.",
    ".KKKKOOKKKK.",
    ".SSSSSSSSSS.",
    "KKSSWWWWWKKK",
    "KKKSWWWWWKKK",
    ".KKKWWWWWKK.",
    ".KKWWWWWWKK.",
    "..KKWWWWKK..",
    "..OOO..OOO.."],
    pal: { K: '#2B3147', W: '#F7FAFF', P: '#11131C', O: '#F5A623', S: '#2F7DE1' } },
  cat: { map: [
    "OO........OO",
    "OOO......OOO",
    "ONOOOOOOOONO",
    "OOOODOODOOOO",
    "OOGPOOOOGPOO",
    "OOGPOOOOGPOO",
    "OOOOWNNWOOOO",
    "OOOWWWWWWOOO",
    ".SSSSSSSSSS.",
    ".OOOWWWWOOO.",
    ".ODOWWWWODO.",
    ".OOOWWWWOOO.",
    "..WW....WW.."],
    pal: { O: '#F39A3B', D: '#C96A1E', N: '#F7A1B5', W: '#FFF4E6', G: '#7ED957', P: '#1E2233', S: '#E5483B' } },
  snowball: { map: [
    ".WWWW.",
    "WWWWWL",
    "WWWWWL",
    "WWWWLL",
    "LWWLLL",
    ".LLLL."], pal: { W: '#FFFFFF', L: '#BFD9EE' } },
  balloon: { map: [
    "..BBB..",
    ".BHBBB.",
    "BHBBBBB",
    "BBBBBBB",
    "BBBBBBD",
    ".BBBBD.",
    "..BDD..",
    "...K...",
    "..K.K.."], pal: { B: '#4FB3F0', H: '#D6F1FF', D: '#2E86C9', K: '#1E2233' } },
  paint: { map: [
    "HHMMMMM",
    "HMMMMMN",
    "MMMMMMN",
    "MMMMMMN",
    "MNMMNMN",
    ".N..N.N",
    "....N.."], pal: { M: '#E84BB0', H: '#FF9AD8', N: '#B8338A' } },
  computer: { map: [
    "KKKKKKKK",
    "KGGGGGGK",
    "KGPGGPGK",
    "KGGGGGGK",
    "KGPPPPGK",
    "KKKKKKKK",
    "...KK...",
    ".KKKKKK."], pal: { K: '#3A4256', G: '#7FE0C2', P: '#1E2233' } },
  heart: { map: [
    ".RR.RR.",
    "RHRRRRR",
    "RRRRRRR",
    ".RRRRR.",
    "..RRR..",
    "...R..."], pal: { R: '#E5483B', H: '#FF9C92' } },
  heartEmpty: { map: [
    ".RR.RR.",
    "RRRRRRR",
    "RRRRRRR",
    ".RRRRR.",
    "..RRR..",
    "...R..."], pal: { R: '#D5DEE8' } },
  snowhat: { map: [
    "....WWW.....",
    "..WWWWWWL...",
    ".WWWWWWWWLL."], pal: { W: '#FFFFFF', L: '#D5E6F3' } },
  arrow: { map: [
    "BBBBBBB",
    ".BBBBB.",
    "..BBB..",
    "...B..."], pal: { B: '#FFD23F' } },
  chevron: { map: [
    "XX..",
    ".XX.",
    "..XX",
    ".XX.",
    "XX.."], pal: { X: '#2BB3A3' } },
  home: { map: [
    "....X....",
    "...XXX...",
    "..XXXXX..",
    ".XXXXXXX.",
    "XXXXXXXXX",
    ".XXX.XXX.",
    ".XXX.XXX.",
    ".XXX.XXX."], pal: { X: INK } },
  play: { map: [
    "XX.....",
    "XXXX...",
    "XXXXXX.",
    "XXXXXXX",
    "XXXXXX.",
    "XXXX...",
    "XX....."], pal: { X: INK } },
  retry: { map: [
    "..XXXX.X.",
    ".XX..XXX.",
    "XX...XXX.",
    "XX.......",
    "XX.....XX",
    ".XX...XX.",
    "..XXXXX.."], pal: { X: INK } },
  pause: { map: [
    "XX.XX",
    "XX.XX",
    "XX.XX",
    "XX.XX",
    "XX.XX",
    "XX.XX"], pal: { X: INK } },
  lock: { map: [
    "..XXX..",
    ".X...X.",
    ".X...X.",
    "XXXXXXX",
    "XXX.XXX",
    "XXX.XXX",
    "XXXXXXX"], pal: { X: '#7A869A' } },
  star: { map: [
    "....X....",
    "...XXX...",
    "XXXXXXXXX",
    ".XXXXXXX.",
    "..XXXXX..",
    "..XXXXX..",
    ".XXX.XXX.",
    ".XX...XX."], pal: { X: '#FFD23F' } },
  starEmpty: { map: [
    "....X....",
    "...XXX...",
    "XXXXXXXXX",
    ".XXXXXXX.",
    "..XXXXX..",
    "..XXXXX..",
    ".XXX.XXX.",
    ".XX...XX."], pal: { X: '#C9D3E0' } },
  question: { map: [
    ".XXXX.",
    "XX..XX",
    "....XX",
    "..XXX.",
    "..XX..",
    "......",
    "..XX.."], pal: { X: '#FFFFFF' } },
};
Object.assign(SPR, {
  fish: { map: [
    "...BBBB...",
    ".BBBBBBB.B",
    "BWPBBBBBBB",
    "BBBBBBBBBB",
    ".DDDDDDD.D",
    "...DDDD..."], pal: { B: '#7FB8E8', D: '#4A86C5', W: '#FFFFFF', P: '#1E2233' } },
  plane: { map: [
    "K...............",
    "KK.......WW.....",
    "KKRRRRRRRWWRRR.Y",
    "RRRRRRRRRRRRRRRY",
    ".RRRRRRRRRRRRRRY",
    ".....RRRRR......"], pal: { R: '#E5483B', K: '#B8322A', W: '#BFE6FF', Y: '#FFD23F' } },
  crate: { map: [
    "BBBBBBBB",
    "BLLLLLLB",
    "BLYYYYLB",
    "BLLLYYLB",
    "BLLYYLLB",
    "BLLLLLLB",
    "BLLYYLLB",
    "BBBBBBBB"], pal: { B: '#8A5D39', L: '#C99A5B', Y: '#FFD23F' } },
  chute: { map: [
    "..RRWWRR..",
    ".RRWWRRWW.",
    "RRWWRRWWRR"], pal: { R: '#E84BB0', W: '#FFFFFF' } },
});
SPR.penguinHit = { map: SPR.penguin.map.slice(), pal: SPR.penguin.pal };
SPR.penguinHit.map[2] = ".KWWWKKWWWK.";
SPR.penguinHit.map[3] = ".KPPPKKPPPK.";
SPR.catHit = { map: SPR.cat.map.slice(), pal: SPR.cat.pal };
SPR.catHit.map[4] = "OOOOOOOOOOOO";
SPR.catHit.map[5] = "OPPPOOOOPPPO";
for (const k in SPR) { SPR[k].w = SPR[k].map[0].length; SPR[k].h = SPR[k].map.length; SPR[k].name = k; }

/* ================= Bloklar ================= */
function hash(a, b, c) {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
/* ================= Vektör çizimler (Oyuncak Bloklar stili) =================
   Eski piksel sprite'ların kutularına oturur: drawSprite(ctx, SPR.x, x, y, s) aynı yeri kaplar,
   ama içini yuvarlak hatlı vektör çizimle doldurur. SPR haritaları artık yalnızca boyut için. */
const OL = 2.2; // kalın dış çizgi
function rr(c, x, y, w, h, r) {
  const R = Array.isArray(r) ? r : [r, r, r, r];
  c.beginPath();
  c.moveTo(x + R[0], y);
  c.lineTo(x + w - R[1], y); c.quadraticCurveTo(x + w, y, x + w, y + R[1]);
  c.lineTo(x + w, y + h - R[2]); c.quadraticCurveTo(x + w, y + h, x + w - R[2], y + h);
  c.lineTo(x + R[3], y + h); c.quadraticCurveTo(x, y + h, x, y + h - R[3]);
  c.lineTo(x, y + R[0]); c.quadraticCurveTo(x, y, x + R[0], y);
  c.closePath();
}
function ell(c, x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), rot, 0, Math.PI * 2); }
function lin(c, x0, y0, x1, y1, stops) { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); return g; }
function lighten(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${Math.min(255, (n >> 16) + amt)},${Math.min(255, ((n >> 8) & 255) + amt)},${Math.min(255, (n & 255) + amt)})`;
}
// Önce bütün siluet kalın koyu çizilir, sonra renkler üstüne: yalnızca dış çizgi görünür.
function drawShape(c, parts) {
  c.fillStyle = INK; c.strokeStyle = INK; c.lineWidth = OL * 2; c.lineJoin = 'round';
  for (const p of parts) if (p[2]) { p[0](); c.fill(); c.stroke(); }
  for (const p of parts) { p[0](); c.fillStyle = p[1]; c.fill(); }
}
function groundShadow(c) { c.fillStyle = 'rgba(30,34,51,.2)'; ell(c, 0, 0, 16, 3.5); c.fill(); }
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

// Penguen: (0,0) ayakların ortası, yüksekliği ~41 birim
function penguinArt(c, hit, team = '#2F7DE1', shadow = true) {
  if (shadow) groundShadow(c);
  const body = lin(c, -18, -40, 18, 0, ['#4A5B82', '#2B3550', '#1E2540']);
  const belly = lin(c, 0, -18, 0, 0, ['#FFFFFF', '#DCE6F3']);
  const orange = lin(c, 0, -6, 0, 0, ['#FFC04D', '#F08C1E']);
  const scarf = lin(c, 0, -19, 0, -12, [lighten(team, 30), team]);
  drawShape(c, [
    [() => ell(c, -7, -2.5, 6.5, 3.6), orange, true],
    [() => ell(c, 7, -2.5, 6.5, 3.6), orange, true],
    [() => ell(c, -16.5, -17, 4.6, 10, .35), body, true],
    [() => ell(c, 16.5, -17, 4.6, 10, -.35), body, true],
    [() => ell(c, 0, -20, 17, 20), body, true],
    [() => ell(c, 0, -8.5, 11.5, 8.5), belly],
    [() => ell(c, -5.2, -29.5, 6.8, 7.3), '#FFFFFF'],
    [() => ell(c, 5.2, -29.5, 6.8, 7.3), '#FFFFFF'],
    [() => { c.beginPath(); c.moveTo(-4, -24.5); c.quadraticCurveTo(0, -26, 4, -24.5); c.quadraticCurveTo(1.5, -19.5, 0, -19.5); c.quadraticCurveTo(-1.5, -19.5, -4, -24.5); c.closePath(); }, orange],
    [() => rr(c, -15.5, -18.5, 31, 6.5, 3.2), scarf],
    [() => rr(c, 6.5, -15, 6, 11, 3), scarf],
  ]);
  if (hit) closedEyes(c, -5.2, -29.5, 5.2, -29.5);
  else [-5.2, 5.2].forEach(ex => {
    ell(c, ex + .4, -28.9, 3.3, 3.6); c.fillStyle = '#11131C'; c.fill();
    ell(c, ex - .8, -30.4, 1.25, 1.25); c.fillStyle = '#FFFFFF'; c.fill();
  });
  cheeks(c, 10.5, -23.5);
  if (hit) snowPile(c, -40);
}
// Kedi: (0,0) ayakların ortası, kulaklarla ~48 birim
function catArt(c, hit, team = '#E5483B', shadow = true) {
  if (shadow) groundShadow(c);
  const fur = lin(c, -16, -44, 16, 0, ['#FFB45E', '#F39A3B', '#DE7A22']);
  const cream = lin(c, 0, -26, 0, 0, ['#FFFFFF', '#F7E6D2']);
  const scarf = lin(c, 0, -15, 0, -9, [lighten(team, 30), team]);
  const tail = () => { c.beginPath(); c.moveTo(9, -6); c.quadraticCurveTo(22, -6, 20, -20); c.quadraticCurveTo(19, -27, 23, -29); };
  c.lineCap = 'round';
  c.strokeStyle = INK; c.lineWidth = 6 + OL * 2; tail(); c.stroke();
  c.strokeStyle = '#E8862C'; c.lineWidth = 6; tail(); c.stroke();
  drawShape(c, [
    [() => ell(c, -6, -2.5, 5, 3.2), cream, true],
    [() => ell(c, 6, -2.5, 5, 3.2), cream, true],
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
    ell(c, ex, -28.6, 1.5, 3.3); c.fillStyle = '#11131C'; c.fill();
    ell(c, ex - 1.2, -30.5, 1, 1); c.fillStyle = '#FFFFFF'; c.fill();
  });
  cheeks(c, 11, -24);
  if (hit) snowPile(c, -43);
}
function snowballArt(c, r) {
  ell(c, 0, 0, r + OL, r + OL); c.fillStyle = INK; c.fill();
  const g = c.createRadialGradient(-r * .4, -r * .4, r * .1, 0, 0, r);
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(.6, '#F1F7FC'); g.addColorStop(1, '#B9D4EA');
  ell(c, 0, 0, r, r); c.fillStyle = g; c.fill();
}
function balloonArt(c) { // ~22x24 birim, merkez (0,0)
  const body = () => { c.beginPath(); c.moveTo(0, 10); c.bezierCurveTo(-11, 4, -10, -11, 0, -11); c.bezierCurveTo(10, -11, 11, 4, 0, 10); c.closePath(); };
  c.lineWidth = OL * 2; c.strokeStyle = INK; c.lineJoin = 'round'; body(); c.stroke();
  c.fillStyle = INK; c.beginPath(); c.moveTo(-4.5, 14); c.lineTo(4.5, 14); c.lineTo(0, 8); c.closePath(); c.fill();
  body(); c.fillStyle = lin(c, -8, -10, 8, 10, ['#8FD3FA', '#46A9EC', '#2E86C9']); c.fill();
  c.fillStyle = '#2E86C9'; c.beginPath(); c.moveTo(-2.5, 12.5); c.lineTo(2.5, 12.5); c.lineTo(0, 9.5); c.closePath(); c.fill();
  ell(c, -4, -5, 2.4, 3.6, .4); c.fillStyle = 'rgba(255,255,255,.75)'; c.fill();
}
function paintArt(c) { // ~20x24 birim, merkez (0,0)
  rr(c, -9 - OL, -9 - OL, 18 + OL * 2, 18 + OL * 2, 6); c.fillStyle = INK; c.fill();
  rr(c, -9, -9, 18, 18, 4.5); c.fillStyle = lin(c, -9, -9, 9, 9, ['#FF8AD2', '#E84BB0', '#B8338A']); c.fill();
  c.fillStyle = '#B8338A';
  rr(c, -5, 6, 3.4, 8, 1.7); c.fill(); ell(c, -3.3, 14, 2.2, 2.2); c.fill();
  rr(c, 3, 6, 3, 5, 1.5); c.fill(); ell(c, 4.5, 11.5, 1.9, 1.9); c.fill();
  rr(c, -6, -6, 6, 3, 1.5); c.fillStyle = 'rgba(255,255,255,.6)'; c.fill();
}
function fishArt(c) { // ~28x16 birim, sola bakar, merkez (0,0)
  const tail = () => { c.beginPath(); c.moveTo(7, 0); c.lineTo(15, -7); c.quadraticCurveTo(12.5, 0, 15, 7); c.closePath(); };
  const body = () => ell(c, -2, 0, 11, 7.5);
  c.lineWidth = OL * 2; c.strokeStyle = INK; c.lineJoin = 'round';
  tail(); c.stroke(); body(); c.stroke();
  tail(); c.fillStyle = '#4A86C5'; c.fill();
  body(); c.fillStyle = lin(c, 0, -8, 0, 8, ['#A6D3F5', '#7FB8E8', '#4A86C5']); c.fill();
  c.beginPath(); c.moveTo(-1, -6); c.quadraticCurveTo(3, -11, 7, -6); c.closePath(); c.fillStyle = '#4A86C5'; c.fill();
  ell(c, -7, -1.5, 2.6, 2.6); c.fillStyle = '#FFFFFF'; c.fill();
  ell(c, -7.4, -1.3, 1.4, 1.5); c.fillStyle = '#11131C'; c.fill();
  c.strokeStyle = 'rgba(30,34,51,.5)'; c.lineWidth = 1; c.beginPath(); c.arc(-2, 0, 4, -1.1, 1.1); c.stroke();
}
function heartArt(c, empty) { // ~18x14 birim
  const p = () => { c.beginPath(); c.moveTo(0, 6.5); c.bezierCurveTo(-9.5, 0, -7.5, -8.5, 0, -4.2); c.bezierCurveTo(7.5, -8.5, 9.5, 0, 0, 6.5); c.closePath(); };
  if (!empty) { c.lineWidth = 2.6; c.strokeStyle = INK; c.lineJoin = 'round'; p(); c.stroke(); }
  p(); c.fillStyle = empty ? '#D5DEE8' : lin(c, 0, -7, 0, 6, ['#FF7A6E', '#E5483B']); c.fill();
  if (!empty) { ell(c, -3.6, -2.6, 1.7, 1.1, -.5); c.fillStyle = 'rgba(255,255,255,.75)'; c.fill(); }
}
function starPath(c, r) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * .48 : r; c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
  c.closePath();
}
function starArt(c, r, empty) {
  c.lineJoin = 'round';
  if (!empty) { c.lineWidth = OL * 2; c.strokeStyle = INK; starPath(c, r); c.stroke(); }
  starPath(c, r); c.fillStyle = empty ? '#D5DEE8' : lin(c, 0, -r, 0, r, ['#FFE680', '#FFC21F']); c.fill();
}
function computerArt(c) { // ~24x24 birim
  rr(c, -4, 6, 8, 6, 2); c.fillStyle = INK; c.fill();
  rr(c, -9, 10, 18, 4, 2); c.fill();
  rr(c, -12 - OL, -11 - OL, 24 + OL * 2, 18 + OL * 2, 5); c.fill();
  rr(c, -12, -11, 24, 18, 4); c.fillStyle = '#4A5470'; c.fill();
  rr(c, -9, -8, 18, 12, 3); c.fillStyle = lin(c, 0, -8, 0, 4, ['#A5F0D8', '#5FD3B0']); c.fill();
  c.fillStyle = INK; ell(c, -3.5, -3.5, 1.4, 1.7); c.fill(); ell(c, 3.5, -3.5, 1.4, 1.7); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.4; c.lineCap = 'round'; c.beginPath(); c.arc(0, -1, 3, .3, Math.PI - .3); c.stroke();
}
function planeArt(c) { // ~56x22 birim, sağa bakar
  const body = () => { c.beginPath(); c.moveTo(-26, -6); c.quadraticCurveTo(-24, -9, -18, -6); c.lineTo(16, -6); c.quadraticCurveTo(26, -6, 26, 1); c.quadraticCurveTo(26, 7, 16, 7); c.lineTo(-18, 7); c.quadraticCurveTo(-24, 6, -26, -6); c.closePath(); };
  const fin = () => { c.beginPath(); c.moveTo(-24, -5); c.lineTo(-27, -15); c.quadraticCurveTo(-24, -16, -20, -13); c.lineTo(-15, -5); c.closePath(); };
  const wing = () => rr(c, -6, 0, 16, 6, 3);
  c.lineWidth = OL * 2; c.strokeStyle = INK; c.lineJoin = 'round';
  fin(); c.stroke(); body(); c.stroke();
  fin(); c.fillStyle = '#C8352C'; c.fill();
  body(); c.fillStyle = lin(c, 0, -6, 0, 7, ['#FF7A6E', '#E5483B', '#C8352C']); c.fill();
  rr(c, 6, -4, 9, 5, 2.5); c.fillStyle = '#BFE6FF'; c.fill();
  wing(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke(); c.fillStyle = '#C8352C'; c.fill();
  ell(c, 27.5, 1, 2.2, 9); c.fillStyle = INK; c.fill(); ell(c, 27.5, 1, 1.2, 8); c.fillStyle = '#FFD23F'; c.fill();
}
function crateArt(c) { // ~24x24 birim
  rr(c, -12 - OL, -12 - OL, 24 + OL * 2, 24 + OL * 2, 5); c.fillStyle = INK; c.fill();
  rr(c, -12, -12, 24, 24, 4); c.fillStyle = lin(c, 0, -12, 0, 12, ['#E0B276', '#C99A5B', '#A87A42']); c.fill();
  c.strokeStyle = '#8A5D39'; c.lineWidth = 2.4; rr(c, -8.5, -8.5, 17, 17, 2.5); c.stroke();
  c.font = `800 15px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineWidth = 3.5; c.strokeStyle = INK; c.strokeText('?', 0, 1); c.fillStyle = '#FFD23F'; c.fillText('?', 0, 1);
}
function chuteArt(c, w, h) { // kubbe
  c.save(); c.translate(0, h * .5);
  const dome = () => { c.beginPath(); c.moveTo(-w / 2, 0); c.quadraticCurveTo(-w / 2, -h * 1.15, 0, -h * 1.15); c.quadraticCurveTo(w / 2, -h * 1.15, w / 2, 0); c.quadraticCurveTo(0, -h * .35, -w / 2, 0); c.closePath(); };
  c.lineWidth = OL * 2; c.strokeStyle = INK; c.lineJoin = 'round'; dome(); c.stroke();
  c.save(); dome(); c.clip();
  for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#FFFFFF' : '#E84BB0'; c.fillRect(-w / 2 + i * w / 5, -h * 1.3, w / 5 + .5, h * 1.4); }
  c.restore(); c.restore();
}
function iconArt(c, name, w, h, opt) {
  const s = Math.min(w, h) / 2;
  c.fillStyle = INK; c.strokeStyle = INK; c.lineJoin = 'round'; c.lineCap = 'round';
  if (name === 'home') {
    c.beginPath(); c.moveTo(0, -s * .95); c.lineTo(s * .95, -s * .05); c.lineTo(s * .7, -s * .05); c.lineTo(s * .7, s * .85); c.lineTo(-s * .7, s * .85); c.lineTo(-s * .7, -s * .05); c.lineTo(-s * .95, -s * .05); c.closePath();
    c.lineWidth = s * .2; c.stroke(); c.fill();
    rr(c, -s * .2, s * .25, s * .4, s * .62, s * .12); c.fillStyle = '#FFFFFF'; c.fill();
  } else if (name === 'play') {
    c.save(); if (opt.flip) c.scale(-1, 1);
    c.beginPath(); c.moveTo(-s * .6, -s * .85); c.lineTo(s * .85, 0); c.lineTo(-s * .6, s * .85); c.closePath();
    c.lineWidth = s * .3; c.stroke(); c.fill(); c.restore();
  } else if (name === 'pause') {
    rr(c, -s * .75, -s * .9, s * .55, s * 1.8, s * .2); c.fill();
    rr(c, s * .2, -s * .9, s * .55, s * 1.8, s * .2); c.fill();
  } else if (name === 'retry') {
    c.lineWidth = s * .32; c.beginPath(); c.arc(0, 0, s * .68, -Math.PI * .35, Math.PI * 1.45); c.stroke();
    const a = -Math.PI * .35, ax = Math.cos(a) * s * .68, ay = Math.sin(a) * s * .68;
    c.beginPath(); c.moveTo(ax + s * .42, ay - s * .05); c.lineTo(ax - s * .1, ay - s * .5); c.lineTo(ax - s * .12, ay + s * .32); c.closePath();
    c.lineWidth = s * .12; c.stroke(); c.fill();
  } else if (name === 'lock') {
    c.strokeStyle = '#7A869A'; c.lineWidth = s * .26; c.beginPath(); c.arc(0, -s * .2, s * .45, Math.PI, 0); c.lineTo(s * .45, s * .05); c.moveTo(-s * .45, -s * .2); c.lineTo(-s * .45, s * .05); c.stroke();
    rr(c, -s * .78, -s * .1, s * 1.56, s * 1.05, s * .22); c.fillStyle = '#7A869A'; c.fill();
    ell(c, 0, s * .35, s * .14, s * .18); c.fillStyle = '#E3E9F0'; c.fill();
  } else if (name === 'question') {
    c.font = `800 ${Math.round(h * 1.15)}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = h * .18; c.strokeText('?', 0, h * .06); c.fillStyle = '#FFFFFF'; c.fillText('?', 0, h * .06);
  }
}
// İsim → çizim. (c, x, y, w, h, opt): kutunun içine ortalanır.
const ART = {
  penguin: (c, x, y, w, h) => { c.translate(x + w / 2, y + h); c.scale(h / 42, h / 42); penguinArt(c, false); },
  penguinHit: (c, x, y, w, h) => { c.translate(x + w / 2, y + h); c.scale(h / 42, h / 42); penguinArt(c, true); },
  cat: (c, x, y, w, h) => { c.translate(x + w / 2, y + h); c.scale(h / 44, h / 44); catArt(c, false); },
  catHit: (c, x, y, w, h) => { c.translate(x + w / 2, y + h); c.scale(h / 44, h / 44); catArt(c, true); },
  snowhat: () => {},
  snowball: (c, x, y, w, h) => { c.translate(x + w / 2, y + h / 2); snowballArt(c, Math.min(w, h) / 2 * .92); },
  balloon: (c, x, y, w, h) => { c.translate(x + w / 2, y + h * .46); const s = h / 26; c.scale(s, s); balloonArt(c); },
  paint: (c, x, y, w, h) => { c.translate(x + w / 2, y + h * .42); const s = Math.min(w, h) / 22; c.scale(s, s); paintArt(c); },
  fish: (c, x, y, w, h, o) => { c.translate(x + w / 2, y + h / 2); const s = w / 30; c.scale(o.flip ? -s : s, s); fishArt(c); },
  computer: (c, x, y, w, h) => { c.translate(x + w / 2, y + h / 2); const s = Math.min(w, h) / 26; c.scale(s, s); computerArt(c); },
  heart: (c, x, y, w, h) => { c.translate(x + w / 2, y + h / 2); const s = Math.min(w / 19, h / 15); c.scale(s, s); heartArt(c, false); },
  heartEmpty: (c, x, y, w, h) => { c.translate(x + w / 2, y + h / 2); const s = Math.min(w / 19, h / 15); c.scale(s, s); heartArt(c, true); },
  star: (c, x, y, w, h) => { c.translate(x + w / 2, y + h / 2); starArt(c, Math.min(w, h) * .56, false); },
  starEmpty: (c, x, y, w, h) => { c.translate(x + w / 2, y + h / 2); starArt(c, Math.min(w, h) * .56, true); },
  arrow: (c, x, y, w, h) => {
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w / 2, y + h * 1.1); c.closePath();
    c.lineJoin = 'round'; c.lineWidth = OL * 2; c.strokeStyle = INK; c.stroke(); c.fillStyle = '#FFD23F'; c.fill();
  },
  arrowUp: (c, x, y, w, h) => {
    c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath();
    c.lineJoin = 'round'; c.lineWidth = OL * 2; c.strokeStyle = INK; c.stroke(); c.fillStyle = '#FFD23F'; c.fill();
  },
  chevron: (c, x, y, w, h, o) => {
    const col = (o.pal && o.pal.X) || '#2BB3A3';
    c.translate(x + w / 2, y + h / 2); if (o.flip) c.scale(-1, 1);
    const p = () => { c.beginPath(); c.moveTo(-w * .32, -h * .42); c.lineTo(w * .3, 0); c.lineTo(-w * .32, h * .42); };
    c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = col; c.lineWidth = w * .42; p(); c.stroke();
  },
  plane: (c, x, y, w, h, o) => { c.translate(x + w / 2, y + h / 2); const s = w / 58; c.scale(o.flip ? -s : s, s); planeArt(c); },
  crate: (c, x, y, w, h) => { c.translate(x + w / 2, y + h / 2); const s = w / 27; c.scale(s, s); crateArt(c); },
  chute: (c, x, y, w, h) => { c.translate(x + w / 2, y + h / 2); chuteArt(c, w, h); },
  home: (c, x, y, w, h, o) => { c.translate(x + w / 2, y + h / 2); iconArt(c, 'home', w, h, o); },
  play: (c, x, y, w, h, o) => { c.translate(x + w / 2, y + h / 2); iconArt(c, 'play', w, h, o); },
  pause: (c, x, y, w, h, o) => { c.translate(x + w / 2, y + h / 2); iconArt(c, 'pause', w, h, o); },
  retry: (c, x, y, w, h, o) => { c.translate(x + w / 2, y + h / 2); iconArt(c, 'retry', w, h, o); },
  lock: (c, x, y, w, h, o) => { c.translate(x + w / 2, y + h / 2); iconArt(c, 'lock', w, h, o); },
  question: (c, x, y, w, h, o) => { c.translate(x + w / 2, y + h / 2); iconArt(c, 'question', w, h, o); },
};
function drawSprite(c, spr, x, y, s, opt = {}) {
  const fn = ART[spr.name]; if (!fn) return;
  c.save();
  if (opt.alpha != null && opt.alpha !== 1) c.globalAlpha *= opt.alpha;
  fn(c, x, y, spr.w * s, spr.h * s, opt);
  c.restore();
}

/* ----- Oyuncak blok ----- */
const BLOCK = {
  dirt: ['#C0844F', '#A86E3E'], stone: ['#A3AABA', '#868D9E'], sand: ['#F3DE9E', '#DEC57E'],
  grassTop: ['#7FE05C', '#4FB43A'], snowTop: ['#FFFFFF', '#D9E8F5'],
};
function drawBlock(c, type, x, y, b, cx, cy, capped) {
  const base = type === 'grass' || type === 'snow' ? 'dirt' : type;
  const [l, d] = BLOCK[base];
  rr(c, x + .5, y + .5, b - 1, b - 1, b * .22);
  c.fillStyle = lin(c, x, y, x, y + b, [l, d]); c.fill();
  c.fillStyle = `rgba(255,255,255,${.22 + hash(cx, cy, 1) * .06})`; rr(c, x + b * .16, y + b * .12, b * .68, b * .19, b * .09); c.fill();
  c.fillStyle = 'rgba(30,34,51,.12)'; rr(c, x + b * .12, y + b * .75, b * .76, b * .12, b * .06); c.fill();
  if (capped && (type === 'grass' || type === 'snow')) {
    const [gl, gd] = type === 'grass' ? BLOCK.grassTop : BLOCK.snowTop;
    rr(c, x - .5, y - 1, b + 1, b * .44, b * .22); c.fillStyle = lin(c, x, y - 1, x, y + b * .4, [gl, gd]); c.fill();
    if (hash(cx, cy, 2) < .6) { ell(c, x + b * .25 + hash(cx, cy, 3) * b * .5, y + b * .38, b * .15, b * .15); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.4)'; rr(c, x + b * .12, y, b * .62, b * .1, b * .05); c.fill();
  }
}

const TS = 2; // zemin önbelleği çözünürlüğü
const BASE_COLOR = { grass: '#6CCB4C', snow: '#F2F7FB', dirt: '#B67A47', stone: '#959CAD', sand: '#EBD48E' };
const THEMES = {
  grass: { sky: ['#4FB8F5', '#8FD6FA', '#D2F0FF'], water: ['#56B8F2', '#2C7FCC'], sun: true },
  snow: { sky: ['#7FAAD6', '#B3D0EC', '#E8F2FB'], water: ['#9AD3F2', '#4F95CC'], sun: false, flakes: true },
};

class Terrain {
  constructor(heights, themeKey, water) {
    this.h0 = heights; this.themeKey = themeKey; this.theme = THEMES[themeKey]; this.water = water;
    this.cells = new Uint8Array(COLS * ROWS);
    this.paint = new Uint8Array(COLS * ROWS);
    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) this.cells[c * ROWS + r] = r < heights[c] ? 1 : 0;
    this.canvas = document.createElement('canvas');
    this.canvas.width = W * TS; this.canvas.height = H * TS;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(TS, TS);
    this.render();
  }
  solid(c, r) { return c >= 0 && c < COLS && r >= 0 && r < ROWS && this.cells[c * ROWS + r] === 1; }
  solidAt(x, y) { return this.solid(Math.floor(x / B), Math.floor((H - 1 - y) / B)); }
  get waterY() { return H - this.water * B; }
  top(c) { for (let r = ROWS - 1; r >= 0; r--) if (this.solid(c, r)) return r; return -1; }
  surfaceY(c) { return H - (this.top(c) + 1) * B; }
  typeAt(c, r) {
    const d = this.h0[c] - 1 - r;
    if (this.themeKey === 'snow') return d === 0 ? 'snow' : d <= 2 ? 'dirt' : 'stone';
    const low = this.h0[c] <= this.water + 1;
    if (d === 0) return low ? 'sand' : 'grass';
    if (d <= 2) return low ? 'sand' : 'dirt';
    return 'stone';
  }
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);
    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
      if (!this.solid(c, r)) continue;
      const x = c * B, y = H - (r + 1) * B;
      drawBlock(ctx, this.typeAt(c, r), x, y, B, c, r, !this.solid(c, r + 1));
      if (this.paint[c * ROWS + r]) {
        rr(ctx, x + .5, y + .5, B - 1, B - 1, 3.5); ctx.fillStyle = 'rgba(232,75,176,.55)'; ctx.fill();
        if (hash(c, r, 9) < .5) { ell(ctx, x + 6, y + 6, 2.5, 2.5); ctx.fillStyle = 'rgba(255,170,224,.85)'; ctx.fill(); }
      }
    }
  }
  carve(x, y, rad, paintRad = 0) {
    const pr = Math.max(rad, paintRad);
    const c0 = Math.max(0, Math.floor((x - pr) / B)), c1 = Math.min(COLS - 1, Math.floor((x + pr) / B));
    for (let c = c0; c <= c1; c++) for (let r = 0; r < ROWS; r++) {
      const dx = c * B + B / 2 - x, dy = H - (r + .5) * B - y, d2 = dx * dx + dy * dy;
      if (d2 < rad * rad) this.cells[c * ROWS + r] = 0;
      else if (paintRad && d2 < paintRad * paintRad && this.cells[c * ROWS + r]) this.paint[c * ROWS + r] = 1;
    }
    this.render();
  }
  raise(c0, c1) {
    for (let c = Math.max(0, c0); c <= Math.min(COLS - 1, c1); c++) for (let r = 0; r <= this.water; r++) this.cells[c * ROWS + r] = 1;
    this.render();
  }
  thumb() {
    const s = 4, cv = document.createElement('canvas');
    cv.width = COLS * s; cv.height = ROWS * s;
    const ctx = cv.getContext('2d');
    drawSky(ctx, cv.width, cv.height, this.theme.sky);
    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
      const x = c * s, y = (ROWS - 1 - r) * s;
      if (this.solid(c, r)) { ctx.fillStyle = BASE_COLOR[this.typeAt(c, r)]; ctx.fillRect(x, y, s, s); }
      else if (r < this.water) { ctx.fillStyle = this.theme.water[1]; ctx.fillRect(x, y, s, s); }
    }
    return cv;
  }
}

function makeHeights(fn) {
  const a = [];
  for (let c = 0; c < COLS; c++) a.push(clamp(Math.round(fn(c)), 2, ROWS - 7));
  return a;
}

/* ================= Bölümler ================= */
const LEVELS = [
  { island: 0, theme: 'grass', water: 3, h: c => 8 + 1.5 * Math.sin(c / 7) + Math.sin(c / 3), p: 10, e: 43, wind: 0, items: ['snowball'], err: .35, preview: 200 },
  { island: 0, theme: 'grass', water: 5, h: c => 7 + 4 * Math.cos(2 * Math.PI * c / 54) + 1.2 * Math.sin(c * .9) - (c > 20 && c < 34 ? 1 : 0), p: 8, e: 46, wind: 0, items: ['snowball'], err: .28, preview: 170 },
  { island: 0, theme: 'grass', water: 4, h: c => 6 + 7 * Math.exp(-Math.pow((c - 27) / 6, 2)) + Math.sin(c / 2.5), p: 9, e: 45, wind: 1, items: ['snowball', 'balloon'], err: .22, preview: 140 },
  { island: 1, theme: 'snow', water: 4, h: c => 8 + 3 * Math.sin(c / 5 + 1) + 1.5 * Math.sin(c / 2.1), p: 7, e: 47, wind: 1, items: ['snowball', 'balloon'], err: .18, preview: 120 },
  { island: 1, theme: 'snow', water: 4, h: c => 7 + 2 * Math.sin(c / 4) + (c >= 22 && c <= 32 ? 7 : 0), p: 10, e: 44, wind: 2, items: ['snowball', 'balloon', 'paint'], err: .14, preview: 100 },
  { island: 1, theme: 'snow', water: 5, h: c => 5 + 6 * Math.max(0, Math.cos(2 * Math.PI * c / 27)) + 1.5 * Math.sin(c / 2), p: 4, e: 50, wind: 3, items: ['snowball', 'balloon', 'paint'], err: .11, preview: 90 },
];
const ISLANDS = [{ name: 'ÇİMEN ADASI', color: '#5DBB4A' }, { name: 'KAR ADASI', color: '#7CC4EA' }];
const ALL_ITEMS = ['snowball', 'balloon', 'paint'];
const ITEM_ORDER = ['snowball', 'balloon', 'paint', 'fish'];

function mapDef(key) {
  if (key === 'grass') return Object.assign({}, LEVELS[1], { wind: 1, preview: 130 });
  if (key === 'snow') return Object.assign({}, LEVELS[3], { wind: 2, preview: 110 });
  // sürpriz: her seferinde yeni bir ada
  const th = Math.random() < .5 ? 'grass' : 'snow';
  const a = rand(1, 4), f = rand(3, 7), ph = rand(0, 6);
  const mid = Math.random() < .5 ? rand(4, 8) : -rand(0, 3);
  return {
    theme: th, water: 3 + Math.floor(rand(0, 3)), wind: 2, preview: 110,
    h: c => 7 + a * Math.sin(c / f + ph) + 1.2 * Math.sin(c / 2.3 + ph * 2) + mid * Math.exp(-Math.pow((c - 27) / 6, 2)),
    p: 6 + Math.floor(rand(0, 6)), e: 42 + Math.floor(rand(0, 6)),
  };
}

const ITEMS = {
  snowball: { spr: 'snowball', r: 26, wind: .6, word: 'POF!', sound: 'pof', colors: ['#FFFFFF', '#E6F0F8', '#BFD9EE', '#9B6B43'] },
  balloon: { spr: 'balloon', r: 40, wind: 1.3, word: 'ŞLAP!', sound: 'splash', colors: ['#4FB3F0', '#D6F1FF', '#2E86C9', '#FFFFFF'] },
  paint: { spr: 'paint', r: 30, wind: .9, word: 'ŞAP!', sound: 'splat', colors: ['#E84BB0', '#FF9AD8', '#B8338A'], bounce: true, paintR: 54 },
  // sadece sürpriz kutudan çıkar: daha düz ve uzağa uçar, rüzgârı pek umursamaz
  fish: { spr: 'fish', r: 34, wind: .2, grav: .55, word: 'ŞLOP!', sound: 'splat', colors: ['#7FB8E8', '#4A86C5', '#FFFFFF'] },
};

/* ================= Kayıt ================= */
const Store = {
  key: 'war-of-blocks.v1',
  stars: LEVELS.map(() => 0),
  load() {
    try {
      const d = JSON.parse(localStorage.getItem(this.key) || 'null');
      if (d && Array.isArray(d.stars)) this.stars = LEVELS.map((_, i) => clamp(d.stars[i] | 0, 0, 3));
    } catch (e) {}
  },
  save() { try { localStorage.setItem(this.key, JSON.stringify({ stars: this.stars })); } catch (e) {} },
  unlocked(i) { return i === 0 || this.stars[i - 1] > 0; },
};
Store.load();

/* ================= Ses ================= */
const Sound = {
  ctx: null,
  // iOS sesi yalnızca dokunma bitince (touchend/pointerup) açar; pointerdown yetmez.
  // 'playback' oturumu, telefon sessiz moddayken de sesin çalmasını sağlar.
  unlock() {
    try {
      if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback';
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state !== 'running') {
        this.ctx.resume();
        const src = this.ctx.createBufferSource();
        src.buffer = this.ctx.createBuffer(1, 1, 22050);
        src.connect(this.ctx.destination); src.start(0);
      }
    } catch (e) {}
  },
  noise(dur, { type = 'lowpass', freq = 900, freqEnd = 0, gain = .5, q = 1 } = {}) {
    const a = this.ctx; if (!a) return;
    const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(freq, a.currentTime);
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, a.currentTime + dur);
    const g = a.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(a.destination); src.start();
  },
  tone(freq, dur, { type = 'square', gain = .12, to = 0, delay = 0 } = {}) {
    const a = this.ctx; if (!a) return;
    const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + .05);
  },
  play(name) {
    try {
      switch (name) {
        case 'pof': this.noise(.3, { freq: 900, freqEnd: 200, gain: .7 }); this.tone(120, .2, { type: 'sine', gain: .3, to: 50 }); break;
        case 'splat': this.noise(.35, { type: 'bandpass', freq: 1800, freqEnd: 300, gain: .9, q: 2 }); break;
        case 'splash': this.noise(.5, { type: 'bandpass', freq: 2500, freqEnd: 400, gain: .7, q: 1.5 }); break;
        case 'throw': this.noise(.18, { type: 'highpass', freq: 800, freqEnd: 3000, gain: .25 }); break;
        case 'hit': this.tone(600, .25, { to: 180, gain: .12 }); break;
        case 'click': this.tone(880, .06, { gain: .07 }); break;
        case 'turn': this.tone(660, .08, { gain: .07 }); this.tone(990, .1, { gain: .07, delay: .09 }); break;
        case 'bounce': this.tone(300, .12, { type: 'sine', to: 600, gain: .18 }); break;
        case 'win': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, .2, { gain: .1, delay: i * .12 })); break;
        case 'pickup': [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, .12, { gain: .09, delay: i * .07 })); break;
        case 'plane': this.tone(140, 1.4, { type: 'sawtooth', gain: .05, to: 110 }); this.tone(147, 1.4, { type: 'square', gain: .03, to: 115 }); break;
        case 'lose': [392, 330, 262].forEach((f, i) => this.tone(f, .25, { type: 'triangle', gain: .14, delay: i * .18 })); break;
      }
    } catch (e) {}
  },
};

/* ================= Canvas ve ölçek ================= */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let K = 1;
function resize() {
  const wrap = document.getElementById('wrap');
  const cs = getComputedStyle(wrap);
  const cw = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const chh = wrap.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const s = Math.max(.1, Math.min(cw / W, chh / H));
  canvas.style.width = Math.floor(W * s) + 'px';
  canvas.style.height = Math.floor(H * s) + 'px';
  const dpr = window.devicePixelRatio || 1;
  K = clamp(s * dpr, 1, 3);
  canvas.width = Math.round(W * K); canvas.height = Math.round(H * K);
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 200));
resize();

/* ================= Çizim yardımcıları ================= */
function drawSky(c, w, h, bands) {
  c.fillStyle = lin(c, 0, 0, 0, h, bands); c.fillRect(0, 0, w, h);
}
function puff(x, y, s) {
  const top = '#FFFFFF', bottom = '#DCEFFB';
  [[0, 0, 16], [18, -10, 20], [40, -4, 17], [56, 4, 12]].forEach(([dx, dy, r]) => { ell(ctx, x + dx * s, y + dy * s, r * s, r * s); ctx.fillStyle = top; ctx.fill(); });
  rr(ctx, x - 12 * s, y, 80 * s, 14 * s, 7 * s); ctx.fillStyle = top; ctx.fill();
  rr(ctx, x - 10 * s, y + 8 * s, 76 * s, 6 * s, 3 * s); ctx.fillStyle = bottom; ctx.fill();
}
function drawClouds(time) {
  [[60, 100, .9, 10], [360, 130, .7, 13], [560, 78, .55, 8], [780, 120, .75, 11]].forEach(([x0, y, s, sp]) => {
    const span = W + 220, x = ((x0 + time * sp) % span + span) % span - 120;
    puff(x, y, s);
  });
}
function drawSun(x, y) {
  const cx = x + 24, cy = y + 24;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(time * .15);
  ctx.fillStyle = 'rgba(255,224,102,.35)';
  for (let i = 0; i < 10; i++) { ctx.rotate(Math.PI / 5); ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(0, 62); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  ell(ctx, cx, cy, 30, 30); ctx.fillStyle = INK; ctx.fill();
  ell(ctx, cx, cy, 27, 27); ctx.fillStyle = lin(ctx, cx - 18, cy - 22, cx + 12, cy + 23, ['#FFF1A8', '#FFD23F', '#FFB52E']); ctx.fill();
}
function drawWater(T) {
  const wy = T.waterY, [a, b] = T.theme.water;
  ctx.fillStyle = lin(ctx, 0, wy, 0, H, [a, b]);
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 8) ctx.lineTo(x, wy + Math.sin(x * .05 + time * 2.5) * 1.8);
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 8) { const y = wy + Math.sin(x * .05 + time * 2.5) * 1.8; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.stroke();
}
// Şeker gibi kabarık panel: koyu dış çizgi, renkli çerçeve, beyaz iç
function panel(x, y, w, h, frame, fill = '#FFFFFF') {
  const r = Math.min(18, h / 3.2);
  rr(ctx, x, y, w, h, r); ctx.fillStyle = INK; ctx.fill();
  rr(ctx, x + 3, y + 3, w - 6, h - 6, r - 3); ctx.fillStyle = frame; ctx.fill();
  rr(ctx, x + 7, y + 7, w - 14, h - 14, Math.max(2, r - 7)); ctx.fillStyle = fill; ctx.fill();
}
function text(str, x, y, size, opt = {}) {
  const { align = 'center', color = '#FFFFFF', stroke = INK, lw = Math.max(3, size / 5), base = 'middle' } = opt;
  ctx.font = `800 ${size}px ${FONT}`;
  y += size * .06; // Baloo'nun harfleri biraz yukarıda durur
  ctx.textAlign = align; ctx.textBaseline = base; ctx.lineJoin = 'round';
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.strokeText(str, x, y); }
  ctx.fillStyle = color; ctx.fillText(str, x, y);
}
function centerSprite(spr, cx, cy, s, opt) { drawSprite(ctx, SPR[spr], cx - SPR[spr].w * s / 2, cy - SPR[spr].h * s / 2, s, opt); }

/* ================= Düğmeler ================= */
let buttons = [];
function button(x, y, w, h, onTap, drawInside, opt = {}) {
  const b = { x, y, w, h, onTap, onDown: opt.onDown, onUp: opt.onUp, disabled: opt.disabled };
  buttons.push(b);
  const down = pointer.btn && pointer.btn.x === x && pointer.btn.y === y;
  const o = down ? 4 : 0;
  rr(ctx, x, y + 5, w, h, Math.min(18, h / 3.2)); ctx.fillStyle = INK; ctx.fill();
  ctx.save(); ctx.globalAlpha = opt.disabled ? .5 : 1;
  panel(x, y + o, w, h, opt.frame || '#FFD23F', opt.fill || '#FFFFFF');
  if (drawInside) drawInside(x, y + o, w, h);
  ctx.restore();
}

/* ================= Parçacıklar ================= */
let parts = [], words = [], shake = 0;
function spawn(x, y, n, colors, speed = 1) {
  for (let i = 0; i < n; i++) parts.push({
    x, y, vx: rand(-.5, .5) * 300 * speed, vy: -rand(60, 320) * speed,
    s: 4 + Math.floor(rand(0, 3)) * 2, c: colors[i % colors.length], life: rand(.9, 1.4), g: 620,
  });
}
function confetti(n) {
  const cols = ['#FFD23F', '#E5483B', '#2F7DE1', '#5DBB4A', '#E84BB0', '#FFFFFF'];
  for (let i = 0; i < n; i++) parts.push({ x: rand(0, W), y: rand(-40, -5), vx: rand(-40, 40), vy: rand(40, 140), s: 6, c: cols[i % cols.length], life: 4, g: 60 });
}
function updateParts(dt) {
  for (const p of parts) { p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
  parts = parts.filter(p => p.life > 0 && p.y < H + 30);
  for (const w of words) w.t += dt;
  words = words.filter(w => w.t < 1);
}
function drawParts() {
  for (const p of parts) {
    rr(ctx, p.x - 1.5, p.y - 1.5, p.s + 3, p.s + 3, 2.5); ctx.fillStyle = INK; ctx.fill();
    rr(ctx, p.x, p.y, p.s, p.s, 1.6); ctx.fillStyle = p.c; ctx.fill();
  }
  for (const w of words) {
    const e = 1 - Math.pow(1 - w.t, 3);
    ctx.save(); ctx.globalAlpha = 1 - w.t * w.t;
    const wy = w.y - 26 - 22 * e;
    if (w.spr) { centerSprite(w.spr, w.x - 22, wy, 3); text(w.word, w.x + 14, wy, Math.round(w.size * (.7 + .5 * e)), { color: w.color || '#FFFFFF', lw: 6 }); }
    else text(w.word, w.x, wy, Math.round(w.size * (.7 + .5 * e)), { color: w.color || '#FFFFFF', lw: 6 });
    ctx.restore();
  }
}

/* ================= Sayı Bahçesi cüzdanı =================
   Bu oyun Sayı Bahçesi'nin içinde (savas/). Maç bileti ve dükkândan alınan eşyalar Sayı Bahçesi'nin
   kaydında tutulur; aynı site olduğu için localStorage ortak. Her maç bir bilet harcar. */
const Wallet = {
  key: 'sayi-bahcesi.v1',
  read() { try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch (e) { return {}; } },
  write(d) { try { localStorage.setItem(this.key, JSON.stringify(d)); } catch (e) {} },
  get tickets() { return this.read().tickets || 0; },
  useTicket() { const d = this.read(); if (!(d.tickets > 0)) return false; d.tickets--; this.write(d); return true; },
  inv(k) { const d = this.read(); return (d.inv && d.inv[k]) || 0; },
  useItem(k) { const d = this.read(); if (d.inv && d.inv[k] > 0) { d.inv[k]--; this.write(d); } },
};
const BUYABLE = ['balloon', 'paint', 'fish'];
const toGarden = () => { location.href = '../'; };

/* ================= Oyun durumu ================= */
let screen = 'title';
let play = null;
let flakes = Array.from({ length: 70 }, () => ({ x: rand(0, W), y: rand(0, H), v: rand(18, 40), s: Math.random() < .3 ? 4 : 2 }));
let time = 0;

function makeTeam(id, cpu, items) {
  return {
    id, cpu, items: items.slice(), hearts: 3,
    spr: id === 0 ? 'penguin' : 'cat', hitSpr: id === 0 ? 'penguinHit' : 'catHit',
    color: id === 0 ? '#2F7DE1' : '#E5483B',
    x: 0, y: 0, vx: 0, vy: 0, grounded: true, spawnCol: 0, walkAnim: 0,
    ammo: { snowball: Infinity, balloon: 1, paint: 1, fish: 0 }, item: 'snowball', hitShow: false, lostTurn: false,
  };
}
function spawnCol(T, c0) {
  for (let d = 0; d < COLS; d++) for (const s of [c0 + d, c0 - d]) {
    if (s >= 1 && s <= COLS - 2 && T.top(s) >= T.water) return s;
  }
  // Bütün kara oyulmuşsa karakter sonsuza dek suya düşmesin: küçük bir zemin çıkar.
  const c = clamp(c0, 1, COLS - 2);
  T.raise(c - 1, c + 1);
  return c;
}
function place(T, ch, c0) {
  const c = spawnCol(T, c0);
  ch.spawnCol = c; ch.x = c * B + B / 2; ch.y = T.surfaceY(c); ch.grounded = true; ch.vx = ch.vy = 0;
}

function startMatch(mode, li, mapKey, def) {
  if (!Wallet.useTicket()) { play = null; screen = 'noticket'; return; }
  beginMatch(mode, li, mapKey, def);
}
function beginMatch(mode, li, mapKey, def) {
  def = def || (mode === '1p' ? LEVELS[li] : mapDef(mapKey));
  const T = new Terrain(makeHeights(def.h), def.theme, def.water);
  const items = mode === '1p' ? def.items : ALL_ITEMS;
  const teams = [makeTeam(0, false, items), makeTeam(1, mode === '1p', items)];
  place(T, teams[0], def.p); place(T, teams[1], def.e);
  // Penguen (çocuk) bölümün verdiği eşyaların üstüne dükkândan aldıklarını da getirir.
  // Önce bedava olanlar harcanır (free), sonra dükkân stoğu.
  const kid = teams[0]; kid.free = {};
  for (const k of BUYABLE) {
    kid.free[k] = items.includes(k) ? kid.ammo[k] : 0;
    const own = Wallet.inv(k);
    kid.ammo[k] = kid.free[k] + own;
    if (own > 0 && !kid.items.includes(k)) kid.items.push(k);
  }
  kid.items = ITEM_ORDER.filter(i => kid.items.includes(i));
  parts = []; words = []; shake = 0;
  play = {
    mode, li, mapKey, def, T, teams, turn: 0, phase: 'banner', t: 0,
    proj: null, wind: 0, aim: null, walkDir: 0, walkLeft: WALK_BUDGET,
    ai: null, cpuShots: 0, winner: null, overT: 0, paused: false, acc: 0,
    turnNo: 0, drops: dropTurns(), plane: null, crates: [],
  };
  screen = 'play';
  beginTurn();
}
const cur = () => play.teams[play.turn];
const foe = () => play.teams[1 - play.turn];

function beginTurn() {
  const ch = cur();
  ch.hitShow = false;
  for (const t of play.teams) t.lostTurn = false;
  play.phase = 'banner'; play.t = 0; play.aim = null; play.ai = null; play.walkDir = 0; play.walkLeft = WALK_BUDGET;
  const wm = play.def.wind || 0;
  play.wind = wm ? Math.round(rand(-wm, wm)) : 0;
  if (!(ch.ammo[ch.item] > 0) || !ch.items.includes(ch.item)) ch.item = 'snowball';
  play.turnNo++;
  if (play.drops.includes(play.turnNo)) startDrop(); else Sound.play('turn');
}

/* ----- Sürpriz kutu: maç başına 2 kez, rastgele bir turun başında uçak bırakır ----- */
const CRATE_LOOT = [['heart', 35], ['fish', 35], ['balloon', 15], ['paint', 15]];
function dropTurns() {
  const a = 2 + Math.floor(rand(0, 3));          // 2.-4. tur
  return [a, a + 2 + Math.floor(rand(0, 3))];    // ilkinden 2-4 tur sonra
}
function pickLoot() {
  let n = rand(0, 100);
  for (const [k, w] of CRATE_LOOT) if ((n -= w) < 0) return k;
  return 'heart';
}
function startDrop() {
  const T = play.T;
  const far = c => play.teams.every(ch => Math.abs(c * B + B / 2 - ch.x) > 70);
  let cols = [];
  for (let c = 2; c <= COLS - 3; c++) if (T.top(c) >= T.water && far(c)) cols.push(c);
  if (!cols.length) for (let c = 2; c <= COLS - 3; c++) if (T.top(c) >= T.water) cols.push(c);
  const c = cols.length ? cols[Math.floor(rand(0, cols.length))] : spawnCol(T, COLS >> 1);
  const dir = Math.random() < .5 ? 1 : -1;
  play.plane = { x: dir > 0 ? -60 : W + 60, y: 96, vx: dir * 360, dropX: c * B + B / 2, crate: null };
  play.phase = 'drop'; play.t = 0;
  Sound.play('plane');
}
function updateAir(dt) {
  const T = play.T, pl = play.plane;
  if (pl) {
    pl.x += pl.vx * dt;
    if (!pl.crate && (pl.vx > 0 ? pl.x >= pl.dropX : pl.x <= pl.dropX)) {
      pl.crate = { x: pl.dropX, y: pl.y + 30, vy: 0, chute: true, grounded: false, loot: pickLoot() };
      play.crates.push(pl.crate);
    }
    if (pl.x < -80 || pl.x > W + 80) play.plane = null;
  }
  for (const cr of play.crates) {
    const sup = () => T.solidAt(cr.x - 8, cr.y) || T.solidAt(cr.x + 8, cr.y);
    if (cr.grounded && !sup()) { cr.grounded = false; cr.chute = false; cr.vy = 0; }
    if (!cr.grounded) {
      cr.vy = cr.chute ? 90 : Math.min(cr.vy + 900 * dt, 700);
      let dy = cr.vy * dt;
      while (dy > 0) {
        const st = Math.min(4, dy); cr.y += st; dy -= st;
        if (sup()) { cr.y = H - (Math.floor((H - 1 - cr.y) / B) + 1) * B; cr.vy = 0; cr.grounded = true; cr.chute = false; break; }
      }
      if (cr.y >= T.waterY) {
        cr.gone = true; Sound.play('splash');
        spawn(cr.x, T.waterY, 12, ['#C99A5B', '#4FB3F0', '#FFFFFF']);
      }
    }
    if (!cr.gone) for (const ch of play.teams) {
      if (Math.abs(ch.x - cr.x) < 20 && Math.abs(ch.y - cr.y) < 26) { collect(ch, cr); break; }
    }
  }
  play.crates = play.crates.filter(cr => !cr.gone);
}
function collect(ch, cr) {
  cr.gone = true;
  let k = cr.loot;
  if (k === 'heart' && ch.hearts >= 3) k = 'fish';
  if (k === 'heart') { ch.hearts++; ch.hitShow = false; }
  else {
    ch.ammo[k] = (ch.ammo[k] || 0) + 1;
    if (ch.free) ch.free[k] = (ch.free[k] || 0) + 1;   // kutudan gelen bedava, dükkân stoğundan önce harcanır
    if (!ch.items.includes(k)) ch.items = ITEM_ORDER.filter(i => i === k || ch.items.includes(i));
  }
  Sound.play('pickup');
  spawn(cr.x, cr.y - 12, 16, ['#FFD23F', '#FFFFFF', ch.color]);
  words.push({ x: cr.x, y: cr.y - 10, word: '+1', spr: k === 'heart' ? 'heart' : ITEMS[k].spr, size: 30, t: 0, color: '#FFD23F' });
}
function drawAir() {
  for (const cr of play.crates) {
    const x = cr.x - 12, y = cr.y - 24;
    if (cr.chute) {
      ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x - 2, y - 22); ctx.lineTo(x + 2, y); ctx.moveTo(x + 26, y - 22); ctx.lineTo(x + 22, y); ctx.stroke();
      drawSprite(ctx, SPR.chute, x - 3, y - 32, 3);
    }
    drawSprite(ctx, SPR.crate, x, y, 3);
  }
  const pl = play.plane;
  if (pl) drawSprite(ctx, SPR.plane, pl.x - 36, pl.y - 14, 4.5, { flip: pl.vx < 0 });
}

/* ----- Karakter fiziği ----- */
function onGround(T, ch) { return T.solidAt(ch.x - 8, ch.y) || T.solidAt(ch.x, ch.y) || T.solidAt(ch.x + 8, ch.y); }
function charPhysics(ch, dt) {
  const T = play.T;
  if (ch.grounded && !onGround(T, ch)) { ch.grounded = false; ch.vy = Math.max(ch.vy, 0); }
  if (ch.grounded) return;
  ch.vy = Math.min(ch.vy + 900 * dt, 700);
  ch.x = clamp(ch.x + ch.vx * dt, 14, W - 14);
  let dy = ch.vy * dt;
  if (dy <= 0) ch.y += dy;
  else while (dy > 0) {
    const s = Math.min(4, dy); ch.y += s; dy -= s;
    if (onGround(T, ch)) {
      const r = Math.floor((H - 1 - ch.y) / B);
      ch.y = H - (r + 1) * B; ch.vy = 0; ch.vx = 0; ch.grounded = true; break;
    }
  }
  if (ch.y > T.waterY + 14 || ch.y > H + 30) splash(ch);
}
// Bir karakter aynı turda en fazla bir kalp kaybeder (isabet + itilip suya düşme iki kalp götürmesin).
function loseHeart(ch) {
  ch.hitShow = true;
  if (ch.hearts <= 0 || ch.lostTurn) return false;
  ch.hearts--; ch.lostTurn = true;
  return true;
}
function splash(ch) {
  const T = play.T;
  Sound.play('splash');
  spawn(ch.x, T.waterY, 18, ['#4FB3F0', '#D6F1FF', '#FFFFFF']);
  words.push({ x: ch.x, y: T.waterY, word: 'ŞAPUR!', size: 26, t: 0 });
  loseHeart(ch);
  const c = spawnCol(T, ch.spawnCol);
  ch.x = c * B + B / 2; ch.y = T.surfaceY(c) - 90; ch.vx = 0; ch.vy = 0; ch.grounded = false;
}
function walk(ch, dir, dt) {
  const T = play.T;
  if (!ch.grounded || play.walkLeft <= 0) return;
  const sp = 70 * dt;
  const nx = clamp(ch.x + dir * sp, 14, W - 14);
  const fx = nx + dir * 9;
  if (T.solidAt(fx, ch.y - 2)) {
    const r = Math.floor((H - 1 - (ch.y - 2)) / B), c = Math.floor(fx / B);
    if (T.solid(c, r + 1) || T.solid(c, r + 2) || T.solid(c, r + 3)) return; // duvar çok yüksek
    ch.y = H - (r + 1) * B;
  }
  ch.x = nx; play.walkLeft -= sp; ch.walkAnim += dt;
}

/* ----- Mermi ----- */
function stepProj(p, dt) {
  const T = play.T, it = ITEMS[p.item];
  p.vx += play.wind * WIND_ACC * it.wind * dt;
  p.vy += GRAV * (it.grav || 1) * dt;
  p.x += p.vx * dt; p.y += p.vy * dt; p.t += dt;
  if (p.x < -60 || p.x > W + 60 || p.y > H + 40 || p.t > 9) return { type: 'out' };
  for (const ch of play.teams) {
    if (ch.id === p.owner && p.t < .4) continue;
    if (Math.abs(p.x - ch.x) < 15 && p.y > ch.y - 40 && p.y < ch.y) return { type: 'char', id: ch.id };
  }
  if (T.solidAt(p.x, p.y)) return { type: 'terrain' };
  if (p.y >= T.waterY) return { type: 'water' };
  return null;
}
function simulate(x, y, vx, vy, item, owner, maxT, path) {
  const p = { x, y, vx, vy, item, owner, t: 0 };
  let n = 0;
  while (p.t < maxT) {
    const hit = stepProj(p, SIM_DT);
    if (path && (n++ % 4 === 0)) path.push({ x: p.x, y: p.y });
    if (hit) return Object.assign(hit, { x: p.x, y: p.y });
  }
  return null;
}
function fire(vx, vy) {
  const ch = cur();
  play.proj = { x: ch.x, y: ch.y - 24, vx, vy, item: ch.item, owner: ch.id, t: 0, trail: [], bounced: false };
  if (ch.ammo[ch.item] !== Infinity) {
    ch.ammo[ch.item]--;
    if (ch.free) { if (ch.free[ch.item] > 0) ch.free[ch.item]--; else Wallet.useItem(ch.item); }
  }
  if (ch.cpu) play.cpuShots++;
  play.phase = 'fly'; play.aim = null; play.acc = 0;
  Sound.play('throw');
}
function explode(x, y, kind) {
  const p = play.proj, it = ITEMS[p.item], T = play.T;
  play.proj = null;
  play.phase = 'settle'; play.t = 0;
  if (kind === 'out') return;
  if (kind === 'water') {
    Sound.play('splash');
    spawn(x, T.waterY, 16, ['#4FB3F0', '#D6F1FF', '#FFFFFF']);
    words.push({ x, y: T.waterY, word: 'ŞAPUR!', size: 26, t: 0 });
  } else {
    T.carve(x, y, it.r, it.paintR || 0);
    Sound.play(it.sound);
    spawn(x, y, 26, it.colors);
    words.push({ x, y, word: it.word, size: 34, t: 0 });
    shake = 6;
  }
  if (kind !== 'water') for (const cr of play.crates) {
    if (!cr.gone && Math.hypot(cr.x - x, cr.y - 12 - y) < it.r + 12) collect(play.teams[p.owner], cr);
  }
  play.crates = play.crates.filter(cr => !cr.gone);
  for (const ch of play.teams) {
    if (ch.id === p.owner) continue; // kendine zarar yok
    const dx = ch.x - x, dy = (ch.y - 18) - y;
    if (Math.hypot(dx, dy) < it.r + 16) {
      if (loseHeart(ch)) Sound.play('hit');
      ch.vx = Math.sign(dx || 1) * 90; ch.vy = -220; ch.grounded = false;
    }
  }
}

/* ----- Bilgisayar rakip ----- */
function aiPlan() {
  const me = cur(), them = foe();
  let item = 'snowball';
  if (me.items.includes('balloon') && me.ammo.balloon > 0 && Math.random() < .35) item = 'balloon';
  else if (me.items.includes('paint') && me.ammo.paint > 0 && Math.random() < .3) item = 'paint';
  if (me.ammo.fish > 0 && Math.random() < .5) item = 'fish';
  const sx = me.x, sy = me.y - 24, dir = Math.sign(them.x - me.x) || -1;
  let best = null;
  for (let a = 15; a <= 80; a += 2.5) for (let pw = .3; pw <= 1.0001; pw += .025) {
    const ang = a * Math.PI / 180;
    const res = simulate(sx, sy, Math.cos(ang) * pw * VMAX * dir, -Math.sin(ang) * pw * VMAX, item, me.id, 6);
    if (!res) continue;
    let d = Math.hypot(res.x - them.x, res.y - (them.y - 18));
    if (res.type === 'char' && res.id === them.id) d -= 30;
    if (!best || d < best.d) best = { d, ang, pw };
  }
  if (!best) best = { ang: Math.PI / 4, pw: .7 };
  // Çocuk kolay kazansın diye hata payı: ilk atışlarda ve çocuğun tek kalbi kaldığında daha çok ıskalar.
  let e = play.def.err;
  if (play.cpuShots === 0) e *= 1.6;
  if (them.hearts === 1) e *= 1.4;
  if (them.hearts < me.hearts) e *= 1.25;
  const ang = best.ang + gauss() * e * .5;
  const pw = clamp(best.pw * (1 + gauss() * e), .2, 1);
  return { item, vx: Math.cos(ang) * pw * VMAX * dir, vy: -Math.sin(ang) * pw * VMAX, pw };
}

/* ----- Oyun döngüsü ----- */
function updatePlay(dt) {
  const T = play.T;
  play.t += dt;
  for (const ch of play.teams) charPhysics(ch, dt);
  updateAir(dt);
  const ch = cur();

  if (play.phase === 'drop') {
    const cr = play.plane && play.plane.crate;
    const done = play.plane ? cr && (cr.grounded || cr.gone) : true;
    if (done || play.t > 8) { play.phase = 'banner'; play.t = 0; Sound.play('turn'); }
  } else if (play.phase === 'banner') {
    if (play.t > 1.0) { play.phase = 'aim'; play.t = 0; }
  } else if (play.phase === 'aim') {
    if (ch.cpu) {
      if (!play.ai && play.t > .5) { play.ai = aiPlan(); ch.item = play.ai.item; }
      if (play.ai && play.t > 1.6) fire(play.ai.vx, play.ai.vy);
    } else if (play.walkDir) walk(ch, play.walkDir, dt);
  } else if (play.phase === 'fly') {
    const p = play.proj;
    play.acc += dt;
    while (play.acc >= SIM_DT && play.proj) {
      play.acc -= SIM_DT;
      const px = p.x, py = p.y;
      const hit = stepProj(p, SIM_DT);
      if (hit) {
        if (hit.type === 'terrain' && ITEMS[p.item].bounce && !p.bounced) {
          p.x = px; p.y = py; p.vy = -Math.abs(p.vy) * .5; p.vx *= .65; p.bounced = true;
          Sound.play('bounce');
        } else explode(p.x, p.y, hit.type);
      }
    }
    if (play.proj) { p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 6) p.trail.shift(); }
  } else if (play.phase === 'settle') {
    if (play.t > .9 && play.teams.every(c => c.grounded)) {
      if (!checkOver()) { play.turn = 1 - play.turn; beginTurn(); }
    }
  } else if (play.phase === 'over') {
    play.overT += dt;
    const happy = play.mode === '2p' || play.winner === 0;
    if (happy && play.overT < 3 && Math.random() < .5) confetti(2);
  }
  if (play.phase === 'aim' || play.phase === 'banner') checkOver();
}
function checkOver() {
  const dead = play.teams.find(c => c.hearts <= 0);
  if (!dead || !play.teams.every(c => c.grounded)) return false;
  play.phase = 'over'; play.overT = 0; play.winner = 1 - dead.id; play.walkDir = 0; play.aim = null;
  if (play.mode === '1p') {
    if (play.winner === 0) {
      const st = clamp(play.teams[0].hearts, 1, 3);
      if (st > Store.stars[play.li]) { Store.stars[play.li] = st; Store.save(); }
      Sound.play('win');
    } else Sound.play('lose');
  } else Sound.play('win');
  return true;
}

/* ================= Ekranlar ================= */
let titleT = null, stripCanvas = null, thumbs = null;
function titleTerrain() {
  if (!titleT) titleT = new Terrain(makeHeights(LEVELS[1].h), 'grass', LEVELS[1].water);
  return titleT;
}
function drawWorldBg(theme, T) {
  drawSky(ctx, W, H, theme.sky);
  if (theme.sun) drawSun(screen === 'play' ? 560 : 730, screen === 'play' ? 86 : 96);
  drawClouds(time);
  if (T) { drawWater(T); ctx.drawImage(T.canvas, 0, 0, W, H); }
}
function drawFlakes(dt) {
  for (const f of flakes) {
    f.y += f.v * dt; f.x += Math.sin(time + f.v) * 10 * dt + (play ? play.wind * 6 * dt : 0);
    if (f.y > H) { f.y = -4; f.x = rand(0, W); }
    if (f.x < 0) f.x += W; if (f.x > W) f.x -= W;
    ell(ctx, f.x, f.y, f.s * .7, f.s * .7); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill();
  }
}
function drawChar(ch, isTurn) {
  const bob = ch.walkAnim > 0 && play && play.walkDir && isTurn ? Math.abs(Math.sin(ch.walkAnim * 14)) * 2 : 0;
  const x = ch.x - 20, y = ch.y - 43 - bob; // vektör karakter, isabet kutusundan biraz büyük çizilir
  drawSprite(ctx, SPR[ch.hitShow ? ch.hitSpr : ch.spr], x, y, 3.3);
  if (ch.hitShow) drawSprite(ctx, SPR.snowhat, x, y - 6, 3);
}

/* ----- Açılış ----- */
function drawTitle() {
  const T = titleTerrain();
  drawWorldBg(THEMES.grass, T);
  const pc = spawnCol(T, 8), cc = spawnCol(T, 46);
  const b1 = Math.abs(Math.sin(time * 3)) * 4, b2 = Math.abs(Math.sin(time * 3 + 1.4)) * 4;
  drawSprite(ctx, SPR.penguin, pc * B + B / 2 - 18, T.surfaceY(pc) - 39 - b1, 3);
  drawSprite(ctx, SPR.cat, cc * B + B / 2 - 18, T.surfaceY(cc) - 39 - b2, 3);

  text('WAR OF BLOCKS', W / 2, 82, 64, { lw: 10 });
  homeButton(toGarden);
  panel(W - 150, 14, 136, 56, '#FFD23F');
  text('🎟️ ' + Wallet.tickets, W - 82, 43, 30, { color: INK, stroke: null });

  const bw = 230, bh = 136, gap = 40, y = 140;
  button(W / 2 - bw - gap / 2, y, bw, bh, () => { screen = 'levels'; }, (x, yy, w, h) => {
    centerSprite('penguin', x + w / 2 - 40, yy + 52, 4);
    text('×', x + w / 2, yy + 54, 28, { color: INK, stroke: null });
    centerSprite('computer', x + w / 2 + 42, yy + 56, 5);
    text('1 OYUNCU', x + w / 2, yy + h - 28, 26, { color: INK, stroke: null });
  }, { frame: '#2F7DE1', fill: '#E6F2FF' });
  button(W / 2 + gap / 2, y, bw, bh, () => { screen = 'maps'; thumbs = null; }, (x, yy, w, h) => {
    centerSprite('penguin', x + w / 2 - 40, yy + 52, 4);
    text('×', x + w / 2, yy + 54, 28, { color: INK, stroke: null });
    centerSprite('cat', x + w / 2 + 40, yy + 52, 4);
    text('2 OYUNCU', x + w / 2, yy + h - 28, 26, { color: INK, stroke: null });
  }, { frame: '#E5483B', fill: '#FFEDEB' });
}

/* ----- Bilet bitti ----- */
function drawNoTicket() {
  drawWorldBg(THEMES.grass, null);
  ctx.drawImage(levelStrip(), 0, H - 5 * B);
  homeButton(() => { screen = 'title'; });
  const w = 440, h = 250, x = W / 2 - w / 2, y = 60;
  panel(x, y, w, h, '#FFD23F');
  text('🎟️', W / 2, y + 62, 64, { stroke: null });
  text('BİLET BİTTİ', W / 2, y + 120, 36, { color: INK, stroke: null });
  text('Bir matematik turu bitir, bilet kazan!', W / 2, y + 156, 21, { color: '#6B7890', stroke: null });
  button(W / 2 - 120, y + h - 70, 240, 54, toGarden, (bx, by, bw, bh) => text('🌻 SAYI BAHÇESİ', bx + bw / 2, by + bh / 2 + 1, 24, { color: INK, stroke: null }), { frame: '#5DBB4A' });
}

/* ----- Bölüm haritası ----- */
const NODES = [[110, 236], [220, 176], [330, 240], [534, 236], [644, 176], [754, 240]];
function levelStrip() {
  if (stripCanvas) return stripCanvas;
  stripCanvas = document.createElement('canvas'); stripCanvas.width = W * TS; stripCanvas.height = 5 * B * TS;
  const c = stripCanvas.getContext('2d'); c.scale(TS, TS);
  for (let col = 0; col < COLS; col++) for (let r = 0; r < 5; r++) {
    const snow = col >= COLS / 2;
    const type = r === 0 ? (snow ? 'snow' : 'grass') : r < 3 ? 'dirt' : 'stone';
    drawBlock(c, type, col * B, r * B + 1, B, col, r, r === 0);
  }
  return stripCanvas;
}
function drawLevels() {
  drawWorldBg(THEMES.grass, null);
  ctx.drawImage(levelStrip(), 0, H - 5 * B, W, 5 * B);
  homeButton(() => { screen = 'title'; });

  ISLANDS.forEach((isl, i) => text(isl.name, i === 0 ? 220 : 644, 100, 30, { lw: 7 }));
  // yol
  for (let i = 0; i < NODES.length - 1; i++) {
    const [x1, y1] = NODES[i], [x2, y2] = NODES[i + 1];
    for (let k = 1; k < 8; k++) {
      const t = k / 8, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
      ell(ctx, x, y, 5.5, 5.5); ctx.fillStyle = INK; ctx.fill();
      ell(ctx, x, y, 3.5, 3.5); ctx.fillStyle = Store.unlocked(i + 1) ? '#FFD23F' : '#FFFFFF'; ctx.fill();
    }
  }
  let next = Store.stars.findIndex(s => s === 0);
  NODES.forEach(([cx, cy], i) => {
    const open = Store.unlocked(i), isl = ISLANDS[LEVELS[i].island], s = 76;
    button(cx - s / 2, cy - s / 2, s, s, open ? () => startMatch('1p', i) : null, (x, y, w, h) => {
      if (open) text(String(i + 1), x + w / 2, y + h / 2 + 2, 38, { color: INK, stroke: null });
      else centerSprite('lock', x + w / 2, y + h / 2, 5, { outline: false });
    }, { frame: open ? isl.color : '#B9C6D6', fill: open ? '#FFFFFF' : '#E3E9F0', disabled: !open });
    if (open) for (let k = 0; k < 3; k++) drawSprite(ctx, SPR[k < Store.stars[i] ? 'star' : 'starEmpty'], cx - 33 + k * 23, cy + s / 2 + 10, 2);
    if (i === next) {
      const bob = Math.abs(Math.sin(time * 4)) * 6;
      drawSprite(ctx, SPR.penguin, cx - 18, cy - s / 2 - 50 - bob, 3);
    }
  });
}
function homeButton(fn) {
  button(14, 14, 56, 56, fn, (x, y, w, h) => centerSprite('home', x + w / 2, y + h / 2, 3, { outline: false }));
}

/* ----- 2 oyuncu harita seçimi ----- */
function drawMaps() {
  drawWorldBg(THEMES.grass, null);
  ctx.drawImage(levelStrip(), 0, H - 5 * B, W, 5 * B);
  homeButton(() => { screen = 'title'; });
  text('HARİTA SEÇ', W / 2, 52, 36, { lw: 8 });
  if (!thumbs) thumbs = {
    grass: new Terrain(makeHeights(LEVELS[1].h), 'grass', LEVELS[1].water).thumb(),
    snow: new Terrain(makeHeights(LEVELS[3].h), 'snow', LEVELS[3].water).thumb(),
  };
  const cw = 244, chh = 196, gap = 22, x0 = W / 2 - (cw * 3 + gap * 2) / 2, y = 100;
  [['grass', 'ÇİMEN', '#5DBB4A'], ['snow', 'KAR', '#7CC4EA'], ['random', 'SÜRPRİZ', '#E84BB0']].forEach(([key, label, col], i) => {
    button(x0 + i * (cw + gap), y, cw, chh, () => startMatch('2p', null, key), (x, yy, w, h) => {
      const tx = x + 14, ty = yy + 14;
      ctx.save(); rr(ctx, tx, ty, 216, 100, 10); ctx.clip();
      if (thumbs[key]) ctx.drawImage(thumbs[key], tx, ty);
      else {
        ctx.fillStyle = lin(ctx, tx, ty, tx, ty + 100, ['#FF8AD2', '#E84BB0']); ctx.fillRect(tx, ty, 216, 100);
        for (let k = 0; k < 18; k++) { rr(ctx, tx + hash(k, 1, 2) * 200, ty + hash(k, 3, 4) * 84, 16, 16, 4); ctx.fillStyle = ['#FF9AD8', '#FFD23F', '#7CC4EA', '#5DBB4A'][k % 4]; ctx.fill(); }
        centerSprite('question', tx + 108, ty + 50, 8);
      }
      ctx.restore();
      rr(ctx, tx, ty, 216, 100, 10); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
      text(label, x + w / 2, yy + h - 36, 30, { color: INK, stroke: null });
    }, { frame: col });
  });
}

/* ----- Oyun ekranı ----- */
function drawPlay(dt) {
  const T = play.T, ch = cur();
  ctx.save();
  if (shake > 0) { ctx.translate(Math.round(rand(-shake, shake)), Math.round(rand(-shake, shake))); }
  drawWorldBg(T.theme, T);
  drawAir();
  for (const c of play.teams) drawChar(c, c === ch);

  if (play.phase === 'banner' || play.phase === 'aim') {
    const bob = Math.sin(time * 6) * 3;
    drawSprite(ctx, SPR.arrow, ch.x - 10, ch.y - 64 + bob, 3);
  }
  if (play.phase === 'aim') drawAim(ch);
  if (play.proj) drawProj(play.proj);
  drawParts();
  if (T.theme.flakes) drawFlakes(play.paused ? 0 : dt);
  ctx.restore();

  drawHud();
  if (play.phase === 'banner') drawBanner();
  if (play.phase === 'over' && play.overT > .9) drawOver();
  if (play.paused) drawPause();
}
function drawAim(ch) {
  const hx = ch.x, hy = ch.y - 24;
  let vx, vy, pull = 0;
  if (ch.cpu) {
    if (!play.ai) { text('...', ch.x, ch.y - 80, 28, { color: '#FFFFFF' }); return; }
    const k = clamp((play.t - .5) / .9, 0, 1);
    vx = play.ai.vx; vy = play.ai.vy; pull = play.ai.pw * k;
  } else {
    if (!play.aim) return;
    const dx = play.aim.x0 - play.aim.x, dy = play.aim.y0 - play.aim.y, len = Math.hypot(dx, dy);
    if (len < AIM_MIN) return;
    const pw = Math.min(len / PULL_MAX, 1);
    vx = dx / len * pw * VMAX; vy = dy / len * pw * VMAX; pull = pw;
    // Nişan noktaları yolun yalnızca başını gösterir (preview: px); gerisini çocuk tahmin eder.
    const path = [], total = play.def.preview || 110;
    simulate(hx, hy, vx, vy, ch.item, ch.id, 3, path);
    let left = total, px = hx, py = hy;
    for (const q of path) {
      left -= Math.hypot(q.x - px, q.y - py); px = q.x; py = q.y;
      if (left <= 0) break;
      const f = left / total, r = Math.round(2 + 3 * f);
      ctx.save(); ctx.globalAlpha = .35 + .65 * f;
      ell(ctx, q.x, q.y, r + 1.6, r + 1.6); ctx.fillStyle = INK; ctx.fill();
      ell(ctx, q.x, q.y, r, r); ctx.fillStyle = '#FFFFFF'; ctx.fill();
      ctx.restore();
    }
  }
  const sp = Math.hypot(vx, vy) || 1;
  const bx = hx - vx / sp * pull * 48, by = hy - vy / sp * pull * 48;
  ctx.strokeStyle = '#8A5D39'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(hx - 8, hy - 4); ctx.lineTo(bx, by); ctx.lineTo(hx + 8, hy - 4); ctx.stroke();
  const spr = SPR[ITEMS[ch.item].spr];
  drawSprite(ctx, spr, bx - spr.w * 1.5, by - spr.h * 1.5, 3);
}
function drawProj(p) {
  p.trail.forEach((q, i) => {
    ctx.globalAlpha = (i + 1) / p.trail.length * .5;
    ell(ctx, q.x, q.y, 3.5, 3.5); ctx.fillStyle = '#FFFFFF'; ctx.fill();
  });
  ctx.globalAlpha = 1;
  const spr = SPR[ITEMS[p.item].spr];
  if (p.y < -4) {
    // ekranın üstünde: nerede olduğunu göster
    const x = clamp(p.x, 20, W - 20);
    drawSprite(ctx, { name: 'arrowUp', w: 3, h: 3 }, x - 6, 4, 4);
    drawSprite(ctx, spr, x - spr.w, 20, 2);
  } else drawSprite(ctx, spr, p.x - spr.w * 1.5, p.y - spr.h * 1.5, 3, { flip: p.item === 'fish' && p.vx > 0 });
}
function drawHud() {
  const [a, b] = play.teams;
  panel(12, 12, 176, 56, a.color);
  drawSprite(ctx, SPR.penguin, 24, 21, 3, { outline: false });
  for (let i = 0; i < 3; i++) drawSprite(ctx, SPR[i < a.hearts ? 'heart' : 'heartEmpty'], 70 + i * 36, 28, 4, { outline: false });
  panel(W - 188, 12, 176, 56, b.color);
  drawSprite(ctx, SPR.cat, W - 176, 21, 3, { outline: false });
  for (let i = 0; i < 3; i++) drawSprite(ctx, SPR[i < b.hearts ? 'heart' : 'heartEmpty'], W - 130 + i * 36, 28, 4, { outline: false });

  // rüzgâr
  panel(W / 2 - 62, 12, 124, 56, '#2BB3A3');
  const n = Math.abs(play.wind), flip = play.wind < 0;
  for (let i = 0; i < 3; i++) {
    const idx = flip ? 2 - i : i;
    drawSprite(ctx, SPR.chevron, W / 2 - 40 + i * 28, 30, 4, { outline: false, flip, pal: { X: idx < n ? '#2BB3A3' : '#D7E6EC' } });
  }

  if (screen === 'play' && play.phase !== 'over') {
    button(200, 12, 56, 56, () => { play.paused = true; }, (x, y, w, h) => centerSprite('pause', x + w / 2, y + h / 2, 4, { outline: false }), { frame: '#B9C6D6' });
  }

  const ch = cur();
  if (play.phase === 'aim' && !ch.cpu && !play.paused) {
    // eşyalar
    const its = ch.items, sw = 64, gap = 12, total = its.length * sw + (its.length - 1) * gap;
    its.forEach((k, i) => {
      const x = W / 2 - total / 2 + i * (sw + gap), y = H - sw - 12;
      const left = ch.ammo[k], empty = !(left > 0);
      button(x, y, sw, sw, empty ? null : () => { ch.item = k; }, (bx, by, w, h) => {
        const spr = SPR[ITEMS[k].spr], s = k === 'balloon' ? 4 : 5;
        drawSprite(ctx, spr, bx + (w - spr.w * s) / 2, by + (h - spr.h * s) / 2, s);
        if (left !== Infinity) {
          ell(ctx, bx + w - 12, by + h - 12, 10, 10); ctx.fillStyle = INK; ctx.fill();
          text(String(left), bx + w - 12, by + h - 13, 14, { stroke: null });
        }
      }, { frame: ch.item === k ? '#FFD23F' : '#B9C6D6', disabled: empty });
    });
    // yürüme
    const canWalk = play.walkLeft > 0;
    [[-1, 14], [1, 86]].forEach(([dir, x]) => {
      button(x, H - 76, 60, 60, null, (bx, by, w, h) => centerSprite('play', bx + w / 2, by + h / 2, 4, { outline: false, flip: dir < 0 }), {
        frame: '#B9C6D6', disabled: !canWalk,
        onDown: () => { if (canWalk) play.walkDir = dir; }, onUp: () => { play.walkDir = 0; },
      });
    });
    rr(ctx, 14, H - 11, 132, 8, 4); ctx.fillStyle = INK; ctx.fill();
    const wl = clamp(play.walkLeft / WALK_BUDGET, 0, 1);
    if (wl > .03) { rr(ctx, 16, H - 9, 128 * wl, 4, 2); ctx.fillStyle = '#7FE05C'; ctx.fill(); }
  }
}
function drawBanner() {
  const ch = cur(), t = play.t;
  const a = t < .15 ? t / .15 : t > .85 ? (1 - t) / .15 : 1;
  ctx.save(); ctx.globalAlpha = clamp(a, 0, 1);
  const w = 380, h = 112, x = W / 2 - w / 2, y = 84;
  panel(x, y, w, h, ch.color);
  drawSprite(ctx, SPR[ch.spr], x + 28, y + 22, 5, { outline: false });
  const msg = play.mode === '1p' ? (ch.cpu ? 'SIRA KEDİDE' : 'SIRA SENDE!') : (ch.id === 0 ? 'SIRA MAVİDE!' : 'SIRA KIRMIZIDA!');
  text(msg, x + 112 + (w - 112) / 2 - 10, y + h / 2, 30, { color: INK, stroke: null });
  ctx.restore();
}
function drawOver() {
  ctx.fillStyle = 'rgba(30,34,51,.45)'; ctx.fillRect(0, 0, W, H);
  const w = 440, h = 300, x = W / 2 - w / 2, y = 50;
  const win = play.teams[play.winner];
  const humanWon = play.mode === '1p' && play.winner === 0;
  const humanLost = play.mode === '1p' && play.winner === 1;
  panel(x, y, w, h, humanLost ? '#B9C6D6' : win.color);
  const bob = Math.abs(Math.sin(time * 5)) * 8;
  const sprKey = humanLost ? 'penguin' : win.spr;
  drawSprite(ctx, SPR[sprKey], W / 2 - 36, y + 26 - bob, 6);
  const msg = humanWon ? 'KAZANDIN!' : humanLost ? 'TEKRAR DENE!' : 'KAZANDI!';
  text(msg, W / 2, y + 128, 40, { color: humanLost ? INK : win.color, stroke: humanLost ? null : INK, lw: 7 });
  if (humanWon) for (let k = 0; k < 3; k++) drawSprite(ctx, SPR[k < play.teams[0].hearts ? 'star' : 'starEmpty'], W / 2 - 75 + k * 52, y + 160, 5);

  const bs = 70, by = y + h - bs - 22;
  const btns = [['home', () => { screen = play.mode === '1p' ? 'levels' : 'maps'; play = null; }]];
  btns.push(['retry', () => startMatch(play.mode, play.li, play.mapKey, play.mapKey === 'random' ? null : play.def)]);
  if (humanWon && play.li < LEVELS.length - 1) btns.push(['play', () => startMatch('1p', play.li + 1)]);
  const total = btns.length * bs + (btns.length - 1) * 20;
  btns.forEach(([icon, fn], i) => {
    const bx = W / 2 - total / 2 + i * (bs + 20);
    button(bx, by, bs, bs, fn, (xx, yy, ww, hh) => centerSprite(icon, xx + ww / 2, yy + hh / 2, 4, { outline: false }),
      { frame: icon === 'play' ? '#5DBB4A' : '#FFD23F' });
  });
  if (humanWon && play.li === LEVELS.length - 1) text('HEPSİNİ BİTİRDİN!', W / 2, y + h + 26, 26, { lw: 6 });
}
function drawPause() {
  ctx.fillStyle = 'rgba(30,34,51,.55)'; ctx.fillRect(0, 0, W, H);
  const bs = 96, gap = 28, total = bs * 3 + gap * 2, x0 = W / 2 - total / 2, y = H / 2 - bs / 2;
  [['play', () => { play.paused = false; }, '#5DBB4A'],
   ['retry', () => startMatch(play.mode, play.li, play.mapKey, play.mapKey === 'random' ? null : play.def), '#FFD23F'],
   ['home', () => { screen = play.mode === '1p' ? 'levels' : 'maps'; play = null; }, '#FFD23F']].forEach(([icon, fn, col], i) => {
    button(x0 + i * (bs + gap), y, bs, bs, fn, (xx, yy, ww, hh) => centerSprite(icon, xx + ww / 2, yy + hh / 2, 6, { outline: false }), { frame: col });
  });
}

/* ================= Dokunma ================= */
const pointer = { id: null, btn: null };
function toLogical(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
}
canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  Sound.unlock();
  if (pointer.id !== null) return;
  pointer.id = e.pointerId;
  try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  const p = toLogical(e);
  for (let i = buttons.length - 1; i >= 0; i--) {
    const b = buttons[i];
    if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
      if (b.disabled) return;
      pointer.btn = b;
      if (b.onDown) b.onDown();
      if (b.onTap) { Sound.play('click'); b.onTap(); }
      return;
    }
  }
  if (screen === 'play' && play && !play.paused && play.phase === 'aim' && !cur().cpu) {
    play.aim = { x0: p.x, y0: p.y, x: p.x, y: p.y };
  }
});
canvas.addEventListener('pointermove', e => {
  if (e.pointerId !== pointer.id) return;
  if (play && play.aim) { const p = toLogical(e); play.aim.x = p.x; play.aim.y = p.y; }
});
function pointerEnd(e) {
  if (e.type === 'pointerup') Sound.unlock();
  if (e.pointerId !== pointer.id) return;
  pointer.id = null;
  if (pointer.btn && pointer.btn.onUp) pointer.btn.onUp();
  pointer.btn = null;
  if (screen === 'play' && play && play.aim && play.phase === 'aim') {
    const p = toLogical(e);
    const dx = play.aim.x0 - p.x, dy = play.aim.y0 - p.y, len = Math.hypot(dx, dy);
    play.aim = null;
    if (e.type === 'pointerup' && len >= AIM_MIN) {
      const pw = Math.min(len / PULL_MAX, 1);
      fire(dx / len * pw * VMAX, dy / len * pw * VMAX);
    }
  }
}
canvas.addEventListener('pointerup', pointerEnd);
canvas.addEventListener('pointercancel', pointerEnd);
['gesturestart', 'gesturechange', 'dblclick', 'contextmenu'].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
['touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, () => Sound.unlock(), { passive: true }));
document.addEventListener('visibilitychange', () => { if (document.hidden && play && play.phase !== 'over') play.paused = true; });
const portrait = window.matchMedia('(orientation: portrait)');
const onOrient = () => { if (portrait.matches && play && play.phase !== 'over') play.paused = true; resize(); };
if (portrait.addEventListener) portrait.addEventListener('change', onOrient); else if (portrait.addListener) portrait.addListener(onOrient);

/* ================= Ana döngü ================= */
let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  time += dt;
  if (screen === 'play' && play && !play.paused) updatePlay(dt);
  if (!(play && play.paused)) updateParts(dt);
  shake = Math.max(0, shake - dt * 30);

  ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  buttons = [];
  if (screen === 'title') { drawTitle(); drawParts(); }
  else if (screen === 'levels') drawLevels();
  else if (screen === 'maps') drawMaps();
  else if (screen === 'noticket') drawNoTicket();
  else if (screen === 'play' && play) drawPlay(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Test ve hata ayıklama için küçük bir kapı (oyunu etkilemez)
window.__wob = { get play() { return play; }, get screen() { return screen; }, startMatch, beginMatch, Wallet, Store, LEVELS, fire, aiPlan, walk, startDrop, penguinArt, catArt, drawBlock };
})();
