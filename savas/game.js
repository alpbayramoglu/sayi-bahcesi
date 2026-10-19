/* War of Blocks (Kartopu Savaşı) — 6 yaş için sıra tabanlı, Worms tarzı oyun. Sayı Bahçesi'nin içinde.
   Ekran 864x400 mantıksal çözünürlük; dünya ekrandan geniş olabilir, kamera yatayda kayar.
   23 eşya: sapanla atılanlar, sayı seçilerek kullanılanlar (cetvel, rüzgâr, sayma) ve savunma eşyaları.
   Takımlar 1-3 karakter. */
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
const HP_MAX = 100;        // karakter gücü
const WATER_DMG = 20;      // suya düşünce
const FALL_SAFE = 64;      // bu yükseklikten (px) fazla düşen hasar alır
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
  if (type === 'wood') { c.fillStyle = 'rgba(90,50,20,.35)'; c.fillRect(x + 2, y + b * .5, b - 4, 1.2); }
  if (type === 'brick') { c.fillStyle = 'rgba(70,60,50,.28)'; c.fillRect(x + 2, y + b * .5, b - 4, 1.2); c.fillRect(x + b * .5, y + 2, 1.2, b * .46); }
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


/* ================= Arazi =================
   Dünya artık ekrandan geniş olabilir (T.cols sütun). Yapılar (kale, gemi, duvar, köprü) hücre başına
   malzemeyle tutulur. Patlamada yalnızca etkilenen sütunlar yeniden çizilir. */
Object.assign(BLOCK, {
  wood: ['#D29A5E', '#9E6A38'], brick: ['#DCD5CB', '#A8A094'], ice: ['#E2F7FF', '#9BD8F6'], snowwall: ['#FFFFFF', '#D3E6F4'],
});
const MAT = { wood: 1, brick: 2, ice: 3, snowwall: 4 }, MAT_TYPE = [null, 'wood', 'brick', 'ice', 'snowwall'];
const UNIT = 48;   // sayı cetvelinin bir adımı = 3 blok
const unitOf = x => Math.floor(x / UNIT), unitX = u => u * UNIT + UNIT / 2;

class Terrain {
  constructor(heights, themeKey, water) {
    this.cols = heights.length; this.w = this.cols * B;
    this.h0 = heights; this.themeKey = themeKey; this.theme = THEMES[themeKey]; this.water = water;
    const n = this.cols * ROWS;
    this.cells = new Uint8Array(n); this.paint = new Uint8Array(n); this.mat = new Uint8Array(n);
    this.flags = [];
    for (let c = 0; c < this.cols; c++) for (let r = 0; r < ROWS; r++) this.cells[c * ROWS + r] = r < heights[c] ? 1 : 0;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.w * TS; this.canvas.height = H * TS;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(TS, TS);
    // Lekeler (boya, karpuz suyu, kar izi) ayrı bir katmanda; yalnızca blokların üstünde görünür
    this.decal = document.createElement('canvas');
    this.decal.width = this.w * TS; this.decal.height = H * TS;
    this.dctx = this.decal.getContext('2d'); this.dctx.scale(TS, TS);
    this.render();
  }
  splat(x, y, col, size, drips = 0, alpha = 1) {
    const c = this.dctx;
    c.save(); c.globalAlpha = alpha; c.fillStyle = col;
    ell(c, x, y, size * .55, size * .42); c.fill();
    for (let i = 0; i < 12; i++) { const a = rand(0, 6.28), d = size * rand(.4, 1.1), r = rand(1.5, size * .17); ell(c, x + Math.cos(a) * d, y + Math.sin(a) * d * .75, r, r); c.fill(); }
    for (let i = 0; i < 5; i++) { const a = rand(0, 6.28), d = size * rand(.5, .95); c.save(); c.translate(x + Math.cos(a) * d * .5, y + Math.sin(a) * d * .4); c.rotate(a); ell(c, 0, 0, d * .5, 1.6); c.fill(); c.restore(); }
    c.restore();
    this.maskDecal(x - size * 1.5, size * 3);
    for (let i = 0; i < drips; i++) {
      const dx = x + rand(-size * .7, size * .7), dy = y + rand(-size * .15, size * .35);
      if (this.solidAt(dx, dy)) fxs.push(dripFx(this, dx, dy, col, alpha));
    }
  }
  maskDecal(x0, w) {
    const c = this.dctx;
    c.save(); c.beginPath(); c.rect(x0, 0, w, H); c.clip();
    c.globalCompositeOperation = 'destination-in'; c.drawImage(this.canvas, 0, 0, this.w, H);
    c.restore();
  }
  get maxUnit() { return Math.floor(this.w / UNIT) - 1; }
  solid(c, r) { return c >= 0 && c < this.cols && r >= 0 && r < ROWS && this.cells[c * ROWS + r] === 1; }
  solidAt(x, y) { return this.solid(Math.floor(x / B), Math.floor((H - 1 - y) / B)); }
  get waterY() { return H - this.water * B; }
  top(c) { for (let r = ROWS - 1; r >= 0; r--) if (this.solid(c, r)) return r; return -1; }
  surfaceY(c) { return H - (this.top(c) + 1) * B; }
  land(c) { return this.top(c) >= this.water; }               // üstünde durulabilir mi (su değil)
  typeAt(c, r) {
    const m = this.mat[c * ROWS + r]; if (m) return MAT_TYPE[m];
    const d = this.h0[c] - 1 - r;
    if (this.themeKey === 'snow') return d === 0 ? 'snow' : d <= 2 ? 'dirt' : 'stone';
    const low = this.h0[c] <= this.water + 1;
    if (d === 0) return low ? 'sand' : 'grass';
    if (d <= 2) return low ? 'sand' : 'dirt';
    return 'stone';
  }
  render(c0 = 0, c1 = this.cols - 1) {
    c0 = Math.max(0, c0); c1 = Math.min(this.cols - 1, c1);
    const ctx = this.ctx;
    ctx.clearRect(c0 * B, 0, (c1 - c0 + 1) * B, H);
    ctx.save(); ctx.beginPath(); ctx.rect(c0 * B, 0, (c1 - c0 + 1) * B, H); ctx.clip();
    // komşu sütunlar da çizilir ama kırpılır; blok kenarları taşsa bile dikiş izi kalmaz
    for (let c = Math.max(0, c0 - 1); c <= Math.min(this.cols - 1, c1 + 1); c++) for (let r = 0; r < ROWS; r++) {
      if (!this.solid(c, r)) continue;
      const x = c * B, y = H - (r + 1) * B;
      drawBlock(ctx, this.typeAt(c, r), x, y, B, c, r, !this.solid(c, r + 1));
      if (this.paint[c * ROWS + r]) {
        rr(ctx, x + .5, y + .5, B - 1, B - 1, 3.5); ctx.fillStyle = 'rgba(232,75,176,.55)'; ctx.fill();
        if (hash(c, r, 9) < .5) { ell(ctx, x + 6, y + 6, 2.5, 2.5); ctx.fillStyle = 'rgba(255,170,224,.85)'; ctx.fill(); }
      }
    }
    ctx.restore();
  }
  carve(x, y, rad) {
    const c0 = Math.max(0, Math.floor((x - rad) / B)), c1 = Math.min(this.cols - 1, Math.floor((x + rad) / B));
    for (let c = c0; c <= c1; c++) for (let r = 0; r < ROWS; r++) {
      const dx = c * B + B / 2 - x, dy = H - (r + .5) * B - y, d2 = dx * dx + dy * dy, i = c * ROWS + r;
      if (d2 < rad * rad) { this.cells[i] = 0; this.mat[i] = 0; }
    }
    this.render(c0, c1);
    this.maskDecal(c0 * B - B, (c1 - c0 + 3) * B);   // kazılan yerin lekesi de gider
  }
  raise(c0, c1) {
    for (let c = Math.max(0, c0); c <= Math.min(this.cols - 1, c1); c++) for (let r = 0; r <= this.water; r++) this.cells[c * ROWS + r] = 1;
    this.render(c0, c1);
  }
  build(list, m) {
    let lo = Infinity, hi = -1;
    for (const [c, r] of list) {
      if (c < 0 || c >= this.cols || r < 0 || r >= ROWS) continue;
      const i = c * ROWS + r; this.cells[i] = 1; this.mat[i] = m; this.paint[i] = 0;
      lo = Math.min(lo, c); hi = Math.max(hi, c);
    }
    if (hi >= 0) this.render(lo, hi);
  }
  thumb(s = 4) {
    const cv = document.createElement('canvas');
    cv.width = this.cols * s; cv.height = ROWS * s;
    const ctx = cv.getContext('2d');
    drawSky(ctx, cv.width, cv.height, this.theme.sky);
    for (let c = 0; c < this.cols; c++) for (let r = 0; r < ROWS; r++) {
      const x = c * s, y = (ROWS - 1 - r) * s;
      if (this.solid(c, r)) { const t = this.typeAt(c, r); ctx.fillStyle = BASE_COLOR[t] || BLOCK[t][1]; ctx.fillRect(x, y, s, s); }
      else if (r < this.water) { ctx.fillStyle = this.theme.water[1]; ctx.fillRect(x, y, s, s); }
    }
    return cv;
  }
}

function makeHeights(fn, cols = COLS) {
  const a = [];
  for (let c = 0; c < cols; c++) a.push(clamp(Math.round(fn(c)), 1, ROWS - 7));
  return a;
}
// Taş kale: zeminin en yüksek yerine oturur, iki yanında kule, üstünde mazgallar
function castle(T, c0, w = 7, h = 5) {
  let base = 0;
  for (let c = c0; c < c0 + w; c++) base = Math.max(base, T.top(c) + 1);
  const cells = [];
  for (let c = c0; c < c0 + w; c++) {
    const tower = c - c0 < 2 || c0 + w - 1 - c < 2, top = base + h - 1 + (tower ? 2 : 0);
    for (let r = 0; r <= top; r++) if (!T.solid(c, r) || r >= base) cells.push([c, r]);
    if (!tower && (c - c0) % 2 === 0) cells.push([c, top + 1]);
    if (tower && (c - c0 === 0 || c0 + w - 1 - c === 0)) cells.push([c, top + 1]);
  }
  T.build(cells, MAT.brick);
}
// Ahşap gemi: güverte suyun hemen üstünde, ortada direk ve bayrak
function ship(T, c0, len = 10) {
  const wl = T.water, cells = [];
  for (let c = c0 + 2; c < c0 + len - 2; c++) cells.push([c, wl - 2]);
  for (let c = c0 + 1; c < c0 + len - 1; c++) cells.push([c, wl - 1]);
  for (let c = c0; c < c0 + len; c++) cells.push([c, wl]);
  const m = c0 + (len >> 1);
  for (let r = wl + 1; r < wl + 5; r++) cells.push([m, r]);
  T.build(cells, MAT.wood);
  T.flags.push({ x: m * B + B / 2, y: H - (wl + 5) * B });
}
function makeMap(def) {
  const T = new Terrain(makeHeights(def.h, def.cols || COLS), def.theme, def.water);
  if (def.build) def.build(T);
  return T;
}

/* ================= Bölümler =================
   cols: harita genişliği (sütun), teams: takım başına karakter, items: bedava eşyalar (bilgisayar da bunları kullanır) */
const sea = (c, cols, left, right) => c < left ? 9 + Math.sin(c / 2) : c > cols - right ? 9 + Math.sin(c / 2.2) : 2;
const LEVELS = [
  { island: 0, theme: 'grass', water: 3, h: c => 8 + 1.5 * Math.sin(c / 7) + Math.sin(c / 3), p: 10, e: 43, wind: 0, items: ['snowball'], err: .35, preview: 200 },
  { island: 0, theme: 'grass', water: 5, h: c => 7 + 4 * Math.cos(2 * Math.PI * c / 54) + 1.2 * Math.sin(c * .9) - (c > 20 && c < 34 ? 1 : 0), p: 8, e: 46, wind: 0, items: ['snowball'], err: .28, preview: 170 },
  { island: 0, theme: 'grass', water: 4, h: c => 6 + 7 * Math.exp(-Math.pow((c - 27) / 6, 2)) + Math.sin(c / 2.5), p: 9, e: 45, wind: 1, items: ['snowball', 'balloon'], err: .22, preview: 140 },
  { island: 1, theme: 'snow', water: 4, h: c => 8 + 3 * Math.sin(c / 5 + 1) + 1.5 * Math.sin(c / 2.1), p: 7, e: 47, wind: 1, items: ['snowball', 'balloon'], err: .18, preview: 120 },
  { island: 1, theme: 'snow', water: 4, h: c => 7 + 2 * Math.sin(c / 4) + (c >= 22 && c <= 32 ? 7 : 0), p: 10, e: 44, wind: 2, items: ['snowball', 'balloon', 'fish'], err: .14, preview: 100 },
  { island: 1, theme: 'snow', water: 5, h: c => 5 + 6 * Math.max(0, Math.cos(2 * Math.PI * c / 27)) + 1.5 * Math.sin(c / 2), p: 4, e: 50, wind: 3, items: ['snowball', 'balloon', 'firework'], err: .11, preview: 90 },
  // Kale Adası: geniş harita, iki taraf kalelerin üstünde
  { island: 2, theme: 'grass', water: 3, cols: 72, h: c => 6 + 1.2 * Math.sin(c / 5) + .8 * Math.sin(c / 2.3), build: T => { castle(T, 6, 7, 4); castle(T, 59, 7, 4); },
    p: 9, e: 62, wind: 1, items: ['snowball', 'balloon', 'bigball'], err: .2, preview: 130 },
  { island: 2, theme: 'grass', water: 4, cols: 72, h: c => 5 + 6 * Math.exp(-Math.pow((c - 36) / 7, 2)) + Math.sin(c / 3), build: T => { castle(T, 5, 7, 5); castle(T, 60, 7, 5); },
    p: 8, e: 63, wind: 2, items: ['snowball', 'balloon', 'bigball', 'melon'], err: .16, preview: 110 },
  { island: 2, theme: 'snow', water: 4, cols: 72, teams: 2, h: c => 6 + 1.5 * Math.sin(c / 4) + Math.sin(c / 1.7), build: T => { castle(T, 4, 8, 4); castle(T, 32, 8, 3); castle(T, 60, 8, 4); },
    p: [7, 14], e: [64, 57], wind: 2, items: ['snowball', 'balloon', 'melon', 'firework'], err: .14, preview: 100 },
  // Korsan Koyu: iki kıyı arasında deniz, ortada gemiler
  { island: 3, theme: 'grass', water: 5, cols: 90, h: c => sea(c, 90, 16, 17), build: T => { ship(T, 24, 11); ship(T, 55, 11); },
    p: 31, e: 58, wind: 2, items: ['snowball', 'balloon', 'fish', 'melon'], err: .14, preview: 100 },
  { island: 3, theme: 'grass', water: 5, cols: 90, teams: 2, h: c => sea(c, 90, 16, 17), build: T => { ship(T, 24, 11); ship(T, 55, 11); },
    p: [31, 26], e: [58, 63], wind: 2, items: ['snowball', 'balloon', 'fish', 'melon', 'bugs'], err: .13, preview: 95 },
  { island: 3, theme: 'snow', water: 5, cols: 90, teams: 3, h: c => sea(c, 90, 18, 18), build: T => { ship(T, 20, 11); ship(T, 39, 11); ship(T, 59, 11); },
    p: [27, 22, 12], e: [62, 67, 77], wind: 3, items: ['snowball', 'balloon', 'fish', 'melon', 'bugs', 'bigball'], err: .12, preview: 90 },
];
const ISLANDS = [
  { name: 'ÇİMEN ADASI', color: '#5DBB4A' }, { name: 'KAR ADASI', color: '#7CC4EA' },
  { name: 'KALE ADASI', color: '#B9A58C' }, { name: 'KORSAN KOYU', color: '#2E86C9' },
];
const MAPS2 = [['grass', 'ÇİMEN', '#5DBB4A'], ['snow', 'KAR', '#7CC4EA'], ['castle', 'KALE', '#B9A58C'], ['pirate', 'KORSAN', '#2E86C9'], ['random', 'SÜRPRİZ', '#E84BB0']];
function mapDef(key) {
  if (key === 'grass') return Object.assign({}, LEVELS[1], { wind: 1, preview: 130 });
  if (key === 'snow') return Object.assign({}, LEVELS[3], { wind: 2, preview: 110 });
  if (key === 'castle') return Object.assign({}, LEVELS[6], { wind: 2, preview: 110, p: [9, 15, 21], e: [62, 56, 50] });
  if (key === 'pirate') return Object.assign({}, LEVELS[9], { preview: 110, p: [31, 26, 13], e: [58, 63, 76] });
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

/* ================= Eşyalar =================
   kind: throw = sapanla atılır · pick = önce bir sayı seçilir · self = hemen kullanılır · passive = kendiliğinden
   Sayılı eşyalar (pick) oyunun içindeki matematik: cetvelde yer bulmak, saymak, rüzgârı hesaba katmak. */
const SNOW_C = ['#FFFFFF', '#E6F0F8', '#BFD9EE', '#9B6B43'];
const FW_C = ['#FF5A6E', '#FFD23F', '#4FB3F0', '#7FE05C', '#B8A6FF', '#FFFFFF'], LAVA_C = ['#FF7A45', '#FFB52E', '#E5483B', '#8A5D39'];
const ITEMS = {
  snowball: { name: 'Kartopu', spr: 'snowball', kind: 'throw', snow: true, r: 26, dmg: 30, wind: .6, word: 'POF!', sound: 'pof', colors: SNOW_C },
  balloon: { name: 'Su Balonu', spr: 'balloon', kind: 'throw', r: 40, dmg: 32, wind: 1.3, word: 'ŞLAP!', sound: 'splash', colors: ['#4FB3F0', '#D6F1FF', '#2E86C9', '#FFFFFF'] },
  paint: { name: 'Boya Küpü', spr: 'paint', kind: 'throw', r: 30, dmg: 28, wind: .9, word: 'ŞAP!', sound: 'splat', colors: ['#E84BB0', '#FF9AD8', '#B8338A'], bounce: 1 },
  fish: { name: 'Balık', spr: 'fish', kind: 'throw', r: 34, dmg: 32, wind: .2, grav: .55, word: 'ŞLOP!', sound: 'splat', colors: ['#7FB8E8', '#4A86C5', '#FFFFFF'] },
  bigball: { name: 'Dev Kartopu', big: true, kind: 'throw', snow: true, r: 48, dmg: 45, wind: .3, grav: 1.5, word: 'GÜMM!', sound: 'pof', colors: SNOW_C },
  bouncy: { name: 'Zıp Zıp Top', emoji: '🥎', kind: 'throw', r: 26, dmg: 24, wind: .7, bounce: 3, word: 'BOİNG!', sound: 'pof', colors: ['#FFE14D', '#7FE05C', '#FFFFFF'] },
  melon: { name: 'Karpuz', emoji: '🍉', kind: 'throw', r: 30, dmg: 18, wind: .8, cluster: 4, word: 'ŞAPŞUP!', sound: 'splat', colors: ['#FF5A6E', '#7FE05C', '#2E7D32', '#FFFFFF'] },
  slice: { name: 'Dilim', emoji: '🍉', size: 15, kind: 'throw', r: 20, dmg: 6, wind: .4, word: 'ŞAP!', sound: 'splat', colors: ['#FF5A6E', '#7FE05C'], hidden: true },
  boomerang: { name: 'Bumerang', emoji: '🪃', spin: true, kind: 'throw', r: 28, dmg: 28, wind: 1.6, boomerang: true, word: 'VUUŞ!', sound: 'pof', colors: ['#C98E55', '#FFD23F'] },
  cake: { name: 'Pasta', emoji: '🎂', kind: 'throw', r: 24, dmg: 14, wind: .8, sticky: true, word: 'ŞLOP!', sound: 'splat', colors: ['#FFFFFF', '#FF9AD8', '#FFE0F0', '#E84BB0'] },
  tickle: { name: 'Gıdıklama Tüyü', emoji: '🪶', spin: true, kind: 'throw', r: 32, dmg: 6, wind: 1.4, grav: .6, light: true, noCarve: true, push: 120, word: 'HİHİ!', sound: 'tickle', colors: ['#FFFFFF', '#FFE680'] },
  pepper: { name: 'Hapşırık Biberi', emoji: '🌶️', kind: 'throw', r: 30, dmg: 20, carve: 14, wind: .6, sneeze: true, word: 'PUF!', sound: 'pof', colors: ['#E5483B', '#FF9F43', '#FFFFFF'] },
  clock: { name: 'Çalar Saat', emoji: '⏰', kind: 'throw', r: 38, dmg: 38, wind: .5, fuse: true, word: 'ÇIIIN!', sound: 'ring', colors: ['#FFD23F', '#E5483B', '#FFFFFF'] },
  frog: { name: 'Zıp Zıp Kurbağa', emoji: '🐸', kind: 'pick', r: 32, dmg: 30, word: 'VRAK!', sound: 'pof', colors: ['#7FE05C', '#2E7D32', '#FFFFFF'],
    pick: { type: 'count', min: 1, max: 15, def: 3, label: 'Kaç kere zıplasın?' } },
  chicken: { name: 'Koşan Tavuk', emoji: '🐔', kind: 'pick', r: 32, dmg: 30, word: 'GIDAK!', sound: 'pof', colors: ['#FFFFFF', '#E5483B', '#FFD23F'],
    pick: { type: 'count', min: 1, max: 15, def: 3, label: 'Kaç adım koşsun?' } },
  bugs: { name: 'Böcek Uçağı', emoji: '🐞', kind: 'pick', r: 24, word: 'VIZZ!', sound: 'pof', colors: ['#E5483B', '#1E2233', '#FFFFFF'],
    pick: { type: 'pos', wind: true, label: 'Uçak böcekleri hangi sayıya bıraksın?' } },
  meteor: { name: 'Meteor Yağmuru', emoji: '☄️', kind: 'pick', r: 26, word: 'BUM!', sound: 'pof', colors: ['#FF9F43', '#FFD23F', '#8A5D39'],
    pick: { type: 'range', span: 5, label: 'Hangi sayıdan hangi sayıya?' } },
  teleport: { name: 'Işınlanma', emoji: '✨', kind: 'pick', pick: { type: 'pos', land: true, label: 'Hangi sayıya ışınlanalım?' } },
  flyballoon: { name: 'Uçan Balon', emoji: '🎈', kind: 'pick', pick: { type: 'pos', wind: true, label: 'Balon seni hangi sayıya götürsün?' } },
  wall: { name: 'Kardan Duvar', emoji: '🧱', kind: 'pick', pick: { type: 'count', min: 1, max: 5, def: 3, label: 'Duvar kaç blok yüksek olsun?' } },
  bridge: { name: 'Sayı Köprüsü', emoji: '🌉', kind: 'pick', pick: { type: 'count', min: 2, max: 12, def: 4, label: 'Köprü kaç blok olsun?' } },
  umbrella: { name: 'Şemsiye', emoji: '☂️', kind: 'self', label: 'Şemsiye seni bir tur korur' },
  potion: { name: 'Güç İksiri', emoji: '🧪', kind: 'self', keepTurn: true, label: '+35 güç' },
  chute: { name: 'Paraşüt', emoji: '🪂', kind: 'passive', label: 'Suya ya da yüksekten düşünce açılır, seni kurtarır' },
  missile: { name: 'Hedef Füzesi', emoji: '🚀', kind: 'pick', r: 20, dmg: 15, carve: 16, word: 'TAK!', sound: 'pof', colors: ['#E5483B', '#FFD23F', '#FFFFFF'],
    pick: { type: 'pos', label: 'Füze hangi sayıya gitsin?' } },
  storm: { name: 'Yıldırım Bulutu', emoji: '⛈️', kind: 'pick', r: 26, dmg: 25, carve: 18, word: 'ÇAT!', sound: 'thunder', colors: ['#FFE14D', '#FFFFFF', '#9AA4B5'],
    pick: { type: 'pos', label: 'Bulut hangi sayının üstüne gelsin?' } },
  tornado: { name: 'Hortum', emoji: '🌪️', kind: 'pick', r: 30, dmg: 20, noCarve: true, word: 'VUUUŞ!', sound: 'whoosh', colors: ['#C9D3E0', '#FFFFFF'],
    pick: { type: 'count', min: 1, max: 15, def: 4, label: 'Hortum kaç adım gitsin?' } },
  swap: { name: 'Yer Değiştirme', emoji: '🔄', kind: 'self', label: 'En yakın rakiple yer değiştir' },
  skunk: { name: 'Kokarca', emoji: '🦨', kind: 'throw', r: 32, dmg: 10, noCarve: true, stink: true, wind: .8, word: 'PÖFF!', sound: 'splat', colors: ['#8BC34A', '#C5E1A5', '#558B2F'] },
  hive: { name: 'Arı Kovanı', emoji: '🐝', kind: 'throw', r: 22, dmg: 8, carve: 12, hive: 4, wind: .7, word: 'VIZZZ!', sound: 'buzz', colors: ['#FFD23F', '#1E2233', '#FFFFFF'] },
  firework: { name: 'Havai Fişek', emoji: '🧨', spin: true, kind: 'throw', r: 22, dmg: 10, wind: .5, apex: 6, word: 'PATT!', sound: 'pop', colors: FW_C },
  fwstar: { emoji: '⭐', size: 16, r: 22, dmg: 9, carve: 9, wind: .2, word: 'PIT!', sound: 'pof', colors: FW_C, hidden: true },
  volcano: { name: 'Yanardağ', emoji: '🌋', kind: 'throw', r: 26, dmg: 12, wind: .6, volcano: 5, word: 'GÜRR!', sound: 'thud', colors: LAVA_C },
  lava: { emoji: '🔥', size: 18, r: 26, dmg: 10, carve: 10, wind: .2, word: 'CIZZ!', sound: 'pof', colors: LAVA_C, hidden: true },
  dragon: { name: 'Ejderha', emoji: '🐉', kind: 'pick', r: 42, dmg: 30, carve: 26, word: 'ROAAR!', sound: 'thunder', colors: LAVA_C.concat('#FFFFFF'),
    pick: { type: 'pos', label: 'Ejderha hangi sayıya ateş püskürsün?' } },
  sting: { emoji: '🐝', r: 14, dmg: 6, noCarve: true, word: 'İĞNE!', sound: 'hit', colors: ['#FFD23F', '#1E2233'], hidden: true },
  // yalnızca eylemlerin içinde
  bug: { emoji: '🐞', size: 18, fall: 170, r: 24, dmg: 14, word: 'VIZZ!', sound: 'pof', colors: ['#E5483B', '#1E2233', '#FFFFFF'], hidden: true },
  barrel: { emoji: '🛢️', r: 38, dmg: 25, word: 'BUM!', sound: 'thud', colors: ['#C98E55', '#8A5D39', '#4FB3F0', '#FFFFFF'], hidden: true },
  rock: { emoji: '☄️', size: 26, fall: 260, r: 26, dmg: 24, word: 'BUM!', sound: 'pof', colors: ['#FF9F43', '#FFD23F', '#8A5D39'], hidden: true },
};
for (const k in ITEMS) ITEMS[k].key = k;
// paint, bouncy, cake artık çantada yok (v17); tanımları eski kayıtlar ve efektler için duruyor
const ITEM_ORDER = ['snowball', 'balloon', 'fish', 'bigball', 'melon', 'firework', 'volcano', 'boomerang', 'tickle', 'pepper', 'skunk', 'hive',
  'clock', 'frog', 'chicken', 'bugs', 'meteor', 'dragon', 'teleport', 'flyballoon', 'wall', 'bridge', 'umbrella', 'potion', 'chute', 'missile', 'storm', 'tornado', 'swap'];
const BUYABLE = ITEM_ORDER.filter(k => k !== 'snowball');
const AI_ITEMS = ['balloon', 'fish', 'bigball', 'melon', 'pepper'];

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
        case 'ring': [1568, 1319, 1568, 1319, 1568].forEach((f, i) => this.tone(f, .09, { gain: .08, delay: i * .08 })); this.noise(.3, { freq: 900, freqEnd: 200, gain: .6 }); break;
        case 'tickle': [880, 1046, 880, 1175].forEach((f, i) => this.tone(f, .08, { type: 'triangle', gain: .08, delay: i * .07 })); break;
        case 'zap': this.tone(300, .35, { type: 'sine', to: 1800, gain: .12 }); break;
        case 'build': [330, 392, 494].forEach((f, i) => this.tone(f, .1, { type: 'triangle', gain: .1, delay: i * .06 })); break;
        case 'ha1': this.tone(300, .3, { type: 'triangle', gain: .1, to: 420 }); break;
        case 'ha2': this.tone(360, .4, { type: 'triangle', gain: .12, to: 600 }); break;
        case 'sneeze': this.noise(.45, { type: 'highpass', freq: 1200, freqEnd: 400, gain: .9 }); this.tone(700, .2, { type: 'triangle', gain: .14, to: 220 }); break;
        case 'giggle': [740, 880, 740, 990, 830, 1046].forEach((f, i) => this.tone(f, .07, { type: 'triangle', gain: .09, delay: i * .09 })); break;
        case 'splashBig': this.noise(.7, { type: 'bandpass', freq: 2200, freqEnd: 300, gain: .9, q: 1.2 }); this.noise(.3, { freq: 600, freqEnd: 120, gain: .5 }); break;
        case 'thud': this.tone(90, .35, { type: 'sine', gain: .35, to: 40 }); this.noise(.3, { freq: 500, freqEnd: 100, gain: .7 }); break;
        case 'tick': this.tone(1800, .03, { type: 'square', gain: .05 }); break;
        case 'pop': this.tone(520, .07, { type: 'sine', gain: .12, to: 900 }); break;
        case 'thunder': this.noise(1.1, { freq: 400, freqEnd: 60, gain: 1 }); this.noise(.25, { type: 'highpass', freq: 2500, freqEnd: 900, gain: .6 }); break;
        case 'whoosh': this.noise(.8, { type: 'bandpass', freq: 500, freqEnd: 1600, gain: .5, q: .8 }); break;
        case 'buzz': this.tone(220, .5, { type: 'sawtooth', gain: .05, to: 260 }); this.tone(228, .5, { type: 'sawtooth', gain: .04, to: 250 }); break;
        case 'cough': this.noise(.18, { type: 'bandpass', freq: 700, freqEnd: 300, gain: .6, q: 1.5 }); this.noise(.16, { type: 'bandpass', freq: 650, freqEnd: 280, gain: .5, q: 1.5 }); break;
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

/* ================= Parçacıklar ve efektler =================
   parts: kısa ömürlü parçacıklar (türüne göre çizilir) · fxs: kendi update/draw'u olan sahnecikler
   stains: zemindeki ıslak izler (zamanla kurur) · kalıcı lekeler arazinin decal katmanında (Terrain.splat) */
let parts = [], words = [], shake = 0, fxs = [], stains = [];
// Eski kare parçalar (kutu, toprak kesekleri)
function spawn(x, y, n, colors, speed = 1) {
  for (let i = 0; i < n; i++) parts.push({
    k: 'chunk', x, y, vx: rand(-.5, .5) * 300 * speed, vy: -rand(60, 320) * speed, rot: 0, vr: 0,
    s: 4 + Math.floor(rand(0, 3)) * 2, c: colors[i % colors.length], life: rand(.9, 1.4), max: 1.4, g: 620,
  });
}
// burst(tür, x, y, adet, { colors, speed: [a,b], dir (radyan, varsayılan yukarı), spread, g, drag, grow, life: [a,b], size: [a,b], jx, jy })
function burst(k, x, y, n, o = {}) {
  const cols = o.colors || ['#FFFFFF'], [s0, s1] = o.speed || [80, 280], [l0, l1] = o.life || [.6, 1.1], [z0, z1] = o.size || [3, 6];
  const dir = o.dir != null ? o.dir : -Math.PI / 2, spread = o.spread != null ? o.spread : Math.PI;
  for (let i = 0; i < n; i++) {
    const a = dir + rand(-spread, spread), v = rand(s0, s1), life = rand(l0, l1);
    parts.push({
      k, x: x + rand(-(o.jx || 0), o.jx || 0), y: y + rand(-(o.jy || 0), o.jy || 0), vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      g: o.g != null ? o.g : 620, drag: o.drag || 0, grow: o.grow || 0, life, max: life, s: rand(z0, z1),
      c: cols[i % cols.length], rot: rand(0, 6.3), vr: rand(-8, 8), ph: rand(0, 6.3),
    });
  }
}
function ring(x, y, color, r1 = 40, life = .45, w = 4) { parts.push({ k: 'ring', x, y, vx: 0, vy: 0, g: 0, life, max: life, s: 0, r1, c: color, w, rot: 0, vr: 0 }); }
function confetti(n) {
  const cols = ['#FFD23F', '#E5483B', '#2F7DE1', '#5DBB4A', '#E84BB0', '#FFFFFF'];
  for (let i = 0; i < n; i++) parts.push({ k: 'chunk', x: (screen === 'play' && play ? cam.x + rand(0, viewW()) : rand(0, W)), y: (screen === 'play' && play ? viewTop() : 0) + rand(-40, -5), vx: rand(-40, 40), vy: rand(40, 140), s: 6, c: cols[i % cols.length], life: 4, max: 4, g: 60, rot: 0, vr: 0 });
}
function updateParts(dt) {
  for (const p of parts) {
    p.vy += p.g * dt;
    if (p.drag) { const f = Math.max(0, 1 - p.drag * dt); p.vx *= f; p.vy *= f; }
    if (p.k === 'feather') { p.vx = Math.sin(time * 3 + p.ph) * 45; p.vy = Math.min(p.vy, 45); }
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.rot += p.vr * dt;
    if (p.grow) p.s += p.grow * dt;
  }
  parts = parts.filter(p => p.life > 0 && p.y < H + 30);
  for (const w of words) w.t += dt;
  words = words.filter(w => w.t < 1);
  for (const f of fxs.slice()) { f.t = (f.t || 0) + dt; if (f.update(dt) === true) fxs.splice(fxs.indexOf(f), 1); }
  for (const s of stains) s.t += dt;
  stains = stains.filter(s => s.t < s.life);
}
function star4(x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rad = i % 2 ? r * .35 : r; ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
  ctx.closePath();
}
function drawParticle(p) {
  const a = clamp(p.life / p.max, 0, 1);
  ctx.globalAlpha = 1;
  switch (p.k) {
    case 'chunk':
      rr(ctx, p.x - 1.5, p.y - 1.5, p.s + 3, p.s + 3, 2.5); ctx.fillStyle = INK; ctx.fill();
      rr(ctx, p.x, p.y, p.s, p.s, 1.6); ctx.fillStyle = p.c; ctx.fill(); break;
    case 'drop': {
      const sp = Math.hypot(p.vx, p.vy), st = 1 + Math.min(1.6, sp / 260);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx)); ctx.globalAlpha = Math.min(1, a * 1.8);
      ell(ctx, 0, 0, p.s * st, p.s); ctx.fillStyle = p.c; ctx.fill();
      ell(ctx, -p.s * .25 * st, -p.s * .35, p.s * .35 * st, p.s * .22); ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.fill();
      ctx.restore(); break;
    }
    case 'snow':
      ctx.globalAlpha = Math.min(1, a * 2);
      ell(ctx, p.x, p.y, p.s, p.s); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.strokeStyle = 'rgba(140,180,215,.9)'; ctx.lineWidth = 1; ctx.stroke(); break;
    case 'smoke':
      ctx.globalAlpha = a * .6; ell(ctx, p.x, p.y, p.s, p.s); ctx.fillStyle = p.c; ctx.fill(); break;
    case 'fire':
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
      ell(ctx, p.x, p.y, p.s * (.4 + .6 * a), p.s * (.4 + .6 * a)); ctx.fillStyle = p.c; ctx.fill();
      ctx.globalCompositeOperation = 'source-over'; break;
    case 'spark':
      ctx.globalAlpha = a; star4(p.x, p.y, p.s * (.7 + .3 * Math.sin(time * 22 + p.ph))); ctx.fillStyle = p.c; ctx.fill(); break;
    case 'seed':
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ell(ctx, 0, 0, p.s, p.s * 1.7); ctx.fillStyle = p.c; ctx.fill(); ctx.restore(); break;
    case 'feather':
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(time * 3 + p.ph) * .7); ctx.globalAlpha = Math.min(1, a * 2);
      ell(ctx, 0, 0, p.s * 1.9, p.s * .65); ctx.fillStyle = p.c; ctx.fill(); ctx.strokeStyle = 'rgba(30,34,51,.45)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-p.s * 2.2, 0); ctx.lineTo(p.s * 1.6, 0); ctx.stroke(); ctx.restore(); break;
    case 'ring': {
      const r = p.r1 * (1 - a * a) + 4;
      ctx.globalAlpha = a; ell(ctx, p.x, p.y, r, r * .8); ctx.strokeStyle = p.c; ctx.lineWidth = p.w * a + 1; ctx.stroke(); break;
    }
    case 'heart':
      ctx.globalAlpha = Math.min(1, a * 2); drawSprite(ctx, SPR.heart, p.x - p.s, p.y - p.s * .8, p.s / 3.5); break;
    case 'gear': {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
      for (let i = 0; i < 6; i++) { ctx.rotate(Math.PI / 3); ctx.fillRect(-1.4, -p.s - 1.6, 2.8, 3.2); }
      ell(ctx, 0, 0, p.s, p.s); ctx.fill(); ell(ctx, 0, 0, p.s * .4, p.s * .4); ctx.fillStyle = INK; ctx.fill(); ctx.restore(); break;
    }
  }
  ctx.globalAlpha = 1;
}
function drawStains() {
  for (const s of stains) {
    const a = .4 * (1 - s.t / s.life);
    ell(ctx, s.x, s.y + 2, s.r, s.r * .32); ctx.fillStyle = `rgba(40,100,170,${a})`; ctx.fill();
  }
}
function drawParts() {
  for (const p of parts) drawParticle(p);
  for (const f of fxs) f.draw();
  for (const w of words) {
    const e = 1 - Math.pow(1 - w.t, 3);
    ctx.save(); ctx.globalAlpha = 1 - w.t * w.t;
    const wy = w.y - 26 - 22 * e;
    if (w.item) { itemIcon(w.item, w.x - 22, wy, 28); text(w.word, w.x + 14, wy, Math.round(w.size * (.7 + .5 * e)), { color: w.color || '#FFFFFF', lw: 6 }); }
    else text(w.word, w.x, wy, Math.round(w.size * (.7 + .5 * e)), { color: w.color || '#FFFFFF', lw: 6 });
    ctx.restore();
  }
}

