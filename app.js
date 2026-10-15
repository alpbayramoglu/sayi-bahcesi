/* Sayı Bahçesi — 6 yaş için toplama, çıkarma, sayı dizisi, boşluk doldurma ve şekil oyunları
   (örüntü, ayna/simetri, farklı olan, şekil sudoku).
   Pedagoji: somut → resimli → soyut (Kolay'da nesneler hep görünür, Orta'da ipucuyla,
   Zor'da 10'luk çerçeve), süre baskısı yok, yanlışta ceza yok, yanlış sorular aralıklı tekrar. */
'use strict';
(() => {

const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };

const ROUND = 10;           // tur başına soru
const REPEAT_GAP = 3;       // yanlış soru kaç soru sonra tekrar gelsin
const LEVELS = {
  1: { options: 3, visual: 'pictures', always: true },   // 0–5
  2: { options: 4, visual: 'pictures', always: false },  // 0–10
  3: { options: 4, visual: 'frames', always: false },    // 0–20, 10'luk çerçeve
};
const VERSION = 8;          // sw.js içindeki CACHE ile aynı tut (sayi-bahcesi-v8)
const MODES = [
  { key: 'add', g: 'num', label: 'Toplama', ico: '2+3', c: '#34C17B' },
  { key: 'sub', g: 'num', label: 'Çıkarma', ico: '5−2', c: '#FF9F43' },
  { key: 'seq', g: 'num', label: 'Sayı Dizisi', ico: '1 2 ?', c: '#8E7CF0' },
  { key: 'blank', g: 'num', label: 'Boşluk Doldur', ico: '3+?=5', c: '#3FA9F5' },
  { key: 'mix', g: 'num', label: 'Karışık', ico: '🎲', c: '#FF6FA8' },
  { key: 'pat', g: 'shape', label: 'Örüntü', ico: '🔺🔵🔺', c: '#14B8A6' },
  { key: 'sym', g: 'shape', label: 'Ayna', ico: '🦋', c: '#E05FC4' },
  { key: 'odd', g: 'shape', label: 'Farklı Olan', ico: '🔍', c: '#F08C1A' },
  { key: 'sud', g: 'shape', label: 'Şekil Sudoku', ico: '🧩', c: '#5B7FEF' },
];
const GROUPS = [['num', 'Sayılar'], ['shape', 'Şekiller']];
const NUM_TYPES = ['add', 'sub', 'seq', 'blank'];
// Bahçe: her STARS_PER_FRIEND yıldızda bir yeni arkadaş gelir; ilki baştan açık.
const FRIENDS = ['🌱', '🌷', '🌼', '🐞', '🌻', '🐝', '🍄', '🦋', '🌳', '🐌', '🐦', '🌸', '🐇', '🍓', '🦔',
  '🐢', '🌈', '🐿️', '🐸', '🌺', '🦊', '🐥', '🦉', '🍎', '🐑', '🦄', '🌵', '🐠', '🎈', '🏡'];
const STARS_PER_FRIEND = 3;
// Ekonomi: yıldız bahçe için birikir (hiç harcanmaz). Altın dükkânda harcanır.
// Her matematik turu bir maç bileti verir; bilet en fazla TICKET_MAX birikir ki matematik → oyun döngüsü korunsun.
const TICKET_MAX = 3;
// Savaş eşyaları (anahtarlar savas/game.js içindeki ITEMS ile aynı). num: sayı seçerek kullanılır.
const SHOP_GROUPS = [['throw', 'Atılanlar'], ['num', 'Sayılı'], ['def', 'Savunma']];
const SHOP = [
  { key: 'balloon', g: 'throw', ico: '💦', name: 'Su Balonu', info: 'Büyük patlar', price: 2 },
  { key: 'paint', g: 'throw', ico: '🎨', name: 'Boya Küpü', info: 'Zıplar, boyar', price: 3 },
  { key: 'fish', g: 'throw', ico: '🐟', name: 'Balık', info: 'Dümdüz uçar', price: 4 },
  { key: 'bigball', g: 'throw', ico: '⚪', name: 'Dev Kartopu', info: 'Ağır, kocaman çukur', price: 3 },
  { key: 'bouncy', g: 'throw', ico: '🥎', name: 'Zıp Zıp Top', info: 'Üç kez seker', price: 3 },
  { key: 'melon', g: 'throw', ico: '🍉', name: 'Karpuz', info: 'Dört dilime ayrılır', price: 5 },
  { key: 'boomerang', g: 'throw', ico: '🪃', name: 'Bumerang', info: 'Geri döner', price: 4 },
  { key: 'cake', g: 'throw', ico: '🎂', name: 'Pasta', info: 'Rakip bir tur yürüyemez', price: 4 },
  { key: 'tickle', g: 'throw', ico: '🪶', name: 'Gıdıklama Tüyü', info: 'Hihi! Rakibi kaydırır', price: 2 },
  { key: 'pepper', g: 'throw', ico: '🌶️', name: 'Hapşırık Biberi', info: 'Rakibi uçurur', price: 4 },
  { key: 'clock', g: 'num', ico: '⏰', name: 'Çalar Saat', info: 'Kaç saniye sonra?', price: 4 },
  { key: 'frog', g: 'num', ico: '🐸', name: 'Zıp Zıp Kurbağa', info: 'Kaç kere zıplasın?', price: 5 },
  { key: 'chicken', g: 'num', ico: '🐔', name: 'Koşan Tavuk', info: 'Kaç adım koşsun?', price: 5 },
  { key: 'bugs', g: 'num', ico: '🐞', name: 'Böcek Uçağı', info: 'Sayıyı seç, rüzgârı ekle', price: 8 },
  { key: 'meteor', g: 'num', ico: '☄️', name: 'Meteor Yağmuru', info: 'Bu sayıdan şu sayıya', price: 10 },
  { key: 'teleport', g: 'num', ico: '✨', name: 'Işınlanma', info: 'Bir sayıya ışınlan', price: 6 },
  { key: 'flyballoon', g: 'num', ico: '🎈', name: 'Uçan Balon', info: 'Rüzgârla uç', price: 5 },
  { key: 'wall', g: 'num', ico: '🧱', name: 'Kardan Duvar', info: 'Kaç blok yüksek?', price: 3 },
  { key: 'bridge', g: 'num', ico: '🌉', name: 'Sayı Köprüsü', info: 'Kaç blok uzun?', price: 4 },
  { key: 'umbrella', g: 'def', ico: '☂️', name: 'Şemsiye', info: 'Bir tur kalkan', price: 5 },
  { key: 'chute', g: 'def', ico: '🪂', name: 'Paraşüt', info: 'Düşerken açılır', price: 3 },
  { key: 'potion', g: 'def', ico: '🧪', name: 'Kalp İksiri', info: '+1 kalp', price: 12 },
];
const friendsFor = stars => Math.min(FRIENDS.length, Math.floor(stars / STARS_PER_FRIEND) + 1);
const FLIERS = ['🐝', '🦋', '🐦', '🌈', '🎈'], BIG = ['🌳', '🏡', '🌈'];
// Bahçe sahnesindeki yerler (% olarak, sol-üst): çimen 3 sıra, gökyüzü 1 sıra; sıra karışık ki bahçe dengeli dolsun.
const GROUND_SLOTS = [[50, 70], [22, 62], [78, 64], [36, 80], [64, 82], [8, 76], [92, 78], [30, 60], [70, 58],
  [50, 86], [16, 86], [84, 86], [43, 64], [58, 70], [6, 62], [94, 62], [26, 74], [74, 74], [38, 88], [62, 88], [50, 56], [18, 54], [82, 54], [34, 52]];
const SKY_SLOTS = [[28, 22], [62, 16], [44, 34], [78, 30], [12, 30]];
const EMOJI = ['🍎', '🐟', '⭐', '🍓', '🐞', '🎈', '🧁', '🐥', '🌸', '🍪', '🦋', '🚗'];
const PRAISE = [['Aferin!', 'aferin'], ['Harika!', 'harika'], ['Süpersin!', 'supersin'], ['Çok güzel!', 'cok_guzel'], ['Bravo!', 'bravo']];

/* ================= Kayıt ================= */
const Store = {
  key: 'sayi-bahcesi.v1',
  d: { level: 1, stars: 0, best: {}, missed: {}, sound: true, seen: 1, coins: 0, tickets: 1, inv: {}, tasks: [], pin: null, celebrate: [] },
  load() { try { Object.assign(this.d, JSON.parse(localStorage.getItem(this.key)) || {}); } catch (e) {} },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.d)); } catch (e) {} },
};
Store.load();

