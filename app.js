/* Sayı Bahçesi — 6 yaş için toplama, çıkarma, sayı dizisi ve boşluk doldurma.
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
const MODES = [
  { key: 'add', label: 'Toplama', ico: '2+3', c: '#34C17B' },
  { key: 'sub', label: 'Çıkarma', ico: '5−2', c: '#FF9F43' },
  { key: 'seq', label: 'Sayı Dizisi', ico: '1 2 ?', c: '#8E7CF0' },
  { key: 'blank', label: 'Boşluk Doldur', ico: '3+?=5', c: '#3FA9F5' },
  { key: 'mix', label: 'Karışık', ico: '🎲', c: '#FF6FA8' },
];
const EMOJI = ['🍎', '🐟', '⭐', '🍓', '🐞', '🎈', '🧁', '🐥', '🌸', '🍪', '🦋', '🚗'];
const PRAISE = ['Aferin!', 'Harika!', 'Süpersin!', 'Çok güzel!', 'Bravo!'];

/* ================= Kayıt ================= */
const Store = {
  key: 'sayi-bahcesi.v1',
  d: { level: 1, stars: 0, best: {}, missed: {}, sound: true },
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

function build(s) {
  if (s.t === 'add') return { ans: s.a + s.b, tokens: [s.a, '+', s.b, '=', null], say: `${s.a} artı ${s.b} kaç eder?` };
  if (s.t === 'sub') return { ans: s.a - s.b, tokens: [s.a, '−', s.b, '=', null], say: `${s.a} eksi ${s.b} kaç eder?` };
  if (s.t === 'blank') {
    const plus = s.op === '+', c = plus ? s.a + s.b : s.a - s.b, sym = plus ? '+' : '−', w = plus ? 'artı' : 'eksi';
    return {
      ans: s[s.hole], c,
      tokens: s.hole === 'a' ? [null, sym, s.b, '=', c] : [s.a, sym, null, '=', c],
      say: s.hole === 'a' ? `Kaç ${w} ${s.b}, ${c} eder?` : `${s.a} ${w} kaç, ${c} eder?`,
    };
  }
  const nums = Array.from({ length: s.len }, (_, i) => s.start + i * s.step);
  return {
    ans: nums[s.hole], seq: true, tokens: nums.map((n, i) => i === s.hole ? null : n),
    say: 'Boş kutuya hangi sayı gelir? ' + nums.map((n, i) => i === s.hole ? 'boş' : n).join(', '),
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
const Voice = {
  v: null,
  init() {
    if (!('speechSynthesis' in window)) return;
    const choose = () => { const vs = speechSynthesis.getVoices(); this.v = vs.find(v => v.lang === 'tr-TR') || vs.find(v => /^tr/i.test(v.lang)) || null; };
    choose(); speechSynthesis.onvoiceschanged = choose;
  },
  say(text) {
    if (!Store.d.sound || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'tr-TR'; if (this.v) u.voice = this.v; u.rate = .9; u.pitch = 1.1;
      speechSynthesis.speak(u);
    } catch (e) {}
  },
  stop() { try { speechSynthesis.cancel(); } catch (e) {} },
};
Voice.init();

/* ================= Ekranlar ================= */
let screen = 'home', mode = null, round = null, cur = null, busy = false;
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
  const box = $('modes'); box.innerHTML = '';
  for (const m of MODES) {
    const b = el('button', 'mode'); b.style.setProperty('--c', m.c);
    b.append(el('span', 'ico', m.ico), el('span', 'lbl', m.label));
    const best = Store.d.best[`${m.key}-${lv()}`] || 0, st = el('span', 'best');
    for (let i = 0; i < 3; i++) st.append(el('span', i < best ? 'on' : '', '★'));
    b.append(st);
    b.onclick = () => { Sound.play('tap'); startRound(m.key); };
    box.append(b);
  }
}

/* ----- Tur ----- */
function startRound(m) {
  mode = m;
  round = { i: 0, score: 0, results: [], repeats: [], recent: [] };
  document.documentElement.style.setProperty('--c', modeOf(m).c);
  show('play');
  next();
}

// Sıradaki soru: önce zamanı gelen tekrar, ara ara önceki oyunlarda yanlış yapılanlar, yoksa yeni soru.
function nextSpec() {
  const r = round;
  const due = r.repeats.findIndex(x => x.due <= r.i);
  if (due >= 0) return { spec: r.repeats.splice(due, 1)[0].spec, repeat: true };
  const pool = Object.values(Store.d.missed)
    .filter(m => m.lv === lv() && (mode === 'mix' || m.spec.t === mode) && !r.recent.includes(JSON.stringify(m.spec)));
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
  Voice.say(cur.q.say);
}

function render() {
  const pr = $('progress'); pr.innerHTML = '';
  for (let i = 0; i < ROUND; i++) pr.append(el('i', round.results[i] || (i === round.i ? 'cur' : '')));

  const qe = $('question'); qe.innerHTML = '';
  qe.className = 'question' + (cur.q.seq && cur.hint ? ' show-steps' : '');
  cur.q.tokens.forEach((t, i) => {
    if (cur.q.seq && i > 0) qe.append(el('span', 'step', (cur.spec.step > 0 ? '+' : '−') + Math.abs(cur.spec.step)));
    if (t === null) { cur.holeEl = el('span', 'hole', '?'); qe.append(cur.holeEl); }
    else if (typeof t === 'number') qe.append(el('span', cur.q.seq ? 'box' : 'num', t));
    else qe.append(el('span', 'op', t));
  });

  renderVisual();

  const ans = $('answers'); ans.innerHTML = '';
  for (const v of options(cur.spec, cur.q, LEVELS[lv()].options)) {
    const b = el('button', 'answer', v);
    b.dataset.v = v; b.setAttribute('aria-label', String(v));
    b.onclick = () => choose(b, v);
    ans.append(b);
  }
}

function renderVisual() {
  const v = $('visual'); v.innerHTML = '';
  const seq = cur.q.seq;
  v.classList.toggle('hidden', !cur.hint || seq);
  $('hintBtn').disabled = cur.hint;
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
  cur.holeEl.textContent = cur.q.ans;
  cur.holeEl.classList.add('filled');
}

function choose(btn, v) {
  if (busy || btn.disabled) return;
  if (v === cur.q.ans) {
    busy = true;
    const first = cur.tries === 0;
    btn.classList.add('right'); fillHole();
    for (const b of $('answers').children) b.disabled = true;
    if (first) round.score++;
    if (first && cur.repeat) relieve(cur);
    round.results[round.i] = first ? 'ok' : 'miss';
    Sound.play('right');
    const word = first ? pick(PRAISE) : 'Aferin!';
    cheer(word); confetti(); Voice.say(word);
    round.i++;
    setTimeout(next, 1400);
    return;
  }
  cur.tries++;
  btn.classList.add('wrong'); btn.disabled = true;
  Sound.play('wrong');
  if (cur.tries === 1) {
    remember(cur);
    if (!round.repeats.some(r => r.id === cur.id)) round.repeats.push({ spec: cur.spec, id: cur.id, due: Math.min(round.i + REPEAT_GAP, ROUND - 1) });
    showHint();
    Voice.say('Bir daha dene. ' + cur.q.say);
  } else {
    // İkinci yanlışta doğru cevabı göster; çocuk kendisi dokunsun.
    for (const b of $('answers').children) if (+b.dataset.v === cur.q.ans) b.classList.add('reveal'); else b.disabled = true;
    Voice.say(`Doğru cevap ${cur.q.ans}. Hadi sen dokun!`);
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
  Store.d.stars += stars;
  Store.d.best[key] = Math.max(Store.d.best[key] || 0, stars);
  Store.save();
  const es = $('endStars'); es.innerHTML = '';
  for (let i = 0; i < 3; i++) { const st = el('span', i < stars ? 'on' : '', '★'); st.style.animationDelay = (i * .25) + 's'; es.append(st); }
  const title = stars === 3 ? 'Mükemmel!' : stars === 2 ? 'Çok iyi!' : 'Güzel çalıştın!';
  $('endTitle').textContent = title;
  $('endText').textContent = `${ROUND} sorudan ${s} tanesini ilk seferde bildin.`;
  show('end');
  Sound.play('win'); confetti(40);
  Voice.say(title);
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
$('homeBtn').onclick = () => { Voice.stop(); show('home'); renderHome(); };
$('endHomeBtn').onclick = () => { Voice.stop(); show('home'); renderHome(); };
$('againBtn').onclick = () => startRound(mode);
$('speakBtn').onclick = () => cur && Voice.say(cur.q.say);
$('hintBtn').onclick = () => { if (cur) { Sound.play('tap'); showHint(); } };
['touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, () => Sound.unlock(), { passive: true }));
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('visibilitychange', () => { if (document.hidden) Voice.stop(); });

renderHome();

// Test ve hata ayıklama için küçük bir kapı (oyunu etkilemez)
window.__mg = { get screen() { return screen; }, get cur() { return cur; }, get round() { return round; }, startRound, GEN, build, options, Store };
})();