/* ----- Eşyaya özel çarpma sahneleri ----- */
const WATER_C = ['#4FB3F0', '#8FD3FA', '#2E86C9'];
// Leke çarpma noktası havadaysa (karaktere çarptıysa) hemen altındaki zemine düşer
function gsplat(T, x, y, col, size, drips, alpha) {
  if (T.solidAt(x, y + 3)) return T.splat(x, y, col, size, drips, alpha);
  const gy = groundY(x);
  if (gy - y < 110 && T.land(Math.floor(x / B))) T.splat(x, gy + 3, col, size, drips, alpha);
}
function juice(x, y, T, k) {
  burst('drop', x, y, Math.round(24 * k), { colors: ['#FF5A6E', '#FF8A9A', '#E5304A'], speed: [100, 320], size: [2.2, 4] });
  burst('seed', x, y, Math.round(10 * k), { colors: ['#1E2233'], speed: [80, 260], size: [1.3, 1.7] });
  gsplat(T, x, y, '#FF5A6E', 26 * k + 8, Math.round(3 * k), .85);
}
function wetStains(x, y, r, n) {
  for (let i = 0; i < n; i++) {
    const sx = x + rand(-r, r), sy = groundY(sx);
    if (Math.abs(sy - y) < r) stains.push({ x: sx, y: sy, r: rand(8, 16), t: 0, life: rand(6, 9) });
  }
}
function puffSmoke(x, y, n, cols = ['#FFFFFF'], size = [6, 11]) {
  burst('smoke', x, y, n, { colors: cols, g: -25, speed: [15, 80], size, grow: 18, life: [.5, .9], drag: 2.2 });
}
const IMPACT = {
  missile(x, y, T) { burst('fire', x, y, 12, { colors: ['#FFB52E', '#FF7A45', '#FFE680'], g: -60, speed: [40, 180], size: [4, 8], life: [.3, .6], drag: 2 }); puffSmoke(x, y, 6, ['#FFFFFF', '#C9D3E0'], [6, 10]); ring(x, y, '#FFD23F', 40); gsplat(T, x, y + 3, 'rgba(40,30,25,.45)', 18); },
  storm(x, y, T) { burst('spark', x, y, 22, { colors: ['#FFF6B0', '#FFFFFF', '#FFE14D'], g: 100, speed: [80, 320], size: [3, 6] }); puffSmoke(x, y, 8, ['#5A5F6E', '#8A8F9C'], [7, 12]); ring(x, y, '#FFF6B0', 60, .4, 6); gsplat(T, x, y + 3, 'rgba(30,30,40,.55)', 26); shake = 6; },
  skunk(x, y) { burst('smoke', x, y, 20, { colors: ['#8BC34A', '#C5E1A5', '#9CCC65'], g: -20, speed: [30, 140], size: [6, 11], grow: 18, life: [.7, 1.2], drag: 2.2 }); },
  hive(x, y, T) { spawn(x, y, 10, ['#E8B04A', '#C98A2B', '#FFD23F'], 1.1); gsplat(T, x, y + 3, '#F5B731', 16, 3, .85); },
  snowball(x, y, T) {
    burst('snow', x, y, 18, { speed: [60, 260], size: [2, 4.5] }); puffSmoke(x, y, 5);
    ring(x, y, '#FFFFFF', 34); gsplat(T, x, y + 4, 'rgba(255,255,255,.95)', 16);
  },
  bigball(x, y, T) {
    burst('snow', x, y, 34, { speed: [80, 380], size: [3, 6] }); spawn(x, y, 10, SNOW_C, 1.4);
    puffSmoke(x, y, 10, ['#FFFFFF', '#E6F0F8'], [8, 14]);
    ring(x, y, '#FFFFFF', 74, .55, 7); ring(x, y, '#BFD9EE', 50, .4, 4);
    gsplat(T, x, y + 6, 'rgba(255,255,255,.95)', 32); shake = 12; Sound.play('thud');
  },
  balloon(x, y) {
    burst('drop', x, y, 42, { colors: WATER_C, speed: [120, 380], size: [2.2, 4.4], g: 720 });
    ring(x, y, '#8FD3FA', 62, .5, 5); wetStains(x, y, 70, 10); Sound.play('splashBig');
  },
  paint(x, y, T) {
    burst('drop', x, y, 32, { colors: ['#E84BB0', '#FF8AD2', '#B8338A'], speed: [120, 340], size: [2.4, 4.6] });
    gsplat(T, x, y, '#E84BB0', 36, 7, .92); gsplat(T, x + rand(-24, 24), y + rand(-10, 8), '#FF8AD2', 16, 2, .9);
    gsplat(T, x + rand(-34, 34), y + rand(-12, 8), '#B8338A', 10, 1, .9);
    ring(x, y, '#FF8AD2', 48);
  },
  fish(x, y) { burst('drop', x, y, 16, { colors: ['#8FD3FA', '#FFFFFF'], speed: [80, 240], size: [2, 3.5] }); fxs.push(flopFx(x)); },
  bouncy(x, y) {
    burst('spark', x, y, 20, { colors: ['#FFE14D', '#7FE05C', '#FF6FA8', '#3FA9F5'], speed: [80, 300], g: 300, size: [3, 5.5] });
    ring(x, y, '#FFE14D', 46); ring(x, y, '#7FE05C', 30, .35);
  },
  melon(x, y, T) { juice(x, y, T, 1); spawn(x, y, 6, ['#2E7D32', '#7FE05C'], 1.2); },
  slice(x, y, T) { juice(x, y, T, .5); },
  boomerang(x, y) { spawn(x, y, 10, ['#C98E55', '#8A5D39', '#FFD23F'], 1.1); burst('spark', x, y, 10, { colors: ['#FFD23F'], g: 200 }); ring(x, y, '#FFD23F', 38); },
  cake(x, y, T) {
    burst('drop', x, y, 26, { colors: ['#FFFFFF', '#FFE0F0', '#FF9AD8'], speed: [90, 260], size: [2.5, 4.6] });
    spawn(x, y, 2, ['#E5483B'], 1.3);
    gsplat(T, x, y, '#FFF4FA', 30, 3, .97); gsplat(T, x + 6, y - 2, '#FF9AD8', 13, 1, .9);
  },
  tickle(x, y) {
    burst('feather', x, y - 10, 7, { colors: ['#FFFFFF'], speed: [20, 90], g: 40, life: [1.5, 2.2], size: [4, 6] });
    burst('spark', x, y, 10, { colors: ['#FFE680', '#FFFFFF'], g: -40, speed: [30, 100] });
  },
  pepper(x, y) {
    burst('smoke', x, y, 18, { colors: ['#FF7A45', '#E5483B', '#FFB36B'], g: -30, speed: [30, 150], size: [6, 11], grow: 20, life: [.6, 1.1], drag: 2.5 });
    burst('spark', x, y, 8, { colors: ['#FFB36B'], g: 100 });
  },
  clock(x, y) {
    [0, 1, 2].forEach(i => ring(x, y, '#FFD23F', 50 + i * 24, .5 + i * .15, 5));
    burst('gear', x, y, 9, { colors: ['#9AA4B5', '#C0C7D3', '#FFD23F'], speed: [120, 320], size: [3.5, 5.5] });
    puffSmoke(x, y, 8, ['#FFFFFF'], [7, 12]);
  },
  frog(x, y, T) {
    burst('drop', x, y, 24, { colors: ['#7FE05C', '#2E7D32', '#B6F59A'], speed: [90, 280], size: [2.2, 4] });
    gsplat(T, x, y, '#5CC93A', 26, 4, .85); ring(x, y, '#7FE05C', 46);
  },
  chicken(x, y) { burst('feather', x, y, 14, { colors: ['#FFFFFF', '#FFF4E0'], speed: [60, 220], g: 60, life: [1.4, 2.2], size: [4, 6] }); puffSmoke(x, y, 6); },
  bug(x, y) { burst('spark', x, y, 8, { colors: ['#E5483B', '#1E2233', '#FFFFFF'], g: 200, speed: [60, 200] }); puffSmoke(x, y, 3, ['#FFFFFF'], [5, 8]); },
  barrel(x, y, T) {
    spawn(x, y, 14, ['#C98E55', '#8A5D39', '#5A6070'], 1.5);
    burst('drop', x, y, 22, { colors: WATER_C, speed: [120, 360], size: [2.2, 4] });
    burst('fire', x, y, 12, { colors: ['#FFB52E', '#FF7A45', '#FFE680'], g: -60, speed: [40, 200], size: [5, 9], life: [.3, .6], drag: 2 });
    puffSmoke(x, y, 8, ['#FFFFFF', '#C9D3E0'], [8, 13]);
    ring(x, y, '#FFD23F', 64, .45, 6); shake = 10;
  },
  rock(x, y, T) {
    burst('fire', x, y, 18, { colors: ['#FFB52E', '#FF7A45', '#FFE680'], g: -60, speed: [40, 220], size: [5, 10], life: [.4, .8], drag: 2 });
    puffSmoke(x, y, 10, ['#5A5F6E', '#8A8F9C'], [8, 14]);
    spawn(x, y, 8, ['#8A5D39', '#5A4030'], 1.2);
    gsplat(T, x, y + 4, 'rgba(40,30,25,.5)', 30); ring(x, y, '#FFB52E', 58, .4, 6); shake = 9; Sound.play('thud');
  },
};
// Vurulan karakterin tepkisi (hasar ve itme explode'da)
const REACT = {
  balloon: ch => { ch.wet = 7; },
  fish: ch => { ch.wet = 4; },
  paint: ch => paintChar(ch, ['#E84BB0', '#FF8AD2', '#B8338A']),
  frog: ch => paintChar(ch, ['#5CC93A', '#7FE05C']),
  melon: ch => paintChar(ch, ['#FF5A6E', '#E5304A']),
  slice: ch => paintChar(ch, ['#FF5A6E']),
  bigball: ch => { ch.dizzy = 2.2; },
  rock: ch => { ch.dizzy = 1.6; },
  tickle: ch => { react(ch, 'laugh', { dur: 1.8 }); Sound.play('giggle'); },
};
function paintChar(ch, cols) {
  ch.spots = Array.from({ length: 7 }, (_, i) => ({ x: rand(-12, 12), y: rand(-36, -4), r: rand(1.8, 4.2), c: cols[i % cols.length] }));
  ch.paintT = 14;
}
function react(ch, k, o = {}) { ch.mood = Object.assign({ k, t: 0, dur: 1 }, o); }
// Balık yere düşünce üç kez çırpınır, sonra ışıltıyla kaybolur
function flopFx(x) {
  const f = { x, y: groundY(x), yy: 0, vy: -200, hops: 0, dir: Math.random() < .5 ? -1 : 1 };
  f.update = dt => {
    f.vy += 760 * dt; f.yy += f.vy * dt; f.x += f.dir * 45 * dt;
    if (f.yy >= 0) {
      f.yy = 0; f.hops++; f.vy = -190 + f.hops * 40;
      burst('drop', f.x, f.y - 2, 3, { colors: ['#8FD3FA'], speed: [40, 90], size: [1.5, 2.4] });
      if (f.hops >= 3) { burst('spark', f.x, f.y - 8, 10, { colors: ['#FFE680', '#FFFFFF'], g: -40, speed: [30, 90] }); return true; }
    }
  };
  f.draw = () => { ctx.save(); ctx.translate(f.x, f.y - 8 + f.yy); ctx.rotate(Math.sin(f.t * 22) * .5); itemIcon('fish', 0, 0, 30, { flip: f.dir > 0 }); ctx.restore(); };
  return f;
}
// Boya/karpuz damlası: lekeden aşağı doğru yavaşça akar, durunca araziye işlenir
function dripFx(T, x, y, col, alpha) {
  let max = 0; while (max < rand(10, 24) && T.solidAt(x, y + max + 2)) max += 2;
  const f = { len: 0, w: rand(2, 3.4) };
  const shape = (c, l) => { rr(c, x - f.w / 2, y, f.w, l + 1, f.w / 2); c.fill(); ell(c, x, y + l, f.w * .75, f.w * .85); c.fill(); };
  f.update = dt => {
    f.len = Math.min(max, f.len + dt * 16);
    if (f.len >= max) { const c = T.dctx; c.save(); c.globalAlpha = alpha; c.fillStyle = col; shape(c, f.len); c.restore(); T.maskDecal(x - 8, 16); return true; }
  };
  f.draw = () => { ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = col; shape(ctx, f.len); ctx.restore(); };
  return f;
}
// Hapşırık: biber tozunu yutan karakter iki kez nefes alır, sonra hapşırıp geri fırlar
function sneeze(ch, dir) {
  Sound.play('sneeze'); shake = 6;
  burst('smoke', ch.x - dir * 12, ch.y - 22, 16, { colors: ['#FFFFFF', '#FFE2C2', '#FFB36B'], dir: dir > 0 ? Math.PI : 0, spread: .45, g: -10, speed: [140, 280], size: [5, 9], grow: 24, life: [.5, .9], drag: 3 });
  burst('drop', ch.x - dir * 14, ch.y - 22, 8, { colors: ['#BFE6FF'], dir: dir > 0 ? Math.PI : 0, spread: .4, speed: [120, 220], size: [1.4, 2.2] });
  words.push({ x: ch.x, y: ch.y - 46, word: 'HAPŞU!', size: 34, t: 0, color: '#FFB36B' });
  if (damage(ch, ITEMS.pepper.dmg)) Sound.play('hit');
  ch.vx = dir * 340; ch.vy = -320; ch.grounded = false;
}
function updateChars(dt) {
  for (const ch of allChars()) {
    animate(ch, dt);
    if (ch.wet > 0) {
      ch.wet -= dt;
      if (Math.random() < dt * 6) burst('drop', ch.x + rand(-10, 10), ch.y - rand(8, 34), 1, { colors: ['#7CC4F5'], speed: [0, 15], g: 520, size: [1.4, 2.2], life: [.5, .8] });
    }
    if (ch.paintT > 0) { ch.paintT -= dt; if (ch.paintT <= 0) ch.spots = null; }
    if (ch.dizzy > 0) ch.dizzy -= dt;
    if (ch.pop > 0) ch.pop -= dt;
    if (ch.hurtT > 0) ch.hurtT -= dt;
    if (ch.hpShown > ch.hp) ch.hpShown = Math.max(ch.hp, ch.hpShown - dt * 40 * (ch.hurtT > 0 ? 0 : 1)); else ch.hpShown = ch.hp;
    const m = ch.mood; if (!m) continue;
    m.t += dt;
    if (m.k === 'sneeze') {
      if (!m.h1 && m.t > .08) { m.h1 = 1; Sound.play('ha1'); }
      if (!m.h2 && m.t > .5) { m.h2 = 1; Sound.play('ha2'); }
      if (!m.fired && m.t >= .95) { m.fired = true; sneeze(ch, m.dir); }
    }
    if (m.t >= m.dur) ch.mood = null;
  }
}
// Mermi uçarken bıraktığı iz
function projTrail(p, dt) {
  if (p.delay > 0) return;
  const k = p.item;
  if (k === 'rock') burst('fire', p.x, p.y - 6, 2, { colors: ['#FFB52E', '#FF7A45', '#FFE680'], g: -40, speed: [10, 50], size: [4, 7], life: [.25, .45], drag: 2 });
  else if (k === 'balloon' && Math.random() < dt * 10) burst('drop', p.x, p.y + 8, 1, { colors: ['#8FD3FA'], speed: [0, 20], g: 420, size: [1.5, 2.2] });
  else if (k === 'paint' && Math.random() < dt * 12) burst('drop', p.x, p.y + 8, 1, { colors: ['#E84BB0'], speed: [0, 20], g: 420, size: [1.5, 2.4] });
  else if (k === 'pepper' && Math.random() < dt * 16) burst('smoke', p.x, p.y, 1, { colors: ['#FF7A45'], g: -10, speed: [0, 20], size: [2, 4], grow: 8, life: [.3, .5] });
  else if (k === 'melon' && Math.random() < dt * 6) burst('drop', p.x, p.y + 6, 1, { colors: ['#FF5A6E'], speed: [0, 20], g: 420, size: [1.4, 2] });
  if (p.fuse) { const sec = Math.ceil(p.fuse - p.t); if (sec !== p.lastSec) { p.lastSec = sec; Sound.play('tick'); } }
}

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
  addCoins(n) { const d = this.read(); d.coins = (d.coins || 0) + n; this.write(d); },
};
const toGarden = () => { location.assign(new URL('../', location.href).href); };