/* ================= Soru üretimi ================= */
const GEN = {
  add(lv) {
    let a, b;
    if (lv === 1) { a = rnd(1, 4); b = rnd(1, 5 - a); }
    else if (lv === 2) { a = rnd(1, 9); b = rnd(1, 10 - a); }
    else if (Math.random() < .7) { do { a = rnd(2, 9); b = rnd(2, 9); } while (a + b <= 10); } // 10'u geçen toplama
    else { a = rnd(10, 16); b = rnd(1, 20 - a); }
    return { t: 'add', a, b };
  },
  sub(lv) {
    let a, b;
    if (lv === 1) { a = rnd(2, 5); b = rnd(1, a); }
    else if (lv === 2) { a = rnd(3, 10); b = rnd(1, a); }
    else if (Math.random() < .7) { a = rnd(11, 18); b = rnd(a - 9, 9); }                      // 10'dan geriye geçen çıkarma
    else { a = rnd(12, 20); b = rnd(1, a - 10); }
    return { t: 'sub', a, b };
  },
  blank(lv) {
    if (lv === 1 || Math.random() < .6) {
      const q = GEN.add(lv);
      return { t: 'blank', op: '+', a: q.a, b: q.b, hole: lv === 1 ? 'b' : pick(['a', 'b']) };
    }
    const q = GEN.sub(lv);
    return { t: 'blank', op: '-', a: q.a, b: Math.min(q.b, q.a - 1) || 1, hole: pick(['a', 'b']) };
  },
  seq(lv) {
    const len = lv === 1 ? 4 : 5;
    const step = lv === 1 ? 1 : lv === 2 ? pick([1, 1, -1, 2]) : pick([2, 5, 10, -1, -2, 5]);
    const s = Math.abs(step), span = s * (len - 1);
    const maxV = lv === 1 ? 10 : lv === 2 ? 20 : s === 10 ? 100 : 50;
    let start = s >= 5 ? s * rnd(0, Math.floor((maxV - span) / s)) : rnd(0, maxV - span);
    if (step < 0) start += span;
    return { t: 'seq', start, step, len, hole: lv === 3 ? rnd(0, len - 1) : rnd(1, len - 1) };
  },
  mix(lv) { return GEN[pick(['add', 'sub', 'seq', 'blank'])](lv); },
};

// say: okunacak ses parçalarının listesi (audio/<ad>.mp3). Sayılar 'n5' gibi; 0 = kısa duraklama.
const N = n => 'n' + n;
function build(s) {
  if (SB[s.t]) return SB[s.t](s);
  if (s.t === 'add') return { ans: s.a + s.b, tokens: [s.a, '+', s.b, '=', null], say: [N(s.a), 'arti', N(s.b), 'kac_eder'] };
  if (s.t === 'sub') return { ans: s.a - s.b, tokens: [s.a, '−', s.b, '=', null], say: [N(s.a), 'eksi', N(s.b), 'kac_eder'] };
  if (s.t === 'blank') {
    const plus = s.op === '+', c = plus ? s.a + s.b : s.a - s.b, sym = plus ? '+' : '−', w = plus ? 'arti' : 'eksi';
    return {
      ans: s[s.hole], c,
      tokens: s.hole === 'a' ? [null, sym, s.b, '=', c] : [s.a, sym, null, '=', c],
      say: s.hole === 'a' ? ['kac', w, N(s.b), 0, N(c), 'eder'] : [N(s.a), w, 'kac', 0, N(c), 'eder'],
    };
  }
  const nums = Array.from({ length: s.len }, (_, i) => s.start + i * s.step);
  return {
    ans: nums[s.hole], seq: true, tokens: nums.map((n, i) => i === s.hole ? null : n),
    say: nums.flatMap((n, i) => [i === s.hole ? 'bos' : N(n), 0]),
  };
}

// Çeldiriciler çocukların gerçek hatalarından: ±1 sayma hatası, işlemi karıştırma, sonucu yazma.
function options(s, q, n) {
  const ans = q.ans, typical = [];
  if (s.t === 'add') typical.push(Math.abs(s.a - s.b));
  if (s.t === 'sub') typical.push(s.a + s.b);
  if (s.t === 'blank') typical.push(q.c);
  const d = s.t === 'seq' ? Math.abs(s.step) : 1;
  const list = [...shuffle([ans + d, ans - d]), ...shuffle([...typical, ans + 2 * d, ans - 2 * d, ans + 1, ans - 1])];
  const set = new Set([ans]);
  for (const v of list) if (set.size < n && v >= 0 && Number.isInteger(v)) set.add(v);
  for (let k = 3; set.size < n; k++) set.add(ans + k);
  return shuffle([...set]);
}

// Görsel ipucu parçaları: a/b = nesne, x = çıkarılan (üstü çizili), q = sayılacak boş yer
function segs(s, q) {
  if (s.t === 'add') return [['a', s.a], ['b', s.b]];
  if (s.t === 'sub') return [['a', s.a - s.b], ['x', s.b]];
  if (s.op === '+') return s.hole === 'b' ? [['a', s.a], ['q', s.b]] : [['q', s.a], ['b', s.b]];
  return [['a', q.c], ['x', s.b]];
}

/* ================= Şekil oyunları =================
   Örüntü: tekrar eden kuralı bulma. Ayna: simetri (çeldirici "aynen kopyala", yani çocukların en sık hatası).
   Farklı Olan: önemsiz farkları görmezden gelip kuralı bulma. Şekil Sudoku: satır ve sütunu birlikte düşünme.
   Bir şekil öğesi: [şekil, renk, küçük mü]. */
const SVGNS = 'http://www.w3.org/2000/svg';
const COLORS = { red: '#FF6B6B', blue: '#3FA9F5', yellow: '#FFC93C', green: '#34C17B', purple: '#8E7CF0', orange: '#FF9F43' };
const COLOR_TR = { red: 'kırmızı', blue: 'mavi', yellow: 'sarı', green: 'yeşil', purple: 'mor', orange: 'turuncu' };
const SHAPE_TR = { circle: 'daire', square: 'kare', triangle: 'üçgen', star: 'yıldız', heart: 'kalp', diamond: 'baklava' };
const STAR = (() => {
  const p = [];
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 19 : 44, a = -Math.PI / 2 + i * Math.PI / 5; p.push(`${(50 + r * Math.cos(a)).toFixed(1)} ${(54 + r * Math.sin(a)).toFixed(1)}`); }
  return 'M' + p.join(' L') + ' Z';
})();
const SHAPE_SVG = {
  circle: '<circle cx="50" cy="50" r="40"/>',
  square: '<rect x="12" y="12" width="76" height="76" rx="10"/>',
  triangle: '<path d="M50 12 L90 84 H10 Z"/>',
  star: `<path d="${STAR}"/>`,
  heart: '<path d="M50 86 C22 66 8 52 8 34 C8 20 19 10 32 10 C41 10 47 15 50 22 C53 15 59 10 68 10 C81 10 92 20 92 34 C92 52 78 66 50 86 Z"/>',
  diamond: '<path d="M50 8 L88 50 L50 92 L12 50 Z"/>',
};
const SHAPES = Object.keys(SHAPE_SVG), COLS = Object.keys(COLORS);
const SUD = [['circle', 'red'], ['square', 'blue'], ['triangle', 'yellow'], ['star', 'green']];
const sample = (a, n) => shuffle([...a]).slice(0, n);
const itemKey = ([sh, co, sm]) => `${sh}-${co}${sm ? '-s' : ''}`;
const itemName = ([sh, co, sm]) => `${sm ? 'küçük ' : ''}${COLOR_TR[co]} ${SHAPE_TR[sh]}`;

function shapeEl([sh, co, sm]) {
  const s = document.createElementNS(SVGNS, 'svg');
  s.setAttribute('viewBox', '0 0 100 100'); s.setAttribute('class', 'shp'); s.setAttribute('aria-hidden', 'true');
  const k = sm ? ' transform="translate(50 50) scale(.55) translate(-50 -50)"' : '';
  s.innerHTML = `<g fill="${COLORS[co]}" stroke="${COLORS[co]}" stroke-width="8" stroke-linejoin="round"${k}>${SHAPE_SVG[sh]}</g>`;
  return s;
}

Object.assign(GEN, {
  pat(lv) {
    const unit = pick(lv === 1 ? ['AB', 'AB', 'AAB', 'ABB'] : lv === 2 ? ['ABC', 'AABB', 'AAB', 'ABB'] : ['ABC', 'ABCD', 'AABC', 'ABAC']);
    const k = new Set(unit).size;
    let items;
    if (lv < 3) { const sh = sample(SHAPES, k), co = sample(COLS, k); items = sh.map((s, i) => [s, co[i]]); }
    else {
      // Zor: parçalar şekli ya da rengi paylaşır; çocuk iki özelliğe birden bakmak zorunda
      const sh = sample(SHAPES, 2), co = sample(COLS, 2);
      items = shuffle([[sh[0], co[0]], [sh[0], co[1]], [sh[1], co[0]], [sh[1], co[1]]]).slice(0, k);
    }
    const total = Math.max(7, unit.length * 2 + 1);
    return { t: 'pat', unit, items, total, hole: lv === 1 ? total - 1 : rnd(unit.length, total - 1), n: LEVELS[lv].options };
  },
  sym(lv) {
    const R = lv === 1 ? 3 : 4, C = lv === 3 ? 3 : 2, colors = lv === 3 ? 2 : 1;
    for (;;) {
      const rows = Array.from({ length: R }, () => Array.from({ length: C }, () => Math.random() < .5 ? 1 + rnd(0, colors - 1) : 0).join(''));
      const filled = rows.join('').replace(/0/g, '').length;
      if (filled < 2 || filled > R * C - 1) continue;
      const s = { t: 'sym', rows, off: [rnd(0, R - 1), rnd(0, C - 1)], n: LEVELS[lv].options };
      const c = symCands(s), vals = Object.values(c).map(r => r.join('/'));
      if (new Set(vals).size === vals.length) return s;
    }
  },
  odd(lv) {
    const rule = pick(lv === 3 ? ['shape', 'color', 'size'] : ['shape', 'color']);
    const val = { shape: sample(SHAPES, 2), color: sample(COLS, 2), size: [0, 1] };
    const items = [0, 1, 2, 3].map(() => ({ shape: val.shape[0], color: val.color[0], size: 0 }));
    const odd = rnd(0, 3);
    items[odd][rule] = val[rule][1];
    // Önemsiz özellikler 2+2 dağılır; böylece hiçbiri tek başına bir öğeyi öne çıkarmaz, kural tek kalır.
    const vary = lv === 1 ? [] : ['shape', 'color', 'size'].filter(a => a !== rule && (a !== 'size' || lv === 3));
    for (const a of vary) { const v = shuffle([val[a][0], val[a][0], val[a][1], val[a][1]]); items.forEach((it, i) => { it[a] = v[i]; }); }
    return { t: 'odd', rule, odd, items: items.map(it => [it.shape, it.color, it.size]) };
  },
  sud(lv) {
    const n = lv === 1 ? 3 : 4, ix = [...Array(n).keys()];
    const rp = shuffle([...ix]), cp = shuffle([...ix]), sp = shuffle([...ix]);
    const g = []; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) g.push(sp[(rp[r] + cp[c]) % n]);
    const at = (r, c) => g[r * n + c];
    const r = rnd(0, n - 1), c = rnd(0, n - 1), blanks = [r * n + c];
    if (lv === 2) { let k; do k = rnd(0, n * n - 1); while (Math.floor(k / n) === r); blanks.push(k); }
    if (lv === 3) {
      // Satırda 2 boş, sütunda 2 boş: cevap ancak ikisine birlikte bakınca tek kalır.
      let c2; do c2 = rnd(0, n - 1); while (c2 === c);
      const w = at(r, c2), r2 = pick(ix.filter(x => x !== r && at(x, c) !== w));
      blanks.push(r * n + c2, r2 * n + c);
    }
    return { t: 'sud', n, g: g.join(''), blanks, target: r * n + c };
  },
});

// Ayna seçenekleri: m = doğru ayna, c = aynen kopya, f = ters dönmüş ayna, o = bir karesi yanlış ayna
function symCands(s) {
  const m = s.rows.map(r => [...r].reverse().join(''));
  const o = m.map((r, i) => i !== s.off[0] ? r : [...r].map((v, j) => j !== s.off[1] ? v : v === '0' ? '1' : '0').join(''));
  return s.n === 3 ? { m, c: s.rows, o } : { m, c: s.rows, f: [...m].reverse(), o };
}
function symHalf(rows, cls, ghost = -1) {
  const g = el('div', 'half ' + cls); g.style.setProperty('--cols', rows[0].length);
  rows.forEach((r, i) => { for (const v of r) g.append(el('span', `sq c${v}${i === ghost ? ' ghost' : ''}`)); });
  return g;
}

// Şekil sorularının ortak biçimi: ans (metin anahtar), opts [[değer, çizici, ad]], draw(), fill(), say/hintSay, prompt/hintText
const SB = {
  pat(s) {
    const L = s.unit.length;
    const seq = Array.from({ length: s.total }, (_, i) => s.items[s.unit.charCodeAt(i % L) - 65]);
    const ans = seq[s.hole], key = itemKey(ans);
    // Çeldiriciler: desendeki öteki parçalar, sonra "aynı şekil başka renk" ve "aynı renk başka şekil"
    const near = [...COLS.filter(c => c !== ans[1]).map(c => [ans[0], c]), ...SHAPES.filter(x => x !== ans[0]).map(x => [x, ans[1]])];
    const seen = new Set([key]), opts = [ans];
    for (const it of [...shuffle([...s.items]), ...shuffle(near)]) if (opts.length < s.n && !seen.has(itemKey(it))) { seen.add(itemKey(it)); opts.push(it); }
    const q = {
      shape: true, ans: key, say: ['bosluga'], hintSay: ['tekrar'],
      prompt: 'Boşluğa hangisi gelir?', hintText: 'Tekrar eden parçaya bak',
      opts: opts.map(it => [itemKey(it), () => shapeEl(it), itemName(it)]),
      draw(qe) {
        const row = el('div', 'pat'); let unit;
        seq.forEach((it, i) => {
          if (i % L === 0) { unit = el('div', 'unit'); row.append(unit); }
          const t = el('div', 'tile');
          if (i === s.hole) { t.classList.add('slot'); t.textContent = '?'; q.slot = t; } else t.append(shapeEl(it));
          unit.append(t);
        });
        qe.append(row);
      },
      fill() { q.slot.textContent = ''; q.slot.append(shapeEl(ans)); q.slot.classList.add('filled'); },
    };
    return q;
  },
  sym(s) {
    const c = symCands(s);
    // İpucu: aynanın sağına, ilk simetrik olmayan satırın yansıması soluk çizilir
    const ghost = Math.max(0, s.rows.findIndex(r => r !== [...r].reverse().join('')));
    const q = {
      shape: true, ans: 'm', say: ['ayna'], hintSay: ['ayna_cizgi'],
      prompt: 'Aynadaki hâli hangisi?', hintText: 'Ortadaki çizgi bir ayna',
      opts: Object.keys(c).map(k => [k, () => symHalf(c[k], 'mini'), 'Ayna seçeneği']),
      draw(qe) {
        const box = el('div', 'sym');
        q.right = symHalf(c.m, 'unknown', ghost);
        box.append(symHalf(s.rows, 'known'), el('div', 'mirror'), q.right);
        qe.append(box);
      },
      fill() { q.right.classList.add('filled'); },
    };
    return q;
  },
  odd(s) {
    const tip = { shape: ['sekline_bak', 'Şekline bak'], color: ['rengine_bak', 'Rengine bak'], size: ['boyuna_bak', 'Büyüklüğüne bak'] }[s.rule];
    return {
      // Seçenekler bulmacanın kendisi: alttaki şeritte değil, sahnede büyük kartlar olarak durur.
      shape: true, inStage: true, ans: 'k' + s.odd, say: ['farkli'], hintSay: [tip[0]],
      prompt: 'Hangisi farklı?', hintText: tip[1],
      opts: s.items.map((it, i) => ['k' + i, () => shapeEl(it), itemName(it)]),
      draw() {},
      fill() {},
    };
  },
  sud(s) {
    const n = s.n, g = [...s.g].map(Number), tr = Math.floor(s.target / n), tc = s.target % n;
    const q = {
      shape: true, ans: String(g[s.target]), say: ['bosluga'], hintSay: ['yan_alt'],
      prompt: 'Boşluğa hangisi gelir?', hintText: 'Yan yana ve alt alta bak',
      opts: SUD.slice(0, n).map((it, i) => [String(i), () => shapeEl(it), itemName(it)]),
      draw(qe) {
        const box = el('div', 'sud'); box.style.setProperty('--n', n);
        g.forEach((v, i) => {
          const r = Math.floor(i / n), c = i % n, cell = el('div', 'sc' + (r === tr || c === tc ? ' line' : ''));
          if (i === s.target) { cell.classList.add('target'); cell.textContent = '?'; q.slot = cell; }
          else if (s.blanks.includes(i)) cell.classList.add('blank');
          else cell.append(shapeEl(SUD[v]));
          box.append(cell);
        });
        qe.append(box);
      },
      fill() { q.slot.textContent = ''; q.slot.append(shapeEl(SUD[g[s.target]])); q.slot.classList.add('filled'); },
    };
    return q;
  },
};