/* ================= Oyun durumu ================= */
let screen = 'title';
let play = null;
let flakes = Array.from({ length: 70 }, () => ({ x: rand(0, W), y: rand(0, H), v: rand(18, 40), s: Math.random() < .3 ? 4 : 2 }));
let time = 0;
const cam = { x: 0, tx: 0, z: 1, tz: 1, zi: 1, kick: 0, manual: false };
// Yakınlık kademeleri: [bütün harita, normal, yakın]. Tek ekranlık haritada "bütün harita" = biraz geri çekilmiş görünüm.
const zoomLevels = () => { const fit = Math.min(1, W / play.T.w); return [fit < .98 ? fit : .8, 1, 1.4]; };
const viewW = () => W / (cam.z + cam.kick);
const viewTop = () => H - H / (cam.z + cam.kick);
function setZoom(i) { const L = zoomLevels(); cam.zi = clamp(i, 0, L.length - 1); cam.tz = L[cam.zi]; cam.manual = cam.zi === 0; if (cam.zi === 0) cam.tx = (play.T.w - W / cam.tz) / 2; else if (cur()) { cam.manual = false; focus(cur().x); } }
// Dünyayı ekrana çizerken: alt kenara sabitlenmiş ölçek (yakınlaşınca gökyüzü kısalır, zemin hep altta)
function worldTransform(c, sx = 0, sy = 0) { const z = cam.z + cam.kick; c.translate(sx, sy + H); c.scale(z, z); c.translate(-cam.x, -H); }
let twoSize = 1;   // 2 oyunculu modda takım başına karakter

const TEAM_COLORS = [['#2F7DE1', '#14B8A6', '#8E7CF0'], ['#E5483B', '#F08C1A', '#E84BB0']];
function makeTeam(id, cpu, items) {
  const ammo = {};
  for (const k of ITEM_ORDER) ammo[k] = 0;
  ammo.snowball = Infinity;
  for (const k of items) if (k !== 'snowball') ammo[k] = 1;
  return { id, cpu, ammo, free: null, item: 'snowball', chars: [], next: 0, color: TEAM_COLORS[id][0] };
}
function makeChar(team, idx, maxHp) {
  return {
    team: team.id, idx, color: TEAM_COLORS[team.id][idx], hp: maxHp, maxHp, hpShown: maxHp, fallFrom: null,
    x: 0, y: 0, vx: 0, vy: 0, grounded: true, spawnCol: 0, walkAnim: 0,
    hitShow: false, shield: false, sticky: 0, stuck: false, chute: false, carried: false,
  };
}
const items = team => ITEM_ORDER.filter(k => team.ammo[k] > 0);
const alive = ch => ch.hp > 0;
const allChars = () => play.teams.flatMap(t => t.chars);
function spawnCol(T, c0, self = null) {
  const taken = s => play && play.teams && allChars().some(o => o !== self && o.spawnCol === s);
  for (let d = 0; d < T.cols; d++) for (const s of [c0 + d, c0 - d]) {
    if (s >= 1 && s <= T.cols - 2 && T.land(s) && !taken(s)) return s;
  }
  // Bütün kara oyulmuşsa karakter sonsuza dek suya düşmesin: küçük bir zemin çıkar.
  const c = clamp(c0, 1, T.cols - 2);
  T.raise(c - 1, c + 1);
  return c;
}
function place(T, ch, c0) {
  const c = spawnCol(T, c0, ch);
  ch.spawnCol = c; ch.x = c * B + B / 2; ch.y = T.surfaceY(c); ch.grounded = true; ch.vx = ch.vy = 0;
}
const spawnList = (p, n, inward) => { const a = Array.isArray(p) ? p.slice(0, n) : [p]; while (a.length < n) a.push(a[a.length - 1] + inward * 6); return a; };

function startMatch(mode, li, mapKey, def) {
  if (!Wallet.useTicket()) { play = null; screen = 'noticket'; return; }
  beginMatch(mode, li, mapKey, def);
}
function beginMatch(mode, li, mapKey, def) {
  def = def || (mode === '1p' ? LEVELS[li] : mapDef(mapKey));
  const T = makeMap(def);
  decorate(T, def, mode === '1p' ? (def.island || 0) : MAP_BACKDROP[mapKey] != null ? MAP_BACKDROP[mapKey] : (T.themeKey === 'snow' ? 1 : 0));
  const size = mode === '1p' ? (def.teams || 1) : twoSize, maxHp = HP_MAX;
  const free = mode === '1p' ? def.items : ['snowball', 'balloon', 'fish'];
  const teams = [makeTeam(0, false, free), makeTeam(1, mode === '1p', free)];
  play = { teams: [], T };
  [spawnList(def.p, size, 1), spawnList(def.e, size, -1)].forEach((cols, ti) => cols.forEach((c, i) => {
    const ch = makeChar(teams[ti], i, maxHp); teams[ti].chars.push(ch);
    play.teams = teams; place(T, ch, c);
  }));
  // Penguen takımı bölümün bedava verdiği eşyaların üstüne dükkândan aldıklarını da getirir.
  // Önce bedava olanlar harcanır (free), sonra dükkân stoğu.
  const kid = teams[0]; kid.free = {};
  for (const k of BUYABLE) { kid.free[k] = kid.ammo[k]; kid.ammo[k] += Wallet.inv(k); }
  // 2 oyuncu: kedi (genelde bir büyük) penguenin çantasının aynısını alır; kedinin harcadığı stoktan düşmez
  if (mode === '2p') for (const k of BUYABLE) teams[1].ammo[k] = kid.ammo[k];
  parts = []; words = []; shake = 0; fxs = []; stains = [];
  play = {
    mode, li, mapKey, def, T, teams, size, turn: 0, cur: null, phase: 'banner', t: 0,
    projs: [], acts: [], wind: 0, aim: null, walkDir: 0, walkLeft: WALK_BUDGET,
    ai: null, cpuShots: 0, winner: null, overT: 0, paused: false, acc: 0,
    stinks: [], flash: 0,
    turnNo: 0, drops: dropTurns(), plane: null, crates: [], pick: null, bag: false, fuse: 3, pan: 0,
  };
  cam.x = cam.tx = 0; cam.z = cam.tz = 1; cam.zi = 1; cam.kick = 0; cam.manual = false;
  screen = 'play';
  beginTurn();
  cam.x = cam.tx;
}
const cur = () => play.cur;
const curTeam = () => play.teams[play.turn];
function useAmmo(team, k) {
  if (team.ammo[k] === Infinity) return;
  team.ammo[k]--;
  if (team.free) { if (team.free[k] > 0) team.free[k]--; else Wallet.useItem(k); }
}

function beginTurn() {
  const team = curTeam();
  let ch = null;
  for (let k = 0; k < team.chars.length; k++) {
    const c = team.chars[(team.next + k) % team.chars.length];
    if (alive(c)) { ch = c; team.next = (team.next + k + 1) % team.chars.length; break; }
  }
  play.cur = ch;
  ch.hitShow = false; ch.shield = false;
  play.phase = 'banner'; play.t = 0; play.aim = null; play.ai = null; play.walkDir = 0; play.pick = null; play.bag = false; play.pan = 0;
  play.bonus = false;
  play.walkLeft = WALK_BUDGET;
  if (ch.sticky) { play.walkLeft = 0; ch.sticky = 0; ch.stuck = true; }   // pastaya yapışan bu tur yürüyemez
  stinkTurn(ch);
  const wm = play.def.wind || 0;
  play.wind = wm ? Math.round(rand(-wm, wm)) : 0;
  if (!(team.ammo[team.item] > 0) || ITEMS[team.item].kind !== 'throw') team.item = 'snowball';
  cam.manual = false; focus(ch.x);
  play.turnNo++;
  if (play.drops.includes(play.turnNo)) startDrop(); else Sound.play('turn');
}
// Kutudan gelen +1 atış: sıra karşıya geçmeden aynı karakter bir daha atar
function bonusTurn() {
  play.phase = 'banner'; play.t = 0; play.aim = null; play.ai = null; play.walkDir = 0; play.pick = null; play.bag = false; play.pan = 0;
  play.bonus = true; cam.manual = false; focus(cur().x);
  const team = curTeam();
  if (!(team.ammo[team.item] > 0) || ITEMS[team.item].kind !== 'throw') team.item = 'snowball';
  Sound.play('pickup');
}
function endTurn() {
  const ch = cur(); if (ch) ch.stuck = false;
  play.turn = 1 - play.turn;
  beginTurn();
}

/* ----- Kamera ----- */
function focus(x) { if (!cam.manual) cam.tx = x - viewW() / 2; }
function updateCam(dt) {
  cam.z += (cam.tz - cam.z) * Math.min(1, dt * 5);
  cam.kick *= Math.exp(-dt * 6);
  const vw = viewW(), maxX = play.T.w - vw;
  if (play.pan) { cam.manual = true; cam.tx += play.pan * 520 * dt / cam.z; }
  cam.tx = maxX < 0 ? maxX / 2 : clamp(cam.tx, 0, maxX);
  cam.x += (cam.tx - cam.x) * Math.min(1, dt * 4.5);
  cam.x = maxX < 0 ? maxX / 2 : clamp(cam.x, 0, maxX);
}

/* ----- Sürpriz kutu: maç başına 2 kez, rastgele bir turun başında uçak bırakır ----- */
const CRATE_LOOT = [['heart', 22], ['extra', 12], ['fish', 10], ['balloon', 9], ['firework', 9], ['melon', 10], ['volcano', 8], ['frog', 7], ['bugs', 6], ['umbrella', 7]];   // toplam 100
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
  const far = c => allChars().every(ch => Math.abs(c * B + B / 2 - ch.x) > 70);
  let cols = [];
  for (let c = 2; c <= T.cols - 3; c++) if (T.land(c) && far(c)) cols.push(c);
  if (!cols.length) for (let c = 2; c <= T.cols - 3; c++) if (T.land(c)) cols.push(c);
  const c = cols.length ? cols[Math.floor(rand(0, cols.length))] : spawnCol(T, T.cols >> 1);
  const dir = Math.random() < .5 ? 1 : -1;
  play.plane = { x: dir > 0 ? -60 : T.w + 60, y: 96, vx: dir * 380, dropX: c * B + B / 2, crate: null };
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
    if (pl.x < -80 || pl.x > T.w + 80) play.plane = null;
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
    if (!cr.gone) for (const ch of allChars()) {
      if (alive(ch) && Math.abs(ch.x - cr.x) < 20 && Math.abs(ch.y - cr.y) < 26) { collect(ch, cr); break; }
    }
  }
  play.crates = play.crates.filter(cr => !cr.gone);
}
function collect(ch, cr) {
  cr.gone = true;
  const team = play.teams[ch.team];
  let k = cr.loot;
  if (k === 'heart' && ch.hp >= ch.maxHp) k = 'fish';
  if (k === 'heart') { heal(ch, 30); }
  else if (k === 'extra') {
    // +1 atış: bu takım sıradaki atışından sonra aynı karakterle bir kez daha atar
    team.extra = (team.extra || 0) + 1;
    words.push({ x: cr.x, y: cr.y - 10, word: '🎯 +1 ATIŞ', size: 28, t: 0, color: '#FFD23F' });
  } else {
    team.ammo[k] = (team.ammo[k] || 0) + 1;
    if (team.free) team.free[k] = (team.free[k] || 0) + 1;   // kutudan gelen bedava, dükkân stoğundan önce harcanır
  }
  Sound.play('pickup');
  burst('spark', cr.x, cr.y - 12, 16, { colors: ['#FFD23F', '#FFFFFF', ch.color], g: 60, speed: [60, 220] });
  ring(cr.x, cr.y - 12, '#FFD23F', 40);
  if (k !== 'heart' && k !== 'extra') words.push({ x: cr.x, y: cr.y - 10, word: '+1', item: k, size: 30, t: 0, color: '#FFD23F' });
}

/* ----- Karakter fiziği ----- */
function onGround(T, ch) { return T.solidAt(ch.x - 8, ch.y) || T.solidAt(ch.x, ch.y) || T.solidAt(ch.x + 8, ch.y); }
function charPhysics(ch, dt) {
  const T = play.T;
  if (ch.carried) return;
  if (ch.grounded && !onGround(T, ch)) { ch.grounded = false; ch.vy = Math.max(ch.vy, 0); }
  if (ch.grounded) return;
  if (ch.fallFrom == null || ch.y < ch.fallFrom) ch.fallFrom = ch.y;
  // Paraşüt: penguen takımının çantasında varsa hızlı düşüşte kendiliğinden açılır
  const team = play.teams[ch.team];
  if (!ch.chute && !ch.calm && ch.vy > 300 && ch.y - ch.fallFrom > FALL_SAFE && team.ammo.chute > 0 && alive(ch)) openChute(ch, team);
  ch.vy = ch.chute ? Math.min(ch.vy + 900 * dt, 75) : Math.min(ch.vy + 900 * dt, 700);
  if (ch.chute) ch.vx = ch.calm ? 0 : play.wind * 14;   // balondan inen süzülür, rüzgâr bir daha itmez
  ch.x = clamp(ch.x + ch.vx * dt, 14, T.w - 14);
  let dy = ch.vy * dt;
  if (dy <= 0) ch.y += dy;
  else while (dy > 0) {
    const s = Math.min(4, dy); ch.y += s; dy -= s;
    if (onGround(T, ch)) {
      const r = Math.floor((H - 1 - ch.y) / B);
      ch.y = H - (r + 1) * B; ch.vy = 0; ch.vx = 0; ch.grounded = true;
      if (ch.fallFrom != null && ch.y - ch.fallFrom > 12) poseKick(ch, { sy: .74, sx: 1.26 });
      const drop = ch.fallFrom == null ? 0 : ch.y - ch.fallFrom;
      if (drop > FALL_SAFE && !ch.chute && !ch.calm) { damage(ch, Math.min(30, (drop - FALL_SAFE) * .2)); burst('smoke', ch.x, ch.y - 2, 6, { colors: ['#E9E0D2'], g: -10, speed: [30, 90], size: [4, 7], grow: 10, life: [.4, .7], drag: 2 }); }
      ch.fallFrom = null; ch.chute = false; ch.calm = false; break;
    }
  }
  if (ch.y > T.waterY + 14 || ch.y > H + 30) splash(ch);
}
// Hasar: güçten düşer, üstünde kırmızı sayı uçar. Şemsiye ilk isabeti tümüyle yutar.
function damage(ch, amt, snowy = false) {
  amt = Math.round(amt);
  if (amt <= 0 || !alive(ch)) return false;
  if (ch.shield) {
    ch.shield = false; Sound.play('pop');
    ring(ch.x, ch.y - 22, '#7FE0FF', 52, .5, 5);
    burst('spark', ch.x, ch.y - 30, 14, { colors: ['#7FE0FF', '#FFFFFF'], g: 100, speed: [60, 200] });
    words.push({ x: ch.x, y: ch.y - 40, word: 'KALKAN!', size: 24, t: 0, color: '#7FE0FF' });
    return false;
  }
  if (snowy) ch.hitShow = true;   // başta kar yığını yalnızca kartopunda; diğer isabetler kendi izini bırakır
  ch.hp = Math.max(0, ch.hp - amt);
  ch.hurtT = .6;
  poseKick(ch, { sy: .62, sx: 1.36 });
  if (!ch.mood || (ch.mood.k === 'sneeze' && ch.mood.fired)) react(ch, 'hurt', { dur: .5 });
  burst('spark', ch.x, ch.y - 44, 6, { colors: ['#FF7A6E', '#FFFFFF'], g: 120, speed: [60, 140] });
  words.push({ x: ch.x + rand(-8, 8), y: ch.y - 34, word: '−' + amt, size: 20 + Math.min(16, amt / 3), t: 0, color: amt >= 30 ? '#FF4D3D' : '#FF8A5C' });
  if (amt >= 30) shake = Math.max(shake, 8);
  if (!alive(ch)) { Sound.play('lose'); burst('spark', ch.x, ch.y - 24, 18, { colors: ['#FFD23F', '#FFFFFF', ch.color], g: 80, speed: [80, 240] }); }
  return true;
}
function heal(ch, amt) {
  const before = ch.hp;
  ch.hp = Math.min(ch.maxHp, ch.hp + amt); ch.hitShow = false;
  const got = Math.round(ch.hp - before);
  if (got > 0) words.push({ x: ch.x, y: ch.y - 40, word: '+' + got, size: 26, t: 0, color: '#5DDB5A' });
  return got;
}
function openChute(ch, team) {
  ch.chute = true; useAmmo(team, 'chute'); Sound.play('pickup');
  words.push({ x: ch.x, y: ch.y - 70, word: '🪂', size: 30, t: 0 });
}
function splash(ch) {
  const T = play.T, team = play.teams[ch.team];
  // Paraşüt: suya düşen karakteri kurtarır, en yakın karaya süzülerek indirir (su hasarı yok)
  if (alive(ch) && (ch.chute || team.ammo.chute > 0)) {
    if (!ch.chute) useAmmo(team, 'chute');
    Sound.play('pickup');
    burst('drop', ch.x, T.waterY, 14, { colors: WATER_C, dir: -Math.PI / 2, spread: .5, speed: [100, 240], size: [2, 3.6] });
    const c = spawnCol(T, ch.spawnCol, ch);
    ch.x = c * B + B / 2; ch.y = Math.max(40, T.surfaceY(c) - 150); ch.vx = 0; ch.vy = 0; ch.grounded = false;
    ch.chute = true; ch.calm = true; ch.fallFrom = null; ch.mood = null;
    words.push({ x: ch.x, y: ch.y - 40, word: '🪂 KURTARDI!', size: 26, t: 0, color: '#7FE0FF' });
    return;
  }
  Sound.play('splashBig');
  burst('drop', ch.x, T.waterY, 34, { colors: WATER_C.concat('#FFFFFF'), dir: -Math.PI / 2, spread: .5, speed: [160, 400], size: [2.4, 4.6] });
  ring(ch.x, T.waterY, '#FFFFFF', 46, .5, 4);
  words.push({ x: ch.x, y: T.waterY, word: 'ŞAPUR!', size: 26, t: 0 });
  ch.shield = false; damage(ch, WATER_DMG); ch.fallFrom = null; ch.calm = true;   // yeniden doğarken iniş hasar saymaz
  const c = spawnCol(T, ch.spawnCol, ch);
  ch.x = c * B + B / 2; ch.y = T.surfaceY(c) - 90; ch.vx = 0; ch.vy = 0; ch.grounded = false; ch.chute = false;
  ch.wet = 6; ch.spots = null; ch.mood = null;
}
function walk(ch, dir, dt) {
  const T = play.T;
  if (!ch.grounded || play.walkLeft <= 0) return;
  const sp = 70 * dt;
  const nx = clamp(ch.x + dir * sp, 14, T.w - 14);
  const fx = nx + dir * 9;
  if (T.solidAt(fx, ch.y - 2)) {
    const r = Math.floor((H - 1 - (ch.y - 2)) / B), c = Math.floor(fx / B);
    if (T.solid(c, r + 1) || T.solid(c, r + 2) || T.solid(c, r + 3)) return; // duvar çok yüksek
    ch.y = H - (r + 1) * B;
  }
  ch.x = nx; play.walkLeft -= sp; ch.walkAnim += dt;
}