/* ================= Ses ve konuşma ================= */
const Sound = {
  ctx: null,
  // iOS sesi yalnızca dokunma bitince açar; 'playback' sessiz modda da çalmasını sağlar.
  unlock() {
    try {
      if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback';
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state !== 'running') {
        this.ctx.resume();
        const src = this.ctx.createBufferSource();
        src.buffer = this.ctx.createBuffer(1, 1, 22050); src.connect(this.ctx.destination); src.start(0);
      }
    } catch (e) {}
  },
  tone(freq, dur, { type = 'sine', gain = .15, delay = 0, to = 0 } = {}) {
    const a = this.ctx; if (!a || !Store.d.sound) return;
    const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + .05);
  },
  play(name) {
    try {
      if (name === 'right') [523, 659, 784].forEach((f, i) => this.tone(f, .25, { type: 'triangle', delay: i * .08 }));
      else if (name === 'wrong') this.tone(260, .3, { type: 'triangle', gain: .09, to: 190 });
      else if (name === 'tap') this.tone(880, .07, { gain: .06 });
      else if (name === 'win') [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, .22, { type: 'triangle', delay: i * .11 }));
    } catch (e) {}
  },
};
// Önceden kaydedilmiş Yelda parçaları (tools/make-audio.sh). Tarayıcının sesli okumasını kullanmıyoruz:
// cihaza göre aksan değişiyor ve cümleler üst üste biniyordu. Burada tek bir kuyruk var;
// yeni bir şey söylenince öncekisi hemen susar.
const Voice = {
  buf: new Map(), playing: [], gen: 0,
  load(name) {
    if (!this.buf.has(name)) {
      this.buf.set(name, fetch(`audio/${name}.mp3`).then(r => r.arrayBuffer())
        .then(b => new Promise((ok, no) => Sound.ctx.decodeAudioData(b, ok, no)))
        .catch(() => { this.buf.delete(name); return null; }));
    }
    return this.buf.get(name);
  },
  async say(parts, delay = 0) {
    this.stop();
    if (!Store.d.sound || !Sound.ctx) return;
    const gen = this.gen;
    const bufs = await Promise.all(parts.map(p => p === 0 ? 0 : this.load(p)));
    if (gen !== this.gen) return;               // bu arada başka bir şey söylendi ya da susturuldu
    const a = Sound.ctx;
    let t = a.currentTime + .05 + delay;
    for (const b of bufs) {
      if (b === 0) { t += .18; continue; }      // kısa duraklama
      if (!b) continue;
      const src = a.createBufferSource(); src.buffer = b; src.connect(a.destination); src.start(t);
      this.playing.push(src);
      t += b.duration + .04;
    }
  },
  stop() {
    this.gen++;
    for (const s of this.playing) try { s.stop(); } catch (e) {}
    this.playing = [];
  },
};

/* ================= Ekranlar ================= */
let screen = 'home', mode = null, round = null, cur = null, busy = false, nextTimer = 0;
const lv = () => Store.d.level;
const modeOf = k => MODES.find(m => m.key === k);

function show(name) {
  screen = name;
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('active', s.id === name);
}

function renderHome() {
  $('starsTotal').textContent = Store.d.stars;
  $('soundBtn').textContent = Store.d.sound ? '🔊' : '🔇';
  for (const b of document.querySelectorAll('.level')) {
    const on = +b.dataset.level === lv();
    b.classList.toggle('on', on); b.setAttribute('aria-checked', on);
  }
  $('coinsTotal').textContent = Store.d.coins;
  const box = $('modes'); box.innerHTML = '';
  box.append(hubGroup());
  for (const [g, title] of GROUPS) {
    const sec = el('section', 'mode-group'), grid = el('div', 'mode-grid');
    sec.append(el('h2', 'group-title', title), grid);
    for (const m of MODES.filter(x => x.g === g)) {
      const b = el('button', 'mode'); b.style.setProperty('--c', m.c);
      b.append(el('span', 'ico', m.ico), el('span', 'lbl', m.label));
      const best = Store.d.best[`${m.key}-${lv()}`] || 0, st = el('span', 'best');
      for (let i = 0; i < 3; i++) st.append(el('span', i < best ? 'on' : '', '★'));
      b.append(st);
      b.onclick = () => { Sound.play('tap'); startRound(m.key); };
      grid.append(b);
    }
    box.append(sec);
  }
}

// Oyun grubu: savaş, dükkân, görevler, bahçe
function hubGroup() {
  const sec = el('section', 'mode-group'), grid = el('div', 'mode-grid');
  sec.append(el('h2', 'group-title', 'Oyun'), grid);
  const tile = (id, ico, label, c, sub, fn, dot) => {
    const b = el('button', 'mode hub'); b.id = id; b.style.setProperty('--c', c);
    b.append(el('span', 'ico', ico), el('span', 'lbl', label), el('span', 'sub', sub));
    const d = el('span', 'dot' + (dot ? ' on' : '')); if (id === 'gardenBtn') d.id = 'gardenDot';
    b.append(d);
    b.onclick = () => { Sound.play('tap'); fn(); };
    grid.append(b);
  };
  const doable = Store.d.tasks.filter(t => taskState(t) === 'open').length;
  tile('warBtn', '⚔️', 'Kartopu Savaşı', '#E5483B', `🎟️ ${Store.d.tickets}`, goWar, Store.d.tickets > 0);
  tile('shopBtn', '🛒', 'Dükkân', '#F5A524', `🪙 ${Store.d.coins}`, () => { show('shop'); renderShop(); });
  tile('tasksBtn', '📋', 'Görevlerim', '#3FA9F5', doable ? `✋ ${doable}` : '✓', () => { show('tasks'); renderTasks(); }, doable > 0);
  tile('gardenBtn', '🌻', 'Bahçem', '#34C17B', `★ ${Store.d.stars}`, () => { show('garden'); renderGarden(); }, friendsFor(Store.d.stars) > Store.d.seen);
  return sec;
}
function goWar() {
  if (Store.d.tickets > 0) { location.href = 'savas/'; return; }
  modal((c, close) => {
    c.append(el('div', 'modal-ico', '🎟️'), el('h2', '', 'Biletin bitti'), el('p', '', 'Bir matematik turu bitir, bilet kazan!'));
    const ok = el('button', 'big-btn', 'Tamam'); ok.onclick = close; c.append(ok);
  });
}

/* ----- Dükkân ----- */
function renderShop() {
  $('shopCoins').textContent = Store.d.coins;
  const g = $('shopGrid'); g.innerHTML = '';
  for (const [grp, title] of SHOP_GROUPS) {
    g.append(el('h2', 'shop-group', title));
    for (const it of SHOP.filter(x => x.g === grp)) {
      const card = el('div', 'shop-card'), have = Store.d.inv[it.key] || 0, poor = Store.d.coins < it.price;
      card.append(el('div', 'shop-ico', it.ico), el('div', 'shop-name', it.name), el('div', 'shop-info', it.info), el('div', 'shop-have', `🎒 ${have}`));
      if (grp === 'num') card.append(el('span', 'shop-badge', '🔢'));
      const buy = el('button', 'big-btn buy' + (poor ? ' poor' : ''), `🪙 ${it.price}`);
      buy.setAttribute('aria-label', `${it.name} al, ${it.price} altın`);
      buy.onclick = () => {
        if (Store.d.coins < it.price) { Sound.play('wrong'); buy.classList.remove('shake'); void buy.offsetWidth; buy.classList.add('shake'); return; }
        Store.d.coins -= it.price; Store.d.inv[it.key] = (Store.d.inv[it.key] || 0) + 1; Store.save();
        Sound.play('right'); confetti(14);
        const top = g.scrollTop; renderShop(); g.scrollTop = top;
        g.querySelector(`[data-k="${it.key}"]`).classList.add('bought');
      };
      card.dataset.k = it.key;
      card.append(buy);
      g.append(card);
    }
  }
}

/* ----- Görevler (ebeveyn ekler, çocuk "Yaptım!" der, ebeveyn onaylar) ----- */
const pad2 = n => String(n).padStart(2, '0');
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return dayKey(d); };
const weekKey = k => { const d = fromKey(k); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return dayKey(d); };   // haftanın pazartesisi
const KIND_TXT = { once: () => 'Bir kez', streak: n => `${n} gün üst üste`, weekly: n => `Haftada ${n} kez` };

// Görünen ilerleme: seri bir gün atlanınca, haftalık hedef hafta değişince sıfırlanır.
function taskCount(t, today = dayKey()) {
  if (t.kind === 'streak') return t.last === today || t.last === addDays(today, -1) ? t.count : 0;
  if (t.kind === 'weekly') return t.week === weekKey(today) ? t.count : 0;
  return t.count;
}
function taskState(t) {
  if (t.done) return 'done';
  if (t.claim) return 'pending';
  if (t.last === dayKey()) return 'today';
  return 'open';
}
function approveTask(t) {
  const day = t.claim || dayKey();
  t.claim = null;
  if (t.last !== day) {
    if (t.kind === 'streak') t.count = t.last === addDays(day, -1) ? t.count + 1 : 1;
    else if (t.kind === 'weekly') { const wk = weekKey(day); if (t.week !== wk) { t.week = wk; t.count = 0; } t.count++; }
    else t.count = 1;
    t.last = day;
    if (t.count >= t.n) {
      // Ebeveyn ödülü bilet tavanına takılmaz: bilinçli verilmiş bir ödül.
      Store.d.coins += t.coins; Store.d.tickets += t.tickets; t.wins = (t.wins || 0) + 1;
      Store.d.celebrate.push({ emoji: t.emoji, title: t.title, coins: t.coins, tickets: t.tickets });
      if (t.kind === 'once') t.done = true; else t.count = 0;
    }
  }
  Store.save();
}
function dots(t) {
  const d = el('div', 'task-dots'), c = taskCount(t);
  if (t.kind !== 'once') for (let i = 0; i < t.n; i++) d.append(el('i', i < c ? 'on' : ''));
  return d;
}
function rewardChips(t) {
  const r = el('div', 'task-reward');
  if (t.coins) r.append(el('span', 'chip', `🪙 ${t.coins}`));
  if (t.tickets) r.append(el('span', 'chip', `🎟️ ${t.tickets}`));
  return r;
}
function renderTasks() {
  $('tasksTickets').textContent = Store.d.tickets;
  const list = $('taskList'); list.innerHTML = '';
  const tasks = Store.d.tasks.filter(t => !t.done || t.last === dayKey());
  if (!tasks.length) { list.append(el('p', 'empty', 'Henüz görev yok. Annen ya da baban ⚙️ ile görev ekleyebilir.')); return; }
  for (const t of tasks) {
    const card = el('div', 'task-card'), st = taskState(t), info = el('div', 'task-info');
    info.append(el('div', 'task-title', t.title), el('div', 'task-kind', KIND_TXT[t.kind](t.n)), dots(t));
    card.append(el('div', 'task-ico', t.emoji), info, rewardChips(t));
    const btn = el('button', 'task-btn ' + st, { open: '✋ Yaptım!', pending: '⏳ Onay bekliyor', today: '✓ Bugün tamam', done: '🏆 Bitti' }[st]);
    btn.disabled = st !== 'open';
    btn.onclick = () => { t.claim = dayKey(); Store.save(); Sound.play('right'); cheer('✋'); renderTasks(); };
    card.append(btn);
    list.append(card);
  }
}
// Ebeveyn bir görevi onaylayınca çocuk ana sayfaya döndüğünde kutlama görür.
function celebrateNext() {
  const c = Store.d.celebrate.shift(); if (!c) return;
  Store.save();
  Sound.play('win'); confetti(40); Voice.say(['aferin'], .4);
  modal((box, close) => {
    box.append(el('div', 'modal-ico pop', c.emoji), el('h2', '', 'Görev tamam!'), el('p', '', c.title));
    const r = el('div', 'task-reward big');
    if (c.coins) r.append(el('span', 'chip', `+${c.coins} 🪙`));
    if (c.tickets) r.append(el('span', 'chip', `+${c.tickets} 🎟️`));
    const ok = el('button', 'big-btn', 'Yaşasın! 🎉');
    ok.onclick = () => { close(); renderHome(); setTimeout(celebrateNext, 300); };
    box.append(r, ok);
  });
}

/* ----- PIN kapısı ----- */
// Amaç çocuğun panele girmemesi; gerçek bir şifreleme değil.
const hashPin = p => { let h = 2166136261; for (const ch of 'sb:' + p) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
function keypad(title, sub, len, onSubmit) {
  modal((c, close) => {
    let val = '';
    const disp = el('div', 'pin-disp'), err = el('p', 'pin-sub', sub || '');
    const show = () => { disp.textContent = len ? '●'.repeat(val.length) + '○'.repeat(len - val.length) : (val || ' '); };
    const fail = () => { val = ''; show(); disp.classList.remove('shake'); void disp.offsetWidth; disp.classList.add('shake'); Sound.play('wrong'); };
    const submit = () => { if (val && onSubmit(val, close, fail) === false) fail(); };
    const keys = el('div', 'pin-keys');
    for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '✕', '0', len ? '⌫' : '✓']) {
      const b = el('button', 'pin-key', k);
      b.onclick = () => {
        if (k === '✕') return close();
        if (k === '⌫') val = val.slice(0, -1);
        else if (k === '✓') return submit();
        else if (!len || val.length < len) val += k;
        show();
        if (len && val.length === len) setTimeout(submit, 120);
      };
      keys.append(b);
    }
    c.append(el('h2', '', title), err, disp, keys);
    if (!len) { const bk = el('button', 'link', '⌫ sil'); bk.onclick = () => { val = val.slice(0, -1); show(); }; c.append(bk); }
    c.classList.add('pin');
    show();
    return { err };
  });
}
function setPin(then) {
  keypad('Yeni PIN', 'Ebeveyn paneli için 4 rakam seç', 4, (a, close) => {
    close();
    setTimeout(() => keypad('PIN tekrar', 'Aynı 4 rakamı bir daha gir', 4, (b, close2, fail) => {
      if (a !== b) return false;
      Store.d.pin = hashPin(a); Store.save(); close2(); then();
    }), 150);
  });
}
function parentGate(then) {
  if (!Store.d.pin) return setPin(then);
  keypad('Ebeveyn', 'PIN gir', 4, (v, close) => {
    if (hashPin(v) !== Store.d.pin) return false;
    close(); then();
  });
  const forgot = el('button', 'link', 'PIN\'i unuttum');
  forgot.onclick = () => {
    // Yetişkin sorusu: 6 yaşında bir çocuğun çözemeyeceği bir işlem
    const a = rnd(6, 9), b = rnd(6, 9), c = rnd(11, 29);
    keypad(`${a} × ${b} + ${c} = ?`, 'Yeni PIN belirlemek için cevapla', 0, (v, close) => {
      if (+v !== a * b + c) return false;
      close(); setTimeout(() => setPin(then), 150);
    });
  };
  $('modalCard').append(forgot);
}