/* ----- Mermiler ----- */
function stepProj(p, dt) {
  const T = play.T, it = ITEMS[p.item];
  if (p.delay > 0) { p.delay -= dt; return null; }
  if (it.fall) {
    // böcek ve meteor: sabit hızla düşer, rüzgâr onları tam olarak (x1 - x0) kadar kaydırır
    if (p.x0 == null) { p.x0 = p.x1 = p.x; p.y0 = p.y; }
    p.y += it.fall * dt;
    const gy = Math.max(p.y0 + 1, groundY(p.x1));
    p.x = p.x0 + (p.x1 - p.x0) * clamp((p.y - p.y0) / (gy - p.y0), 0, 1);
  } else {
    if (p.rest) { if (!T.solidAt(p.x, p.y + 3)) p.rest = false; }
    if (!p.rest) {
      p.vx += play.wind * WIND_ACC * it.wind * dt;
      if (it.boomerang && p.t > .3) p.vx -= p.dir0 * 560 * dt;   // geri döner
      p.vy += GRAV * (it.grav || 1) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      // hafif tüy ekranın üstünden çıkıp rüzgârla haritadan uçup gitmesin: tepeye değince süzülür, kenardan geri seker
      if (it.light) {
        if (p.y < 24 && p.vy < 0) { p.y = 24; p.vy = 0; }
        if (p.x < 10 && p.vx < 0 || p.x > T.w - 10 && p.vx > 0) p.vx = -p.vx * .5;
      }
    }
  }
  p.t += dt;
  if (it.spin) p.rot = (p.rot || 0) + dt * 12 * Math.sign(p.vx || 1);
  if (p.x < -60 || p.x > T.w + 60 || p.y > H + 40 || p.t > 12) return { type: 'out' };
  if (p.fuse && p.t >= p.fuse) return { type: 'timer' };
  if (it.apex && p.vy >= 0 && p.t > .2) return { type: 'apex' };
  for (const ch of allChars()) {
    if (!alive(ch) || ch.team === p.team) continue;
    if (Math.abs(p.x - ch.x) < 15 && p.y > ch.y - 40 && p.y < ch.y) return { type: 'char' };
  }
  if (!p.rest && T.solidAt(p.x, p.y)) return { type: 'terrain' };
  if (p.y >= T.waterY) return { type: 'water' };
  return null;
}
function groundY(x) {
  const T = play.T, c = clamp(Math.floor(x / B), 0, T.cols - 1);
  return T.land(c) ? T.surfaceY(c) : T.waterY;
}
function simulate(x, y, vx, vy, item, team, maxT, path) {
  const p = { x, y, vx, vy, item, team, t: 0, dir0: Math.sign(vx) || 1 };
  let n = 0;
  while (p.t < maxT) {
    const hit = stepProj(p, SIM_DT);
    if (path && (n++ % 4 === 0)) path.push({ x: p.x, y: p.y });
    if (hit) return Object.assign(hit, { x: p.x, y: p.y });
  }
  return null;
}
function newProj(o) { return Object.assign({ t: 0, trail: [], bounces: 0, rot: 0 }, o); }
function fire(vx, vy) {
  const ch = cur(), team = curTeam(), k = team.item;
  ch.throwT = .38; ch.face = Math.sign(vx) || ch.face; poseOf(ch).vel.armR = -30;
  play.projs.push(newProj({ x: ch.x, y: ch.y - 24, vx, vy, item: k, team: ch.team, dir0: Math.sign(vx) || 1, fuse: ITEMS[k].fuse ? play.fuse : 0 }));
  useAmmo(team, k);
  if (team.cpu) play.cpuShots++;
  play.phase = 'fly'; play.aim = null; play.acc = 0; play.pick = null; cam.manual = false;
  Sound.play('throw');
}
// Mermi bir yere çarptı: sekenler sekiyor, saat duruyor, gerisi patlıyor
function hitProj(p, hit, px, py) {
  const it = ITEMS[p.item];
  if (hit.type === 'terrain' && (it.bounce > p.bounces || p.fuse)) {
    const T = play.T;
    const sideways = T.solidAt(px + p.vx * SIM_DT * 2, py) && !T.solidAt(px, py + Math.abs(p.vy) * SIM_DT * 2 + 1);
    p.x = px; p.y = py;
    if (sideways) p.vx = -p.vx * .6; else { p.vy = -Math.abs(p.vy) * .5; p.vx *= .7; }
    p.bounces++;
    if (p.fuse && Math.hypot(p.vx, p.vy) < 60) { p.rest = true; p.vx = p.vy = 0; }
    if (!p.rest) Sound.play('bounce');
    return false;
  }
  if (hit.type === 'apex') { fireworkBurst(p, p.x, p.y); return true; }
  if (hit.type === 'char' && p.fuse) { p.vx *= -.3; p.vy = -60; return false; }   // saat çarpıp seker, zamanı dolunca çalar
  explode(p, p.x, p.y, hit.type);
  return true;
}
function explode(p, x, y, kind) {
  const it = ITEMS[p.item], T = play.T;
  if (kind === 'out') return;
  if (kind === 'water') {
    Sound.play('splash');
    burst('drop', x, T.waterY, 22, { colors: WATER_C, dir: -Math.PI / 2, spread: .6, speed: [120, 300], size: [2, 4] });
    ring(x, T.waterY, '#FFFFFF', 30, .4, 3);
    words.push({ x, y: T.waterY, word: 'ŞAPUR!', size: 26, t: 0 });
    return;
  }
  if (!it.noCarve) T.carve(x, y, it.carve || it.r);
  Sound.play(it.sound);
  (IMPACT[p.item] || ((xx, yy) => spawn(xx, yy, 26, it.colors)))(x, y, T);
  words.push({ x, y, word: it.word, size: 34, t: 0 });
  shake = Math.max(shake, it.noCarve ? 2 : 6);
  for (const cr of play.crates) {
    if (!cr.gone && p.team >= 0 && Math.hypot(cr.x - x, cr.y - 12 - y) < it.r + 12) collect(play.teams[p.team].chars.find(alive) || play.teams[p.team].chars[0], cr);
  }
  play.crates = play.crates.filter(cr => !cr.gone);
  propsBlast(x, y, it.r, p.team);
  let hitAny = false;
  for (const ch of allChars()) {
    if (ch.team === p.team || !alive(ch)) continue;   // kendine ve takım arkadaşına zarar yok (fıçının takımı yok: herkese vurur)
    const dx = ch.x - x, dy = (ch.y - 18) - y;
    const dist = Math.hypot(dx, dy), R = it.r + 16;
    if (dist >= R) continue;
    hitAny = true;
    // biber: hasar ve itme hemen değil, karakter hapşırınca gelir
    if (it.sneeze) { if (!(ch.mood && ch.mood.k === 'sneeze')) react(ch, 'sneeze', { dur: 1.5, dir: Math.sign(dx || 1), block: true }); continue; }
    // tam isabette en çok, kenarda en az %40; doğrudan çarpma biraz fazlası
    const near = 1 - dist / R, amt = (it.dmg || 20) * (kind === 'char' ? 1.15 : .4 + .6 * near);
    if (!it.noDamage && damage(ch, amt, it.snow)) Sound.play('hit');
    if (it.sticky) { ch.sticky = 1; words.push({ x: ch.x, y: ch.y - 50, word: 'YAPIŞTI!', size: 22, t: 0, color: '#FF9AD8' }); }
    if (REACT[p.item]) REACT[p.item](ch);
    ch.vx = Math.sign(dx || 1) * (it.push || 90); ch.vy = -220; ch.grounded = false;
  }
  const me = cur();
  if (hitAny && me && me.team === p.team && alive(me) && !me.mood) react(me, 'cheer', { dur: 1 });
  if (it.stink) play.stinks.push({ x, y: Math.min(y, groundY(x)) - 10, team: p.team, turns: 3, t: 0 });
  if (it.hive) play.acts.push(beesAct(p.team, x, y - 6, it.hive));
  if (it.volcano) play.acts.push(volcanoAct(p.team, x, it.volcano));
  if (it.apex) fireworkBurst(p, x, y - 10, true);
  if (it.cluster) for (let i = 0; i < it.cluster; i++) {
    play.projs.push(newProj({ x, y: y - 8, vx: rand(-170, 170), vy: rand(-340, -220), item: 'slice', team: p.team, dir0: 1 }));
  }
}

// Havai fişek: renk renk patlar, yıldızlar aşağı yağar (yere çarparsa da yıldızlarını saçar)
function fireworkBurst(p, x, y, landed = false) {
  const n = ITEMS.firework.apex;
  if (!landed) {
    Sound.play('pop'); Sound.play('pof'); play.flash = Math.max(play.flash, .2);
    burst('spark', x, y, 46, { colors: FW_C, g: 50, speed: [90, 300], size: [3, 6], life: [.7, 1.2] });
    ring(x, y, '#FFD23F', 70, .5, 4); ring(x, y, '#FF5A6E', 46, .4, 3);
    words.push({ x, y, word: 'PATT!', size: 34, t: 0, color: '#FFD23F' });
  }
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * (landed ? .5 : .62);
    const sp = landed ? 260 : 75;   // havada patlayınca yıldızlar dar bir yelpazeyle aşağı yağar
    play.projs.push(newProj({ x, y, vx: Math.cos(a) * sp + rand(-20, 20) + (landed ? 0 : p.vx * .3), vy: landed ? Math.sin(a) * sp : rand(-60, 30), item: 'fwstar', team: p.team, dir0: 1 }));
  }
}
// Yanardağ: düştüğü yerde küçük bir dağ yükselir, gürler, sonra lav taşları fışkırtır
function volcanoAct(team, x, n) {
  const gy = groundY(x), a = { t: 0, fx: x, shot: 0 };
  a.step = dt => {
    a.t += dt;
    if (a.t > .4 && a.t < 1.3) {
      shake = Math.max(shake, 1.5);
      if (Math.random() < dt * 22) burst('smoke', x + rand(-5, 5), gy - 32, 1, { colors: ['#6B6B6B', '#9A9A9A'], g: -40, speed: [10, 40], size: [4, 7], grow: 12, life: [.6, 1], drag: 1 });
    }
    if (a.shot < n && a.t >= 1.3 + a.shot * .16) {
      if (!a.shot) { Sound.play('thunder'); burst('fire', x, gy - 34, 26, { colors: LAVA_C, dir: -Math.PI / 2, spread: .5, g: 300, speed: [120, 320], size: [3, 6] }); }
      // ilk üç taş en yakın rakibe doğru (biraz saçılarak), kalanlar rastgele
      const foe = allChars().filter(c => alive(c) && c.team !== team).sort((p, q) => Math.abs(p.x - x) - Math.abs(q.x - x))[0];
      const vy = rand(-460, -380), tf = 2 * -vy / GRAV;
      const vx = foe && a.shot < 3 && Math.abs(foe.x - x) < 420 ? (foe.x - x) / tf + rand(-12, 12) : rand(-240, 240);
      play.projs.push(newProj({ x, y: gy - 38, vx, vy, item: 'lava', team, dir0: 1 }));
      a.shot++;
    }
    return a.shot >= n && a.t > 2.5;
  };
  a.draw = () => {
    const k = Math.min(1, a.t / .4) * (a.t > 2.2 ? Math.max(0, 1 - (a.t - 2.2) / .3) : 1), h = 32 * k;
    if (h <= 1) return;
    ctx.beginPath(); ctx.moveTo(x - h * 1.25, gy + 2); ctx.lineTo(x - h * .32, gy - h); ctx.lineTo(x + h * .32, gy - h); ctx.lineTo(x + h * 1.25, gy + 2); ctx.closePath();
    ctx.fillStyle = '#8A5D39'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - h * .32, gy - h); ctx.lineTo(x - h * .12, gy - h * .55); ctx.lineTo(x + h * .05, gy - h * .8); ctx.lineTo(x + h * .32, gy - h); ctx.closePath();
    ctx.fillStyle = a.t > 1.2 ? '#FF7A45' : '#B5562E'; ctx.fill();
    if (a.t > .4 && a.t < 1.3) text('GÜRR', x, gy - h - 16 - Math.sin(time * 30) * 2, 16, { color: '#FFB52E', lw: 4 });
  };
  return a;
}
// Ejderha: atanın tarafından uçarak gelir, seçilen sayının yanında durur ve ateş püskürür
function dragonAct(ch, u, dir) {
  const tg = targetAt(u, ch.team), team = ch.team, hy = Math.max(60, Math.min(tg.y - 110, 150));
  const hx = tg.x - dir * 70;
  const a = { t: 0, x: hx - dir * 460, y: hy - 40, stage: 0, fx: tg.x, blasted: false };
  Sound.play('whoosh');
  a.step = dt => {
    a.t += dt;
    if (a.stage === 0) {
      const d = hx - a.x; a.x += Math.sign(d) * Math.min(Math.abs(d), 420 * dt); a.y += (hy - a.y) * Math.min(1, dt * 4);
      if (Math.abs(d) < 1) { a.stage = 1; a.t = 0; }
    } else if (a.stage === 1) {
      const mx = a.x + dir * 22, my = a.y + 6;
      if (a.t > .15) {   // gökyüzü açık renk: 'fire' (lighter) beyaz görünür, ateş dili normal boyayla çizilir
        const dir = Math.atan2(tg.y - my, tg.x - mx);
        burst('smoke', mx, my, 4, { colors: ['#FF7A45', '#FFB52E', '#E5483B'], dir, spread: .2, g: 0, speed: [260, 380], size: [5, 9], grow: 16, life: [.25, .4] });
        burst('spark', mx, my, 1, { colors: ['#FFE14D', '#FFFFFF'], dir, spread: .3, g: 0, speed: [200, 340], size: [3, 5], life: [.2, .35] });
      }
      if (!a.blasted && a.t > .6) { a.blasted = true; blastAt(tg.x, tg.y, 'dragon', team); }
      if (a.t > 1.2) { a.stage = 2; a.t = 0; }
    } else {
      a.x += dir * 420 * dt; a.y -= 160 * dt;
      if (a.t > 1.1) return true;
    }
    a.fx = a.stage === 2 ? tg.x : a.x;
    return false;
  };
  a.draw = () => emojiAt('🐉', a.x, a.y + Math.sin(time * 9) * 4, 66, 0, dir > 0);
  return a;
}

/* ----- Sayılı eşyaların eylemleri -----
   Her eylem { step(dt) → bitti mi, draw(), fx: kameranın izleyeceği x } */
function blastAt(x, y, item, team) { explode({ item, team }, x, y, 'terrain'); }
function enemyNear(x, y, team, d = 18) { return allChars().some(c => alive(c) && c.team !== team && Math.abs(c.x - x) < d && Math.abs(c.y - 18 - y) < 30); }
function frogAct(ch, n, dir) {
  const T = play.T, team = ch.team;
  const a = { x: ch.x + dir * 12, y: ch.y, hop: 0, t: 1, fx: ch.x, from: null };
  const next = () => {
    const tx = clamp(a.x + dir * UNIT, 8, T.w - 8);
    a.from = { x: a.x, y: a.y }; a.to = { x: tx, y: groundY(tx) }; a.t = 0;
  };
  a.step = dt => {
    if (a.t >= 1) { if (a.hop >= n) return blastAt(a.x, a.y - 10, 'frog', team), true; next(); }
    a.t = Math.min(1, a.t + dt / .42);
    const h = 36 + Math.max(0, a.from.y - a.to.y);
    a.x = a.from.x + (a.to.x - a.from.x) * a.t;
    a.y = a.from.y + (a.to.y - a.from.y) * a.t - h * 4 * a.t * (1 - a.t);
    a.fx = a.x;
    if (a.t >= 1) {
      a.hop++; Sound.play('bounce');
      a.onWater = !T.land(Math.floor(a.x / B));   // suya denk gelirse nilüfer yaprağına basıp devam eder
      if (a.onWater) burst('drop', a.x, T.waterY, 6, { colors: WATER_C, speed: [40, 120], size: [1.6, 2.8] });
      if (enemyNear(a.x, a.y - 10, team)) { blastAt(a.x, a.y - 10, 'frog', team); return true; }
    }
    return false;
  };
  a.draw = () => { if (a.onWater && a.t >= .85) { ell(ctx, a.x, a.y + 1, 13, 4); ctx.fillStyle = '#5FB24A'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke(); } emojiAt('🐸', a.x, a.y - 11, 24, 0, dir > 0); if (a.t < 1 || a.hop < n) text(String(n - a.hop), a.x, a.y - 34, 18, { color: '#FFFFFF', lw: 5 }); };
  return a;
}
function chickenAct(ch, n, dir) {
  const T = play.T, team = ch.team, dist = n * UNIT;
  const a = { x: ch.x, y: ch.y, gone: 0, fx: ch.x, vy: 0 };
  a.step = dt => {
    const sp = 95 * dt, nx = clamp(a.x + dir * sp, 8, T.w - 8);
    const c = Math.floor(nx / B), gy = groundY(nx);
    if (gy < a.y - 2 * B - 1) { blastAt(a.x, a.y - 10, 'chicken', team); return true; }   // duvar: koşamaz, patlar
    a.x = nx; a.gone += sp; a.fx = a.x;
    if (gy < a.y) a.y = gy; else { a.vy += 900 * dt; a.y = Math.min(gy, a.y + a.vy * dt); if (a.y >= gy) a.vy = 0; }
    if (!T.land(c) && a.y >= T.waterY - 1) { spawn(a.x, T.waterY, 10, ['#4FB3F0', '#FFFFFF']); Sound.play('splash'); return true; }
    if (enemyNear(a.x, a.y - 10, team) || a.gone >= dist) { blastAt(a.x, a.y - 10, 'chicken', team); return true; }
    return false;
  };
  a.draw = () => {
    emojiAt('🐔', a.x, a.y - 12 - Math.abs(Math.sin(a.gone * .3)) * 3, 24, 0, dir > 0);
    text(String(Math.max(0, Math.ceil((dist - a.gone) / UNIT))), a.x, a.y - 36, 18, { color: '#FFFFFF', lw: 5 });
  };
  return a;
}
// Böcek uçağı: seçilen sayının üstünden 3 uğur böceği bırakır; rüzgâr onları tam "rüzgâr" kadar sayı kaydırır.
function bugsAct(team, u) {
  const T = play.T, x = unitX(u), dir = x > T.w / 2 ? -1 : 1;
  const a = { px: dir > 0 ? -70 : T.w + 70, dropped: false, fx: x };
  Sound.play('plane');
  a.step = dt => {
    a.px += dir * 430 * dt;
    if (!a.dropped) a.fx = a.px;
    if (!a.dropped && (dir > 0 ? a.px >= x : a.px <= x)) {
      a.dropped = true;
      for (const k of [-1, 0, 1]) {
        const x0 = x + k * 11;
        play.projs.push(newProj({ x: x0, y: 70, x0, y0: 70, x1: x0 + play.wind * UNIT, item: 'bug', team, delay: (k + 1) * .12 }));
      }
    }
    return a.px < -90 || a.px > T.w + 90;
  };
  a.draw = () => drawSprite(ctx, SPR.plane, a.px - 36, 56, 4.5, { flip: dir < 0 });
  return a;
}
function meteorAct(team, u0, u1) {
  for (let u = u0, i = 0; u <= u1; u++, i++) {
    const x = unitX(u);
    play.projs.push(newProj({ x, y: -30, x0: x, y0: -30, x1: x, item: 'rock', team, delay: i * .35 }));
  }
  Sound.play('plane');
}
function balloonAct(ch, u) {
  const T = play.T, tx = unitX(u), lx = clamp(tx + play.wind * UNIT, 14, T.w - 14);
  const a = { stage: 0, fx: ch.x };
  ch.carried = true; ch.grounded = false;
  a.step = dt => {
    if (a.stage === 0) { ch.y -= 160 * dt; if (ch.y <= 110) a.stage = 1; }
    else if (a.stage === 1) { const d = tx - ch.x; ch.x += Math.sign(d) * Math.min(Math.abs(d), 220 * dt); if (Math.abs(d) < 1) a.stage = 2; }
    else if (a.stage === 2) { const d = lx - ch.x; ch.x += Math.sign(d) * Math.min(Math.abs(d), 120 * dt); if (Math.abs(d) < 1) a.stage = 3; }
    else { ch.carried = false; ch.vy = 0; ch.chute = true; ch.calm = true; return true; }   // balon bırakır, paraşütle süzülerek iner
    a.fx = ch.x;
    return false;
  };
  a.draw = () => { if (a.stage < 3) { ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ch.x, ch.y - 40); ctx.lineTo(ch.x, ch.y - 58); ctx.stroke(); emojiAt('🎈', ch.x, ch.y - 72, 30); } };
  return a;
}
// Sayılı seçim onaylandı
// Seçilen sayıda bir rakip varsa onu, yoksa o sayının zeminini hedefle (nokta atışı)
function targetAt(u, team) {
  const foe = allChars().find(c => alive(c) && c.team !== team && unitOf(c.x) === u);
  const x = foe ? foe.x : unitX(u);
  return { x, y: foe ? foe.y - 16 : groundY(x) - 4, foe };
}
// Hedef füzesi: yükselir, kavis çizer, seçilen sayıya tam isabet eder (az acıtır)
function missileAct(ch, u) {
  const tg = targetAt(u, ch.team), x0 = ch.x, y0 = ch.y - 30, peak = Math.min(y0, tg.y) - 150;
  const cx = (x0 + tg.x) / 2, dur = .8 + Math.abs(tg.x - x0) / 900;
  const a = { t: 0, x: x0, y: y0, ang: -Math.PI / 2, fx: x0 };
  Sound.play('throw');
  a.step = dt => {
    a.t = Math.min(1, a.t + dt / dur);
    const t = a.t, px = a.x, py = a.y;
    a.x = (1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * cx + t * t * tg.x;
    a.y = (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * peak + t * t * tg.y;
    a.ang = Math.atan2(a.y - py, a.x - px); a.fx = a.x;
    burst('smoke', a.x - Math.cos(a.ang) * 12, a.y - Math.sin(a.ang) * 12, 1, { colors: ['#FFFFFF', '#E3E8F0'], g: -10, speed: [5, 25], size: [3, 5], grow: 10, life: [.4, .6], drag: 2 });
    burst('fire', a.x - Math.cos(a.ang) * 12, a.y - Math.sin(a.ang) * 12, 1, { colors: ['#FFB52E', '#FF7A45'], g: 0, speed: [5, 30], size: [3, 5], life: [.15, .25] });
    if (a.t >= 1) { blastAt(a.x, a.y, 'missile', ch.team); return true; }
    return false;
  };
  a.draw = () => emojiAt('🚀', a.x, a.y, 24, a.ang + Math.PI / 4);
  return a;
}
// Yıldırım bulutu: seçilen sayının üstünde kara bulut toplanır, gürler, yıldırım düşer
function stormAct(team, u) {
  const tg = targetAt(u, team), cy = 70;
  const a = { t: 0, fx: tg.x, struck: false, bolt: null };
  a.step = dt => {
    a.t += dt;
    if (a.t > .3 && a.t < 1.3 && Math.random() < dt * 30) burst('drop', tg.x + rand(-34, 34), cy + 14, 1, { colors: ['#9BD8F6'], dir: Math.PI / 2, spread: .05, speed: [200, 260], g: 300, size: [1.2, 1.8], life: [.4, .7] });
    if (!a.struck && a.t >= 1.3) {
      a.struck = true; play.flash = .55; Sound.play('thunder');
      // zikzak yıldırım
      a.bolt = []; let x = tg.x + rand(-8, 8);
      for (let y = cy + 10; y < tg.y; y += 16) { a.bolt.push([x, y]); x += rand(-10, 10); }
      a.bolt.push([tg.x, tg.y]);
      blastAt(tg.x, tg.y, 'storm', team);
      const hit = allChars().filter(c => alive(c) && c.team !== team && Math.hypot(c.x - tg.x, c.y - 18 - tg.y) < ITEMS.storm.r + 16);
      for (const c of hit) { c.dizzy = 2.2; paintChar(c, ['#2B2F3A', '#4A4F5C']); }
    }
    return a.t > 2.1;
  };
  a.draw = () => {
    const k = Math.min(1, a.t / .5) * (a.t > 1.7 ? Math.max(0, 1 - (a.t - 1.7) / .4) : 1), dark = a.t > 1.25 && a.t < 1.4;
    ctx.save(); ctx.globalAlpha = k;
    [[-26, 6, 20], [0, 0, 26], [26, 6, 20], [-12, 14, 18], [14, 14, 18]].forEach(([dx, dy, r]) => {
      ell(ctx, tg.x + dx, cy + dy, r * k + 2, (r * .75) * k + 2); ctx.fillStyle = dark ? '#2C3040' : '#5A6075'; ctx.fill();
    });
    ell(ctx, tg.x - 6, cy - 4, 14 * k, 6 * k); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fill();
    ctx.restore();
    if (a.bolt && a.t < 1.55) {
      for (const [w, c] of [[9, 'rgba(255,240,150,.5)'], [4, '#FFF6B0'], [1.6, '#FFFFFF']]) {
        ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.beginPath();
        a.bolt.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
      }
    }
  };
  return a;
}
// Hortum: rakibe doğru seçilen adım kadar gider; su ve duvar onu durdurmaz, yakaladığını havaya savurur
function tornadoAct(ch, n, dir) {
  const T = play.T, team = ch.team, dist = n * UNIT;
  const a = { x: ch.x + dir * 14, y: ch.y, gone: 0, fx: ch.x, t: 0 };
  Sound.play('whoosh');
  a.step = dt => {
    a.t += dt;
    const sp = 120 * dt; a.x = clamp(a.x + dir * sp, 8, T.w - 8); a.gone += sp; a.fx = a.x;
    const gy = groundY(a.x); a.y += (gy - a.y) * Math.min(1, dt * 8);   // zeminin ya da suyun üstünde süzülür
    if (Math.random() < dt * 20) burst(T.land(Math.floor(a.x / B)) ? 'chunk' : 'drop', a.x + rand(-10, 10), a.y - 4, 1, { colors: T.land(Math.floor(a.x / B)) ? ['#B67A47', '#7FE05C'] : WATER_C, dir: -Math.PI / 2, spread: .8, speed: [80, 200], size: [2, 4] });
    const foe = allChars().find(c => alive(c) && c.team !== team && Math.abs(c.x - a.x) < 20 && Math.abs(c.y - a.y) < 50);
    if (foe) {
      if (damage(foe, ITEMS.tornado.dmg)) Sound.play('hit');
      foe.vx = dir * 260; foe.vy = -420; foe.grounded = false; foe.dizzy = 1.6; foe.fallFrom = null; foe.calm = true;   // savrulup düşmek ayrıca hasar saymaz
      words.push({ x: foe.x, y: foe.y - 40, word: 'VUUUŞ!', size: 30, t: 0, color: '#C9D3E0' });
      puffSmoke(a.x, a.y - 20, 8, ['#FFFFFF', '#C9D3E0'], [6, 11]); return true;
    }
    if (a.gone >= dist) { puffSmoke(a.x, a.y - 20, 10, ['#FFFFFF', '#C9D3E0'], [6, 12]); return true; }
    return false;
  };
  a.draw = () => {
    for (let i = 0; i < 9; i++) {
      const h = i * 7, w = 6 + i * 2.6, sway = Math.sin(a.t * 9 + i * .7) * (2 + i * .8);
      ell(ctx, a.x + sway, a.y - 4 - h, w, 3 + i * .3);
      ctx.strokeStyle = `rgba(150,165,185,${.85 - i * .05})`; ctx.lineWidth = 2.4; ctx.stroke();
      ctx.fillStyle = 'rgba(220,228,238,.35)'; ctx.fill();
    }
    text(String(Math.max(0, Math.ceil((dist - a.gone) / UNIT))), a.x, a.y - 76, 18, { color: '#FFFFFF', lw: 5 });
  };
  return a;
}
// Yer değiştirme: en yakın rakiple ışıltılar içinde yer değiştirir
function swapPlaces(ch) {
  const foe = nearestFoe(ch);
  if (foe === ch) return;
  const sparkle = c => { burst('spark', c.x, c.y - 20, 18, { colors: ['#FFD23F', '#FFFFFF', '#7FE0FF'], g: -80, speed: [40, 200], jx: 8, size: [3, 6] }); ring(c.x, c.y - 20, '#7FE0FF', 40); };
  sparkle(ch); sparkle(foe);
  for (const k of ['x', 'y', 'spawnCol']) [ch[k], foe[k]] = [foe[k], ch[k]];
  for (const c of [ch, foe]) { c.vx = c.vy = 0; c.grounded = false; c.pop = .35; c.fallFrom = null; c.calm = true; }
  sparkle(ch); sparkle(foe); Sound.play('zap');
  words.push({ x: (ch.x + foe.x) / 2, y: Math.min(ch.y, foe.y) - 50, word: 'HOP!', size: 30, t: 0, color: '#7FE0FF' });
}
// Arı kovanı: patlayınca arılar en yakın rakibi kovalayıp sokar
function beesAct(team, x, y, n) {
  const bees = Array.from({ length: n }, (_, i) => ({ x: x + rand(-8, 8), y: y + rand(-8, 4), ph: rand(0, 6), done: false, t: -i * .12 }));
  const a = { fx: x };
  Sound.play('buzz');
  a.step = dt => {
    let live = 0;
    for (const b of bees) {
      if (b.done) continue; live++;
      b.t += dt; if (b.t < 0) continue;
      const foe = allChars().filter(c => alive(c) && c.team !== team).sort((p, q) => Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y))[0];
      if (!foe || b.t > 4) { b.y -= 120 * dt; if (b.t > 4.6) b.done = true; continue; }
      const tx = foe.x, ty = foe.y - 26, d = Math.hypot(tx - b.x, ty - b.y) || 1;
      b.x += (tx - b.x) / d * 170 * dt + Math.sin(b.t * 14 + b.ph) * 40 * dt;
      b.y += (ty - b.y) / d * 170 * dt + Math.cos(b.t * 11 + b.ph) * 40 * dt;
      if (d < 12) {
        b.done = true;
        if (damage(foe, ITEMS.sting.dmg)) Sound.play('hit');
        burst('spark', b.x, b.y, 6, { colors: ['#FFD23F', '#FFFFFF'], g: 60, speed: [40, 120] });
        words.push({ x: foe.x + rand(-10, 10), y: foe.y - 46, word: 'AY!', size: 18, t: 0, color: '#FFD23F' });
        if (!foe.mood) react(foe, 'hurt', { dur: .4 });
      }
      a.fx = b.x;
    }
    return live === 0;
  };
  a.draw = () => { for (const b of bees) if (!b.done && b.t >= 0) emojiAt('🐝', b.x, b.y, 16, Math.sin(b.t * 30) * .3); };
  return a;
}
// Kokarca bulutu: 3 tur kalır; içinde turuna başlayan rakip öksürür ve güç kaybeder (bayıltmaz)
function stinkTurn(ch) {
  for (const st of play.stinks) {
    if (play.turn === st.team) st.turns -= .5;
    if (ch.team === st.team || Math.hypot(ch.x - st.x, ch.y - 16 - st.y) > 62) continue;
    damage(ch, Math.min(8, ch.hp - 1)); Sound.play('cough');
    burst('smoke', ch.x, ch.y - 30, 8, { colors: ['#8BC34A', '#C5E1A5'], g: -20, speed: [20, 70], size: [4, 7], grow: 10, drag: 2 });
    words.push({ x: ch.x, y: ch.y - 50, word: 'ÖHÖ ÖHÖ!', size: 22, t: 0, color: '#9CCC65' });
    react(ch, 'hurt', { dur: .6 });
  }
  play.stinks = play.stinks.filter(st => st.turns > 0);
}
function drawStinks() {
  for (const st of play.stinks) {
    const k = Math.min(1, st.t / .6);
    for (let i = 0; i < 7; i++) {
      const a = i * .9 + time * .4, r = 18 + (i % 3) * 7;
      ell(ctx, st.x + Math.cos(a) * 30 * k, st.y + Math.sin(a * 1.3) * 12 * k, r * k, r * .7 * k);
      ctx.fillStyle = `rgba(139,195,74,${.22 * Math.min(1, st.turns)})`; ctx.fill();
    }
    // koku çizgileri
    ctx.strokeStyle = 'rgba(85,139,47,.55)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      for (let y = 0; y < 30; y += 3) { const xx = st.x + i * 18 + Math.sin(y * .3 + time * 4 + i) * 4; y ? ctx.lineTo(xx, st.y - 20 - y) : ctx.moveTo(xx, st.y - 20 - y); }
      ctx.stroke();
    }
  }
}