/* ----- Ebeveyn paneli ----- */
const TEMPLATES = [
  { emoji: '🦷', title: 'Dişlerini fırçala', kind: 'streak', n: 3, coins: 5, tickets: 1 },
  { emoji: '🛏️', title: 'Saatinde yat', kind: 'weekly', n: 7, coins: 10, tickets: 1 },
  { emoji: '🌙', title: 'Bu akşam saatinde yat', kind: 'once', n: 1, coins: 2, tickets: 0 },
  { emoji: '📚', title: 'Ödevini zamanında yap', kind: 'weekly', n: 5, coins: 8, tickets: 1 },
  { emoji: '🧸', title: 'Oyuncaklarını topla', kind: 'once', n: 1, coins: 2, tickets: 0 },
];
const TASK_EMOJI = ['🦷', '🛏️', '🌙', '📚', '✏️', '🧸', '🧹', '🥦', '🚿', '👕', '🎒', '🙏', '🎹', '⚽', '🐶', '📖'];
let draft = null;
function stepper(label, val, min, max, onChange) {
  const w = el('div', 'stepper'), v = el('b', '', val);
  const btn = (t, d) => { const b = el('button', 'step-btn', t); b.onclick = () => { const n = Math.max(min, Math.min(max, +v.textContent + d)); v.textContent = n; onChange(n); }; return b; };
  w.append(el('span', '', label), btn('−', -1), v, btn('+', 1));
  return w;
}
function renderParent() {
  const body = $('parentBody'); body.innerHTML = '';
  const section = (title) => { const s = el('section', 'p-sec'); s.append(el('h2', '', title)); body.append(s); return s; };

  const pending = Store.d.tasks.filter(t => t.claim);
  if (pending.length) {
    const s = section('Onay bekleyenler');
    for (const t of pending) {
      const row = el('div', 'p-row'), when = t.claim === dayKey() ? 'bugün' : t.claim === addDays(dayKey(), -1) ? 'dün' : t.claim;
      row.append(el('span', 'p-ico', t.emoji), el('span', 'p-title', `${t.title} · ${when}`));
      const ok = el('button', 'mini-btn ok', '✓ Onayla'), no = el('button', 'mini-btn', '✕');
      ok.onclick = () => { approveTask(t); Sound.play('right'); renderParent(); };
      no.onclick = () => { t.claim = null; Store.save(); renderParent(); };
      row.append(ok, no); s.append(row);
    }
  }

  const s2 = section('Görevler');
  if (!Store.d.tasks.length) s2.append(el('p', 'p-note', 'Henüz görev yok. Aşağıdan ekleyebilirsin.'));
  for (const t of Store.d.tasks) {
    const row = el('div', 'p-row' + (t.done ? ' done' : '')), st = taskState(t);
    const prog = t.done ? '🏆 tamamlandı' : t.kind === 'once' ? 'bir kez' : `${KIND_TXT[t.kind](t.n)} · ${taskCount(t)}/${t.n}`;
    row.append(el('span', 'p-ico', t.emoji), el('span', 'p-title', `${t.title}`), el('span', 'p-meta', `${prog} · 🪙${t.coins}${t.tickets ? ' 🎟️' + t.tickets : ''}${t.wins ? ' · ' + t.wins + ' kez kazandı' : ''}`));
    const did = el('button', 'mini-btn ok', '✓ Bugün yaptı');
    did.disabled = t.done || st === 'today';
    did.onclick = () => { if (!t.claim) t.claim = dayKey(); approveTask(t); Sound.play('right'); renderParent(); };
    const del = el('button', 'mini-btn', '🗑');
    del.onclick = () => {
      if (del.dataset.sure) { Store.d.tasks.splice(Store.d.tasks.indexOf(t), 1); Store.save(); renderParent(); }
      else { del.dataset.sure = 1; del.textContent = 'Sil?'; }
    };
    row.append(did, del); s2.append(row);
  }

  const s3 = section('Yeni görev');
  if (!draft) draft = { ...TEMPLATES[0], title: '' };
  const tpl = el('div', 'p-chips');
  for (const t of TEMPLATES) {
    const b = el('button', 'chip-btn', `${t.emoji} ${t.title}${t.kind === 'once' ? '' : ' (' + KIND_TXT[t.kind](t.n) + ')'}`);
    b.onclick = () => { draft = { ...t }; renderParent(); };
    tpl.append(b);
  }
  const emo = el('div', 'p-chips');
  for (const e of TASK_EMOJI) { const b = el('button', 'emo-btn' + (draft.emoji === e ? ' on' : ''), e); b.onclick = () => { draft.emoji = e; renderParent(); }; emo.append(b); }
  const name = el('input', 'p-input'); name.placeholder = 'Görevin adı (ör. Dişlerini fırçala)'; name.value = draft.title; name.maxLength = 40;
  name.oninput = () => { draft.title = name.value; };
  const kinds = el('div', 'p-chips');
  for (const [k, txt] of [['once', 'Bir kez'], ['streak', 'Üst üste gün'], ['weekly', 'Haftada kez']]) {
    const b = el('button', 'chip-btn' + (draft.kind === k ? ' on' : ''), txt);
    b.onclick = () => { draft.kind = k; if (k === 'once') draft.n = 1; else if (draft.n < 2) draft.n = 3; renderParent(); };
    kinds.append(b);
  }
  const nums = el('div', 'p-steppers');
  if (draft.kind !== 'once') nums.append(stepper(draft.kind === 'streak' ? 'Gün' : 'Kez', draft.n, 2, 7, n => { draft.n = n; }));
  nums.append(stepper('🪙', draft.coins, 0, 30, n => { draft.coins = n; }), stepper('🎟️', draft.tickets, 0, 3, n => { draft.tickets = n; }));
  const add = el('button', 'big-btn', '+ Görevi ekle');
  add.onclick = () => {
    const title = draft.title.trim();
    if (!title) { name.focus(); name.classList.add('shake'); return; }
    Store.d.tasks.push({ id: Date.now().toString(36), emoji: draft.emoji, title, kind: draft.kind, n: draft.kind === 'once' ? 1 : draft.n,
      coins: draft.coins, tickets: draft.tickets, count: 0, last: null, week: null, claim: null, done: false, wins: 0 });
    Store.save(); draft = null; Sound.play('right'); renderParent();
  };
  s3.append(el('p', 'p-note', 'Hazır görevler:'), tpl, el('p', 'p-note', 'Ya da kendin yaz:'), emo, name, kinds, nums, add);

  const s4 = section('Hediye');
  s4.append(el('p', 'p-note', `Şu an: 🪙 ${Store.d.coins} · 🎟️ ${Store.d.tickets}`));
  const gifts = el('div', 'p-chips');
  for (const [txt, fn] of [['+1 🎟️', () => { Store.d.tickets++; }], ['+5 🪙', () => { Store.d.coins += 5; }]]) {
    const b = el('button', 'chip-btn', txt); b.onclick = () => { fn(); Store.save(); Sound.play('right'); renderParent(); }; gifts.append(b);
  }
  s4.append(gifts);

  const s5 = section('Ayarlar');
  const pin = el('button', 'chip-btn', '🔒 PIN değiştir'); pin.onclick = () => setPin(renderParent);
  const out = el('textarea', 'p-input code'); out.readOnly = true; out.hidden = true;
  const exp = el('button', 'chip-btn', '💾 Yedek kodu al');
  exp.onclick = () => {
    out.hidden = false; out.value = backupCode(); out.select();
    try { navigator.clipboard.writeText(out.value).then(() => { exp.textContent = '✓ Kopyalandı'; }); } catch (e) {}
  };
  const inp = el('textarea', 'p-input code'); inp.placeholder = 'Yedek kodunu buraya yapıştır';
  const imp = el('button', 'chip-btn', '↩︎ Yedekten yükle');
  imp.onclick = () => { if (!restoreBackup(inp.value)) { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); } };
  const row = el('div', 'p-chips'); row.append(pin, exp);
  s5.append(row, out, el('p', 'p-note', 'Yedek kodu ilerlemeyi, görevleri ve dükkân eşyalarını taşır. Safari verileri silinirse buradan geri yüklenir.'), inp, imp);
}

/* ----- Yedek ----- */
function backupCode() {
  const data = { v: 1, sb: Store.d, wob: localStorage.getItem('war-of-blocks.v1') };
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}
function restoreBackup(code) {
  try {
    const d = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if (!d || !d.sb || typeof d.sb !== 'object') return false;
    localStorage.setItem(Store.key, JSON.stringify(d.sb));
    if (d.wob) localStorage.setItem('war-of-blocks.v1', d.wob);
    location.reload();
    return true;
  } catch (e) { return false; }
}

/* ----- Modal ----- */
function modal(build) {
  const m = $('modal'), c = $('modalCard');
  c.innerHTML = ''; c.className = 'modal-card';
  const close = () => { m.hidden = true; };
  m.hidden = false;
  build(c, close);
  return close;
}

/* ----- Tur ----- */
function startRound(m) {
  clearTimeout(nextTimer); Voice.stop();
  mode = m;
  round = { i: 0, score: 0, results: [], repeats: [], recent: [], streak: 0 };
  document.documentElement.style.setProperty('--c', modeOf(m).c);
  show('play');
  next();
}

// Sıradaki soru: önce zamanı gelen tekrar, ara ara önceki oyunlarda yanlış yapılanlar, yoksa yeni soru.
function nextSpec() {
  const r = round;
  let due = r.repeats.findIndex(x => x.due <= r.i);
  // Kalan soru sayısı bekleyen tekrar kadar azaldıysa tekrarı şimdi sor ki tur bitmeden hepsi gelsin.
  if (due < 0 && r.repeats.length && ROUND - r.i <= r.repeats.length) due = 0;
  if (due >= 0) return { spec: r.repeats.splice(due, 1)[0].spec, repeat: true };
  const pool = Object.values(Store.d.missed)
    .filter(m => m.lv === lv() && (mode === 'mix' ? NUM_TYPES.includes(m.spec.t) : m.spec.t === mode) && !r.recent.includes(JSON.stringify(m.spec)));
  if (pool.length && Math.random() < .3) return { spec: pick(pool).spec, repeat: true };
  for (let k = 0; k < 30; k++) {
    const s = GEN[mode](lv());
    if (!r.recent.includes(JSON.stringify(s))) return { spec: s };
  }
  return { spec: GEN[mode](lv()) };
}

function next() {
  if (round.i >= ROUND) return finish();
  const { spec, repeat } = nextSpec();
  cur = { spec, q: build(spec), id: JSON.stringify(spec), tries: 0, repeat, em: pick(EMOJI), hint: LEVELS[lv()].always };
  round.recent = [cur.id, ...round.recent].slice(0, 5);
  busy = false;
  render();
  // Soru kendiliğinden okunmaz; çocuk 🔈'e dokununca okunur.
}

function render() {
  const pr = $('progress'); pr.innerHTML = '';
  for (let i = 0; i < ROUND; i++) pr.append(el('i', round.results[i] || (i === round.i ? 'cur' : '')));

  const q = cur.q, qe = $('question'); qe.innerHTML = '';
  if (q.shape) {
    qe.className = `question shapes ${cur.spec.t}`;
    q.draw(qe);
  } else {
    qe.className = 'question';
    q.tokens.forEach((t, i) => {
      if (q.seq && i > 0) qe.append(el('span', 'step', (cur.spec.step > 0 ? '+' : '−') + Math.abs(cur.spec.step)));
      if (t === null) { cur.holeEl = el('span', 'hole', '?'); qe.append(cur.holeEl); }
      else if (typeof t === 'number') qe.append(el('span', q.seq ? 'box' : 'num', t));
      else qe.append(el('span', 'op', t));
    });
  }

  renderVisual();

  $('answers').innerHTML = '';
  $('answers').className = 'answers' + (q.inStage ? ' hidden' : '');
  const ans = q.inStage ? el('div', 'stage-answers') : $('answers');
  if (q.inStage) qe.append(ans);
  // Sayı sorularında seçenekler metin; şekil sorularında her seçeneğin kendi çizimi var.
  const opts = q.opts ? shuffle([...q.opts]) : options(cur.spec, q, LEVELS[lv()].options).map(v => [v, null, String(v)]);
  for (const [v, draw, name] of opts) {
    const b = el('button', 'answer', draw ? undefined : v);
    if (draw) b.append(draw());
    b.dataset.v = String(v); b.setAttribute('aria-label', name);
    b.onclick = () => choose(b, v);
    ans.append(b);
  }
}

function renderPrompt() {
  const p = $('prompt'), q = cur.q; p.innerHTML = '';
  if (!q.prompt) return;
  p.append(el('span', '', q.prompt));
  if (cur.hint && q.hintText) p.append(el('span', 'hint-chip', '💡 ' + q.hintText));
}

function renderVisual() {
  const v = $('visual'); v.innerHTML = '';
  const seq = cur.q.seq;
  $('hintBtn').disabled = cur.hint;
  renderPrompt();
  if (cur.q.shape) { v.classList.add('hidden'); $('question').classList.toggle('show-hint', cur.hint); return; }
  v.classList.toggle('hidden', !cur.hint || seq);
  if (seq) { $('question').classList.toggle('show-steps', cur.hint); return; }
  const sg = segs(cur.spec, cur.q);
  if (LEVELS[lv()].visual === 'frames') {
    const cells = sg.flatMap(([k, n]) => Array(n).fill(k)), fr = el('div', 'frames');
    for (let f = 0; f < Math.max(1, Math.ceil(cells.length / 10)); f++) {
      const box = el('div', 'frame');
      for (let i = 0; i < 10; i++) box.append(el('span', 'cell ' + (cells[f * 10 + i] || '')));
      fr.append(box);
    }
    v.append(fr);
    return;
  }
  const group = parts => {
    const g = el('div', 'group');
    for (const [k, n] of parts) for (let i = 0; i < n; i++) {
      const it = el('span', 'item' + (k === 'x' ? ' gone' : k === 'q' ? ' empty' : ''));
      if (k !== 'q') it.textContent = cur.em;
      g.append(it);
    }
    return g;
  };
  if (cur.spec.t === 'add') v.append(group([sg[0]]), el('span', 'vop', '+'), group([sg[1]]));
  else { const g = group(sg); g.classList.add('wide'); v.append(g); }
}

function showHint() {
  if (cur.hint) return;
  cur.hint = true;
  renderVisual();
}

function fillHole() {
  if (cur.q.fill) return cur.q.fill();
  cur.holeEl.textContent = cur.q.ans;
  cur.holeEl.classList.add('filled');
}

function choose(btn, v) {
  if (busy || btn.disabled) return;
  if (String(v) === String(cur.q.ans)) {
    busy = true;
    const first = cur.tries === 0;
    btn.classList.add('right'); fillHole();
    for (const b of document.querySelectorAll('#play .answer')) b.disabled = true;
    if (first) round.score++;
    if (first && cur.repeat) relieve(cur);
    round.results[round.i] = first ? 'ok' : 'miss';
    Sound.play('right');
    const [word, clip] = first ? pick(PRAISE) : PRAISE[0];
    round.streak = first ? round.streak + 1 : 0;
    // Üst üste 3, 6, 9 ilk denemede doğru: daha büyük kutlama
    if (round.streak >= 3 && round.streak % 3 === 0) { cheer('🔥 ' + round.streak); confetti(40); }
    else { cheer(word); confetti(); }
    Voice.say([clip], .3);   // önce zil, ardından övgü
    round.i++;
    nextTimer = setTimeout(next, 1400);
    return;
  }
  cur.tries++;
  round.streak = 0;
  btn.classList.add('wrong'); btn.disabled = true;
  Sound.play('wrong');
  if (cur.tries === 1) {
    remember(cur);
    if (!round.repeats.some(r => r.id === cur.id)) round.repeats.push({ spec: cur.spec, id: cur.id, due: round.i + REPEAT_GAP });
    showHint();
  } else {
    // İkinci yanlışta doğru cevabı göster; çocuk kendisi dokunsun.
    for (const b of document.querySelectorAll('#play .answer')) if (b.dataset.v === String(cur.q.ans)) b.classList.add('reveal'); else b.disabled = true;
  }
}