function usePick() {
  const pk = play.pick, ch = cur(), team = curTeam(), k = pk.item, T = play.T;
  if (!pickValid(pk)) return;
  useAmmo(team, k);
  play.pick = null; play.bag = false; cam.manual = false;
  const dir = pk.dir;
  if (k === 'frog') play.acts.push(frogAct(ch, pk.val, dir));
  else if (k === 'chicken') play.acts.push(chickenAct(ch, pk.val, dir));
  else if (k === 'bugs') play.acts.push(bugsAct(ch.team, pk.val));
  else if (k === 'meteor') meteorAct(ch.team, Math.min(pk.val, pk.val2), Math.max(pk.val, pk.val2));
  else if (k === 'flyballoon') play.acts.push(balloonAct(ch, pk.val));
  else if (k === 'missile') play.acts.push(missileAct(ch, pk.val));
  else if (k === 'storm') play.acts.push(stormAct(ch.team, pk.val));
  else if (k === 'dragon') play.acts.push(dragonAct(ch, pk.val, dir));
  else if (k === 'tornado') play.acts.push(tornadoAct(ch, pk.val, dir));
  else if (k === 'swap') swapPlaces(ch);
  else if (k === 'teleport') {
    const sparkle = () => { burst('spark', ch.x, ch.y - 20, 22, { colors: ['#FFD23F', '#FFFFFF', '#B8A6FF'], dir: -Math.PI / 2, spread: .25, g: -120, speed: [40, 220], jx: 10, size: [3, 6] }); ring(ch.x, ch.y - 20, '#B8A6FF', 40); };
    sparkle();
    const c = clamp(Math.floor(unitX(pk.val) / B), 1, T.cols - 2);
    ch.x = c * B + B / 2; ch.y = T.surfaceY(c); ch.vx = ch.vy = 0; ch.grounded = true; ch.pop = .35;
    sparkle(); Sound.play('zap');
  } else if (k === 'wall') {
    const c = Math.floor(ch.x / B) + dir * 2, base = T.top(c) + 1, cells = [];
    for (let r = base; r < Math.min(ROWS - 2, base + pk.val); r++) cells.push([c, r]);
    play.acts.push(buildAct(cells, MAT.snowwall, SNOW_C));
  } else if (k === 'bridge') {
    const r = Math.round((H - ch.y) / B) - 1, c0 = Math.floor(ch.x / B) + dir, cells = [];
    for (let i = 0; i < pk.val; i++) { const c = c0 + dir * i; if (!T.solid(c, r)) cells.push([c, r]); }
    play.acts.push(buildAct(cells, MAT.wood, ['#D29A5E', '#9E6A38']));
  } else if (k === 'umbrella') {
    ch.shield = true; Sound.play('pickup'); ring(ch.x, ch.y - 22, '#7FE0FF', 46, .5, 5);
    words.push({ x: ch.x, y: ch.y - 50, word: 'KALKAN!', size: 24, t: 0, color: '#7FE0FF' });
  } else if (k === 'potion') {
    heal(ch, 35); Sound.play('pickup');
    burst('heart', ch.x, ch.y - 30, 7, { g: -120, speed: [20, 70], life: [.9, 1.3], size: [5, 7], jx: 10 }); ring(ch.x, ch.y - 24, '#FF9AB0', 44);
    react(ch, 'cheer', { dur: .9 });
    team.item = 'snowball'; return;   // iksir turu bitirmez
  }
  play.phase = 'fly'; play.t = 0; play.acc = 0;
}
function pickValid(pk) {
  const T = play.T, it = ITEMS[pk.item];
  if (pk.item === 'potion') return cur().hp < cur().maxHp;
  if (pk.item === 'swap') return nearestFoe(cur()) !== cur();
  if (it.pick && it.pick.land) return T.land(clamp(Math.floor(unitX(pk.val) / B), 0, T.cols - 1));
  return true;
}
function openPick(k) {
  const it = ITEMS[k], ch = cur();
  curTeam().item = k; play.bag = false;
  if (it.kind === 'throw') { play.pick = null; return; }
  const p = it.pick || { type: 'none' }, foeX = nearestFoe(ch).x;
  play.pick = { item: k, type: p.type, dir: foeX >= ch.x ? 1 : -1, val: p.def || 0, val2: 0 };
  if (p.type === 'pos') play.pick.val = unitOf(ch.x);
  if (p.type === 'range') { play.pick.val = Math.max(0, unitOf(foeX) - 2); play.pick.val2 = Math.min(play.T.maxUnit, play.pick.val + 4); }
}
const nearestFoe = ch => allChars().filter(c => alive(c) && c.team !== ch.team).sort((a, b) => Math.abs(a.x - ch.x) - Math.abs(b.x - ch.x))[0] || ch;

// Duvar ve köprü blok blok kurulur
function buildAct(cells, mat, cols) {
  const a = { i: 0, t: .07, fx: cells.length ? cells[0][0] * B : 0 };
  a.step = dt => {
    a.t += dt;
    while (a.t >= .07 && a.i < cells.length) {
      a.t -= .07;
      const [c, r] = cells[a.i++], x = c * B + B / 2, y = H - (r + .5) * B;
      play.T.build([[c, r]], mat);
      puffSmoke(x, y, 3, ['#FFFFFF'], [4, 7]); spawn(x, y, 2, cols, .6);
      Sound.play('pop'); a.fx = x;
    }
    return a.i >= cells.length;
  };
  a.draw = () => {};
  return a;
}

/* ----- Bilgisayar rakip ----- */
function aiPlan(noWalk) {
  const me = cur(), team = curTeam(), them = nearestFoe(me);
  const sx = me.x, sy = me.y - 24, dir = Math.sign(them.x - me.x) || -1;
  const best = { d: Infinity };
  const opts = ['snowball', ...AI_ITEMS.filter(k => team.ammo[k] > 0)];
  let item = opts[Math.floor(rand(0, opts.length))];
  if (Math.random() < .45) item = 'snowball';
  for (const k of new Set([item, 'fish'].filter(k => team.ammo[k] > 0))) {
    for (let a = 15; a <= 80; a += 2.5) for (let pw = .3; pw <= 1.0001; pw += .025) {
      const ang = a * Math.PI / 180;
      const res = simulate(sx, sy, Math.cos(ang) * pw * VMAX * dir, -Math.sin(ang) * pw * VMAX, k, me.team, 6);
      if (!res) continue;
      let d = Math.hypot(res.x - them.x, res.y - (them.y - 18));
      if (res.type === 'char') d -= 30;
      if (k !== item) d += 40;   // uzak menzil için balığa ancak gerekirse geçer
      if (d < best.d) Object.assign(best, { d, ang, pw, item: k });
    }
  }
  // Ulaşamıyorsa: elinde böcek uçağı varsa onu kullanır, yoksa rakibe doğru yürür
  if (best.d > 90) {
    if (team.ammo.bugs > 0) return { kind: 'bugs', u: clamp(Math.round(unitOf(them.x) - play.wind + gauss() * play.def.err * 5), 0, play.T.maxUnit) };
    if (!noWalk && play.walkLeft > 0) return { kind: 'walk', dir };
  }
  if (!isFinite(best.d)) Object.assign(best, { ang: Math.PI / 4, pw: .7, item: 'snowball' });
  // Hata payı: ilk atışlarda ve rakibin gücü azaldığında daha çok ıskalar.
  let e = play.def.err || .2;
  if (play.cpuShots === 0) e *= 1.6;
  if (them.hp <= 35) e *= 1.4;
  if (them.hp < me.hp) e *= 1.25;
  const ang = best.ang + gauss() * e * .5;
  const pw = clamp(best.pw * (1 + gauss() * e), .2, 1);
  return { kind: 'throw', item: best.item, vx: Math.cos(ang) * pw * VMAX * dir, vy: -Math.sin(ang) * pw * VMAX, pw };
}

/* ----- Oyun döngüsü ----- */
function updatePlay(dt) {
  play.t += dt;
  for (const ch of allChars()) charPhysics(ch, dt);
  updateChars(dt);
  updateAir(dt);
  updateProps(dt);
  for (const st of play.stinks) st.t += dt;
  if (play.flash > 0) play.flash = Math.max(0, play.flash - dt * 2.5);
  const ch = cur(), team = curTeam();

  if (play.phase === 'drop') {
    const pl = play.plane, cr = pl && pl.crate;
    focus(cr ? cr.x : pl ? pl.x : ch.x);
    const done = pl ? cr && (cr.grounded || cr.gone) : true;
    if (done || play.t > 9) { play.phase = 'banner'; play.t = 0; Sound.play('turn'); cam.manual = false; }
  } else if (play.phase === 'banner') {
    focus(ch.x);
    if (play.t > 1.0) { play.phase = 'aim'; play.t = 0; }
  } else if (play.phase === 'aim') {
    focus(ch.x);
    if (team.cpu) {
      if (!play.ai && play.t > .5) {
        play.ai = aiPlan(play.aiWalked);
        if (play.ai.kind === 'throw') team.item = play.ai.item;
        if (play.ai.kind === 'walk') { play.walkDir = play.ai.dir; play.aiWalkT = 0; }
      }
      if (play.ai && play.ai.kind === 'walk') {
        walk(ch, play.walkDir, dt); play.aiWalkT += dt;
        if (play.aiWalkT > 1.4 || play.walkLeft <= 0) { play.walkDir = 0; play.ai = null; play.aiWalked = true; play.t = .3; }
      } else if (play.ai && play.t > 1.6) {
        play.aiWalked = false;
        if (play.ai.kind === 'bugs') { team.item = 'bugs'; play.pick = { item: 'bugs', type: 'pos', val: play.ai.u, dir: 1 }; usePick(); }
        else fire(play.ai.vx, play.ai.vy);
      }
    } else if (play.walkDir) walk(ch, play.walkDir, dt);
  } else if (play.phase === 'fly') {
    play.acc += dt;
    while (play.acc >= SIM_DT) {
      play.acc -= SIM_DT;
      for (const p of play.projs.slice()) {
        const px = p.x, py = p.y, hit = stepProj(p, SIM_DT);
        if (hit && hitProj(p, hit, px, py)) play.projs.splice(play.projs.indexOf(p), 1);
      }
    }
    for (const p of play.projs) { projTrail(p, dt); if (!(p.delay > 0)) { p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 6) p.trail.shift(); } }
    for (const a of play.acts.slice()) if (a.step(dt)) play.acts.splice(play.acts.indexOf(a), 1);
    const f = play.acts[0] || play.projs.find(p => !(p.delay > 0)) || play.projs[0];
    if (f) focus(f.fx != null ? f.fx : f.x);
    if (!play.projs.length && !play.acts.length) { play.phase = 'settle'; play.t = 0; }
  } else if (play.phase === 'settle') {
    if (play.t > .9 && allChars().every(c => (c.grounded || !alive(c)) && !(c.mood && c.mood.block && !c.mood.fired))) {
      if (!checkOver()) {
        const tm = curTeam();
        if (tm.extra > 0 && alive(cur())) { tm.extra--; bonusTurn(); } else endTurn();
      }
    }
  } else if (play.phase === 'over') {
    play.overT += dt;
    const happy = play.mode === '2p' || play.winner === 0;
    if (happy && play.overT < 3 && Math.random() < .5) confetti(2);
    for (const c of play.teams[play.winner].chars) if (alive(c) && !c.mood && play.overT < 4) react(c, 'cheer', { dur: 1 });
  }
  if (play.phase === 'aim' || play.phase === 'banner') checkOver();
  updateCam(dt);
}
function checkOver() {
  const dead = play.teams.find(t => t.chars.every(c => !alive(c)));
  if (!dead || !allChars().every(c => c.grounded || !alive(c))) return false;
  play.phase = 'over'; play.overT = 0; play.winner = 1 - dead.id; play.walkDir = 0; play.aim = null; play.pick = null; play.bag = false;
  // Altın: kazanınca 3 + yıldız, kaybedince teselli 1; 2 oyunculu maç 2
  if (play.mode === '1p') {
    if (play.winner === 0) {
      const st = matchStars();
      if (st > Store.stars[play.li]) { Store.stars[play.li] = st; Store.save(); }
      play.reward = 3 + st;
      Sound.play('win');
    } else { play.reward = 1; Sound.play('lose'); }
  } else { play.reward = 2; Sound.play('win'); }
  Wallet.addCoins(play.reward);
  return true;
}
function matchStars() {
  const t = play.teams[0], have = t.chars.reduce((s, c) => s + c.hp, 0), max = t.chars.reduce((s, c) => s + c.maxHp, 0);
  return have / max > .66 ? 3 : have / max > .33 ? 2 : 1;
}


/* ================= Harita ayrıntıları =================
   Arka planda kameradan yavaş kayan katmanlar (dağlar, tepeler, kaleler, adalar), zeminde süsler
   (ağaç, çam, çalı, kaya, kardan adam, fıçı) ve sallanan çimenler. Süsler patlamaya tepki verir:
   ağaç devrilir, kardan adam dağılır, fıçı zincirleme patlar ve herkese hasar verir. */
const MAP_BACKDROP = { grass: 0, snow: 1, castle: 2, pirate: 3 };
function decorate(T, def, kind) {
  T.backdrop = kind; T.props = [];
  const avoid = [].concat(def.p, def.e).filter(v => v != null);
  const free = c => T.land(c) && avoid.every(a => Math.abs(a - c) > 2) && !T.mat[c * ROWS + T.top(c)];
  const pool = kind === 1 ? ['pine', 'pine', 'snowman', 'rock', 'bush'] : kind === 2 ? ['tree', 'bush', 'rock', 'barrel', 'tree', 'bush'] : kind === 3 ? ['palm', 'palm', 'bush', 'rock', 'barrel'] : ['tree', 'tree', 'bush', 'flowers', 'rock'];
  let c = 2 + Math.floor(hash(T.cols, 1, 1) * 4), n = 0;
  while (c < T.cols - 2) {
    if (free(c)) {
      let type = pool[Math.floor(hash(c, T.cols, 7) * pool.length)];
      if (type === 'barrel' && avoid.some(v => Math.abs(v - c) < 7)) type = 'bush';   // başlangıç yerinin dibinde fıçı olmasın
      T.props.push({ type, x: c * B + B / 2, y: T.surfaceY(c), s: .85 + hash(c, 3, 9) * .4, seed: hash(c, 5, 5), vy: 0, fallA: 0, gone: false });
      n++;
    }
    c += 4 + Math.floor(hash(c, 2, 2) * 5);
  }
  // her haritada ortaya yakın en az bir patlayan fıçı (aksiyon için)
  const mid = Math.floor(T.cols / 2);
  for (let d = 0; d < 10; d++) for (const cc of [mid + d, mid - d]) {
    if (free(cc) && !T.props.some(q => Math.abs(q.x - (cc * B + 8)) < 20)) { T.props.push({ type: 'barrel', x: cc * B + B / 2, y: T.surfaceY(cc), s: 1, seed: .5, vy: 0, fallA: 0, gone: false }); d = 99; break; }
  }
  // gemilerin güvertesine fıçı
  for (const f of T.flags) T.props.push({ type: 'barrel', x: f.x + 24, y: H - (T.water + 1) * B, s: .9, seed: .3, vy: 0, fallA: 0, gone: false });
}
function updateProps(dt) {
  const T = play.T;
  for (const q of T.props) {
    if (q.gone) continue;
    if (q.fall) { q.fallA = Math.min(Math.PI / 2, q.fallA + dt * (1.5 + q.fallA * 4)); q.fade = (q.fade || 0) + (q.fallA >= Math.PI / 2 ? dt : 0); if (q.fade > .8) q.gone = true; continue; }
    if (q.fuse != null) { q.fuse -= dt; if (q.fuse <= 0) { q.gone = true; explode({ item: 'barrel', team: -1 }, q.x, q.y - 10, 'terrain'); } continue; }
    if (!T.solidAt(q.x, q.y) && !T.solidAt(q.x - 6, q.y) && !T.solidAt(q.x + 6, q.y)) {
      q.vy = Math.min(q.vy + 900 * dt, 600); q.y += q.vy * dt;
      if (T.solidAt(q.x, q.y)) { q.y = H - (Math.floor((H - 1 - q.y) / B) + 1) * B; q.vy = 0; }
      if (q.y > T.waterY + 6) { q.gone = true; burst('drop', q.x, T.waterY, 10, { colors: WATER_C, speed: [80, 200], size: [2, 3.5] }); }
    }
  }
  T.props = T.props.filter(q => !q.gone);
}
function propsBlast(x, y, r, team) {
  const T = play.T;
  for (const q of T.props) {
    if (q.gone || q.fall || q.fuse != null) continue;
    const d = Math.hypot(q.x - x, q.y - 16 - y);
    if (d > r + 18 * q.s) continue;
    const dir = Math.sign(q.x - x) || 1;
    if (q.type === 'tree' || q.type === 'pine' || q.type === 'palm') {
      q.fall = dir;
      burst('seed', q.x, q.y - 40 * q.s, 14, { colors: q.type === 'pine' ? ['#3E8E5A', '#2F6E46', '#FFFFFF'] : ['#5FB24A', '#7FD45C', '#3E8E3A'], speed: [60, 220], size: [2, 3.5], g: 300 });
    } else if (q.type === 'barrel') {
      q.fuse = .22; burst('spark', q.x, q.y - 14, 6, { colors: ['#FFD23F', '#FFFFFF'], g: 60, speed: [40, 120] });
    } else {
      q.gone = true;
      const cols = q.type === 'snowman' ? ['#FFFFFF', '#E6F0F8', '#F08C1E', '#1E2233'] : q.type === 'rock' ? ['#A3AABA', '#868D9E'] : q.type === 'flowers' ? ['#FF6FA8', '#FFD23F', '#FFFFFF', '#5FB24A'] : ['#5FB24A', '#7FD45C', '#3E8E3A'];
      spawn(q.x, q.y - 12, 10, cols, 1.1);
      if (q.type === 'snowman') burst('snow', q.x, q.y - 20, 16, { speed: [60, 220], size: [2, 4] });
    }
  }
}
function drawProps(T) {
  const L = cam.x - 60, R = cam.x + viewW() + 60;
  for (const q of T.props) {
    if (q.x < L || q.x > R) continue;
    ctx.save(); ctx.translate(q.x, q.y);
    if (q.fall) { ctx.rotate(q.fall * q.fallA); ctx.globalAlpha = 1 - (q.fade || 0) / .8; }
    ctx.scale(q.s, q.s);
    const sway = Math.sin(time * 1.6 + q.seed * 9) * .04;
    PROP_ART[q.type](ctx, q, sway);
    ctx.restore();
  }
}
const PROP_ART = {
  tree(c, q, sw) {
    rr(c, -4 - OL, -22, 8 + OL * 2, 22 + OL, 3); c.fillStyle = INK; c.fill();
    rr(c, -4, -22, 8, 22, 2.5); c.fillStyle = lin(c, -4, 0, 4, 0, ['#B07A48', '#8A5D39']); c.fill();
    c.rotate(sw);
    const blobs = [[0, -40, 17], [-12, -30, 11], [12, -31, 12], [0, -52, 11]];
    c.fillStyle = INK; blobs.forEach(([x, y, r]) => { ell(c, x, y, r + OL, r + OL); c.fill(); });
    blobs.forEach(([x, y, r], i) => { ell(c, x, y, r, r); c.fillStyle = i === 3 ? '#7FD45C' : '#5FB24A'; c.fill(); });
    c.fillStyle = 'rgba(255,255,255,.22)'; ell(c, -5, -46, 6, 4); c.fill();
    c.fillStyle = 'rgba(30,60,30,.18)'; ell(c, 4, -30, 10, 5); c.fill();
    if (q.seed > .6) { c.fillStyle = '#E5483B'; [[-8, -38], [7, -44], [10, -28]].forEach(([x, y]) => { ell(c, x, y, 2.4, 2.4); c.fill(); }); }
  },
  pine(c, q, sw) {
    rr(c, -3.5 - OL, -14, 7 + OL * 2, 14 + OL, 2); c.fillStyle = INK; c.fill();
    rr(c, -3.5, -14, 7, 14, 2); c.fillStyle = '#8A5D39'; c.fill();
    c.rotate(sw * .6);
    const tiers = [[-12, 18], [-26, 14], [-38, 10]];
    for (const pass of [0, 1]) tiers.forEach(([y, w], i) => {
      c.beginPath(); c.moveTo(-w, y); c.lineTo(0, y - 20); c.lineTo(w, y); c.closePath();
      if (!pass) { c.lineWidth = OL * 2; c.lineJoin = 'round'; c.strokeStyle = INK; c.stroke(); }
      else { c.fillStyle = i % 2 ? '#3E8E5A' : '#357B4E'; c.fill(); }
    });
    c.fillStyle = '#FFFFFF'; tiers.forEach(([y, w]) => { c.beginPath(); c.moveTo(-w * .5, y - 10); c.lineTo(0, y - 20); c.lineTo(w * .5, y - 10); c.quadraticCurveTo(0, y - 13, -w * .5, y - 10); c.fill(); });
  },
  palm(c, q, sw) {
    c.lineCap = 'round';
    c.strokeStyle = INK; c.lineWidth = 7 + OL * 2; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(6, -24, 2, -46); c.stroke();
    c.strokeStyle = '#B07A48'; c.lineWidth = 7; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(6, -24, 2, -46); c.stroke();
    c.translate(2, -46); c.rotate(sw * 1.5);
    [-2.6, -1.9, -1.2, -.4, .3].forEach((a, i) => {
      c.save(); c.rotate(a);
      for (const pass of [0, 1]) { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(12, -8, 24, 2); c.quadraticCurveTo(12, -1, 0, 0); if (!pass) { c.lineWidth = OL * 2; c.strokeStyle = INK; c.stroke(); } else { c.fillStyle = i % 2 ? '#5FB24A' : '#4C9E3C'; c.fill(); } }
      c.restore();
    });
    c.fillStyle = '#8A5D39'; ell(c, -3, 3, 3, 3); c.fill(); ell(c, 3, 4, 3, 3); c.fill();
  },
  bush(c, q, sw) {
    const blobs = [[-9, -7, 8], [0, -11, 10], [10, -7, 8]];
    c.fillStyle = INK; blobs.forEach(([x, y, r]) => { ell(c, x, y, r + OL, r + OL); c.fill(); });
    blobs.forEach(([x, y, r]) => { ell(c, x, y + Math.sin(time * 2 + x) * .3, r, r); c.fillStyle = q.seed > .5 ? '#5FB24A' : '#4FA83F'; c.fill(); });
    c.fillStyle = 'rgba(255,255,255,.25)'; ell(c, -2, -15, 4, 2.5); c.fill();
    if (q.seed > .7) { c.fillStyle = '#FF6FA8'; ell(c, -6, -10, 2.2, 2.2); c.fill(); ell(c, 6, -13, 2.2, 2.2); c.fill(); }
  },
  flowers(c, q, sw) {
    for (let i = 0; i < 4; i++) {
      const x = -10 + i * 7, h = 9 + (i % 2) * 4, bend = Math.sin(time * 2.2 + i + q.seed * 5) * 1.6;
      c.strokeStyle = '#3E8E3A'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x, -h * .6, x + bend, -h); c.stroke();
      c.fillStyle = ['#FF6FA8', '#FFD23F', '#FFFFFF', '#B8A6FF'][i]; for (let k = 0; k < 5; k++) { const a = k * 1.257; ell(c, x + bend + Math.cos(a) * 2.4, -h + Math.sin(a) * 2.4, 1.9, 1.9); c.fill(); }
      c.fillStyle = '#F5A623'; ell(c, x + bend, -h, 1.5, 1.5); c.fill();
    }
  },
  rock(c, q) {
    const p = () => { c.beginPath(); c.moveTo(-13, 0); c.quadraticCurveTo(-14, -10, -5, -13); c.quadraticCurveTo(4, -17, 11, -9); c.quadraticCurveTo(15, -3, 13, 0); c.closePath(); };
    c.lineWidth = OL * 2; c.lineJoin = 'round'; c.strokeStyle = INK; p(); c.stroke();
    p(); c.fillStyle = lin(c, 0, -15, 0, 0, ['#BFC5D2', '#8C93A4']); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; ell(c, -3, -10, 4, 2); c.fill();
    if (q.seed > .5) { c.fillStyle = '#6FBF5A'; ell(c, 6, -11, 4, 2); c.fill(); }
  },
  snowman(c, q) {
    const balls = [[0, -9, 10], [0, -24, 7.5], [0, -35, 5.5]];
    c.fillStyle = INK; balls.forEach(([x, y, r]) => { ell(c, x, y, r + OL, r + OL); c.fill(); });
    balls.forEach(([x, y, r]) => { ell(c, x, y, r, r); c.fillStyle = '#FFFFFF'; c.fill(); });
    c.fillStyle = 'rgba(160,190,220,.4)'; ell(c, 3, -6, 6, 3); c.fill();
    c.fillStyle = INK; ell(c, -2, -36, 1, 1); c.fill(); ell(c, 2, -36, 1, 1); c.fill();
    c.fillStyle = '#F08C1E'; c.beginPath(); c.moveTo(0, -34.5); c.lineTo(7, -33.5); c.lineTo(0, -33); c.closePath(); c.fill();
    c.fillStyle = '#E5483B'; rr(c, -7, -30, 14, 3.5, 1.7); c.fill();
    c.strokeStyle = '#8A5D39'; c.lineWidth = 1.6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-7, -24); c.lineTo(-15, -30 + Math.sin(time * 3) * 1.5); c.moveTo(7, -24); c.lineTo(15, -29); c.stroke();
  },
  barrel(c, q) {
    const blink = q.fuse != null ? (Math.sin(time * 50) > 0 ? 1 : 0) : 0;
    rr(c, -10 - OL, -24 - OL, 20 + OL * 2, 24 + OL * 2, 7); c.fillStyle = INK; c.fill();
    rr(c, -10, -24, 20, 24, 6); c.fillStyle = blink ? '#FFD23F' : lin(c, -10, 0, 10, 0, ['#C98E55', '#E0AB72', '#A8743F']); c.fill();
    c.fillStyle = '#5A6070'; c.fillRect(-10, -19, 20, 2.6); c.fillRect(-10, -6, 20, 2.6);
    c.fillStyle = '#E5483B'; ell(c, 0, -12, 4.2, 4.2); c.fill();
    c.fillStyle = '#FFFFFF'; c.font = `800 7px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', 0, -11.6);
  },
};
// Sallanan çimen tutamları ve küçük çiçekler: yalnızca ekrandaki çimenli sütunlarda
function drawTufts(T) {
  if (T.themeKey === 'snow') return;
  const c0 = Math.max(0, Math.floor(cam.x / B)), c1 = Math.min(T.cols - 1, Math.ceil((cam.x + viewW()) / B));
  ctx.lineCap = 'round';
  for (let c = c0; c <= c1; c++) {
    const r = T.top(c); if (r < 0 || r < T.water) continue;
    if (T.typeAt(c, r) !== 'grass') continue;
    const x = c * B, y = H - (r + 1) * B, sd = hash(c, r, 4);
    for (let i = 0; i < 3; i++) {
      const bx = x + 3 + i * 5 + sd * 2, h = 4 + ((sd * 7 + i) % 1) * 4, sway = Math.sin(time * 2.2 + bx * .05) * 1.5 + play.wind * .9;
      ctx.strokeStyle = i === 1 ? '#5CC745' : '#46AC35'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx, y + 1); ctx.quadraticCurveTo(bx + sway * .3, y - h * .6, bx + sway, y - h); ctx.stroke();
    }
    if (sd < .12) {
      const fx = x + 9 + Math.sin(time * 2 + x) * 1.2, fy = y - 8;
      ctx.strokeStyle = '#3E9A2E'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x + 9, y); ctx.lineTo(fx, fy); ctx.stroke();
      ctx.fillStyle = sd < .06 ? '#FFFFFF' : '#FFD86B'; for (let k = 0; k < 5; k++) { const a = k * 1.256; ell(ctx, fx + Math.cos(a) * 2.2, fy + Math.sin(a) * 2.2, 1.7, 1.7); ctx.fill(); }
      ctx.fillStyle = '#F5A623'; ell(ctx, fx, fy, 1.3, 1.3); ctx.fill();
    }
  }
}
// Arka plan katmanları: dünya ile aynı alta sabitlenmiş ölçek ama kameradan yavaş kayar (f küçükse uzak)
function layer(f, fn) {
  const z = cam.z + cam.kick, zf = 1 + (z - 1) * f;
  ctx.save(); ctx.translate(0, H); ctx.scale(zf, zf); ctx.translate(-cam.x * f, -H);
  fn(cam.x * f - 80, cam.x * f + W / zf + 80); ctx.restore();
}
function drawBackdrop(T) {
  const k = T.backdrop || 0, snow = k === 1;
  const far = snow ? '#AFC8E2' : k === 3 ? '#9FD0E8' : '#A9C9E6', mid = snow ? '#C9DCEC' : k === 2 ? '#9CC48A' : '#8CCB7A';
  layer(.22, (a, b) => {
    // uzak dağlar (denizde uzak adalar)
    ctx.fillStyle = far; ctx.beginPath(); ctx.moveTo(a, H + 50);
    const peak = x => k === 3 ? H - 150 - 40 * Math.max(0, Math.sin(x * .006 + 1)) * (Math.sin(x * .0021) > 0 ? 1 : 0) : H - 200 - 70 * Math.abs(Math.sin(x * .0042 + 1)) - 24 * Math.sin(x * .013);
    for (let x = a; x <= b; x += 16) ctx.lineTo(x, peak(x));
    ctx.lineTo(b, H + 50); ctx.closePath(); ctx.fill();
    if (k !== 3) { ctx.fillStyle = 'rgba(255,255,255,.75)'; for (let x = Math.floor(a / 16) * 16; x <= b; x += 16) { const y = peak(x); if (y < H - 255) { ell(ctx, x, y + 6, 11, 6); ctx.fill(); } } }
  });
  layer(.5, (a, b) => {
    const hy = x => H - 120 - 30 * Math.sin(x * .007 + 2) - 14 * Math.sin(x * .019);
    if (k === 3) {
      // denizde uzak gemi
      const sx = ((time * 14) % (b - a + 300)) + a - 150; shipSil(sx, H - 112);
      return;
    }
    ctx.fillStyle = mid; ctx.beginPath(); ctx.moveTo(a, H + 50);
    for (let x = a; x <= b; x += 12) ctx.lineTo(x, hy(x));
    ctx.lineTo(b, H + 50); ctx.closePath(); ctx.fill();
    if (k === 2) for (let x = Math.floor(a / 380) * 380 + 140; x <= b; x += 380) castleSil(x, hy(x) + 6);
    for (let x = Math.floor(a / 46) * 46; x <= b; x += 46) {
      if (hash(Math.floor(x), 3, 7) < .35) continue;
      if (k === 2 && Math.abs(((x - 140) % 380 + 380) % 380) < 70) continue;
      const y = hy(x) + 3, s = .7 + hash(Math.floor(x), 1, 1) * .5;
      if (snow) { ctx.fillStyle = '#9DB8CC'; ctx.beginPath(); ctx.moveTo(x - 9 * s, y); ctx.lineTo(x, y - 28 * s); ctx.lineTo(x + 9 * s, y); ctx.closePath(); ctx.fill(); }
      else { ctx.fillStyle = '#7E9A70'; rr(ctx, x - 2 * s, y - 12 * s, 4 * s, 12 * s, 2); ctx.fill(); ctx.fillStyle = '#6DAE60'; ell(ctx, x, y - 20 * s, 10 * s, 12 * s); ctx.fill(); }
    }
  });
}
function castleSil(x, y) {
  // uzak tepedeki küçük kale: iki kule, sivri çatılar, bayrak
  const wall = '#B7C3D3', dark = '#9AA8BB', roof = '#C98A8A';
  ctx.fillStyle = wall; ctx.fillRect(x - 24, y - 26, 48, 26);
  for (let i = 0; i < 6; i++) ctx.fillRect(x - 24 + i * 9, y - 31, 5, 5);
  for (const tx of [-30, 22]) {
    ctx.fillStyle = dark; ctx.fillRect(x + tx, y - 40, 12, 40);
    ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x + tx - 3, y - 40); ctx.lineTo(x + tx + 6, y - 56); ctx.lineTo(x + tx + 15, y - 40); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = dark; rr(ctx, x - 6, y - 14, 12, 14, [6, 6, 0, 0]); ctx.fill();
  ctx.strokeStyle = dark; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 28, y - 56); ctx.lineTo(x + 28, y - 66); ctx.stroke();
  ctx.fillStyle = '#E5483B'; ctx.beginPath(); ctx.moveTo(x + 28, y - 66); ctx.lineTo(x + 28 + 9 + Math.sin(time * 4) * 1.5, y - 63); ctx.lineTo(x + 28, y - 60); ctx.closePath(); ctx.fill();
}
function shipSil(x, y) {
  ctx.fillStyle = '#86AFC6';
  ctx.beginPath(); ctx.moveTo(x - 40, y); ctx.lineTo(x + 40, y); ctx.lineTo(x + 30, y + 12); ctx.lineTo(x - 30, y + 12); ctx.closePath(); ctx.fill();
  ctx.fillRect(x - 1.5, y - 44, 3, 44);
  ctx.beginPath(); ctx.moveTo(x + 2, y - 42); ctx.quadraticCurveTo(x + 22, y - 26, x + 2, y - 8); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 2, y - 36); ctx.quadraticCurveTo(x - 18, y - 22, x - 2, y - 10); ctx.fill();
}
// Canlı ayrıntılar: suda sıçrayan balıklar, uçan kuşlar
let ambient = [];
function drawAmbient(T, dt) {
  if (!play.paused) {
    if (Math.random() < dt * .25 && T.backdrop !== 1) {
      const x = cam.x + rand(40, viewW() - 40), c = Math.floor(x / B);
      if (c >= 0 && c < T.cols && !T.land(c)) ambient.push({ k: 'fish', x, y0: T.waterY, t: 0, dir: Math.random() < .5 ? -1 : 1 });
    }
    if (Math.random() < dt * .12) { const dir = Math.random() < .5 ? -1 : 1; ambient.push({ k: 'bird', x: dir > 0 ? cam.x - 30 : cam.x + viewW() + 30, y: rand(viewTop() + 90, 170), dir, t: 0, n: 1 + Math.floor(rand(0, 3)) }); }
  }
  for (const a of ambient) {
    if (!play.paused) a.t += dt;
    if (a.k === 'fish') {
      const k = a.t / .9; if (k >= 1) { a.done = true; continue; }
      const x = a.x + a.dir * 40 * k, y = a.y0 - Math.sin(k * Math.PI) * 34;
      if (!a.s1) { a.s1 = 1; burst('drop', a.x, a.y0, 6, { colors: WATER_C, speed: [50, 140], size: [1.5, 2.6] }); }
      if (k > .95 && !a.s2) { a.s2 = 1; burst('drop', x, a.y0, 6, { colors: WATER_C, speed: [50, 140], size: [1.5, 2.6] }); }
      ctx.save(); ctx.translate(x, y); ctx.rotate(a.dir * (k - .5) * 2.2); ctx.scale(a.dir > 0 ? -.55 : .55, .55); fishArt(ctx); ctx.restore();
    } else {
      a.x += a.dir * 55 * (play.paused ? 0 : dt);
      if (a.x < cam.x - 60 || a.x > cam.x + viewW() + 60) { if (a.t > 1) a.done = true; }
      for (let i = 0; i < a.n; i++) {
        const bx = a.x - a.dir * i * 16, by = a.y + i * 7 + Math.sin(a.t * 2 + i) * 3, f = Math.sin(a.t * 12 + i) * 4;
        ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(bx - 7, by - f); ctx.quadraticCurveTo(bx - 3, by - 3, bx, by); ctx.quadraticCurveTo(bx + 3, by - 3, bx + 7, by - f); ctx.stroke();
      }
    }
  }
  ambient = ambient.filter(a => !a.done);
}

/* ================= Ekranlar ================= */
let titleT = null, stripCanvas = null, thumbs = null, levelPage = 0;
function titleTerrain() {
  if (!titleT) titleT = new Terrain(makeHeights(LEVELS[1].h), 'grass', LEVELS[1].water);
  return titleT;
}
function drawWorldBg(theme, T) {
  drawSky(ctx, W, H, theme.sky);
  if (theme.sun) drawSun(730, 96);
  drawClouds(time);
  if (T) { drawWater(T, 0); ctx.drawImage(T.canvas, 0, 0, T.w, H); }
}
function drawFlakes(dt) {
  for (const f of flakes) {
    f.y += f.v * dt; f.x += Math.sin(time + f.v) * 10 * dt + (play ? play.wind * 6 * dt : 0);
    if (f.y > H) { f.y = -4; f.x = rand(0, W); }
    if (f.x < 0) f.x += W; if (f.x > W) f.x -= W;
    ell(ctx, f.x, f.y, f.s * .7, f.s * .7); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill();
  }
}
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
// Emoji önce düz (döndürmeden) ayrı bir tuvale yazılır, sonra resim olarak çizilir.
// iOS Safari döndürülmüş ya da aynalanmış emojiyi bazen renksiz, mavi bir gölge gibi çiziyor; resim her açıda renkli kalır.
const emojiCache = new Map();
function emojiImg(e, px) {
  const q = Math.min(256, Math.max(16, Math.ceil(px / 16) * 16)), key = e + q;
  let c = emojiCache.get(key);
  if (!c) {
    c = document.createElement('canvas'); c.width = c.height = Math.ceil(q * 1.3);
    const g = c.getContext('2d');
    g.font = `${q}px ${EMOJI_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(e, c.width / 2, c.height / 2 + q * .06);
    emojiCache.set(key, c);
  }
  return c;
}
function emojiAt(e, x, y, size, rot = 0, flip = false) {
  const img = emojiImg(e, size * (canvas.width / W) * Math.max(1, cam.z)), s = size * 1.3;
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -s / 2, -s / 2, s, s); ctx.restore();
}
// Bir eşyanın simgesi (cx, cy merkezli, yaklaşık size piksel)
function itemIcon(k, cx, cy, size, opt = {}) {
  if (k === 'heart') return drawSprite(ctx, SPR.heart, cx - size / 2, cy - size * .4, size / 7);
  const it = ITEMS[k];
  ctx.save(); ctx.translate(cx, cy); if (opt.rot) ctx.rotate(opt.rot);
  if (it.big) snowballArt(ctx, size * .42);
  else if (it.spr) { const spr = SPR[it.spr], s = size / Math.max(spr.w, spr.h) * (k === 'snowball' ? .8 : 1); drawSprite(ctx, spr, -spr.w * s / 2, -spr.h * s / 2, s, opt); }
  else emojiAt(it.emoji, 0, 0, size * .8, 0, opt.flip);
  ctx.restore();
}
// Yüz ifadeleri: karakter çiziminin üstüne gözler, ağız, burun yeniden çizilir (yerel koordinatlar)
const FACE = {
  p: { eyes: [[-5.2, -29.5], [5.2, -29.5]], er: [6.6, 7.1], bg: '#FFFFFF', mouth: [0, -21], nose: [0, -22.5, 3.8, 2.4] },
  c: { eyes: [[-6, -29], [6, -29]], er: [4.4, 5], bg: '#F39A3B', mouth: [0, -19.6], nose: [0, -23.2, 2.6, 2] },
};
function face(c, cat, eyes, mouth, nose, tears) {
  const F = cat ? FACE.c : FACE.p;
  if (eyes) {
    for (const [ex, ey] of F.eyes) { ell(c, ex, ey, F.er[0], F.er[1]); c.fillStyle = F.bg; c.fill(); }
    c.strokeStyle = INK; c.lineWidth = 2; c.lineCap = 'round'; c.lineJoin = 'round';
    if (eyes === 'squint') closedEyes(c, F.eyes[0][0], F.eyes[0][1], F.eyes[1][0], F.eyes[1][1]);
    else for (const [ex, ey] of F.eyes) {
      c.beginPath();
      if (eyes === 'happy') { c.moveTo(ex - 3.2, ey + 1.4); c.quadraticCurveTo(ex, ey - 3.4, ex + 3.2, ey + 1.4); }
      else if (eyes === 'blink') { c.moveTo(ex - 3.2, ey); c.quadraticCurveTo(ex, ey + 2.2, ex + 3.2, ey); }
      else if (eyes === 'spiral') { for (let a = 0; a < 9.5; a += .35) { const r = a * .38; c.lineTo(ex + Math.cos(a + time * 7) * r, ey + Math.sin(a + time * 7) * r); } c.lineWidth = 1.3; }
      c.stroke(); c.lineWidth = 2;
    }
  }
  if (nose) { const [nx, ny, rx, ry] = F.nose; ell(c, nx, ny, rx, ry); c.fillStyle = 'rgba(232,60,50,.85)'; c.fill(); }
  if (mouth) {
    const [mx, my] = F.mouth, big = mouth === 'big';
    ell(c, mx, my, big ? 3.6 : 2.2, big ? 3 : 1.8); c.fillStyle = '#7A2230'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
    if (big) { ell(c, mx, my + 1.4, 2, 1.2); c.fillStyle = '#FF8FA3'; c.fill(); }
  }
  if (tears) for (const [ex, ey] of F.eyes) {
    const d = ex < 0 ? -1 : 1;
    ell(c, ex + d * (F.er[0] + .4), ey + 3 + Math.sin(time * 10) * .7, 1.3, 2.1); c.fillStyle = '#7CC4F5'; c.fill();
  }
}
function wetLook(c) {
  [[-7, -40, 1], [3, -44, .8], [10, -35, .9]].forEach(([x, y, k]) => {
    c.beginPath(); c.moveTo(x, y - 4 * k); c.quadraticCurveTo(x + 3 * k, y, x, y + 2.4 * k); c.quadraticCurveTo(x - 3 * k, y, x, y - 4 * k);
    c.fillStyle = '#7CC4F5'; c.fill(); c.strokeStyle = 'rgba(30,34,51,.5)'; c.lineWidth = .8; c.stroke();
  });
  c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.4; c.beginPath(); c.arc(0, -24, 13, -2.5, -1.9); c.stroke();
}
function creamLook(c) {
  c.strokeStyle = INK; c.lineWidth = 1.6;
  ell(c, 0, -41, 13, 6); c.fillStyle = '#FFF8FB'; c.fill(); c.stroke();
  ell(c, -8, -37, 3, 4.5); c.fill(); ell(c, 7, -36.5, 2.4, 3.6); c.fill();
  ell(c, -3, -45, 6, 4); c.fill(); c.stroke();
  ell(c, 3, -49, 3.4, 3.4); c.fillStyle = '#E5483B'; c.fill(); c.stroke();
  ell(c, 2, -50, 1, 1); c.fillStyle = '#FFFFFF'; c.fill();
  c.strokeStyle = '#5A8F3A'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(3, -52); c.quadraticCurveTo(5, -56, 8, -56); c.stroke();
}

/* ================= Canlı karakterler =================
   Karakter parça parça çizilir (ayaklar, kollar/kanatlar, gövde, kafa, kuyruk). Her parçanın açısı ve
   gövdenin basılıp esnemesi bir "poz"dan gelir; poz hedefine yay gibi gider, böylece hareketler
   arasındaki geçiş kendiliğinden yumuşak olur ve sonunda hafifçe esneyerek oturur. */