// Kalıcı tekrar listesi: yanlış yapılan soru ileriki oyunlarda ara ara yeniden sorulur;
// ilk denemede doğru bilindikçe listeden düşer.
function remember(c) {
  const k = lv() + ':' + c.id, m = Store.d.missed;
  // n=2: tur içindeki tekrar bir puan düşürür, soru sonraki bir oyunda da bir kez daha gelir.
  m[k] = { lv: lv(), spec: c.spec, n: Math.min(3, ((m[k] && m[k].n) || 0) + 2) };
  const keys = Object.keys(m);
  if (keys.length > 60) delete m[keys[0]];
  Store.save();
}
function relieve(c) {
  const k = lv() + ':' + c.id, m = Store.d.missed[k];
  if (!m) return;
  if (--m.n <= 0) delete Store.d.missed[k];
  Store.save();
}

function finish() {
  const s = round.score, stars = s >= 9 ? 3 : s >= 7 ? 2 : 1;
  const key = `${mode}-${lv()}`;
  const prevBest = Store.d.best[key] || 0;
  const before = friendsFor(Store.d.stars);
  Store.d.stars += stars;
  const after = friendsFor(Store.d.stars), nw = $('endNew');
  nw.hidden = after <= before; nw.innerHTML = '';
  if (after > before) nw.append(el('b', '', FRIENDS[after - 1]), el('span', '', 'Bahçene yeni arkadaş!'));
  Store.d.best[key] = Math.max(Store.d.best[key] || 0, stars);
  Store.save();
  const es = $('endStars'); es.innerHTML = '';
  for (let i = 0; i < 3; i++) { const st = el('span', i < stars ? 'on' : '', '★'); st.style.animationDelay = (i * .25) + 's'; es.append(st); }
  const [title, clip] = stars === 3 ? ['Mükemmel!', 'mukemmel'] : stars === 2 ? ['Çok iyi!', 'cok_iyi'] : ['Güzel çalıştın!', 'guzel_calistin'];
  $('endTitle').textContent = title;
  $('endText').textContent = `${ROUND} sorudan ${s} tanesini ilk seferde bildin.`;
  // Altın: yıldız kadar, Zor seviyede +1, yeni rekorda +1. Bilet: tur başına 1, en fazla TICKET_MAX.
  const coins = stars + (lv() === 3 ? 1 : 0) + (stars > prevBest ? 1 : 0);
  const ticket = Store.d.tickets < TICKET_MAX;
  Store.d.coins += coins; if (ticket) Store.d.tickets++;
  Store.save();
  const loot = $('endLoot'); loot.innerHTML = '';
  loot.append(el('span', 'chip', `+${coins} 🪙`), el('span', 'chip', ticket ? '+1 🎟️' : `🎟️ ${TICKET_MAX}/${TICKET_MAX}`));
  show('end');
  Sound.play('win'); confetti(40);
  Voice.say(after > before ? [clip, 0, 0, 'yeni_arkadas'] : [clip], .9);
}

/* ----- Bahçe ----- */
function renderGarden() {
  const stars = Store.d.stars, open = friendsFor(stars), fresh = Store.d.seen;
  $('gardenStars').textContent = stars;
  const g = $('gardenGrid'); g.innerHTML = '';
  // Uçanlar gökyüzüne, ötekiler çimene; yerleri her açılışta aynı kalsın diye sabit bir sırayla dağıtılır.
  let sky = 0, ground = 0;
  FRIENDS.slice(0, open).forEach((f, i) => {
    const fly = FLIERS.includes(f), k = fly ? sky++ : ground++;
    const [x, y] = fly ? SKY_SLOTS[k % SKY_SLOTS.length] : GROUND_SLOTS[k % GROUND_SLOTS.length];
    const b = el('button', 'friend' + (fly ? ' fly' : '') + (BIG.includes(f) ? ' big' : '') + (i >= fresh ? ' fresh' : ''), f);
    b.style.left = x + '%'; b.style.top = y + '%'; b.style.zIndex = Math.round(y);
    b.style.animationDelay = (-(i % 5) * .7) + 's';
    b.setAttribute('aria-label', 'Arkadaş');
    b.onclick = () => { Sound.play('tap'); b.classList.remove('wiggle', 'fresh'); void b.offsetWidth; b.classList.add('wiggle'); };
    g.append(b);
  });
  const nx = $('gardenNext'); nx.innerHTML = '';
  if (open >= FRIENDS.length) nx.append(el('span', '', 'Hepsi senin! 🎉'));
  else {
    const have = stars % STARS_PER_FRIEND, bar = el('span', 'bar'), fill = el('i'), next = el('span', 'shadow', FRIENDS[open]);
    fill.style.width = (have / STARS_PER_FRIEND * 100) + '%'; bar.append(fill);
    nx.append(el('span', 'star', '★'), bar, el('span', '', `${have}/${STARS_PER_FRIEND}`), next);   // sıradaki arkadaşın gölgesi
  }
  Store.d.seen = open; Store.save();
}

/* ----- Efektler ----- */
function cheer(word) {
  const c = $('cheer'); c.textContent = word;
  c.classList.remove('show'); void c.offsetWidth; c.classList.add('show');
}
function confetti(n = 18) {
  const box = $('confetti'), cols = ['#FFC93C', '#34C17B', '#3FA9F5', '#FF6FA8', '#FF9F43', '#8E7CF0'];
  for (let i = 0; i < n; i++) {
    const p = el('i');
    p.style.left = '50%'; p.style.top = '40%'; p.style.background = cols[i % cols.length];
    p.style.setProperty('--dx', rnd(-45, 45) + 'vw'); p.style.setProperty('--dy', rnd(-40, 50) + 'vh'); p.style.setProperty('--r', rnd(-540, 540) + 'deg');
    box.append(p); setTimeout(() => p.remove(), 1200);
  }
}

/* ================= Olaylar ================= */
for (const b of document.querySelectorAll('.level')) b.onclick = () => { Sound.play('tap'); Store.d.level = +b.dataset.level; Store.save(); renderHome(); };
$('soundBtn').onclick = () => { Store.d.sound = !Store.d.sound; Store.save(); if (!Store.d.sound) Voice.stop(); renderHome(); };
const goHome = () => { clearTimeout(nextTimer); Voice.stop(); show('home'); renderHome(); setTimeout(celebrateNext, 400); };
$('homeBtn').onclick = goHome;
$('gardenHomeBtn').onclick = goHome;
for (const b of document.querySelectorAll('.back')) b.onclick = goHome;
$('parentBtn').onclick = () => { Sound.play('tap'); parentGate(() => { draft = null; show('parent'); renderParent(); }); };
$('endHomeBtn').onclick = goHome;
$('againBtn').onclick = () => startRound(mode);
// 🔈: soruyu okur; şekil sorularında ipucu açıksa ipucunu da ekler.
$('speakBtn').onclick = () => cur && Voice.say(cur.hint && cur.q.hintSay ? [...cur.q.say, 0, 0, ...cur.q.hintSay] : cur.q.say);
$('ver').textContent = 'v' + VERSION;
$('hintBtn').onclick = () => { if (cur) { Sound.play('tap'); showHint(); } };
['touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, () => Sound.unlock(), { passive: true }));
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('visibilitychange', () => { if (document.hidden) Voice.stop(); });

// 🪙 emojisi iOS'ta gri, gümüş bir para gibi görünür; çocuğun gördüğü her yerde sarı bir altına çevrilir.
function goldify(node) {
  if (!node) return;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT), hits = [];
  while (walker.nextNode()) if (walker.currentNode.nodeValue.includes('🪙')) hits.push(walker.currentNode);
  for (const t of hits) {
    if (t.parentNode && t.parentNode.closest('textarea, option')) continue;
    const frag = document.createDocumentFragment();
    t.nodeValue.split('🪙').forEach((part, i) => { if (i) frag.append(el('i', 'coin')); if (part) frag.append(part); });
    t.replaceWith(frag);
  }
}
new MutationObserver(ms => {
  for (const m of ms) for (const n of m.addedNodes) {
    if (n.nodeType === 1) goldify(n);
    else if (n.nodeType === 3 && n.nodeValue.includes('🪙')) goldify(n.parentNode);
  }
}).observe(document.body, { childList: true, subtree: true });
goldify(document.body);

renderHome();
setTimeout(celebrateNext, 600);

// Test ve hata ayıklama için küçük bir kapı (oyunu etkilemez)
window.__mg = { get screen() { return screen; }, get cur() { return cur; }, get round() { return round; }, startRound, GEN, build, options, Store, approveTask, taskCount, taskState, dayKey, addDays, backupCode, restoreBackup, hashPin };
})();