const POSE0 = { sx: 1, sy: 1, lean: 0, hop: 0, lookX: 0, lookY: 0, tilt: 0, armL: .12, armR: .12, ear: 0, tail: 1 };
function poseOf(ch) {
  if (!ch.pose) { ch.pose = { v: { ...POSE0 }, t: { ...POSE0 }, vel: {}, k: 220 }; for (const k in POSE0) ch.pose.vel[k] = 0; }
  return ch.pose;
}
function poseStep(P, dt) {
  const n = 3, h = dt / n, k = P.k, d = 2 * Math.sqrt(k) * .6;
  for (let i = 0; i < n; i++) for (const key in P.t) {
    const a = k * (P.t[key] - P.v[key]) - d * P.vel[key];
    P.vel[key] += a * h; P.v[key] += P.vel[key] * h;
  }
}
const poseKick = (ch, o) => Object.assign(poseOf(ch).v, o);
// Her karede karakterin durumuna göre hedef pozu seç
function animate(ch, dt) {
  const P = poseOf(ch), m = ch.mood, isCur = play && play.cur === ch, team = play.teams[ch.team];
  ch.footL = 0; ch.footR = 0; ch.hold = null;
  if (!ch.face) ch.face = ch.team === 0 ? 1 : -1;
  const foe = nearestFoe(ch);
  if (alive(ch) && foe !== ch && Math.abs(foe.x - ch.x) > 4) ch.face = Math.sign(foe.x - ch.x);
  const b = Math.sin(time * 2.6 + ch.idx * 1.7 + ch.team * 2.3);
  P.k = 220;
  const t = { sx: 1 - .02 * b, sy: 1 + .028 * b, lean: .03 * Math.sin(time * .9 + ch.idx), hop: 0, lookX: 1.2 + .8 * Math.sin(time * .7 + ch.idx * 2), lookY: 0,
    tilt: .04 * Math.sin(time * 1.1 + ch.team), armL: .12 + .08 * b, armR: .12 + .08 * Math.sin(time * 2.6 + .5), ear: 0, tail: 1 };
  const ai = play.ai, aiming = isCur && play.phase === 'aim' && !play.pick && ITEMS[team.item].kind === 'throw' &&
    (play.aim ? Math.hypot(play.aim.x0 - play.aim.x, play.aim.y0 - play.aim.y) >= AIM_MIN : team.cpu && ai && ai.kind === 'throw' && play.t > .5);
  if (ch.throwT > 0) {
    ch.throwT -= dt; P.k = 900;
    Object.assign(t, { lean: .26, sx: 1.1, sy: .9, armR: -.25, armL: -.1, lookX: 3, lookY: 0, tilt: .12 });
  } else if (aiming) {
    const dx = play.aim ? play.aim.x0 - play.aim.x : ai.vx, dy = play.aim ? play.aim.y0 - play.aim.y : ai.vy;
    if (Math.abs(dx) > 2) ch.face = Math.sign(dx);
    const up = clamp(-dy / (Math.hypot(dx, dy) || 1), -1, 1);   // yukarı nişan alırken başını kaldırır
    const pw = play.aim ? Math.min(Math.hypot(dx, dy) / PULL_MAX, 1) : clamp((play.t - .5) / .9, 0, 1) * (ai.pw || 1);
    Object.assign(t, { sx: 1.04, sy: .94, lean: -.14, lookX: 2.8, lookY: -2.6 * up, tilt: -.12 * up, armL: .55, armR: 2.1 + .8 * pw + .06 * Math.sin(time * 9), ear: -.2, tail: 1.8 });
    ch.hold = team.item;
  } else if (isCur && play.walkDir && ch.grounded) {
    const s = Math.sin(ch.walkAnim * 14);
    Object.assign(t, { hop: -Math.abs(s) * 3, lean: .1 * s, armL: .55 + .45 * s, armR: .55 - .45 * s, lookX: 2.2, tilt: .06 * s, tail: 1.4 });
    ch.face = play.walkDir; ch.footL = -Math.max(0, s) * 3; ch.footR = -Math.max(0, -s) * 3;
  } else if (isCur && play.phase === 'aim' && !team.cpu) {
    Object.assign(t, { armR: .5 + .1 * Math.sin(time * 3), lookX: 2.4 });   // sırası gelen hazır bekler
  }
  if (m) {
    if (m.k === 'cheer') { const ph = m.t * 9; Object.assign(t, { armL: 2.6 + .35 * Math.sin(ph * 2), armR: 2.6 - .35 * Math.sin(ph * 2), lookY: -1, lookX: 0, tail: 2 }); }
    else if (m.k === 'laugh') Object.assign(t, { armL: 1.2 + .7 * Math.sin(m.t * 22), armR: 1.2 - .7 * Math.sin(m.t * 22), lookX: 0 });
    else if (m.k === 'hurt') Object.assign(t, { armL: 1.4, armR: 1.4, lean: -.18, lookX: 0 });
    else if (m.k === 'sneeze') Object.assign(t, m.fired ? { armL: 1.6, armR: 1.6, lean: -.25 } : { armL: .45, armR: .45, lookY: -2.5, lookX: 0 });
  }
  if (ch.dizzy > 0) t.tilt = Math.sin(time * 5) * .2;
  if (ch.chute || ch.carried) Object.assign(t, { armL: 2.7, armR: 2.7, lookY: -1 });
  else if (!ch.grounded && alive(ch) && ch.vy > 120) Object.assign(t, { armL: 2, armR: 2, sy: 1.08, sx: .94 });   // düşerken kollar havada
  if (!alive(ch)) Object.assign(t, { armL: .05, armR: .05, sy: .9, sx: 1.08, tail: .2, ear: 1, lookY: 2 });
  P.t = t;
  poseStep(P, dt);
}
function rigParts(c, parts) {
  for (const pt of parts) if (pt.sil) {
    c.save(); pt.tf(c); pt.path(c);
    c.fillStyle = INK; c.strokeStyle = INK; c.lineWidth = OL * 2; c.lineJoin = 'round'; c.fill(); c.stroke();
    c.restore();
  }
  for (const pt of parts) {
    c.save(); pt.tf(c); pt.path(c);
    c.fillStyle = typeof pt.fill === 'function' ? pt.fill(c) : pt.fill; c.fill();
    if (pt.after) pt.after(c);
    c.restore();
  }
}
// Gözler: open, blink, squint (><), happy (^^), spiral, determined (kaşlı), sad
function rigEyes(c, xs, y, mode, p, r, iris) {
  const lx = p.lookX * .55, ly = p.lookY * .45;
  c.lineCap = 'round'; c.lineJoin = 'round';
  xs.forEach((x, i) => {
    const side = i === 0 ? -1 : 1;
    if (mode === 'squint') { c.strokeStyle = INK; c.lineWidth = 2.1; c.beginPath(); c.moveTo(x - 3 * side, y - 2.6); c.lineTo(x + 1.6 * side, y); c.lineTo(x - 3 * side, y + 2.6); c.stroke(); return; }
    if (mode === 'happy') { c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.arc(x, y + 1.6, 3, Math.PI * 1.12, Math.PI * 1.88); c.stroke(); return; }
    if (mode === 'blink') { c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 3.2, y); c.quadraticCurveTo(x, y + 2.2, x + 3.2, y); c.stroke(); return; }
    if (mode === 'spiral') { c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); for (let a = 0; a < 9.5; a += .35) { const rr2 = a * .38; c.lineTo(x + Math.cos(a + time * 7) * rr2, y + Math.sin(a + time * 7) * rr2); } c.stroke(); return; }
    if (iris) { ell(c, x + lx * .5, y + ly * .5, r * 1.1, r * 1.25); c.fillStyle = iris; c.fill(); }
    ell(c, x + lx, y + ly, iris ? r * .48 : r, iris ? r : r * 1.1); c.fillStyle = '#11131C'; c.fill();
    ell(c, x + lx - r * .35, y + ly - r * .45, r * .36, r * .36); c.fillStyle = '#FFFFFF'; c.fill();
    if (mode === 'determined') { c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 4 * side, y - r - 3.2); c.lineTo(x - 3.5 * side, y - r - 1.2); c.stroke(); }
    if (mode === 'sad') { c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x - 3.5 * side, y - r - 1.2); c.lineTo(x + 3 * side, y - r - 3.4); c.stroke(); }
  });
}
function heldItem(c, k) { if (!k) return; c.save(); c.rotate(-Math.PI / 2); itemIcon(k, 0, 0, 17); c.restore(); }
// o: { eyes, hit, body(c): gövde katmanı üstüne (lekeler, ıslaklık, krema), face(c): yüz üstüne (ağız, burun, gözyaşı) }
function penguinRig(c, ch, o) {
  const p = poseOf(ch).v, team = ch.color;
  const lift = clamp(-p.hop / 30, 0, .6);
  c.fillStyle = 'rgba(30,34,51,.2)'; ell(c, 0, 0, 16 * (1 - lift * .5), 3.5 * (1 - lift * .5)); c.fill();
  c.save(); c.scale(ch.face || 1, 1);
  const body = c => { c.translate(0, p.hop); c.rotate(p.lean); c.scale(p.sx, p.sy); };
  const face = c => { body(c); c.translate(0, -28); c.rotate(p.tilt * .6); c.translate(p.lookX * .5, 28 + p.lookY * .35); };
  const bodyFill = c => lin(c, -18, -40, 18, 0, ['#4A5B82', '#2B3550', '#1E2540']);
  const orange = c => lin(c, 0, -6, 0, 0, ['#FFC04D', '#F08C1E']);
  rigParts(c, [
    { tf: c => c.translate(-7, p.hop * .85 + (ch.footL || 0)), path: c => ell(c, 0, -2.5, 6.5, 3.6), fill: orange, sil: 1 },
    { tf: c => c.translate(7, p.hop * .85 + (ch.footR || 0)), path: c => ell(c, 0, -2.5, 6.5, 3.6), fill: orange, sil: 1 },
    { tf: c => { body(c); c.translate(-14.5, -26); c.rotate(.35 + p.armL); }, path: c => ell(c, 0, 9, 4.8, 10.5), fill: '#2E3856', sil: 1 },
    { tf: c => { body(c); c.translate(14.5, -26); c.rotate(-(.35 + p.armR)); }, path: c => ell(c, 0, 9, 4.8, 10.5), fill: '#2E3856', sil: 1, after: c => { if (ch.hold) { c.translate(0, 20); heldItem(c, ch.hold); } } },
    { tf: body, path: c => ell(c, 0, -20, 17, 20), fill: bodyFill, sil: 1 },
    { tf: body, path: c => ell(c, 0, -8.5, 11.5, 8.5), fill: c => lin(c, 0, -18, 0, 0, ['#FFFFFF', '#DCE6F3']) },
    { tf: face, path: c => { ell(c, -5.2, -29.5, 6.8, 7.3); c.moveTo(12, -29.5); c.ellipse(5.2, -29.5, 6.8, 7.3, 0, 0, Math.PI * 2); }, fill: '#FFFFFF' },
    { tf: c => { face(c); c.translate(p.lookX * .3, p.lookY * .15); }, path: c => { c.beginPath(); c.moveTo(-4, -24.5); c.quadraticCurveTo(0, -26, 4, -24.5); c.quadraticCurveTo(1.5, -19.5, 0, -19.5); c.quadraticCurveTo(-1.5, -19.5, -4, -24.5); c.closePath(); }, fill: orange },
    { tf: body, path: c => rr(c, -15.5, -18.5, 31, 6.5, 3.2), fill: c => lin(c, 0, -19, 0, -12, [lighten(team, 30), team]) },
    { tf: c => { body(c); c.translate(9, -14); c.rotate(Math.sin(time * 7 + ch.idx) * .18 - p.lean * 1.5 + .1); }, path: c => rr(c, -3, -1, 6, 11, 3), fill: team },
  ]);
  c.save(); face(c);
  rigEyes(c, [-5.2, 5.2], -29.5, o.eyes, p, 3.3, null);
  c.fillStyle = 'rgba(247,120,150,.42)'; ell(c, -10.5, -23.5, 2.6, 1.8); c.fill(); ell(c, 10.5, -23.5, 2.6, 1.8); c.fill();
  if (o.face) o.face(c);
  c.restore();
  c.save(); body(c); if (o.hit) snowPile(c, -40); if (o.body) o.body(c); c.restore();
  c.restore();
}
function catRig(c, ch, o) {
  const p = poseOf(ch).v, team = ch.color;
  const lift = clamp(-p.hop / 30, 0, .6);
  c.fillStyle = 'rgba(30,34,51,.2)'; ell(c, 0, 0, 16 * (1 - lift * .5), 3.5 * (1 - lift * .5)); c.fill();
  c.save(); c.scale(-(ch.face || -1), 1);   // kedi çizimi sola bakar: yüzü dönükse aynala
  const body = c => { c.translate(0, p.hop); c.rotate(p.lean); c.scale(p.sx, p.sy); };
  const head = c => { body(c); c.translate(0, -28); c.rotate(p.tilt); c.translate(-p.lookX * .35, p.lookY * .25); };
  const fur = c => lin(c, -16, -16, 16, 16, ['#FFB45E', '#F39A3B', '#DE7A22']);
  const cream = c => lin(c, 0, -8, 0, 8, ['#FFFFFF', '#F7E6D2']);
  // kuyruk (arkada)
  c.save(); body(c);
  const wv = Math.sin(time * 3.2 + ch.idx) * p.tail, wv2 = Math.cos(time * 2.4 + ch.idx) * p.tail;
  const tail = () => { c.beginPath(); c.moveTo(9, -6); c.quadraticCurveTo(22, -6 + wv, 20 + wv * .4, -20); c.quadraticCurveTo(19 - wv2 * .5, -27, 23 + wv2, -30 - p.tail); };
  c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = 6 + OL * 2; tail(); c.stroke();
  c.strokeStyle = '#E8862C'; c.lineWidth = 6; tail(); c.stroke();
  c.restore();
  const earL = c => { head(c); c.translate(-9, -8); c.rotate(-p.ear * .7); c.translate(9, 8); };
  const earR = c => { head(c); c.translate(9, -8); c.rotate(p.ear * .7); c.translate(-9, 8); };
  rigParts(c, [
    { tf: c => c.translate(-6, p.hop * .85 + (ch.footR || 0)), path: c => ell(c, 0, -2.5, 5, 3.2), fill: cream, sil: 1 },
    { tf: c => c.translate(6, p.hop * .85 + (ch.footL || 0)), path: c => ell(c, 0, -2.5, 5, 3.2), fill: cream, sil: 1 },
    { tf: body, path: c => ell(c, 0, -9, 12, 9.5), fill: fur, sil: 1 },
    { tf: body, path: c => ell(c, 0, -6, 6.5, 6), fill: cream },
    { tf: c => { body(c); c.translate(8, -13); c.rotate(-(.3 + p.armL)); }, path: c => ell(c, 0, 5, 3.6, 6.4), fill: '#F39A3B', sil: 1 },
    { tf: earL, path: c => { c.beginPath(); c.moveTo(-15, -5); c.lineTo(-12.5, -19); c.lineTo(-3, -11); c.closePath(); }, fill: fur, sil: 1 },
    { tf: earR, path: c => { c.beginPath(); c.moveTo(15, -5); c.lineTo(12.5, -19); c.lineTo(3, -11); c.closePath(); }, fill: fur, sil: 1 },
    { tf: head, path: c => ell(c, 0, 0, 16.5, 14), fill: fur, sil: 1 },
    { tf: earL, path: c => { c.beginPath(); c.moveTo(-12, -8); c.lineTo(-11.5, -15); c.lineTo(-6.5, -10.5); c.closePath(); }, fill: '#F7A1B5' },
    { tf: earR, path: c => { c.beginPath(); c.moveTo(12, -8); c.lineTo(11.5, -15); c.lineTo(6.5, -10.5); c.closePath(); }, fill: '#F7A1B5' },
    { tf: head, path: c => ell(c, -p.lookX * .2, 6.5, 8, 5.5), fill: cream },
    { tf: body, path: c => rr(c, -12.5, -15.5, 25, 5.5, 2.75), fill: c => lin(c, 0, -15, 0, -10, [lighten(team, 30), team]) },
  ]);
  c.save(); head(c);
  c.strokeStyle = '#C96A1E'; c.lineWidth = 1.8; c.lineCap = 'round';
  [-4, 0, 4].forEach(dx => { c.beginPath(); c.moveTo(dx, -12); c.lineTo(dx, -8); c.stroke(); });
  const mx = -p.lookX * .2;
  c.fillStyle = '#F07C98'; c.beginPath(); c.moveTo(mx - 2, 4); c.lineTo(mx + 2, 4); c.lineTo(mx, 6); c.closePath(); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.1;
  c.beginPath(); c.moveTo(mx, 6); c.quadraticCurveTo(mx - 1.5, 8.5, mx - 3.2, 7.5); c.moveTo(mx, 6); c.quadraticCurveTo(mx + 1.5, 8.5, mx + 3.2, 7.5); c.stroke();
  c.strokeStyle = 'rgba(30,34,51,.55)'; c.lineWidth = .9;
  [[-8, 6, -17, 4], [-8, 7.5, -17, 8.5], [8, 6, 17, 4], [8, 7.5, 17, 8.5]].forEach(([a, b2, d, e]) => { c.beginPath(); c.moveTo(a + mx, b2); c.lineTo(d + mx, e + Math.sin(time * 3) * .4); c.stroke(); });
  rigEyes(c, [-6, 6], -1, o.eyes, { lookX: -p.lookX, lookY: p.lookY }, 3.4, '#8BD96A');
  c.fillStyle = 'rgba(247,120,150,.42)'; ell(c, -11, 4, 2.6, 1.8); c.fill(); ell(c, 11, 4, 2.6, 1.8); c.fill();
  if (o.face) { c.translate(0, 28); o.face(c); }
  c.restore();
  c.save(); body(c); if (o.hit) snowPile(c, -43); if (o.body) o.body(c); c.restore();
  // atış patisi en önde
  rigParts(c, [{ tf: c => { body(c); c.translate(-8, -13); c.rotate(.3 + p.armR); }, path: c => ell(c, 0, 5.5, 3.8, 7), fill: '#F39A3B', sil: 1,
    after: c => { ell(c, 0, 10, 2.6, 2.2); c.fillStyle = '#FFF4E6'; c.fill(); if (ch.hold) { c.translate(0, 15); heldItem(c, ch.hold); } } }]);
  c.restore();
}

function drawChar(ch, isTurn) {
  const out = !alive(ch), m = ch.mood, cat = ch.team === 1;
  let bob = 0;
  let rot = 0, sx = 1, sy = 1 + Math.sin(time * 2.6 + ch.idx * 1.7 + ch.team * 2.3) * .018;   // nefes alıp verme
  let eyes = null, mouth = null, nose = false, tears = false, say = null;
  if (!ch.blinkAt || time > ch.blinkAt + .14) ch.blinkAt = time + rand(2.2, 5);
  if (time > ch.blinkAt && !ch.hitShow) eyes = 'blink';
  if (ch.dizzy > 0) { rot += Math.sin(time * 5) * .08; eyes = 'spiral'; }
  if (m && !out) {
    const t = m.t;
    if (m.k === 'sneeze') {
      nose = true; eyes = 'squint';
      if (!m.fired) { const k = Math.min(1, t / .9); rot = m.dir * .22 * k; sy *= 1 + .07 * k; mouth = 'small'; say = t < .5 ? 'ha...' : 'HA...'; }
      else { const k = Math.max(0, 1 - (t - .95) / .4); rot = -m.dir * .32 * k; mouth = 'big'; }
    } else if (m.k === 'laugh') {
      rot = Math.sin(t * 28) * .14; bob += Math.abs(Math.sin(t * 14)) * 3; eyes = 'happy'; mouth = 'big'; tears = true;
      if (t < 1.5) say = Math.floor(t * 4) % 2 ? 'hi hi' : 'HİHİ';
    } else if (m.k === 'cheer') { bob += Math.abs(Math.sin(t * 9)) * 12 * (1 - t / m.dur); eyes = 'happy'; mouth = 'big'; }
    else if (m.k === 'hurt') { const k = 1 - t / m.dur; if (!ch.hitShow) { eyes = 'squint'; mouth = 'small'; } rot = Math.sin(t * 40) * .09 * k; sx *= 1 + .08 * k; sy *= 1 - .08 * k; }
  }
  if (ch.wet > 0) rot += Math.sin(time * 38) * .012;   // ıslak: hafif titreme
  const pp = ch.pop > 0 ? 1 - ch.pop / .35 : 1, ps = pp < 1 ? .3 + .7 * pp + Math.sin(pp * Math.PI) * .25 : 1;
  if (ch.chute) { ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(ch.x - 16, ch.y - 64); ctx.lineTo(ch.x - 6, ch.y - 30); ctx.moveTo(ch.x + 16, ch.y - 64); ctx.lineTo(ch.x + 6, ch.y - 30); ctx.stroke(); drawSprite(ctx, SPR.chute, ch.x - 20, ch.y - 82, 4); }
  ctx.save(); ctx.translate(ch.x, ch.y - bob); ctx.rotate(rot); ctx.scale(sx * ps, sy * ps);
  if (out) { ctx.globalAlpha = .55; ctx.rotate(-.12); }
  const s = cat ? .975 : 1.02; ctx.scale(s, s);
  const hitLook = ch.hitShow || out;
  let eyeMode = eyes || (hitLook ? 'squint' : ch.hold ? 'determined' : ch.throwT > 0 ? 'determined' : 'open');
  if (out) eyeMode = 'squint';
  (cat ? catRig : penguinRig)(ctx, ch, {
    eyes: eyeMode, hit: hitLook,
    body: out ? null : c => {
      if (ch.spots) { c.globalAlpha = Math.min(1, ch.paintT / 2); for (const p of ch.spots) { ell(c, p.x, p.y, p.r, p.r * .85); c.fillStyle = p.c; c.fill(); } c.globalAlpha = 1; }
      if (ch.wet > 0) wetLook(c);
      if (ch.sticky || ch.stuck) creamLook(c);
    },
    face: out || !(mouth || nose || tears) ? null : c => face(c, cat, null, mouth, nose, tears),
  });
  ctx.restore();
  if (ch.shield && !out) {
    ell(ctx, ch.x, ch.y - 22, 26, 30); ctx.strokeStyle = 'rgba(127,224,255,.9)'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = 'rgba(127,224,255,.15)'; ctx.fill();
    emojiAt('☂️', ch.x, ch.y - 66 + Math.sin(time * 3) * 2, 28);
  }
  if (ch.dizzy > 0 && !out) for (let i = 0; i < 3; i++) {
    const a = time * 4 + i * 2.09; ctx.save(); ctx.translate(ch.x + Math.cos(a) * 15, ch.y - 52 + Math.sin(a) * 4); starArt(ctx, 4.5, false); ctx.restore();
  }
  if (!out && play && screen === 'play') { ctx.save(); ctx.globalAlpha = ch.hurtT > 0 || ch.hp < ch.maxHp ? 1 : .8; hpBar(ch.x - 17, ch.y - 60, 34, 6, ch, false); ctx.restore(); }
  if (say) text(say, ch.x, ch.y - 72, 16, { color: '#FFFFFF', lw: 4 });
  if (out) text('Zzz', ch.x + 16, ch.y - 50 - Math.sin(time * 2) * 3, 16, { color: '#FFFFFF', lw: 4 });
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
  button(W / 2 - bw - gap / 2, y, bw, bh, () => { screen = 'levels'; levelPage = Math.floor(Math.max(0, Store.stars.findIndex(s => s === 0)) / 6) || 0; }, (x, yy, w, h) => {
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
  ctx.drawImage(levelStrip(), 0, H - 5 * B, W, 5 * B);
  homeButton(() => { screen = 'title'; });
  const w = 440, h = 250, x = W / 2 - w / 2, y = 60;
  panel(x, y, w, h, '#FFD23F');
  text('🎟️', W / 2, y + 62, 64, { stroke: null });
  text('BİLET BİTTİ', W / 2, y + 120, 36, { color: INK, stroke: null });
  text('Bir matematik turu bitir, bilet kazan!', W / 2, y + 156, 21, { color: '#6B7890', stroke: null });
  button(W / 2 - 120, y + h - 70, 240, 54, toGarden, (bx, by, bw, bh) => text('🌻 SAYI BAHÇESİ', bx + bw / 2, by + bh / 2 + 1, 24, { color: INK, stroke: null }), { frame: '#5DBB4A' });
}

/* ----- Bölüm haritası: iki sayfa, sayfa başına iki ada ----- */
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
  const base = levelPage * 6;
  [0, 1].forEach(i => text(ISLANDS[levelPage * 2 + i].name, i === 0 ? 220 : 644, 100, 30, { lw: 7 }));
  for (let i = 0; i < NODES.length - 1; i++) {
    const [x1, y1] = NODES[i], [x2, y2] = NODES[i + 1];
    for (let k = 1; k < 8; k++) {
      const t = k / 8, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
      ell(ctx, x, y, 5.5, 5.5); ctx.fillStyle = INK; ctx.fill();
      ell(ctx, x, y, 3.5, 3.5); ctx.fillStyle = Store.unlocked(base + i + 1) ? '#FFD23F' : '#FFFFFF'; ctx.fill();
    }
  }
  const next = Store.stars.findIndex(s => s === 0);
  NODES.forEach(([cx, cy], j) => {
    const i = base + j, open = Store.unlocked(i), isl = ISLANDS[LEVELS[i].island], s = 76;
    button(cx - s / 2, cy - s / 2, s, s, open ? () => startMatch('1p', i) : null, (x, y, w, h) => {
      if (open) text(String(i + 1), x + w / 2, y + h / 2 + 2, 38, { color: INK, stroke: null });
      else centerSprite('lock', x + w / 2, y + h / 2, 5, { outline: false });
    }, { frame: open ? isl.color : '#B9C6D6', fill: open ? '#FFFFFF' : '#E3E9F0', disabled: !open });
    if (open) for (let k = 0; k < 3; k++) drawSprite(ctx, SPR[k < Store.stars[i] ? 'star' : 'starEmpty'], cx - 33 + k * 23, cy + s / 2 + 10, 2);
    if (LEVELS[i].teams > 1) text('👥' + LEVELS[i].teams, cx + 30, cy - 40, 18, { stroke: null });
    if (i === next) {
      const bob = Math.abs(Math.sin(time * 4)) * 6;
      drawSprite(ctx, SPR.penguin, cx - 18, cy - s / 2 - 50 - bob, 3);
    }
  });
  // sayfa okları
  if (levelPage > 0) button(14, H / 2 - 30, 52, 60, () => { levelPage--; }, (x, y, w, h) => centerSprite('play', x + w / 2, y + h / 2, 3.4, { flip: true }), { frame: '#B9C6D6' });
  if (levelPage < 1) button(W - 66, H / 2 - 30, 52, 60, () => { levelPage++; }, (x, y, w, h) => centerSprite('play', x + w / 2, y + h / 2, 3.4), { frame: Store.unlocked(6) ? '#FFD23F' : '#B9C6D6' });
}
function homeButton(fn) {
  button(14, 14, 56, 56, fn, (x, y, w, h) => centerSprite('home', x + w / 2, y + h / 2, 3, { outline: false }));
}

/* ----- 2 oyuncu harita ve takım seçimi ----- */
function drawMaps() {
  drawWorldBg(THEMES.grass, null);
  ctx.drawImage(levelStrip(), 0, H - 5 * B, W, 5 * B);
  homeButton(() => { screen = 'title'; });
  text('HARİTA SEÇ', W / 2, 46, 34, { lw: 8 });
  if (!thumbs) thumbs = {};
  for (const [k] of MAPS2) if (k !== 'random' && !thumbs[k]) thumbs[k] = makeMap(mapDef(k)).thumb(2);
  // takım büyüklüğü
  text('👥', W - 236, 44, 28, { stroke: null });
  [1, 2, 3].forEach((n, i) => button(W - 206 + i * 62, 18, 52, 52, () => { twoSize = n; }, (x, y, w, h) => text(String(n), x + w / 2, y + h / 2 + 1, 28, { color: INK, stroke: null }), { frame: twoSize === n ? '#FFD23F' : '#B9C6D6' }));
  const cw = 156, chh = 170, gap = 10, x0 = W / 2 - (cw * 5 + gap * 4) / 2, y = 104;
  MAPS2.forEach(([key, label, col], i) => {
    button(x0 + i * (cw + gap), y, cw, chh, () => startMatch('2p', null, key), (x, yy, w, h) => {
      const tx = x + 12, ty = yy + 14, tw = w - 24, th = 86;
      ctx.save(); rr(ctx, tx, ty, tw, th, 10); ctx.clip();
      if (thumbs[key]) { const im = thumbs[key], sc = Math.max(tw / im.width, th / im.height); ctx.drawImage(im, tx + (tw - im.width * sc) / 2, ty + th - im.height * sc, im.width * sc, im.height * sc); }
      else {
        ctx.fillStyle = lin(ctx, tx, ty, tx, ty + th, ['#FF8AD2', '#E84BB0']); ctx.fillRect(tx, ty, tw, th);
        for (let k = 0; k < 14; k++) { rr(ctx, tx + hash(k, 1, 2) * (tw - 16), ty + hash(k, 3, 4) * (th - 16), 16, 16, 4); ctx.fillStyle = ['#FF9AD8', '#FFD23F', '#7CC4EA', '#5DBB4A'][k % 4]; ctx.fill(); }
        centerSprite('question', tx + tw / 2, ty + th / 2, 7);
      }
      ctx.restore();
      rr(ctx, tx, ty, tw, th, 10); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
      text(label, x + w / 2, yy + h - 34, 24, { color: INK, stroke: null });
    }, { frame: col });
  });
}

/* ----- Oyun ekranı ----- */
function drawWater(T, x0) {
  const wy = T.waterY, [a, b] = T.theme.water, vw = screen === 'play' && play ? viewW() : W, xa = Math.floor(x0 / 8) * 8 - 8, xb = x0 + vw + 16;
  ctx.fillStyle = lin(ctx, 0, wy, 0, H, [a, b]);
  ctx.beginPath(); ctx.moveTo(xa, H);
  for (let x = xa; x <= xb; x += 8) ctx.lineTo(x, wy + Math.sin(x * .05 + time * 2.5) * 1.8);
  ctx.lineTo(xb, H); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = xa; x <= xb; x += 8) { const y = wy + Math.sin(x * .05 + time * 2.5) * 1.8; x === xa ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
  ctx.stroke();
}
function drawFlag(f) {
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x, f.y - 26); ctx.stroke();
  const wv = Math.sin(time * 4) * 3;
  ctx.beginPath(); ctx.moveTo(f.x, f.y - 26); ctx.quadraticCurveTo(f.x + 12, f.y - 24 + wv, f.x + 22, f.y - 20); ctx.lineTo(f.x, f.y - 14); ctx.closePath();
  ctx.fillStyle = '#1E2233'; ctx.fill(); text('☠', f.x + 9, f.y - 20, 9, { stroke: null });
}
function drawPlay(dt) {
  const T = play.T, ch = cur();
  drawSky(ctx, W, H, T.theme.sky);
  if (T.theme.sun) drawSun(560 - cam.x * .05, 86);
  drawClouds(time + cam.x * .02);
  drawBackdrop(T);
  ctx.save();
  // sarsıntı yalnızca hafif bir titreme: en fazla ~2 piksel (yakınlaşmada da büyümesin diye zoom'a bölünür)
  const amp = Math.min(shake, 6) * .35 / (cam.z || 1), sx = shake > 0 ? rand(-amp, amp) : 0, sy = shake > 0 ? rand(-amp, amp) : 0;
  worldTransform(ctx, sx, sy);
  drawWater(T, cam.x);
  drawAmbient(T, dt);
  ctx.drawImage(T.canvas, 0, 0, T.w, H);
  ctx.drawImage(T.decal, 0, 0, T.w, H);
  drawTufts(T);
  drawProps(T);
  drawStains();
  T.flags.forEach(drawFlag);
  drawStinks();
  drawAir();
  for (const c of allChars()) drawChar(c, c === ch);
  if (play.phase === 'banner' || play.phase === 'aim') {
    const bob = Math.sin(time * 6) * 3;
    drawSprite(ctx, SPR.arrow, ch.x - 10, ch.y - 80 + bob, 3);
  }
  if (play.phase === 'aim') drawAim(ch);
  for (const a of play.acts) a.draw();
  for (const p of play.projs) drawProj(p);
  drawParts();
  ctx.restore();
  if (T.theme.flakes) drawFlakes(play.paused ? 0 : dt);
  if (play.flash > 0) { ctx.fillStyle = `rgba(255,255,240,${play.flash})`; ctx.fillRect(0, 0, W, H); }   // yıldırım çakması

  drawHud();
  if (play.pick && play.phase === 'aim' && !play.paused) {
    // sayı seçerken cetvel her şeyin üstünde: çocuk sayıları görmeli
    ctx.save(); worldTransform(ctx); drawRuler(); ctx.restore();
  }
  if (play.phase === 'banner') drawBanner();
  if (play.phase === 'over' && play.overT > .9) drawOver();
  if (play.paused) drawPause();
}
// Sayı cetveli: her UNIT bir sayı. Sayılı eşya seçiliyken belirginleşir ve seçilen sayı işaretlenir.
function drawRuler() {
  const T = play.T, pk = play.pick, strong = pk && (pk.type === 'pos' || pk.type === 'range');
  const u0 = Math.max(0, unitOf(cam.x)), u1 = Math.min(T.maxUnit, unitOf(cam.x + viewW()));
  // karakterlerin durduğu sayılar takım renginde; ayaklarından cetvele kesik çizgi iner
  const at = {};
  for (const c of allChars()) if (alive(c)) {
    const u = clamp(unitOf(c.x), 0, T.maxUnit); at[u] = at[u] || c;
    ctx.setLineDash([4, 5]); ctx.strokeStyle = c.color; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(c.x, c.y + 2); ctx.lineTo(unitX(u), H - 26); ctx.stroke(); ctx.setLineDash([]);
  }
  for (let u = u0; u <= u1; u++) {
    const x = unitX(u), y = H - 14;
    let on = false;
    if (pk && pk.type === 'pos') on = u === pk.val;
    if (pk && pk.type === 'range') on = u >= Math.min(pk.val, pk.val2) && u <= Math.max(pk.val, pk.val2);
    ctx.globalAlpha = strong ? 1 : .7;
    const who = at[u];
    rr(ctx, x - 15, y - 11, 30, 22, 8); ctx.fillStyle = on ? '#FFD23F' : who ? who.color : 'rgba(255,255,255,.88)'; ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = on || who ? 2.5 : 1.2; ctx.stroke();
    text(String(u), x, y, 15, { color: who && !on ? '#FFFFFF' : INK, stroke: null });
    ctx.globalAlpha = 1;
    if (on && pk.type === 'pos') {
      const ok = pickValid(pk);
      ctx.setLineDash([6, 6]); ctx.strokeStyle = ok ? 'rgba(255,255,255,.95)' : 'rgba(229,72,59,.9)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, 70); ctx.lineTo(x, y - 14); ctx.stroke(); ctx.setLineDash([]);
      itemIcon(pk.item, x, 70, 30);
    }
    if (on && pk.type === 'range') { itemIcon('meteor', x, 80, 26); }
  }
  // sınır çizgileri: bir sayının alanı
  ctx.strokeStyle = 'rgba(30,34,51,.25)'; ctx.lineWidth = 1;
  for (let u = u0; u <= u1 + 1; u++) { ctx.beginPath(); ctx.moveTo(u * UNIT, H - 26); ctx.lineTo(u * UNIT, H - 2); ctx.stroke(); }
}
function drawAim(ch) {
  const hx = ch.x, hy = ch.y - 24, team = curTeam();
  if (play.pick) return;
  let vx, vy, pull = 0;
  if (team.cpu) {
    if (!play.ai || play.ai.kind !== 'throw') { if (!play.ai) text('...', ch.x, ch.y - 80, 28, { color: '#FFFFFF' }); return; }
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
    simulate(hx, hy, vx, vy, team.item, ch.team, 3, path);
    let left = total, px = hx, py = hy;
    for (const q of path) {
      left -= Math.hypot(q.x - px, q.y - py); px = q.x; py = q.y;
      if (left <= 0) break;
      const f = left / total, r = Math.round(2 + 3 * f);
      ctx.save(); ctx.globalAlpha = .35 + .65 * f;
      ell(ctx, q.x, q.y, r + 1.6, r + 1.6); ctx.fillStyle = INK; ctx.fill();
      ell(ctx, q.x, q.y, r, r); ctx.fillStyle = `hsl(${120 - 120 * pw},85%,${62 - 10 * pw}%)`; ctx.fill();
      ctx.restore();
    }
  }
  const sp = Math.hypot(vx, vy) || 1, ux = vx / sp, uy = vy / sp;
  const bx = hx - ux * pull * 48, by = hy - uy * pull * 48;
  // güç: başın üstünde ince bir çubuk, yeşil → sarı → kırmızı; tam güçte titrer ve MAX yazar
  const hue = 120 - 120 * pull, col = `hsl(${hue},85%,48%)`, max = pull >= .999;
  if (!team.cpu) {
    const jit = max ? Math.sin(time * 60) * 1.2 : 0, bw = 46, bh = 7, bx0 = ch.x - bw / 2 + jit, by0 = ch.y - 84;
    rr(ctx, bx0 - 2, by0 - 2, bw + 4, bh + 4, 5); ctx.fillStyle = INK; ctx.fill();
    rr(ctx, bx0, by0, bw, bh, 3.5); ctx.fillStyle = '#E3E9F0'; ctx.fill();
    if (pull > .02) { rr(ctx, bx0, by0, bw * pull, bh, 3.5); ctx.fillStyle = col; ctx.fill(); }
    if (max) { text('MAX', ch.x + bw / 2 + 20, by0 + 3, 13, { color: '#FF5A4E', lw: 4 }); if (!play.maxTick) { play.maxTick = true; Sound.play('tick'); } }
    else play.maxTick = false;
  }
  // eşya artık karakterin elinde; kolun ne kadar geri gittiği gücü gösterir (animate)
}
function drawProj(p) {
  if (p.delay > 0) return;
  const it = ITEMS[p.item];
  if (!['rock', 'pepper', 'tickle'].includes(p.item)) p.trail.forEach((q, i) => {
    ctx.globalAlpha = (i + 1) / p.trail.length * .5;
    ell(ctx, q.x, q.y, 3.5, 3.5); ctx.fillStyle = '#FFFFFF'; ctx.fill();
  });
  ctx.globalAlpha = 1;
  if (p.y < viewTop() - 4) {
    // ekranın üstünde: nerede olduğunu göster
    const x = clamp(p.x, cam.x + 20, cam.x + viewW() - 20), vt = viewTop();
    drawSprite(ctx, { name: 'arrowUp', w: 3, h: 3 }, x - 6, vt + 4, 4);
    itemIcon(p.item, x, vt + 30, 18);
    return;
  }
  let rot = p.rot || 0, flip = false;
  const ang = Math.atan2(p.vy, p.vx);
  if (p.item === 'fish') { flip = p.vx > 0; rot = p.vx > 0 ? ang : ang + Math.PI; }
  else if (p.item === 'balloon') rot = Math.sin(p.t * 10) * .18;
  else if (p.item === 'tickle') rot = Math.sin(p.t * 6) * .7;
  else if (p.item === 'clock') { const left = p.fuse - p.t; rot = Math.sin(time * (left < 1 ? 60 : 30)) * (left < 1 ? .3 : .12); }
  else if (p.item === 'bug') rot = Math.sin(p.t * 30) * .25;
  else if (!it.spin && !it.spr && !it.big) rot = ang * .3;
  itemIcon(p.item, p.x, p.y, it.big ? 26 : it.size || 24, { flip, rot });
  if (p.fuse) text(String(Math.max(1, Math.ceil(p.fuse - p.t))), p.x, p.y - 22, 16, { color: '#FFFFFF', lw: 4 });
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

/* ----- Güç çubuğu -----
   Yeşil → sarı → kırmızı. Kaybedilen kısım önce açık renkte kalır, sonra erir (ne kadar gittiği görülsün). */
function hpColor(f) { return f > .6 ? ['#7FE05C', '#3FAE33'] : f > .3 ? ['#FFD84D', '#F0A81E'] : ['#FF7A6E', '#E5483B']; }
function hpBar(x, y, w, h, c, label) {
  const f = c.hp / c.maxHp, g = c.hpShown / c.maxHp, [l, d] = hpColor(f);
  rr(ctx, x - 2, y - 2, w + 4, h + 4, (h + 4) / 2); ctx.fillStyle = INK; ctx.fill();
  rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = '#E3E9F0'; ctx.fill();
  if (g > f) { rr(ctx, x, y, Math.max(h, w * g), h, h / 2); ctx.fillStyle = '#FFE3DE'; ctx.fill(); }
  if (f > 0) { rr(ctx, x, y, Math.max(h, w * f), h, h / 2); ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [l, d]); ctx.fill(); }
  rr(ctx, x + 3, y + 2, Math.max(0, w * f - 6), Math.max(1.5, h * .22), 1); ctx.fillStyle = 'rgba(255,255,255,.45)'; if (f > .05) ctx.fill();
  if (label) text(String(Math.ceil(c.hp)), x + w / 2, y + h / 2, Math.round(h * .95), { color: '#FFFFFF', lw: 3.5 });
}

/* ----- Üst ve alt göstergeler ----- */
function teamPanel(team, x, right) {
  const n = team.chars.length, per = n === 1 ? 110 : 70, w = 22 + n * per;
  const px = right ? x - w : x;
  panel(px, 12, w, 56, team.color);
  team.chars.forEach((c, i) => {
    const cx = px + 12 + i * per, on = c === cur();
    if (on && play.phase !== 'over') { rr(ctx, cx - 2, 18, per - 2, 44, 10); ctx.fillStyle = '#FFF4C2'; ctx.fill(); }
    ctx.save(); ctx.translate(cx + 16, 55); ctx.scale(.62, .62); if (!alive(c)) ctx.globalAlpha = .45;
    (team.id === 0 ? penguinArt : catArt)(ctx, !alive(c), c.color, false); ctx.restore();
    hpBar(cx + 36, 31, per - 46, n === 1 ? 16 : 12, c, true);
  });
  return w;
}
function drawHud() {
  const [a, b] = play.teams;
  const wa = teamPanel(a, 12, false);
  teamPanel(b, W - 12, true);
  // rüzgâr: oklar + sayı (böcek uçağında hesaba katılan sayı)
  panel(W / 2 - 74, 12, 148, 56, '#2BB3A3');
  const n = Math.abs(play.wind), flip = play.wind < 0;
  for (let i = 0; i < 3; i++) {
    const idx = flip ? 2 - i : i;
    drawSprite(ctx, SPR.chevron, W / 2 - 58 + i * 26, 30, 3.6, { outline: false, flip, pal: { X: idx < n ? '#2BB3A3' : '#D7E6EC' } });
  }
  text((play.wind > 0 ? '+' : play.wind < 0 ? '−' : '') + n, W / 2 + 46, 41, 28, { color: n ? '#1E8F84' : '#9AB0B8', stroke: null });

  if (screen === 'play' && play.phase !== 'over') {
    button(wa + 24, 12, 56, 56, () => { play.paused = true; }, (x, y, w, h) => centerSprite('pause', x + w / 2, y + h / 2, 4, { outline: false }), { frame: '#B9C6D6' });
  }
  drawMinimap();
  const T = play.T;
  // kaydırma okları: harita ekrandan genişse
  // nişan alırken parmak yanlışlıkla oka denk gelmesin diye üstte duruyor ve nişan sırasında gizleniyor
  if (T.w > viewW() + 2 && play.phase !== 'over' && !play.paused && !play.bag && !play.aim) {
    [[-1, 12], [1, W - 56]].forEach(([dir, x]) => {
      const can = dir < 0 ? cam.x > 1 : cam.x < T.w - viewW() - 1;
      button(x, 76, 44, 44, null, (bx, by, w, h) => centerSprite('play', bx + w / 2, by + h / 2, 3, { flip: dir < 0, outline: false }),
        { frame: '#B9C6D6', disabled: !can, onDown: () => { play.pan = dir; }, onUp: () => { play.pan = 0; } });
    });
  }

  if (play.phase !== 'over' && !play.paused && !play.bag && !play.pick) {
    const L = zoomLevels(), zx = W - 56, zy = 128;
    button(zx, zy, 44, 44, () => setZoom(cam.zi + 1), (bx, by, w, h) => zoomIcon(bx + w / 2, by + h / 2, true), { frame: '#B9C6D6', disabled: cam.zi >= L.length - 1 });
    button(zx, zy + 52, 44, 44, () => setZoom(cam.zi - 1), (bx, by, w, h) => zoomIcon(bx + w / 2, by + h / 2, false), { frame: '#B9C6D6', disabled: cam.zi <= 0 });
  }
  const ch = cur(), team = curTeam();
  if (play.phase === 'aim' && !team.cpu && !play.paused) {
    // yürüme
    const canWalk = play.walkLeft > 0 && !play.pick;
    if (!play.pick) [[-1, 14], [1, 86]].forEach(([dir, x]) => {
      button(x, H - 76, 60, 60, null, (bx, by, w, h) => centerSprite('play', bx + w / 2, by + h / 2, 4, { outline: false, flip: dir < 0 }), {
        frame: '#B9C6D6', disabled: !canWalk,
        onDown: () => { if (canWalk) play.walkDir = dir; }, onUp: () => { play.walkDir = 0; },
      });
    });
    if (!play.pick) {
      rr(ctx, 14, H - 11, 132, 8, 4); ctx.fillStyle = INK; ctx.fill();
      const wl = clamp(play.walkLeft / WALK_BUDGET, 0, 1);
      if (wl > .03) { rr(ctx, 16, H - 9, 128 * wl, 4, 2); ctx.fillStyle = '#7FE05C'; ctx.fill(); }
    }
    // seçili eşya ve çanta (seçici açıkken cetvelin üstüne kalkar)
    const k = team.item, left = team.ammo[k], by = play.pick ? H - 140 : H - 76;
    button(W - 152, by, 64, 64, () => { if (ITEMS[k].kind !== 'throw') openPick(k); }, (bx, by, w, h) => {
      itemIcon(k, bx + w / 2, by + h / 2, 38);
      if (left !== Infinity) { ell(ctx, bx + w - 12, by + h - 12, 10, 10); ctx.fillStyle = INK; ctx.fill(); text(String(left), bx + w - 12, by + h - 13, 14, { stroke: null }); }
    }, { frame: '#FFD23F' });
    button(W - 80, by, 64, 64, () => { play.bag = !play.bag; }, (bx, by, w, h) => emojiAt('🎒', bx + w / 2, by + h / 2, 34), { frame: play.bag ? '#FFD23F' : '#B9C6D6' });
    if (ITEMS[k].fuse && !play.pick) stepper(W - 152, H - 132, 136, '⏰', play.fuse, 1, 5, v => { play.fuse = v; }, 'sn');
    if (play.pick) drawPicker();
    if (play.bag) drawBag();
  }
}
function zoomIcon(x, y, plus) {
  ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
  ell(ctx, x - 3, y - 3, 9, 9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + 11, y + 11); ctx.stroke();
  ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x - 7, y - 3); ctx.lineTo(x + 1, y - 3); if (plus) { ctx.moveTo(x - 3, y - 7); ctx.lineTo(x - 3, y + 1); } ctx.stroke();
}
function drawMinimap() {
  const T = play.T;
  if (T.w <= viewW() + 2) return;
  if (!play.mini) play.mini = T.thumb(1);
  const mw = 216, mh = 30, mx = W / 2 - mw / 2, my = 74, sc = mw / T.w;
  rr(ctx, mx - 3, my - 3, mw + 6, mh + 6, 8); ctx.fillStyle = INK; ctx.fill();
  ctx.drawImage(play.mini, mx, my, mw, mh);
  rr(ctx, mx + Math.max(0, cam.x) * sc, my, Math.min(T.w, viewW()) * sc, mh, 3); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.stroke();
  for (const c of allChars()) if (alive(c)) { ell(ctx, mx + c.x * sc, my + c.y / H * mh - 2, 3, 3); ctx.fillStyle = c.color; ctx.fill(); }
  buttons.push({ x: mx, y: my, w: mw, h: mh, onTap: () => { cam.manual = true; cam.tx = (pointer.p.x - mx) / sc - viewW() / 2; } });
  // harita her patlamada değişir; mini haritayı ara ara tazele
  if ((play.miniAge = (play.miniAge || 0) + 1) > 90) { play.mini = null; play.miniAge = 0; }
}
// Küçük sayı ayarlayıcı: [−] değer [+]
function stepper(x, y, w, label, val, min, max, set, unit = '') {
  panel(x, y, w, 50, '#FFD23F');
  button(x + 6, y + 7, 36, 36, () => set(Math.max(min, val - 1)), (bx, by, bw, bh) => text('−', bx + bw / 2, by + bh / 2, 26, { color: INK, stroke: null }), { frame: '#B9C6D6', disabled: val <= min });
  button(x + w - 42, y + 7, 36, 36, () => set(Math.min(max, val + 1)), (bx, by, bw, bh) => text('+', bx + bw / 2, by + bh / 2, 26, { color: INK, stroke: null }), { frame: '#B9C6D6', disabled: val >= max });
  text(`${label} ${val}${unit ? ' ' + unit : ''}`, x + w / 2, y + 26, 22, { color: INK, stroke: null });
}
// Sayılı eşya paneli
function drawPicker() {
  const pk = play.pick, it = ITEMS[pk.item], T = play.T, x = 160, w = W - 320, y = H - 150, h = 110;
  panel(x, y, w, h, '#FFD23F');
  itemIcon(pk.item, x + 38, y + 40, 40);
  const label = it.pick ? it.pick.label : it.label;
  text(label, x + w / 2 + 6, y + 26, 19, { color: INK, stroke: null });
  if (it.pick && it.pick.wind) {
    const n = Math.abs(play.wind);
    text(`rüzgâr ${play.wind > 0 ? '➜ +' : play.wind < 0 ? '⬅ −' : ''}${n}`, x + w / 2 + 6, y + 46, 15, { color: '#1E8F84', stroke: null });
  }
  const sy = y + 54;
  if (pk.type === 'count') {
    const p = it.pick;
    stepper(x + 110, sy, 220, '', pk.val, p.min, p.max, v => { pk.val = v; });
  } else if (pk.type === 'pos') {
    stepper(x + 90, sy, 220, '', pk.val, 0, T.maxUnit, v => { pk.val = v; cam.manual = true; cam.tx = unitX(v) - viewW() / 2; });
  } else if (pk.type === 'range') {
    stepper(x + 60, sy, 140, '', pk.val, 0, T.maxUnit, v => { pk.val = v; pk.val2 = clamp(pk.val2, v - it.pick.span + 1, v + it.pick.span - 1); cam.manual = true; cam.tx = unitX(v) - viewW() / 2; });
    text('➜', x + 216, sy + 25, 24, { color: INK, stroke: null });
    stepper(x + 232, sy, 140, '', pk.val2, 0, T.maxUnit, v => { pk.val2 = v; pk.val = clamp(pk.val, v - it.pick.span + 1, v + it.pick.span - 1); });
  }
  const ok = pickValid(pk);
  button(x + w - 104, y + 52, 92, 50, () => { if (ok) usePick(); else Sound.play('hit'); }, (bx, by, bw, bh) => text(it.kind === 'self' ? 'KULLAN' : 'TAMAM', bx + bw / 2, by + bh / 2 + 1, 20, { color: INK, stroke: null }), { frame: ok ? '#5DBB4A' : '#E5483B', disabled: !ok });
  button(x + w - 44, y - 10, 40, 40, () => { play.pick = null; curTeam().item = 'snowball'; }, (bx, by, bw, bh) => text('✕', bx + bw / 2, by + bh / 2, 22, { color: INK, stroke: null }), { frame: '#B9C6D6' });
}
// Çanta: elindeki bütün eşyalar
function drawBag() {
  const team = curTeam(), list = ITEM_ORDER.filter(k => team.ammo[k] > 0);
  // eşya çoksa daha çok sütun ve küçük kare: çanta en fazla 3 satır, ekrana sığar
  const cols = list.length > 24 ? 11 : 8, s = cols > 8 ? 58 : 66, gap = cols > 8 ? 6 : 8, rows = Math.ceil(list.length / cols), w = cols * (s + gap) + 24, h = rows * (s + gap) + 66;
  const x = W / 2 - w / 2, y = Math.max(76, H - 86 - h);
  buttons.push({ x: 0, y: 0, w: W, h: H, onTap: () => { play.bag = false; } });   // dışarı dokununca kapanır
  panel(x, y, w, h, '#B9C6D6');
  buttons.push({ x, y, w, h, onTap: null });
  text('ÇANTA', x + w / 2, y + 28, 22, { color: INK, stroke: null });
  list.forEach((k, i) => {
    const bx = x + 12 + (i % cols) * (s + gap), by = y + 50 + Math.floor(i / cols) * (s + gap), it = ITEMS[k], left = team.ammo[k];
    button(bx, by, s, s, it.kind === 'passive' ? null : () => { Sound.play('click'); openPick(k); }, (qx, qy, qw, qh) => {
      itemIcon(k, qx + qw / 2, qy + qh / 2 - 2, s > 60 ? 38 : 32);
      if (left !== Infinity) { ell(ctx, qx + qw - 12, qy + qh - 12, 10, 10); ctx.fillStyle = INK; ctx.fill(); text(String(left), qx + qw - 12, qy + qh - 13, 14, { stroke: null }); }
      if (it.kind !== 'throw' && it.kind !== 'passive') text('🔢', qx + 12, qy + 12, 13, { stroke: null });
    }, { frame: team.item === k ? '#FFD23F' : it.kind === 'passive' ? '#E3E9F0' : '#FFFFFF', disabled: it.kind === 'passive' });
  });
}
function drawBanner() {
  const ch = cur(), t = play.t;
  const a = t < .15 ? t / .15 : t > .85 ? (1 - t) / .15 : 1;
  ctx.save(); ctx.globalAlpha = clamp(a, 0, 1);
  const w = 380, h = 112, x = W / 2 - w / 2, y = 110;
  panel(x, y, w, h, ch.color);
  ctx.save(); ctx.translate(x + 62, y + h - 16); ctx.scale(1.6, 1.6); (ch.team === 0 ? penguinArt : catArt)(ctx, false, ch.color, false); ctx.restore();
  const msg = play.bonus ? 'BİR ATIŞ DAHA!' : play.mode === '1p' ? (curTeam().cpu ? 'SIRA KEDİDE' : 'SIRA SENDE!') : (ch.team === 0 ? 'SIRA MAVİDE!' : 'SIRA KIRMIZIDA!');
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
  ctx.save(); ctx.translate(W / 2, y + 108 - bob); ctx.scale(1.9, 1.9);
  (humanLost || win.id === 0 ? penguinArt : catArt)(ctx, false, humanLost ? play.teams[0].color : win.color, false); ctx.restore();
  const msg = humanWon ? 'KAZANDIN!' : humanLost ? 'TEKRAR DENE!' : 'KAZANDI!';
  text(msg, W / 2, y + 140, 40, { color: humanLost ? INK : win.color, stroke: humanLost ? null : INK, lw: 7 });
  if (humanWon) { const st = matchStars(); for (let k = 0; k < 3; k++) drawSprite(ctx, SPR[k < st ? 'star' : 'starEmpty'], W / 2 - 75 + k * 52, y + 168, 5); }
  if (play.reward) { panel(x + w - 112, y - 18, 104, 44, '#FFD23F'); text('+' + play.reward + ' 🪙', x + w - 60, y + 4, 22, { color: INK, stroke: null }); }

  const bs = 70, by = y + h - bs - 22;
  const btns = [['home', () => { screen = play.mode === '1p' ? 'levels' : 'maps'; play = null; }]];
  btns.push(['retry', () => startMatch(play.mode, play.li, play.mapKey, play.mapKey === 'random' ? null : play.def)]);
  if (humanWon && play.li < LEVELS.length - 1) btns.push(['play', () => { levelPage = Math.floor((play.li + 1) / 6); startMatch('1p', play.li + 1); }]);
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
const pointer = { id: null, btn: null, p: { x: 0, y: 0 } };
function toLogical(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
}
canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  Sound.unlock();
  if (pointer.id !== null && !e.isPrimary) return;   // takılı kalmış eski dokunuş yeni dokunuşu engellemesin
  pointer.id = e.pointerId;
  try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  const p = toLogical(e); pointer.p = p;
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
  if (screen === 'play' && play && !play.paused && play.phase === 'aim' && !curTeam().cpu && !play.pick && !play.bag && ITEMS[curTeam().item].kind === 'throw') {
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
document.addEventListener('visibilitychange', () => { pointer.id = null; pointer.btn = null; if (document.hidden && play && play.phase !== 'over') play.paused = true; });
addEventListener('pageshow', () => { pointer.id = null; pointer.btn = null; });
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
window.__wob = {
  get play() { return play; }, get screen() { return screen; }, set screen(v) { screen = v; }, get cam() { return cam; },
  startMatch, beginMatch, Wallet, Store, LEVELS, ITEMS, fire, aiPlan, walk, startDrop, openPick, usePick, unitX, unitOf,
  set twoSize(v) { twoSize = v; }, setZoom, penguinArt, catArt, drawBlock,
};
})();
