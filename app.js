/* Sayı Bahçesi — 6 yaş için toplama, çıkarma, sayı dizisi, boşluk doldurma ve şekil oyunları
   (örüntü, ayna/simetri, farklı olan, şekil sudoku).
   Pedagoji: somut → resimli → soyut (Kolay'da nesneler hep görünür, Orta'da ipucuyla,
   Zor'da 10'luk çerçeve), süre baskısı yok, yanlışta ceza yok, yanlış sorular aralıklı tekrar. */
'use strict';
(() => {

const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const rand = (a, b) => a + Math.random() * (b - a);
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
const VERSION = 29;         // sw.js içindeki CACHE ile aynı tut (sayi-bahcesi-v29)
const MODES = [
  { key: 'add', g: 'num', label: 'Toplama', ico: '2+3', c: '#34C17B' },
  { key: 'sub', g: 'num', label: 'Çıkarma', ico: '5−2', c: '#FF9F43' },
  { key: 'seq', g: 'num', label: 'Sayı Dizisi', ico: '1 2 ?', c: '#8E7CF0' },
  { key: 'blank', g: 'num', label: 'Boşluk Doldur', ico: '3+?=5', c: '#3FA9F5' },
  { key: 'hear', g: 'num', label: 'Sayıyı Dinle', ico: '🔊', c: '#E8A317' },
  { key: 'mix', g: 'num', label: 'Karışık', ico: '🎲', c: '#FF6FA8' },
  { key: 'pat', g: 'shape', label: 'Örüntü', ico: '🔺🔵🔺', c: '#14B8A6' },
  { key: 'sym', g: 'shape', label: 'Ayna', ico: '🦋', c: '#E05FC4' },
  { key: 'odd', g: 'shape', label: 'Farklı Olan', ico: '🔍', c: '#F08C1A' },
  { key: 'sud', g: 'shape', label: 'Şekil Sudoku', ico: '🧩', c: '#5B7FEF' },
  { key: 'mat', g: 'shape', label: 'Matris', ico: '▦', c: '#0EA5A4' },
  { key: 'part', g: 'shape', label: 'Parça Bütün', ico: '◪', c: '#C2410C' },
  { key: 'view', g: 'shape', label: 'Gölge ve Bakış', ico: '👁️', c: '#475569' },
  { key: 'refl', g: 'shape', label: 'Yansıma', ico: '🪞', c: '#7C3AED' },
  { key: 'anal', g: 'shape', label: 'İlişki', ico: 'A→B', c: '#DB2777' },
  { key: 'enw', g: 'en', label: 'Kelimeler', ico: '🍎🐶', c: '#E5483B' },
  { key: 'enc', g: 'en', label: 'Renkler', ico: '🎨', c: '#8E7CF0' },
  { key: 'enn', g: 'en', label: 'Sayılar', ico: '1 2 3', c: '#3FA9F5' },
  { key: 'enf', g: 'en', label: 'Dinle ve Bul', ico: '👂', c: '#14B8A6' },
];
const GROUPS = [['num', 'Sayılar'], ['shape', 'Şekiller'], ['en', 'İngilizce']];
const NUM_TYPES = ['add', 'sub', 'seq', 'blank'];
// Bahçe: her STARS_PER_FRIEND yıldızda bir yeni arkadaş gelir; ilki baştan açık.
const FRIENDS = ['🌱', '🌷', '🌼', '🐞', '🌻', '🐝', '🍄', '🦋', '🌳', '🐌', '🐦', '🌸', '🐇', '🍓', '🦔',
  '🐢', '🌈', '🐿️', '🐸', '🌺', '🦊', '🐥', '🦉', '🍎', '🐑', '🦄', '🌵', '🐠', '🎈', '🏡'];
const STARS_PER_FRIEND = 3;
// Ekonomi: yıldız bahçe için birikir (hiç harcanmaz). Altın dükkânda harcanır.
// Her matematik turu bir maç bileti verir; bilet en fazla TICKET_MAX birikir ki matematik → oyun döngüsü korunsun.
const TICKET_MAX = 3;
// Savaş eşyaları (anahtarlar savas/game.js içindeki ITEMS ile aynı). num: sayı seçerek kullanılır.
const SHOP_GROUPS = [['throw', 'Atılanlar'], ['num', 'Sayılı'], ['def', 'Destek'], ['race', 'Yarış eşyaları']];
const SHOP = [
  { key: 'balloon', dmg: "37", desc: "Patlayınca her yer su olur. Çarptığı yerde büyük bir çukur açar, rakibi ıslatır.", how: "Çantadan seç, parmağını geri çek, bırak.", tip: "Rüzgârdan çok etkilenir: rüzgâr okuna bak!", g: 'throw', ico: '💦', name: 'Su Balonu', info: 'Büyük patlar', price: 1 },
  { key: 'fish', dmg: "37", desc: "Çok hafif uçar, neredeyse dümdüz gider. Uzaktaki rakibe yetişir.", how: "Çantadan seç, geri çek, bırak.", tip: "Rüzgâr onu pek itemez.", g: 'throw', ico: '🐟', name: 'Balık', info: 'Dümdüz uçar', price: 3 },
  { key: 'bigball', dmg: "52", desc: "Kocaman ve ağır bir kartopu. Kısa gider ama büyük bir çukur açar, rakibin başı döner.", how: "Çantadan seç, güçlü çek, bırak.", tip: "Ağır olduğu için yakındaki rakibe at.", g: 'throw', ico: '⚪', name: 'Dev Kartopu', info: 'Ağır, kocaman çukur', price: 6 },
  { key: 'melon', dmg: "49", desc: "Çarpınca dört dilime ayrılır, her dilim ayrıca patlar.", how: "Çantadan seç, geri çek, bırak.", tip: "Rakibin tam üstüne düşerse dilimler etrafa saçılır.", g: 'throw', ico: '🍉', name: 'Karpuz', info: 'Dört dilime ayrılır', price: 6 },
  { key: 'firework', dmg: "6 yıldız × 10", desc: "Havada en yükseğe çıkınca PATT! diye renk renk patlar, altı yıldız aşağı yağar.", how: "Çantadan seç, geri çek, bırak.", tip: "Rakibin tam üstünde patlaması için yukarı doğru at.", g: 'throw', ico: '🧨', name: 'Havai Fişek', info: 'Gökte patlar, yıldız yağar', price: 5 },
  { key: 'volcano', dmg: "5 taş × 12", desc: "Düştüğü yerde küçük bir yanardağ çıkar. Gürler, sonra etrafa beş lav taşı fışkırtır.", how: "Çantadan seç, geri çek, bırak.", tip: "Rakibin yakınına düşür, taşlar her yöne uçar.", g: 'throw', ico: '🌋', name: 'Yanardağ', info: 'Lav taşları fışkırtır', price: 6 },
  { key: 'boomerang', dmg: "32", desc: "Uçar uçar, sonra geri döner. Arkadaki rakibi bile vurabilir.", how: "Çantadan seç, geri çek, bırak.", tip: "Rüzgâr onu çok iter.", g: 'throw', ico: '🪃', name: 'Bumerang', info: 'Geri döner', price: 3 },
  { key: 'tickle', dmg: "7", desc: "Çok az acıtır ama çok güldürür. Rakip gülmekten kayar.", how: "Çantadan seç, geri çek, bırak.", tip: "Uçurumun kenarındaki rakibi suya kaydırabilir!", g: 'throw', ico: '🪶', name: 'Gıdıklama Tüyü', info: 'Hihi! Rakibi kaydırır', price: 1 },
  { key: 'pepper', dmg: "20", desc: "Rakip biberin tozunu yutar, önce \"ha... ha...\" der, sonra HAPŞU! diye geriye uçar.", how: "Çantadan seç, geri çek, bırak.", tip: "Suya yakın rakibe at.", g: 'throw', ico: '🌶️', name: 'Hapşırık Biberi', info: 'Rakibi uçurur', price: 3 },
  { key: 'clock', dmg: "31", desc: "Çalar saati sen kurarsın: kaç saniye sonra çalacağını seçersin. Seker, yuvarlanır, zamanı gelince çalar.", how: "Çantadan seç, ⏰ ile saniyeyi ayarla, geri çek, bırak.", tip: "Rakibin yanına yuvarlanması için az güçle at.", g: 'num', ico: '⏰', name: 'Çalar Saat', info: 'Kaç saniye sonra?', price: 3 },
  { key: 'frog', dmg: "25", desc: "Kurbağa rakibe doğru zıplar. Kaç kere zıplayacağını sen seçersin; her zıplama cetvelde bir sayı.", how: "Çantadan seç, sayıyı ayarla, TAMAM.", tip: "Cetvelde senin sayından kedinin sayısına kaç tane var, say!", g: 'num', ico: '🐸', name: 'Zıp Zıp Kurbağa', info: 'Kaç kere zıplasın?', price: 3 },
  { key: 'chicken', dmg: "25", desc: "Tavuk rakibe doğru koşar. Kaç adım koşacağını sen seçersin; her adım cetvelde bir sayı.", how: "Çantadan seç, sayıyı ayarla, TAMAM.", tip: "Yüksek duvar görürse orada patlar.", g: 'num', ico: '🐔', name: 'Koşan Tavuk', info: 'Kaç adım koşsun?', price: 3 },
  { key: 'bugs', dmg: "3 × 16", desc: "Uçak, seçtiğin sayının üstünden uğur böcekleri bırakır. Rüzgâr böcekleri iter!", how: "Çantadan seç, cetvelden sayıyı seç, TAMAM.", tip: "Rüzgâr +2 ise böcekler 2 sağa kayar. Kedi 9’daysa 7’yi seç!", g: 'num', ico: '🐞', name: 'Böcek Uçağı', info: 'Sayıyı seç, rüzgârı ekle', price: 5 },
  { key: 'meteor', dmg: "5 × 24", desc: "Gökten taşlar yağar. İki sayı seçersin, aradaki her sayıya bir taş düşer.", how: "Çantadan seç, iki sayıyı ayarla, TAMAM.", tip: "En fazla 5 sayılık bir aralık seçebilirsin.", g: 'num', ico: '☄️', name: 'Meteor Yağmuru', info: 'Bu sayıdan şu sayıya', price: 7 },
  { key: 'dragon', dmg: "30", desc: "Ejderha uçarak gelir, seçtiğin sayının yanında durur ve ateş püskürür. Rüzgâr ona işlemez.", how: "Çantadan seç, cetvelden sayıyı seç, TAMAM.", tip: "Kedinin altındaki sayıyı seç, ateş tam ona gider.", g: 'num', ico: '🐉', name: 'Ejderha', info: 'Ateş püskürür', price: 7 },
  { key: 'teleport', desc: "Pıt! diye seçtiğin sayıya ışınlanırsın.", how: "Çantadan seç, cetvelden sayıyı seç, TAMAM.", tip: "Suyun üstüne ışınlanamazsın.", g: 'num', ico: '✨', name: 'Işınlanma', info: 'Bir sayıya ışınlan', price: 4 },
  { key: 'flyballoon', desc: "Balon seni havaya kaldırır ve seçtiğin sayıya götürür. Ama rüzgâr seni biraz daha iter!", how: "Çantadan seç, sayıyı seç, TAMAM.", tip: "Rüzgâr −1 ise 1 sola inersin. Hesapla!", g: 'num', ico: '🎈', name: 'Uçan Balon', info: 'Rüzgârla uç', price: 3 },
  { key: 'wall', desc: "Önüne kardan bir duvar örer. Kaç blok yüksek olacağını sen seçersin.", how: "Çantadan seç, sayıyı ayarla, TAMAM.", tip: "Duvarın arkasına saklan, kartoplar çarpsın.", g: 'num', ico: '🧱', name: 'Kardan Duvar', info: 'Kaç blok yüksek?', price: 2 },
  { key: 'bridge', desc: "Önüne tahtadan bir köprü kurar. Kaç blok uzun olacağını sen seçersin.", how: "Çantadan seç, sayıyı ayarla, TAMAM.", tip: "Suyun üstünden geçmek için köprü kur, sonra yürü.", g: 'num', ico: '🌉', name: 'Sayı Köprüsü', info: 'Kaç blok uzun?', price: 2 },
  { key: 'umbrella', dmg: "isabeti yutar", desc: "Bir tur boyunca seni korur. İlk isabet şemsiyeye çarpar.", how: "Çantadan seç, KULLAN.", tip: "Gücün azaldıysa kullan.", g: 'def', ico: '☂️', name: 'Şemsiye', info: 'Bir tur kalkan', price: 3 },
  { key: 'chute', dmg: "su hasarı yok", desc: "Suya düşersen açılır ve seni karaya süzülerek indirir, hiç güç kaybetmezsin. Yüksekten düşerken de açılır.", how: "Çantanda olması yeter, kendisi çalışır.", tip: "Korsan Koyu'nda rakip seni suya iterse kurtarır.", g: 'def', ico: '🪂', name: 'Paraşüt', info: 'Sudan kurtarır', price: 3 },
  { key: 'potion', dmg: "+35 güç", desc: "Gücünü 35 artırır. Turun bitmez, sonra atış da yapabilirsin.", how: "Çantadan seç, KULLAN.", tip: "Gücün tam doluysa kullanılamaz.", g: 'def', ico: '🧪', name: 'Güç İksiri', info: '+35 güç', price: 7 },
  { key: 'skunk', dmg: "10 + turda 8", desc: "Patladığı yerde yeşil bir koku bulutu kalır. Bulut 3 tur durur; içinde turuna başlayan rakip öksürür ve 8 güç kaybeder.", how: "Çantadan seç, geri çek, bırak.", tip: "Rakibin durduğu yere at, oradan kaçmazsa her tur öksürür.", g: 'throw', ico: '🦨', name: 'Kokarca', info: 'Koku bulutu bırakır', price: 4 },
  { key: 'hive', dmg: "4 × 6", desc: "Patlayınca içinden 4 arı çıkar. Arılar en yakın rakibi kovalayıp sokar, her biri 6 güç götürür.", how: "Çantadan seç, geri çek, bırak.", tip: "Rakibin yakınına düşmesi yeter, arılar onu bulur.", g: 'throw', ico: '🐝', name: 'Arı Kovanı', info: 'Arılar rakibi kovalar', price: 5 },
  { key: 'missile', dmg: "15", desc: "Füze seçtiğin sayıya gider ve hiç ıskalamaz. Kesin vurduğu için az acıtır.", how: "Çantadan seç, cetvelden sayıyı seç, TAMAM.", tip: "Kedinin altındaki sayıyı seç, füze tam ona gider.", g: 'num', ico: '🚀', name: 'Hedef Füzesi', info: 'Seçtiğin sayıya tam gider', price: 4 },
  { key: 'storm', dmg: "25", desc: "Seçtiğin sayının üstünde kara bir bulut toplanır, gürler ve yıldırım düşer. Vurulanın kafası karışır.", how: "Çantadan seç, cetvelden sayıyı seç, TAMAM.", tip: "Rüzgâr buluta işlemez, tam seçtiğin yere düşer.", g: 'num', ico: '⛈️', name: 'Yıldırım Bulutu', info: 'Bulut, gürleme, yıldırım', price: 5 },
  { key: 'tornado', dmg: "20", desc: "Hortum rakibe doğru seçtiğin adım kadar gider. Suyun ve duvarın üstünden geçer, yakaladığını havaya savurur.", how: "Çantadan seç, kaç adım gideceğini seç, TAMAM.", tip: "Aradaki su yüzünden kurbağanın gidemediği yere hortum gider.", g: 'num', ico: '🌪️', name: 'Hortum', info: 'Su ve duvar durdurmaz', price: 4 },
  { key: 'swap', desc: "En yakın rakibinle ışıltılar içinde yer değiştirirsin.", how: "Çantadan seç, KULLAN.", tip: "Rakip güvenli bir yerdeyse onun yerine sen geç!", g: 'def', ico: '🔄', name: 'Yer Değiştirme', info: 'Rakiple yerini değiştir', price: 4 },
  // Yarış eşyaları (anahtarlar yaris3d/game.js içindeki RITEMS ile aynı). Yarıştan önce çantaya en fazla 3 tane konur.
  { key: 'r_missile', num: true, dmg: "rakip döner", desc: "Füze seçtiğin sıradaki arabaya gider ve onu döndürür. Önündeki her arabayı seçebilirsin.", how: "Yarışta çantadaki füzeye bas, kaçıncı sıradaki arabayı vuracağını seç.", tip: "Sen 5. isen 1., 2., 3. ya da 4. sıradakini seçebilirsin. Birinciyi vurmak için 1'e bas!", g: 'race', ico: '🚀', name: 'Hedef Füzesi', info: 'Kaçıncı sıradakini vursun?', price: 4 },
  { key: 'r_oil', dmg: "değen döner", desc: "Arkana kaygan bir yağ birikintisi bırakırsın. Üstünden geçen araba fırıl fırıl döner.", how: "Yarışta çantadaki yağa bas.", tip: "Arkanda biri yaklaşırken bırak.", g: 'race', ico: '🛢️', name: 'Yağ Birikintisi', info: 'Arkana bırak', price: 2 },
  { key: 'r_cones', dmg: "yavaşlatır", desc: "Arkana üç turuncu koni dizersin. Konilere çarpan araba yavaşlar.", how: "Yarışta çantadaki konilere bas.", tip: "Dar virajda bırakırsan kaçmak zor olur.", g: 'race', ico: '🚧', name: 'Koni Seti', info: 'Arkana koni diz', price: 2 },
  { key: 'r_snow', dmg: "rakip kayar", desc: "Önüne dümdüz bir kartopu atarsın. Aynı şeritteki ilk arabaya çarpar, araba kayar.", how: "Yarışta çantadaki kartopuna bas.", tip: "Önce öndeki arabanın şeridine geç, sonra at.", g: 'race', ico: '⚪', name: 'Kartopu', info: 'Öndekine at', price: 3 },
  { key: 'r_bolt', dmg: "öndekiler yavaşlar", desc: "Gökten yıldırım düşer: senden öndeki bütün arabalar bir süre yavaşlar.", how: "Yarışta çantadaki yıldırıma bas.", tip: "Gerideyken kullan, ne kadar çok araba öndeyse o kadar iyi.", g: 'race', ico: '⚡', name: 'Yıldırım', info: 'Öndekilerin hepsi yavaşlar', price: 7 },
  { key: 'r_shield', dmg: "saldırıyı yutar", desc: "Arabanın çevresinde bir kalkan açılır. Gelen ilk füze, kartopu, yağ ya da koni sana işlemez.", how: "Yarışta çantadaki kalkana bas.", tip: "Arkandan füze sesi gelince kullan.", g: 'race', ico: '🛡️', name: 'Kalkan', info: 'İlk saldırıyı yutar', price: 3 },
  { key: 'r_tires', dmg: "kaymazsın", desc: "Bir tur boyunca yağ ve çamur sana işlemez, hiç kaymazsın.", how: "Yarışta çantadaki lastiğe bas.", tip: "Önünde yağ ya da çamur görünce kullan.", g: 'race', ico: '🛞', name: 'Kaymaz Lastik', info: 'Yağ ve çamur işlemez', price: 3 },
  { key: 'r_turbo', dmg: "3 saniye hız", desc: "Arabanın arkasından alev çıkar, 3 saniye çok hızlı gidersin.", how: "Yarışta çantadaki turboya bas.", tip: "Düz yolda ya da rampadan önce kullan.", g: 'race', ico: '🔥', name: 'Turbo', info: '3 saniye hızlan', price: 3 },
  { key: 'r_start', dmg: "hızlı kalkış", desc: "Yeşil ışık yanınca roket gibi kalkarsın, rakipleri başta geçersin.", how: "Çantanda olması yeter, kendisi çalışır.", tip: "Yarışa en arkadan başlarsın, bununla hemen öne geçersin.", g: 'race', ico: '🚦', name: 'Süper Start', info: 'Yeşil ışıkta roket gibi', price: 2 },
];
// Dünyalar: bahçe dolunca akvaryum, akvaryum dolunca orman açılır. Yeni dünyada arkadaş daha pahalı (3 → 5 → 8 yıldız),
// böylece hep bir hedef kalır ama ödül hızı yavaşlar.
const AQUA = ['🐟', '🐚', '🐠', '🦀', '🪸', '🐡', '🦐', '🐙', '🐢', '🪼', '🦞', '🦑', '🐬', '🦦', '🐧', '🦭', '🦈', '🏰', '🐳', '🧜‍♀️'];
const FOREST = ['🌲', '🍄', '🐛', '🦌', '🌰', '🐻', '🍁', '🦝', '🪵', '🦫', '🐗', '🦡', '🫐', '🐺', '🦇', '🐼', '🦥', '🦚', '🏕️', '🧚'];
const WORLDS = [
  { key: 'garden', name: 'Bahçe', title: 'Bahçem', ico: '🌻', cost: STARS_PER_FRIEND, friends: FRIENDS, to: 'Bahçene', clip: 'yeni_arkadas' },
  { key: 'aqua', name: 'Akvaryum', title: 'Akvaryumum', ico: '🐠', cost: 5, friends: AQUA, to: 'Akvaryumuna', clip: 'yeni_akvaryum', opened: 'acildi_akvaryum',
    kinds: { '🐚': 'plant', '🪸': 'plant', '🏰': 'house', '🦀': 'crawl', '🦞': 'crawl', '🦐': 'crawl', '🪼': 'bob', '🐙': 'bob' }, big: ['🐳', '🦈', '🏰', '🐬'] },
  { key: 'forest', name: 'Orman', title: 'Ormanım', ico: '🌲', cost: 8, friends: FOREST, to: 'Ormanına', clip: 'yeni_orman', opened: 'acildi_orman',
    kinds: { '🐛': 'slow', '🦥': 'slow', '🦌': 'walk', '🐻': 'walk', '🦝': 'walk', '🦫': 'walk', '🐗': 'walk', '🦡': 'walk', '🐺': 'walk', '🐼': 'walk', '🦚': 'walk',
      '🦇': 'fly', '🧚': 'fly', '🏕️': 'house' }, big: ['🌲', '🏕️', '🐻'] },
];
// Her dünyada kaç arkadaş açık, sıradaki arkadaşa ne kadar yıldız birikti (bahçenin ilk arkadaşı baştan açık)
function worldState(stars) {
  const counts = []; let left = stars + WORLDS[0].cost, frontier = -1, have = 0;
  WORLDS.forEach((w, i) => {
    const n = Math.min(w.friends.length, Math.floor(left / w.cost));
    counts.push(n);
    if (frontier < 0 && n < w.friends.length) { frontier = i; have = left - n * w.cost; left = 0; } else left -= n * w.cost;
  });
  return { counts, frontier, have, open: frontier < 0 ? WORLDS.length : frontier + 1 };
}
const friendsFor = stars => worldState(stars).counts.reduce((a, b) => a + b, 0);
// Bütün dünyalar boyunca i. arkadaş
function friendAt(i) {
  for (let wi = 0; wi < WORLDS.length; wi++) { const w = WORLDS[wi]; if (i < w.friends.length) return { w, wi, f: w.friends[i] }; i -= w.friends.length; }
  return null;
}
const FLIERS = ['🐝', '🦋', '🐦', '🌈', '🎈'], BIG = ['🌳', '🏡', '🌈'];
// Bahçe sahnesindeki yerler (% olarak, sol-üst): çimen 3 sıra, gökyüzü 1 sıra; sıra karışık ki bahçe dengeli dolsun.
const GROUND_SLOTS = [[50, 70], [22, 62], [78, 64], [36, 80], [64, 82], [8, 76], [92, 78], [30, 60], [70, 58],
  [50, 86], [16, 86], [84, 86], [43, 64], [58, 70], [6, 62], [94, 62], [26, 74], [74, 74], [38, 88], [62, 88], [50, 56], [18, 54], [82, 54], [34, 52]];
const SKY_SLOTS = [[28, 22], [62, 16], [44, 34], [78, 30], [12, 30]];
const EMOJI = ['🍎', '🐟', '⭐', '🍓', '🐞', '🎈', '🧁', '🐥', '🌸', '🍪', '🦋', '🚗'];
const PRAISE = [['Aferin!', 'aferin'], ['Harika!', 'harika'], ['Süpersin!', 'supersin'], ['Çok güzel!', 'cok_guzel'], ['Bravo!', 'bravo']];
// İngilizce turlarında övgü de İngilizce (Samantha); ilk eleman ikinci denemede doğru bilince
const PRAISE_EN = [['Good job!', 'enp_good_job'], ['Great job!', 'enp_great_job'], ['Awesome!', 'enp_awesome'], ['Super!', 'enp_super'], ['Well done!', 'enp_well_done'], ['Excellent!', 'enp_excellent']];
const inEnglish = () => !!(mode && modeOf(mode) && modeOf(mode).g === 'en');

/* ================= Kayıt ================= */
const Store = {
  key: 'sayi-bahcesi.v1',
  d: { level: 1, stars: 0, best: {}, missed: {}, sound: true, seen: 1, coins: 0, tickets: 1, inv: {}, tasks: [], pin: null, celebrate: [] },
  load() { try { Object.assign(this.d, JSON.parse(localStorage.getItem(this.key)) || {}); } catch (e) {} },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.d)); } catch (e) {} },
};
Store.load();
// v17: Boya Küpü, Zıp Zıp Top ve Pasta dükkândan kalktı; eldekilerin parası geri verilir
for (const [k, price] of Object.entries({ paint: 2, bouncy: 2, cake: 3 })) {
  const n = Store.d.inv[k] || 0;
  if (n > 0) { Store.d.coins += n * price; delete Store.d.inv[k]; Store.save(); }
}

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
  // Sayıyı Dinle: Kolay 1–2 basamak, Orta 3, Zor 4–5 basamak. İçinde sıfır olan sayılar en çok karışanlar, sık gelsin.
  hear(lv) {
    let n = lv === 1 ? (Math.random() < .25 ? rnd(0, 9) : rnd(10, 99))
      : lv === 2 ? rnd(100, 999) : Math.random() < .5 ? rnd(1000, 9999) : rnd(10000, 99999);
    const d = [...String(n)];
    if (d.length >= 3 && Math.random() < .35) { d[rnd(1, d.length - 1)] = '0'; n = +d.join(''); }
    return { t: 'hear', n };
  },
};

// Sayıyı sesli okuma parçaları: 23.456 → t23 ("yirmi üç bin"), h4 ("dört yüz"), n56. gap: parçalar arasına duraklama
function numSay(n, gap = false) {
  const T = Math.floor(n / 1000), H = Math.floor(n % 1000 / 100), R = n % 100, out = [];
  if (T) out.push('t' + T);
  if (H) out.push('h' + H);
  if (R || !out.length) out.push(N(R));
  return gap ? out.flatMap((p, i) => i ? [0, p] : [p]) : out;
}
// 12345 → "12.345" (binlik ayırıcı nokta)
const fmtNum = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
// Çeldiriciler duyarken yapılan gerçek hatalardan: basamakları ters yazma (23 → 32),
// bir basamağı kaçırma (23 → 13, 24), sıfırı atlama ya da fazladan yazma (305 → 35, 3005).
function hearOpts(n, k) {
  const s = String(n), L = s.length, ok = t => t && (t.length === 1 || t[0] !== '0') ? +t : null;
  const swaps = [], digits = [], zeros = [];
  for (let i = 0; i < L - 1; i++) if (s[i] !== s[i + 1]) swaps.push(ok(s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2)));
  for (let i = 0; i < L; i++) for (const d of [1, -1]) {
    const v = +s[i] + d;
    if (v >= 0 && v <= 9) digits.push(ok(s.slice(0, i) + v + s.slice(i + 1)));
  }
  if (L === 1) digits.push(n + 10, n * 10);   // 3 → 13, 30
  const z = s.slice(0, -1).indexOf('0', 1);   // aradaki sıfır (sondaki sıfırı atmak başka bir sayı gibi duyulur)
  if (z > 0) zeros.push(ok(s.slice(0, z) + s.slice(z + 1)), ok(s.slice(0, z) + '0' + s.slice(z)));
  else if (L >= 3) { const i = rnd(1, L - 1); zeros.push(ok(s.slice(0, i) + '0' + s.slice(i))); }
  const order = [...shuffle(swaps).slice(0, 1), ...shuffle(digits).slice(0, 1), ...shuffle(zeros).slice(0, 1), ...shuffle(digits), ...swaps];
  const set = new Set([n]);
  for (const v of order) if (set.size < k && v != null && v >= 0) set.add(v);
  for (let d = 2; set.size < k; d++) set.add(n + d);
  return [...set];
}

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
// Zor 'Farklı Olan': ilk bakışta karışan çiftler
const ODD_NEAR = { shape: [['square', 'diamond'], ['circle', 'heart'], ['star', 'diamond']], color: [['red', 'orange'], ['blue', 'purple'], ['yellow', 'orange'], ['green', 'blue']] };
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
    // Kolay 6 kart (3×2), Orta ve Zor 9 kart (3×3). Kural tek bir özellikte: biri farklı, gerisi aynı.
    const n = lv === 1 ? 6 : 9;
    const rule = pick(lv === 1 ? ['shape', 'color'] : ['shape', 'color', 'size']);
    let pair;
    if (rule === 'size') pair = shuffle([0, 1]);
    else if (lv === 3 && Math.random() < .7) pair = shuffle([...pick(ODD_NEAR[rule])]);   // Zor: birbirine benzeyen iki değer
    else pair = sample(rule === 'shape' ? SHAPES : COLS, 2);
    // Önemsiz özellikler de değişir; her değer en az iki kartta olur ki kural dışında tek kalan bir şey çıkmasın.
    const others = ['shape', 'color'].filter(a => a !== rule);
    const nv = lv === 1 ? 2 : 3;
    const vals = {};
    for (const a of others) vals[a] = sample(a === 'shape' ? SHAPES.filter(v => !pair.includes(v)) : COLS.filter(v => !pair.includes(v)), nv);
    if (rule !== 'size') vals.size = lv === 3 ? [0, 1] : [0];
    const spread = vs => shuffle(Array.from({ length: n }, (_, i) => vs[i % vs.length]));
    const cols = {};
    for (const a of Object.keys(vals)) cols[a] = spread(vals[a]);
    const odd = rnd(0, n - 1);
    const items = Array.from({ length: n }, (_, i) => {
      const it = { shape: null, color: null, size: 0 };
      for (const a of Object.keys(cols)) it[a] = cols[a][i];
      it[rule] = i === odd ? pair[1] : pair[0];
      return [it.shape, it.color, it.size];
    });
    return { t: 'odd', rule, odd, n, items };
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
  hear(s) {
    const n = s.n, say = numSay(n), vals = hearOpts(n, LEVELS[lv()].options);
    const cls = vals.some(v => fmtNum(v).length >= 5) ? 'num-long' : '';   // şıklar aynı boyda yazılsın
    const q = {
      shape: true, ans: String(n), say, hintSay: say.length > 1 ? numSay(n, true) : [],
      prompt: 'Hangi sayıyı duydun?', hintText: `${String(n).length} basamaklı`,
      opts: vals.map(v => [v, () => el('span', cls, fmtNum(v)), String(v)]),
      draw(qe) {
        const b = el('button', 'hear-btn', '🔊');
        b.setAttribute('aria-label', 'Sayıyı dinle');
        b.onclick = () => $('speakBtn').onclick();
        q.numEl = el('span', 'hear-num', '?');
        qe.append(b, q.numEl);
      },
      fill() { q.numEl.textContent = fmtNum(n); q.numEl.classList.add('filled'); },
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

/* ================= Yeni şekil soruları =================
   Matris, Parça–Bütün, Gölge ve Bakış, Yansıma, İlişki. Hepsi her seviyede 4 şıklı.
   Soru verisi düz JSON (tekrar listesinde saklanır); doğru cevap veriden hesaplanır, şıklar anahtarlarıyla
   birbirinden farklı olmak zorunda. Çeldiriciler çocukların tipik hatası: bir özelliği atlamak, ters aynalamak, kopyalamak. */
const ASYM_SVG = {
  arrow: '<path d="M12 38 H54 V18 L90 50 L54 82 V62 H12 Z"/>',
  flag: '<path d="M20 8 H31 V92 H20 Z M31 10 H86 L72 30 L86 50 H31 Z"/>',
  ell: '<path d="M16 10 H42 V62 H86 V90 H16 Z"/>',
  pac: '<path d="M50 50 L88 31 A42 42 0 1 0 88 69 Z"/>',
};
const GLYPH = { ...SHAPE_SVG, ...ASYM_SVG };
const GLYPH_TR = { ...SHAPE_TR, arrow: 'ok', flag: 'bayrak', ell: 'L', pac: 'ağız' };
const ROT_SHAPES = ['triangle', 'arrow', 'flag', 'ell', 'pac', 'heart'];
const ROUND4 = ['circle', 'square', 'diamond'];          // 90° dönünce aynı görünenler
const INK = '#2B3550';
const NEW_N = 4;

function svgOf(inner, vb = '0 0 100 100', cls = 'shp') {
  const s = document.createElementNS(SVGNS, 'svg');
  s.setAttribute('viewBox', vb); s.setAttribute('class', cls); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = inner; return s;
}
// Bir hücre: { s şekil, c renk, r çeyrek dönüş, f dolu(1)/boş(0), z küçük, n adet }
function glyphSvg(g) {
  const n = g.n || 1, col = COLORS[g.c], f = g.f === 0 ? 0 : 1;
  const pos = { 1: [[50, 50]], 2: [[27, 50], [73, 50]], 3: [[50, 27], [27, 73], [73, 73]], 4: [[27, 27], [73, 27], [27, 73], [73, 73]] }[n];
  const k = (n === 1 ? .92 : .44) * (g.z ? .58 : 1);
  return pos.map(([x, y]) => `<g transform="translate(${x} ${y}) scale(${k}) rotate(${(g.r || 0) * 90}) translate(-50 -50)" fill="${f ? col : '#fff'}" stroke="${col}" stroke-width="${f ? 8 : 11}" stroke-linejoin="round">${GLYPH[g.s]}</g>`).join('');
}
const gKey = g => [g.s, g.c, ROUND4.includes(g.s) ? 0 : ((g.r || 0) % 4 + 4) % 4, g.f === 0 ? 0 : 1, g.z ? 1 : 0, g.n || 1].join('.');
const gName = g => `${(g.n || 1) > 1 ? g.n + ' ' : ''}${g.z ? 'küçük ' : ''}${g.f === 0 ? 'içi boş ' : ''}${COLOR_TR[g.c]} ${GLYPH_TR[g.s]}`;
const gEl = g => svgOf(glyphSvg(g));
// Doğru cevap + adaylardan, anahtarı farklı ilk 3 çeldirici (yoksa null: üretici yeniden dener)
function pickAlts(ans, cands, key, n = NEW_N - 1) {
  const seen = new Set([key(ans)]), out = [];
  for (const c of cands) { const k = key(c); if (!seen.has(k)) { seen.add(k); out.push(c); if (out.length === n) return out; } }
  return null;
}

/* ----- 1. Matris: 3×3 tabloda satır ve sütun kuralı ----- */
function matCell(lv, kind, r, c, P) {
  if (lv === 1) {   // satır boyunca tek kural; şekil (ve rengi) satıra ait
    const g = { s: P.sh[r], c: P.co[r], r: 0, f: 1, z: 0, n: 1 };
    if (kind === 'count') g.n = c + 1;
    if (kind === 'color') g.c = P.co[c];
    if (kind === 'rot') g.r = c;
    return g;
  }
  if (lv === 2) {   // şekil satıra, renk kayarak (her satırda bir adım), üstüne sütunda adet ya da dönüş
    const g = { s: P.sh[r], c: P.co[(r + c) % 3], r: 0, f: 1, z: 0, n: 1 };
    if (kind === 'count') g.n = c + 1; else g.r = c;
    return g;
  }
  // Zor: şekil ve renk iki farklı yönde kayar, adet satırdan, dönüş sütundan
  return { s: P.sh[(r + 2 * c) % 3], c: P.co[(r + c) % 3], r: kind === 'rot' ? c : 0, f: 1, z: 0, n: kind === 'count' ? r + 1 : (kind === 'rot' ? 1 : 1 + ((r + c) % 2)) };
}

/* ----- 2. Parça–Bütün: desenden kesilmiş kare ----- */
const blk = (rows, x, y, K) => rows.slice(y, y + K).map(r => r.slice(x, x + K));
const bMirror = b => b.map(r => [...r].reverse().join(''));
const bFlip = b => [...b].reverse();
const bRot = b => b[0].split('').map((_, i) => b.map(r => r[i]).reverse().join(''));
const bKey = b => b.join('/');

/* ----- 3. Gölge ve bakış ----- */
const ANCH = { t: [50, 18], tl: [22, 26], tr: [78, 26], l: [16, 62], r: [84, 62], bl: [24, 88], br: [76, 88] };
const SIL_SHAPES = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond'];
const MIRROR_A = { t: 't', tl: 'tr', tr: 'tl', l: 'r', r: 'l', bl: 'br', br: 'bl' };
const silKey = f => [f.base, ...f.parts.map(p => p.a + ':' + p.s).sort()].join('|');
function figSvg(f, dark) {
  const one = (s, x, y, k, col) => `<g transform="translate(${x} ${y}) scale(${k}) translate(-50 -50)" fill="${col}" stroke="${col}" stroke-width="8" stroke-linejoin="round">${SHAPE_SVG[s]}</g>`;
  return f.parts.map(p => one(p.s, ...ANCH[p.a], .34, dark ? INK : COLORS[p.c])).join('') + one(f.base, 50, 58, .62, dark ? INK : COLORS[f.bc]);
}
// Küp yığını: h[y][x] yükseklik. Ön = +y yüzü (sol alttaki yüzler), sağ = +x yüzü.
const viewOf = (h, v) => {
  const X = h[0].length, Y = h.length;
  if (v === 'front') return 'p' + Array.from({ length: X }, (_, x) => Math.max(...h.map(r => r[x]))).join('');
  if (v === 'right') return 'p' + Array.from({ length: Y }, (_, i) => Math.max(...h[Y - 1 - i])).join('');
  return 't' + h.map(r => r.map(z => z > 0 ? 1 : 0).join('')).join('/');
};
function cubesSvg(h, view) {
  const a = 17, b = 10, c = 20, P = (x, y, z) => [(x - y) * a, (x + y) * b - z * c], pts = (...p) => p.map(q => q.map(v => v.toFixed(1)).join(',')).join(' ');
  const X = h[0].length, Y = h.length, list = [];
  for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) for (let z = 0; z < h[y][x]; z++) list.push([x, y, z]);
  list.sort((p, q) => (p[0] + p[1]) - (q[0] + q[1]) || p[2] - q[2]);
  let out = '';
  for (const [x, y, z] of list) {
    out += `<polygon points="${pts(P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1))}" fill="#BFE6FF"/>`;
    out += `<polygon points="${pts(P(x, y + 1, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x, y + 1, z))}" fill="${view === 'front' ? '#FFC93C' : '#3FA9F5'}"/>`;
    out += `<polygon points="${pts(P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x + 1, y, z))}" fill="${view === 'right' ? '#FFC93C' : '#2477C2'}"/>`;
  }
  const all = list.flatMap(([x, y, z]) => [P(x, y, z + 1), P(x + 1, y + 1, z), P(x, y + 1, z), P(x + 1, y, z)]);
  const minX = Math.min(...all.map(p => p[0])), maxX = Math.max(...all.map(p => p[0])), minY = Math.min(...all.map(p => p[1])), maxY = Math.max(...all.map(p => p[1]));
  // Göz: hangi yönden bakıldığını gösterir
  const eye = (ex, ey, rot) => `<g transform="translate(${ex} ${ey}) rotate(${rot})"><path d="M-15 0 Q0 -12 15 0 Q0 12 -15 0 Z" fill="#fff" stroke="${INK}" stroke-width="3"/><circle r="5" fill="${INK}"/><path d="M20 0 H34 M28 -6 L34 0 L28 6" stroke="#E5483B" stroke-width="4" fill="none" stroke-linecap="round"/></g>`;
  const cx = (minX + maxX) / 2;
  const e = view === 'front' ? eye(minX - 6, maxY + 6, -30) : view === 'right' ? eye(maxX + 6, maxY + 6, 210) : eye(cx, minY - 30, 90);
  return { inner: `<g stroke="${INK}" stroke-width="2" stroke-linejoin="round">${out}</g>${e}`, vb: `${minX - 34} ${minY - (view === 'top' ? 52 : 10)} ${maxX - minX + 68} ${maxY - minY + (view === 'top' ? 62 : 36)}` };
}
function viewSvg(code) {
  const s = 20; let out = '', w, hgt;
  if (code[0] === 'p') {
    const cols = code.slice(1).split('').map(Number), H = 4;
    w = cols.length * s; hgt = H * s;
    cols.forEach((n, x) => { for (let z = 0; z < n; z++) out += `<rect x="${x * s + 1}" y="${hgt - (z + 1) * s + 1}" width="${s - 2}" height="${s - 2}" rx="3" fill="#3FA9F5" stroke="${INK}" stroke-width="2"/>`; });
    out += `<path d="M-4 ${hgt + 1} H${w + 4}" stroke="${INK}" stroke-width="3"/>`;
  } else {
    const rows = code.slice(1).split('/');
    w = rows[0].length * s; hgt = rows.length * s;
    rows.forEach((r, y) => [...r].forEach((v, x) => { out += `<rect x="${x * s + 1}" y="${y * s + 1}" width="${s - 2}" height="${s - 2}" rx="3" fill="${v === '1' ? '#BFE6FF' : 'none'}" stroke="${v === '1' ? INK : '#D5DCE8'}" stroke-width="2"/>`; }));
  }
  return svgOf(out, `-8 -8 ${Math.max(w, hgt) + 16} ${Math.max(w, hgt) + 16}`);
}

/* ----- 4. Yansıma: parçalardan bir şekil, dikey ya da yatay ayna ----- */
const REFL_SHAPES = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond', 'arrow'];
function reflT(parts, t) {   // t: v dikey ayna, h yatay ayna, r 180° dönüş, c kopya
  return parts.map(p => {
    const q = { ...p };
    if (t === 'v' || t === 'r') { q.x = 100 - p.x; q.d = 1 - p.d; }
    if (t === 'h' || t === 'r') { q.y = 100 - p.y; q.fl = 1 - p.fl; }
    return q;
  });
}
const reflKey = parts => parts.map(p => [p.s, p.c, p.x, p.y, p.s === 'arrow' ? 'd' + p.d : '', ['triangle', 'star', 'heart'].includes(p.s) ? 'f' + p.fl : ''].join(':')).sort().join('|');
function partsSvg(parts) {
  return parts.map(p => {
    const sx = p.s === 'arrow' && p.d ? -1 : 1, sy = p.s !== 'arrow' && p.fl ? -1 : 1;
    return `<g transform="translate(${p.x} ${p.y}) scale(${.27 * sx} ${.27 * sy}) translate(-50 -50)" fill="${COLORS[p.c]}" stroke="${COLORS[p.c]}" stroke-width="9" stroke-linejoin="round">${GLYPH[p.s]}</g>`;
  }).join('');
}

/* ----- 5. İlişki: A → B ise C → ? ----- */
const ANAL_RULES = ['fill', 'size', 'rot', 'count', 'color'];
function analApply(g, rules, P, skip = null) {
  const o = { ...g };
  for (const r of rules) {
    if (r === skip) continue;
    if (r === 'fill') o.f = g.f === 0 ? 1 : 0;
    if (r === 'size') o.z = g.z ? 0 : 1;
    if (r === 'rot') o.r = (g.r + P.dr + 4) % 4;
    if (r === 'count') o.n = g.n + P.dn;
    if (r === 'color') o.c = P.to;
  }
  return o;
}

Object.assign(GEN, {
  mat(lv) {
    for (;;) {
      const kind = pick(lv === 1 ? ['count', 'color', 'rot'] : lv === 2 ? ['count', 'rot'] : ['count', 'rot', 'mix']);
      const P = { sh: sample(kind === 'rot' || lv === 3 ? ROT_SHAPES : SHAPES, 3), co: sample(COLS, 3) };
      const cells = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push(matCell(lv, kind, r, c, P));
      const hole = lv === 1 ? rnd(0, 2) * 3 + 2 : rnd(0, 8);
      const ans = cells[hole];
      // Çeldirici: tek özelliği yanlış (renk, şekil, adet, dönüş) ve tablodaki komşu hücre
      const cands = shuffle([
        ...P.co.map(c => ({ ...ans, c })), ...P.sh.map(s => ({ ...ans, s })),
        ...[1, 2, 3].map(n => ({ ...ans, n })), ...[1, 2, 3].map(d => ({ ...ans, r: (ans.r + d) % 4 })),
      ]);
      const near = cells.filter((_, i) => i !== hole && (Math.floor(i / 3) === Math.floor(hole / 3) || i % 3 === hole % 3));
      const alts = pickAlts(ans, [pick(near), ...cands], gKey);
      if (alts) return { t: 'mat', cells, hole, alts };
    }
  },
  part(lv) {
    const N = lv === 3 ? 8 : 6, K = lv === 3 ? 3 : 2;
    for (;;) {
      let rows;
      if (lv === 1) {   // tekrar eden desen: şerit, dama, çapraz, iç içe kare
        const p = pick(['stripe', 'check', 'diag', 'ring']);
        const f = { stripe: (x, y) => x % 3, check: (x, y) => (Math.floor(x / 2) + Math.floor(y / 2)) % 2 ? 1 : (x + y) % 2 ? 0 : 2, diag: (x, y) => (x + y) % 3, ring: (x, y) => Math.min(x, y, N - 1 - x, N - 1 - y) % 3 }[p];
        rows = Array.from({ length: N }, (_, y) => Array.from({ length: N }, (_, x) => f(x, y)).join(''));
      } else {          // dört yönlü simetrik desen: sol üst çeyrek rastgele, gerisi aynalarla
        const h = N / 2, nc = lv === 3 ? 3 : 2;
        const q = Array.from({ length: h }, () => Array.from({ length: h }, () => rnd(0, nc)));
        rows = Array.from({ length: N }, (_, y) => Array.from({ length: N }, (_, x) => q[y < h ? y : N - 1 - y][x < h ? x : N - 1 - x]).join(''));
      }
      // Delik bir çeyreğin içinde kalsın ki simetrik eşi görünsün
      const okPos = lv === 1 ? [...Array(N - K + 1).keys()] : [...Array(N / 2 - K + 1).keys()].flatMap(v => [v, v + N / 2]);
      const hx = pick(okPos), hy = pick(okPos);
      const b = blk(rows, hx, hy, K);
      if (new Set(b.join('')).size < 2) continue;
      const one = () => { const c = b.map(r => r.split('')); const i = rnd(0, K - 1), j = rnd(0, K - 1); c[i][j] = String((+c[i][j] + rnd(1, 2)) % (lv === 1 ? 3 : lv === 3 ? 4 : 3)); return c.map(r => r.join('')); };
      const alts = pickAlts(b, [...shuffle([bMirror(b), bFlip(b), bRot(b), bRot(bRot(b))]), one(), one(), one()], bKey);
      if (alts) return { t: 'part', N, K, rows, hx, hy, pal: sample(COLS, 3), white: lv > 1, alts };
    }
  },
  view(lv) {
    if (lv === 1) {   // renkli şeklin gölgesi
      for (;;) {
        const base = pick(['square', 'circle', 'triangle', 'heart']), as = sample(Object.keys(ANCH), 3);
        const f = { base, bc: pick(COLS), parts: as.map(a => ({ a, s: pick(SIL_SHAPES), c: pick(COLS) })) };
        if (silKey(f) === silKey({ ...f, parts: f.parts.map(p => ({ ...p, a: MIRROR_A[p.a] })) })) continue;   // aynası kendisiyle aynı olmasın
        const free = Object.keys(ANCH).filter(a => !as.includes(a));
        const cands = [
          { ...f, parts: f.parts.map(p => ({ ...p, a: MIRROR_A[p.a] })) },
          ...f.parts.map((_, i) => ({ ...f, parts: f.parts.map((p, j) => j === i ? { ...p, s: pick(SIL_SHAPES.filter(x => x !== p.s)) } : p) })),
          ...f.parts.map((_, i) => ({ ...f, parts: f.parts.map((p, j) => j === i ? { ...p, a: pick(free) } : p) })),
          { ...f, base: pick(['square', 'circle', 'triangle', 'heart'].filter(x => x !== base)) },
        ];
        const alts = pickAlts(f, [cands[0], ...shuffle(cands.slice(1))], silKey);
        if (alts) return { t: 'view', mode: 'sil', f, alts };
      }
    }
    for (;;) {   // küp yığını: önden / üstten / sağdan
      const X = 3, Y = lv === 2 ? 2 : 3, maxH = lv === 2 ? 2 : 3;
      const h = Array.from({ length: Y }, () => Array.from({ length: X }, () => Math.random() < .25 ? 0 : rnd(1, maxH)));
      const n = h.flat().reduce((a, v) => a + v, 0);
      if (n < 4 || h.flat().filter(v => v === 0).length > 3) continue;
      const v = pick(lv === 2 ? ['front', 'top'] : ['front', 'right', 'top']);
      const ans = viewOf(h, v);
      const flipP = s => s[0] + s.slice(1).split('').reverse().join('');
      const bump = s => { const a = s.slice(1).split('').map(Number), i = rnd(0, a.length - 1); a[i] = a[i] >= maxH ? a[i] - 1 : a[i] + 1; return 'p' + a.join(''); };
      const tog = s => { const r = s.slice(1).split('/').map(x => x.split('')), i = rnd(0, r.length - 1), j = rnd(0, r[0].length - 1); r[i][j] = r[i][j] === '1' ? '0' : '1'; return 't' + r.map(x => x.join('')).join('/'); };
      const tMirror = s => 't' + s.slice(1).split('/').map(r => [...r].reverse().join('')).join('/');
      const tFlip = s => 't' + s.slice(1).split('/').reverse().join('/');
      const others = ['front', 'right', 'top'].filter(x => x !== v).map(x => viewOf(h, x));
      const cands = ans[0] === 'p' ? [flipP(ans), ...shuffle([...others, bump(ans), bump(ans)])] : [tMirror(ans), tFlip(ans), ...shuffle([...others, tog(ans), tog(ans)])];
      const alts = pickAlts(ans, cands, x => x);
      if (alts && alts.every(a => a !== 'p' && !/^p0+$/.test(a))) return { t: 'view', mode: v, h, alts };
    }
  },
  refl(lv) {
    for (;;) {
      const axis = lv === 1 ? 'v' : pick(['v', 'h']), k = lv === 1 ? 3 : lv === 2 ? 4 : 5;
      const spots = sample([20, 50, 80].flatMap(x => [20, 50, 80].map(y => [x, y])), k);
      const parts = spots.map(([x, y]) => ({ s: pick(lv === 1 ? ['triangle', 'arrow', 'heart', 'circle', 'square'] : REFL_SHAPES), c: pick(COLS), x, y, d: rnd(0, 1), fl: 0 }));
      if (lv === 1) parts.forEach(p => { p.c = parts[0].c; });   // Kolay: tek renk, yalnız yer ve yön
      const ans = reflT(parts, axis);
      const alts = pickAlts(ans, [reflT(parts, 'c'), reflT(parts, axis === 'v' ? 'h' : 'v'), reflT(parts, 'r')], reflKey);
      if (alts) return { t: 'refl', axis, parts, alts };
    }
  },
  anal(lv) {
    for (;;) {
      const rules = sample(ANAL_RULES, lv), P = { dr: pick([1, -1]), dn: 1, to: null };
      const sh = sample(rules.includes('rot') ? ROT_SHAPES : [...SHAPES, ...ROT_SHAPES.slice(1)], 2);
      const c0 = pick(COLS); P.to = pick(COLS.filter(c => c !== c0));
      const base = () => ({ r: rnd(0, 3), f: 1, z: 0, n: rules.includes('count') ? rnd(1, 2) : 1 });
      const A = { s: sh[0], c: c0, ...base() }, C = { s: sh[1], c: rules.includes('color') ? c0 : pick(COLS), ...base() };
      if (rules.includes('fill') && Math.random() < .5) { A.f = 0; C.f = 0; }
      if (rules.includes('size') && Math.random() < .4) { A.z = 1; C.z = 1; }
      const B = analApply(A, rules, P), D = analApply(C, rules, P);
      const cands = [...rules.map(r => analApply(C, rules, P, r)), B, C, analApply(C, rules, { ...P, dr: -P.dr }), analApply(C, [pick(ANAL_RULES.filter(r => !rules.includes(r)))], P)];
      const alts = pickAlts(D, lv === 1 ? shuffle(cands) : [...shuffle(cands.slice(0, rules.length)), ...shuffle(cands.slice(rules.length))], gKey);
      if (alts) return { t: 'anal', rules, A, B, C, D, alts };
    }
  },
});

Object.assign(SB, {
  mat(s) {
    const ans = s.cells[s.hole];
    const q = {
      shape: true, ans: gKey(ans), say: ['bosluga'], hintSay: ['satir_sutun'],
      prompt: 'Boşluğa hangisi gelir?', hintText: 'Satırlara ve sütunlara bak',
      opts: [ans, ...s.alts].map(g => [gKey(g), () => gEl(g), gName(g)]),
      draw(qe) {
        const box = el('div', 'mx');
        s.cells.forEach((g, i) => {
          const cell = el('div', 'mxc');
          if (i === s.hole) { cell.classList.add('slot'); cell.textContent = '?'; q.slot = cell; } else cell.append(gEl(g));
          box.append(cell);
        });
        qe.append(box);
      },
      fill() { q.slot.textContent = ''; q.slot.append(gEl(ans)); q.slot.classList.add('filled'); },
    };
    return q;
  },
  part(s) {
    const cs = 100 / s.N, ans = blk(s.rows, s.hx, s.hy, s.K);
    // Kolay desen 3 renk; Orta ve Zor'da 0 beyaz zemin, gerisi renk
    const pal = v => s.white ? (v === '0' ? '#FFFFFF' : COLORS[s.pal[+v - 1]]) : COLORS[s.pal[+v]];
    const cellsSvg = (rows, ox = 0, oy = 0, size = cs) => rows.map((r, y) => [...r].map((v, x) => `<rect x="${ox + x * size}" y="${oy + y * size}" width="${size + .3}" height="${size + .3}" fill="${pal(v)}"/>`).join('')).join('');
    const blockEl = b => svgOf(`<g>${cellsSvg(b, 0, 0, 100 / s.K)}</g><rect x="1.5" y="1.5" width="97" height="97" rx="6" fill="none" stroke="${INK}" stroke-width="3"/>`);
    const q = {
      shape: true, ans: bKey(ans), say: ['bosluga'], hintSay: ['desen_bak'],
      prompt: 'Hangi parça tamamlar?', hintText: 'Desenin geri kalanına bak',
      opts: [ans, ...s.alts].map(b => [bKey(b), () => blockEl(b), 'Parça']),
      draw(qe) {
        const hole = `<rect x="${s.hx * cs}" y="${s.hy * cs}" width="${s.K * cs}" height="${s.K * cs}" fill="#FFFDF6" stroke="${INK}" stroke-width="2" stroke-dasharray="5 4"/><text x="${(s.hx + s.K / 2) * cs}" y="${(s.hy + s.K / 2) * cs + 7}" text-anchor="middle" font-size="${cs * 1.1}" font-weight="800" fill="${INK}">?</text>`;
        q.svg = svgOf(`<g>${cellsSvg(s.rows)}</g><g class="hole">${hole}</g><rect x="1" y="1" width="98" height="98" rx="5" fill="none" stroke="${INK}" stroke-width="2.5"/>`, '0 0 100 100', 'shp part-svg');
        const box = el('div', 'partq'); box.append(q.svg); qe.append(box);
      },
      fill() { q.svg.querySelector('.hole').innerHTML = `<g>${cellsSvg(ans, s.hx * cs, s.hy * cs)}</g><rect x="${s.hx * cs}" y="${s.hy * cs}" width="${s.K * cs}" height="${s.K * cs}" fill="none" stroke="#34C17B" stroke-width="2.5"/>`; },
    };
    return q;
  },
  view(s) {
    if (s.mode === 'sil') {
      const q = {
        shape: true, ans: silKey(s.f), say: ['golge'], hintSay: ['dis_cizgi'],
        prompt: 'Gölgesi hangisi?', hintText: 'Parçaların yerine bak',
        opts: [s.f, ...s.alts].map(f => [silKey(f), () => svgOf(figSvg(f, true)), 'Gölge']),
        draw(qe) { const box = el('div', 'viewq'); box.append(svgOf(figSvg(s.f, false), '0 0 100 100', 'shp big')); qe.append(box); },
        fill() {},
      };
      return q;
    }
    const ask = { front: ['onden', 'Önden bakınca nasıl görünür?'], right: ['sagdan', 'Sağdan bakınca nasıl görünür?'], top: ['ustten', 'Üstten bakınca nasıl görünür?'] }[s.mode];
    const ans = viewOf(s.h, s.mode), cv = cubesSvg(s.h, s.mode);
    return {
      shape: true, ans, say: [ask[0]], hintSay: [s.mode === 'top' ? 'ustten_ipucu' : 'kule_bak'],
      prompt: ask[1], hintText: s.mode === 'top' ? 'Küplerin tepelerine bak' : 'Her sıradaki en uzun kuleye bak',
      opts: [ans, ...s.alts].map(v => [v, () => viewSvg(v), 'Görünüş']),
      draw(qe) { const box = el('div', 'viewq'); box.append(svgOf(cv.inner, cv.vb, 'shp big cubes')); qe.append(box); },
      fill() {},
    };
  },
  refl(s) {
    const ans = reflT(s.parts, s.axis), frame = '<rect x="3" y="3" width="94" height="94" rx="12" fill="#fff" stroke="#D5DCE8" stroke-width="3"/>';
    const q = {
      shape: true, ans: reflKey(ans), say: ['ayna'], hintSay: ['ayna_yakin'],
      prompt: 'Aynadaki hâli hangisi?', hintText: 'Aynaya yakın olan, yansımada da yakın olur',
      opts: [ans, ...s.alts].map(p => [reflKey(p), () => svgOf(frame + partsSvg(p)), 'Yansıma']),
      draw(qe) {
        const box = el('div', 'reflq ' + s.axis);
        q.out = el('div', 'rbox unknown', '?');
        const known = el('div', 'rbox'); known.append(svgOf(frame + partsSvg(s.parts)));
        box.append(known, el('div', 'rmirror'), q.out);
        qe.append(box);
      },
      fill() { q.out.textContent = ''; q.out.append(svgOf(frame + partsSvg(ans))); q.out.classList.add('filled'); },
    };
    return q;
  },
  anal(s) {
    const q = {
      shape: true, ans: gKey(s.D), say: ['iliski'], hintSay: ['ne_degisti'],
      prompt: 'Birinciye ne olduysa üçüncüye de o olur', hintText: 'İlk ikisinde ne değişti?',
      opts: [s.D, ...s.alts].map(g => [gKey(g), () => gEl(g), gName(g)]),
      draw(qe) {
        const pair = (a, b) => { const p = el('div', 'apair'); const ca = el('div', 'acell'), cb = el('div', 'acell'); ca.append(gEl(a)); if (b) cb.append(gEl(b)); else { cb.classList.add('slot'); cb.textContent = '?'; q.slot = cb; } p.append(ca, el('span', 'aarrow', '→'), cb); return p; };
        const box = el('div', 'analq'); box.append(pair(s.A, s.B), el('span', 'asep', 'gibi'), pair(s.C, null));
        qe.append(box);
      },
      fill() { q.slot.textContent = ''; q.slot.append(gEl(s.D)); q.slot.classList.add('filled'); },
    };
    return q;
  },
});

/* ================= İngilizce =================
   Çocuk okuma bilmiyor: ekranda İngilizce yazı yok. Kelimeyi Samantha (Amerikan) söyler, şıklar emoji ya da renk.
   Ses parçaları en_<kelime> adıyla tools/make-audio.sh'de üretilir. */
const EN_WORDS = {
  family: [['mom', '👩'], ['dad', '👨'], ['baby', '👶'], ['brother', '👦'], ['sister', '👧'], ['grandma', '👵'], ['grandpa', '👴']],
  animals: [['cat', '🐱'], ['dog', '🐶'], ['bird', '🐦'], ['fish', '🐟'], ['cow', '🐮'], ['horse', '🐴'], ['lion', '🦁'], ['duck', '🦆'], ['frog', '🐸'], ['rabbit', '🐰'], ['bear', '🐻'], ['monkey', '🐵'], ['mouse', '🐭'], ['goat', '🐐']],
  food: [['apple', '🍎'], ['banana', '🍌'], ['orange', '🍊'], ['pear', '🍐'], ['strawberry', '🍓'], ['bread', '🍞'], ['milk', '🥛'], ['egg', '🥚'], ['cake', '🍰'], ['cheese', '🧀'], ['water', '💧']],
  home: [['house', '🏠'], ['door', '🚪'], ['bed', '🛏️'], ['chair', '🪑'], ['book', '📕'], ['pencil', '✏️'], ['bag', '🎒'], ['clock', '⏰'], ['key', '🔑']],
  body: [['eye', '👁️'], ['ear', '👂'], ['nose', '👃'], ['mouth', '👄'], ['hand', '✋'], ['foot', '🦶']],
  clothes: [['hat', '🎩'], ['shoe', '👟'], ['shirt', '👕'], ['socks', '🧦'], ['dress', '👗'], ['coat', '🧥'], ['glasses', '👓']],
  toys: [['ball', '⚽'], ['car', '🚗'], ['bus', '🚌'], ['plane', '✈️'], ['train', '🚂'], ['bike', '🚲'], ['boat', '⛵'], ['kite', '🪁'], ['teddy bear', '🧸']],
  nature: [['tree', '🌳'], ['flower', '🌸'], ['sun', '☀️'], ['moon', '🌙'], ['star', '⭐'], ['rain', '🌧️'], ['snow', '❄️'], ['cloud', '☁️']],
};
const EN_EASY = ['family', 'animals', 'food', 'toys'];   // Kolay: ilk öğrenilen kelimeler
// Zor: sesi birbirine benzeyen çiftler
const EN_NEAR = [['cat', 'hat'], ['car', 'star'], ['boat', 'goat', 'coat'], ['mouse', 'house'], ['bear', 'pear', 'chair'], ['bed', 'bread'], ['clock', 'socks'], ['ball', 'doll'], ['cake', 'kite'], ['moon', 'mom'], ['hand', 'sand'], ['tree', 'three']].map(g => g.filter(w => Object.values(EN_WORDS).flat().some(x => x[0] === w)));
const EN_ALL = Object.entries(EN_WORDS).flatMap(([cat, ws]) => ws.map(([w, e]) => ({ w, e, cat })));
const enWord = w => EN_ALL.find(x => x.w === w);
const enClip = w => 'en_' + w.replace(/ /g, '_');
const EN_COLORS = { red: '#E5483B', blue: '#3FA9F5', yellow: '#FFC93C', green: '#34C17B', orange: '#FF9F43', purple: '#8E7CF0', pink: '#FF7AB6', black: '#2B3550', white: '#FFFFFF', brown: '#9A5B2E' };
const EN_COL_EASY = ['red', 'blue', 'yellow', 'green'];
const EN_SHAPES = ['circle', 'square', 'triangle', 'star', 'heart'];
const EN_COL_SHAPE = ['red', 'blue', 'yellow', 'green', 'orange', 'purple'];   // şekil renkleri (COLORS ile aynı adlar)
const EN_NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const EN_TENS = { 30: 'thirty', 40: 'forty', 50: 'fifty', 60: 'sixty', 70: 'seventy', 80: 'eighty', 90: 'ninety', 100: 'one hundred' };
const enNumWord = n => n <= 20 ? EN_NUM[n] : EN_TENS[n];
// "Find three cats": sayılabilen, emojisi net nesneler (çoğul hâliyle)
const EN_FIND = [['cat', 'cats'], ['dog', 'dogs'], ['bird', 'birds'], ['fish', 'fish'], ['apple', 'apples'], ['banana', 'bananas'], ['car', 'cars'], ['ball', 'balls'], ['star', 'stars'], ['flower', 'flowers']];
const enFindClip = (n, w) => `enf_${n}_${w}`;
const enGroup = (e, n) => { const s = el('span', 'en-grp n' + n); for (let i = 0; i < n; i++) s.append(el('span', 'en-emo', e)); return s; };
const enEmo = e => el('span', 'en-emo big', e);
const enBlob = c => { const s = el('span', 'en-blob'); s.style.setProperty('--b', EN_COLORS[c]); return s; };

Object.assign(GEN, {
  enw(lv) {
    let pool;
    if (lv === 1) pool = sample(EN_EASY.map(c => pick(EN_WORDS[c])), 3).map(([w]) => w);   // farklı kategoriler
    else if (lv === 3 && Math.random() < .6) {
      const g = pick(EN_NEAR.filter(g => g.length >= 2)), cat = enWord(g[0]).cat;
      pool = [...g, ...sample(EN_ALL.filter(x => !g.includes(x.w) && x.cat === cat), 4 - g.length).map(x => x.w)];
      pool = pool.slice(0, 4);
      if (pool.length < 4) pool.push(...sample(EN_ALL.filter(x => !pool.includes(x.w)), 4 - pool.length).map(x => x.w));
    } else { const cat = pick(Object.keys(EN_WORDS).filter(c => EN_WORDS[c].length >= 4)); pool = sample(EN_WORDS[cat], 4).map(([w]) => w); }
    return { t: 'enw', w: pool[0], opts: pool };
  },
  enc(lv) {
    // Orta: yarısı şekil adı (circle, star…); şıkların hepsi aynı renkte ki yalnız şekle bakılsın
    if (lv === 2 && Math.random() < .5) { const sh = sample(EN_SHAPES, 4); return { t: 'enc', sh: sh[0], col: pick(EN_COL_SHAPE), opts: sh }; }
    if (lv < 3) { const cs = sample(lv === 1 ? EN_COL_EASY : Object.keys(EN_COLORS), lv === 1 ? 3 : 4); return { t: 'enc', c: cs[0], opts: cs }; }
    // Zor: renk + şekil ("red heart"); çeldiriciler aynı renk başka şekil, aynı şekil başka renk
    const c = pick(EN_COL_SHAPE), s = pick(EN_SHAPES);
    const alts = shuffle([[c, pick(EN_SHAPES.filter(x => x !== s))], [pick(EN_COL_SHAPE.filter(x => x !== c)), s]]);
    const third = [pick(EN_COL_SHAPE.filter(x => x !== c)), pick(EN_SHAPES.filter(x => x !== s))];
    const opts = [[c, s], ...alts, third].filter((v, i, a) => a.findIndex(y => y.join() === v.join()) === i);
    while (opts.length < 4) { const v = [pick(EN_COL_SHAPE), pick(EN_SHAPES)]; if (!opts.some(y => y.join() === v.join())) opts.push(v); }
    return { t: 'enc', c, s, opts };
  },
  enn(lv) {
    if (lv === 1) { const n = rnd(1, 10), set = new Set([n]); for (const v of shuffle([n + 1, n - 1, n + 2, n - 2])) if (set.size < 3 && v >= 1 && v <= 10) set.add(v); return { t: 'enn', n, opts: [...set] }; }
    if (lv === 2) { const n = rnd(1, 20), set = new Set([n]); for (const d of shuffle([1, -1, 2, -2, 10, -10])) if (set.size < 4 && n + d >= 1 && n + d <= 20) set.add(n + d); return { t: 'enn', n, opts: [...set] }; }
    // Zor: thirteen / thirty karışıklığı
    const teen = rnd(3, 9), pairs = [10 + teen, teen * 10, teen, teen * 10 > 20 ? 10 + teen + 1 : teen + 1];
    const n = pick([10 + teen, teen * 10].filter(v => v <= 20 || EN_TENS[v]));
    const set = new Set([n]); for (const v of shuffle(pairs)) if (set.size < 4 && (v <= 20 || EN_TENS[v])) set.add(v);
    for (let k = 1; set.size < 4; k++) if (n + k <= 20 || EN_TENS[n + k]) set.add(n + k);
    return { t: 'enn', n, opts: [...set] };
  },
  enf(lv) {
    const max = lv === 1 ? 3 : lv === 2 ? 4 : 5;
    const [w] = pick(EN_FIND), n = rnd(1, max), other = pick(EN_FIND.filter(x => x[0] !== w))[0];
    const opts = [[w, n]], add = o => { if (!opts.some(x => x[0] === o[0] && x[1] === o[1]) && o[1] >= 1 && o[1] <= max) opts.push(o); };
    for (const d of shuffle([1, -1, 2, -2])) if (opts.length < (lv === 1 ? 3 : 2)) add([w, n + d]);
    if (lv > 1) { add([other, n]); for (const d of shuffle([1, -1, 2])) if (opts.length < 4) add([w, n + d]); }
    for (let k = 1; opts.length < (lv === 1 ? 3 : 4); k++) add([w, ((n + k - 1) % max) + 1]);
    return { t: 'enf', w, n, opts };
  },
});

const enAsk = (s, ans, opts, say, draw) => ({
  shape: true, ans, say, hintSay: ['en_talimat', 0, ...say],
  prompt: 'Dinle ve doğru resmi bul', hintText: 'Bir kez daha dinle',
  opts,
  draw(qe) {
    const b = el('button', 'hear-btn', '🔊'); b.setAttribute('aria-label', 'Dinle');
    b.onclick = () => $('speakBtn').onclick();
    qe.append(b); if (draw) draw(qe);
  },
  fill() {},
});
Object.assign(SB, {
  enw(s) { return enAsk(s, s.w, s.opts.map(w => [w, () => enEmo(enWord(w).e), w]), [enClip(s.w)]); },
  enc(s) {
    if (s.sh) return enAsk(s, s.sh, s.opts.map(sh => [sh, () => shapeEl([sh, s.col]), sh]), ['ens_' + s.sh]);
    if (!s.s) return enAsk(s, s.c, s.opts.map(c => [c, () => enBlob(c), c]), ['enc_' + s.c]);
    return enAsk(s, s.c + '-' + s.s, s.opts.map(([c, sh]) => [c + '-' + sh, () => shapeEl([sh, c]), c + ' ' + sh]), [`encs_${s.c}_${s.s}`]);
  },
  enn(s) {
    const show = n => s.e ? enGroup(s.e, n) : el('span', 'en-num' + (n >= 100 ? ' long' : ''), String(n));
    return enAsk(s, String(s.n), s.opts.map(n => [String(n), () => show(n), String(n)]), ['enn_' + s.n]);
  },
  enf(s) {
    return enAsk(s, s.w + '-' + s.n, s.opts.map(([w, n]) => [w + '-' + n, () => enGroup(enWord(w).e, n), n + ' ' + w]), [enFindClip(s.n, s.w)]);
  },
});

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

const TABS = ['home', 'games', 'garden', 'shop'];
function show(name) {
  screen = name;
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('active', s.id === name);
  // Alt sekme çubuğu yalnızca dört ana bölümde görünür; alıştırma, tur ve sonuç ekranında gizlenir
  document.body.classList.toggle('tabbed', TABS.includes(name));
  for (const t of document.querySelectorAll('.tab')) { const on = t.dataset.tab === name; t.classList.toggle('on', on); if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current'); }
  if (TABS.includes(name)) renderWallet();
}

const LEVEL_NAME = { 1: 'Kolay', 2: 'Orta', 3: 'Zor' };
const bestOf = (k, l = lv()) => Store.d.best[`${k}-${l}`] || 0;
// "Oyna": en son oynanan alıştırma; hiç oynanmamışsa bu seviyede en az yıldızı olan
function nextMode() {
  if (Store.d.lastMode && modeOf(Store.d.lastMode)) return Store.d.lastMode;
  return MODES.slice().sort((a, b) => bestOf(a.key) - bestOf(b.key))[0].key;
}
function renderHome() {
  const m = modeOf(nextMode());
  $('playWhat').textContent = `${m.label} · ${LEVEL_NAME[lv()]}`;
  const full = Store.d.tickets >= TICKET_MAX;
  $('lootTicket').textContent = full ? `🎟️ ${TICKET_MAX}/${TICKET_MAX} dolu` : '🎟️ 1 bilet';
  const maxCoins = 6 + (lv() === 3 ? 2 : 0) + (bestOf(m.key) < 3 ? 1 : 0);
  $('lootCoins').textContent = `🪙 ${maxCoins} altına kadar`;
  renderWallet();
  const doable = Store.d.tasks.filter(t => taskState(t) === 'open').length;
  $('taskBadge').hidden = !doable; $('taskBadge').textContent = doable;
  $('taskSub').textContent = doable ? `${doable} görev seni bekliyor` : Store.d.tasks.length ? 'Hepsini yaptın!' : 'Ebeveynin görev ekleyebilir';
  for (const c of document.querySelectorAll('.prac')) {
    const list = MODES.filter(x => x.g === c.dataset.g), got = list.reduce((n, x) => n + bestOf(x.key), 0), max = list.length * 3;
    c.querySelector('.p-bar i').style.width = (got / max * 100) + '%';
    c.querySelector('em').textContent = `${got}/${max} ★`;
  }
}
// Üstteki cüzdan ve sekme çubuğundaki işaretler (her sekmede güncel kalsın)
function renderWallet() {
  const n = Store.d.tickets;
  $('wTickets').textContent = n; $('wCoins').textContent = Store.d.coins; $('wStars').textContent = Store.d.stars;
  $('wTicketChip').setAttribute('aria-label', `${n} bilet, en fazla ${TICKET_MAX}`);
  $('tabTickets').hidden = !(n > 0); $('tabTickets').textContent = n;
  $('gardenDot').hidden = !(friendsFor(Store.d.stars) > Store.d.seen || worldState(Store.d.stars).open > (Store.d.worldSeen || 1));
}
// Oyunlar sekmesi: bilet göstergesi ve iki oyun
function warNext() {
  try {
    const st = (JSON.parse(localStorage.getItem('war-of-blocks.v1')) || {}).stars || [];
    for (let i = 0; i < 12; i++) if (!(st[i] > 0)) return i + 1;
    return 0;
  } catch (e) { return 1; }
}
function renderGames() {
  renderWallet();
  const n = Store.d.tickets;
  $('gCoins').textContent = Store.d.coins;
  $('tSlots').querySelectorAll('i').forEach((s, i) => s.classList.toggle('on', i < n));
  $('tTitle').textContent = n > 0 ? `${n} biletin var` : 'Biletin yok';
  $('tSub').textContent = n >= TICKET_MAX ? 'Biletlerin dolu, hadi oyna! Her oyun 1 bilet.' : n > 0 ? 'Her oyun 1 bilet. Bir tur bitir, 1 bilet daha kazan.' : 'Bir matematik turu bitir, bilet kazan.';
  $('tGo').hidden = n > 0;
  for (const id of ['warBtn', 'raceBtn', 'race3dBtn']) $(id).classList.toggle('no-ticket', !(n > 0));
  const w = warNext();
  $('warSub').textContent = (w ? `Bölüm ${w} seni bekliyor` : 'Bütün bölümler bitti!') + ' · 1 ya da 2 kişi';
  $('raceNew').hidden = !!Store.d.raceSeen;
  $('race3dNew').hidden = !!Store.d.race3dSeen;
}
// Alıştırma sayfası: zorluk + o gruptaki alıştırmalar
let catGroup = 'num';
function renderCat() {
  $('catTitle').textContent = GROUPS.find(([g]) => g === catGroup)[1];
  for (const b of document.querySelectorAll('.level')) {
    const on = +b.dataset.level === lv();
    b.classList.toggle('on', on); b.setAttribute('aria-checked', on);
  }
  const grid = $('catGrid'); grid.innerHTML = '';
  const list = MODES.filter(x => x.g === catGroup);
  list.forEach((m, i) => {
    const b = el('button', 'mode' + (list.length % 2 && i === list.length - 1 ? ' wide' : '')); b.style.setProperty('--c', m.c);
    b.append(el('span', 'ico', m.ico), el('span', 'lbl', m.label));
    const best = bestOf(m.key), st = el('span', 'best');
    for (let k = 0; k < 3; k++) st.append(el('span', k < best ? 'on' : '', '★'));
    b.append(st);
    b.onclick = () => { Sound.play('tap'); startRound(m.key); };
    grid.append(b);
  });
}
function openSettings() {
  modal((c, close) => {
    c.classList.add('settings');
    c.append(el('h2', '', 'Ayarlar'));
    const snd = el('button', 'big-btn alt', Store.d.sound ? '🔊 Ses açık' : '🔇 Ses kapalı');
    snd.onclick = () => { Store.d.sound = !Store.d.sound; Store.save(); if (!Store.d.sound) Voice.stop(); snd.textContent = Store.d.sound ? '🔊 Ses açık' : '🔇 Ses kapalı'; Sound.play('tap'); };
    const par = el('button', 'big-btn alt', '🔒 Ebeveyn paneli');
    par.onclick = () => { close(); Sound.play('tap'); parentGate(() => { draft = null; parentTab = 'tasks'; show('parent'); renderParent(); }); };
    const ok = el('button', 'big-btn', 'Tamam'); ok.onclick = close;
    c.append(snd, par, ok);
  });
}
function goWar(path = 'savas/') {
  if (Store.d.tickets > 0) { location.href = path; return; }
  modal((c, close) => {
    c.append(el('div', 'modal-ico', '🎟️'), el('h2', '', 'Biletin bitti'), el('p', '', 'Bir matematik turu bitir, bilet kazan!'));
    const ok = el('button', 'big-btn', 'Tamam'); ok.onclick = close; c.append(ok);
  });
}

/* ----- Dükkân ----- */
// Dükkân iki kapı: Kartopu Savaşı eşyaları ve yarış eşyaları ayrı sekmede
let shopTab = 'war';
function renderShop() {
  $('shopCoins').textContent = Store.d.coins;
  for (const b of document.querySelectorAll('.shop-tab')) { const on = b.dataset.st === shopTab; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }
  const g = $('shopGrid'); g.innerHTML = '';
  for (const [grp, title] of SHOP_GROUPS.filter(([k]) => (k === 'race') === (shopTab === 'race'))) {
    g.append(el('h2', 'shop-group', title));
    for (const it of SHOP.filter(x => x.g === grp)) {
      const card = el('div', 'shop-card'), have = Store.d.inv[it.key] || 0, poor = Store.d.coins < it.price;
      card.append(el('div', 'shop-ico', it.ico), el('div', 'shop-name', it.name), el('div', 'shop-info', it.info));
      if (it.dmg) card.append(el('div', 'shop-dmg', /^\d/.test(it.dmg) ? `💥 ${it.dmg}` : it.dmg));
      card.append(el('div', 'shop-have', `🎒 ${have}`));
      if (grp === 'num' || it.num) card.append(el('span', 'shop-badge', '🔢'));
      const info = el('button', 'shop-info-btn', 'i'); info.setAttribute('aria-label', it.name + ' nedir?');
      info.onclick = () => { Sound.play('tap'); shopInfo(it); };
      card.append(info);
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

// Eşya bilgisi: ne yapar, nasıl kullanılır, ipucu
function shopInfo(it) {
  modal((c, close) => {
    c.classList.add('info');
    c.append(el('div', 'modal-ico', it.ico), el('h2', '', it.name));
    const row = (ico, txt) => { const r = el('div', 'info-row'); r.append(el('span', 'info-ico', ico), el('span', '', txt)); return r; };
    c.append(row('✨', it.desc));
    if (it.dmg) c.append(row('💥', /^\d/.test(it.dmg) ? `Rakipten ${it.dmg} güç götürür` : it.dmg));
    c.append(row('👆', it.how), row('💡', it.tip));
    const ok = el('button', 'big-btn', 'Tamam'); ok.onclick = close; c.append(ok);
  });
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
// Ebeveyn paneli üç sekme: görevler, bilet ve altın, ayarlar
let parentTab = 'tasks';
function renderParent() {
  const body = $('parentBody'); body.innerHTML = '';
  const section = (title) => { const s = el('section', 'p-sec'); s.append(el('h2', '', title)); body.append(s); return s; };
  const tabs = el('div', 'p-tabs');
  for (const [k, txt] of [['tasks', '📋 Görevler'], ['wallet', '🎁 Bilet ve Altın'], ['settings', '⚙️ Ayarlar']]) {
    const b = el('button', 'p-tab' + (parentTab === k ? ' on' : ''), txt);
    b.onclick = () => { if (parentTab === k) return; Sound.play('tap'); parentTab = k; renderParent(); body.scrollTop = 0; };
    tabs.append(b);
  }
  body.append(tabs);
  if (parentTab === 'wallet') return renderParentWallet(section);
  if (parentTab === 'settings') return renderParentSettings(section);

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

}
// Bilet ve altın: ebeveyn denemek ya da ödül vermek için doğrudan ekler/çıkarır (bilet sınırına takılmaz)
function renderParentWallet(section) {
  const change = fn => { fn(); Store.d.tickets = Math.max(0, Math.min(99, Store.d.tickets)); Store.d.coins = Math.max(0, Math.min(9999, Store.d.coins)); Store.save(); Sound.play('tap'); renderParent(); };
  const counter = (ico, val, steps, apply) => {
    const row = el('div', 'p-wallet');
    row.append(el('span', 'p-wico', ico), el('b', 'p-wval', val));
    const btns = el('div', 'p-chips');
    for (const d of steps) { const b = el('button', 'chip-btn' + (d > 0 ? ' plus' : ''), (d > 0 ? '+' : '−') + Math.abs(d)); b.onclick = () => change(() => apply(d)); btns.append(b); }
    row.append(btns); return row;
  };
  const s1 = section('Bilet');
  s1.append(counter('🎟️', Store.d.tickets, [-1, 1, 3, 10], d => { Store.d.tickets += d; }),
    el('p', 'p-note', `Çocuk matematik turlarıyla en fazla ${TICKET_MAX} bilet biriktirebilir; buradan eklenen bilet bu sınıra takılmaz.`));
  const s2 = section('Altın');
  s2.append(counter('🪙', Store.d.coins, [-10, -1, 5, 20, 100], d => { Store.d.coins += d; }));
  const s3 = section('Deneme');
  const t = el('button', 'big-btn', '🧪 10 bilet + 200 altın ekle');
  t.onclick = () => change(() => { Store.d.tickets += 10; Store.d.coins += 200; });
  s3.append(el('p', 'p-note', 'Oyunları ve dükkânı denemek için. İşin bitince yukarıdan geri azaltabilirsin.'), t);
}
function renderParentSettings(section) {
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
  mode = m; Store.d.lastMode = m; Store.save();
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
  $('answers').className = 'answers t-' + cur.spec.t + (q.inStage ? ' hidden' : '');
  const ans = q.inStage ? el('div', 'stage-answers n' + q.opts.length) : $('answers');
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
    const P = inEnglish() ? PRAISE_EN : PRAISE, [word, clip] = first ? pick(P.slice(1)) : P[0];
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
  const before = friendsFor(Store.d.stars), wBefore = worldState(Store.d.stars).open;
  Store.d.stars += stars;
  const after = friendsFor(Store.d.stars), wAfter = worldState(Store.d.stars).open, nw = $('endNew');
  const newWorld = wAfter > wBefore ? WORLDS[wAfter - 1] : null, nf = after > before ? friendAt(after - 1) : null;
  nw.hidden = !newWorld && !nf; nw.innerHTML = '';
  if (newWorld) nw.append(el('b', '', newWorld.ico), el('span', '', `${newWorld.name} açıldı!`));
  else if (nf) nw.append(el('b', '', nf.f), el('span', '', `${nf.w.to} yeni arkadaş!`));
  Store.d.best[key] = Math.max(Store.d.best[key] || 0, stars);
  Store.save();
  const es = $('endStars'); es.innerHTML = '';
  for (let i = 0; i < 3; i++) { const st = el('span', i < stars ? 'on' : '', '★'); st.style.animationDelay = (i * .25) + 's'; es.append(st); }
  const [title, clip] = inEnglish() ? (stars === 3 ? ['Perfect!', 'enp_perfect'] : stars === 2 ? ['Very good!', 'enp_very_good'] : ['Nice work!', 'enp_nice_work'])
    : stars === 3 ? ['Mükemmel!', 'mukemmel'] : stars === 2 ? ['Çok iyi!', 'cok_iyi'] : ['Güzel çalıştın!', 'guzel_calistin'];
  $('endTitle').textContent = title;
  $('endText').textContent = `${ROUND} sorudan ${s} tanesini ilk seferde bildin.`;
  // Altın: yıldız başına 2, Zor seviyede +2, yeni rekorda +1. Bilet: tur başına 1, en fazla TICKET_MAX.
  const coins = stars * 2 + (lv() === 3 ? 2 : 0) + (stars > prevBest ? 1 : 0);
  const ticket = Store.d.tickets < TICKET_MAX;
  Store.d.coins += coins; if (ticket) Store.d.tickets++;
  Store.save();
  const loot = $('endLoot'); loot.innerHTML = '';
  loot.append(el('span', 'chip', `+${coins} 🪙`), el('span', 'chip', ticket ? '+1 🎟️' : `🎟️ ${TICKET_MAX}/${TICKET_MAX}`));
  show('end');
  Sound.play('win'); confetti(40);
  Voice.say(newWorld ? [clip, 0, 0, newWorld.opened] : nf ? [clip, 0, 0, nf.w.clip] : [clip], .9);
}

/* ----- Bahçe ----- */
// Bahçe canlı bir sahne: hayvanlar yürür/zıplar/uçar, çiçekler sallanır. Günde bir kez sulanır.
const G_KIND = {
  '🐞': 'walk', '🦊': 'walk', '🐥': 'walk', '🐑': 'walk', '🦄': 'walk', '🦔': 'walk', '🐌': 'slow', '🐢': 'slow',
  '🐇': 'hop', '🐿️': 'hop', '🐸': 'hop', '🐝': 'fly', '🦋': 'fly', '🐦': 'fly', '🦉': 'fly', '🎈': 'float',
  '🌈': 'sky', '🐠': 'pond', '🏡': 'house',
};
const G_NAME = {
  '🌱': 'Filiz', '🌷': 'Lale', '🌼': 'Papatya', '🐞': 'Uğur Böceği', '🌻': 'Ayçiçeği', '🐝': 'Arı', '🍄': 'Mantar', '🦋': 'Kelebek',
  '🌳': 'Ağaç', '🐌': 'Salyangoz', '🐦': 'Kuş', '🌸': 'Kiraz Çiçeği', '🐇': 'Tavşan', '🍓': 'Çilek', '🦔': 'Kirpi', '🐢': 'Kaplumbağa',
  '🌈': 'Gökkuşağı', '🐿️': 'Sincap', '🐸': 'Kurbağa', '🌺': 'Ebegümeci', '🦊': 'Tilki', '🐥': 'Civciv', '🦉': 'Baykuş', '🍎': 'Elma',
  '🐑': 'Kuzu', '🦄': 'Tek Boynuzlu At', '🌵': 'Kaktüs', '🐠': 'Balık', '🎈': 'Balon', '🏡': 'Ev',
  // akvaryum
  '🐟': 'Balık', '🐚': 'Deniz Kabuğu', '🦀': 'Yengeç', '🪸': 'Mercan', '🐡': 'Balon Balığı', '🦐': 'Karides', '🐙': 'Ahtapot',
  '🪼': 'Denizanası', '🦞': 'Istakoz', '🦑': 'Kalamar', '🐬': 'Yunus', '🦦': 'Su Samuru', '🐧': 'Penguen', '🦭': 'Fok', '🦈': 'Köpekbalığı',
  '🏰': 'Kale', '🐳': 'Balina', '🧜‍♀️': 'Deniz Kızı',
  // orman
  '🌲': 'Çam', '🐛': 'Tırtıl', '🦌': 'Geyik', '🌰': 'Kestane', '🐻': 'Ayı', '🍁': 'Akçaağaç', '🦝': 'Rakun', '🪵': 'Kütük', '🦫': 'Kunduz',
  '🐗': 'Yaban Domuzu', '🦡': 'Porsuk', '🫐': 'Yaban Mersini', '🐺': 'Kurt', '🦇': 'Yarasa', '🐼': 'Panda', '🦥': 'Tembel Hayvan',
  '🦚': 'Tavus Kuşu', '🏕️': 'Kamp', '🧚': 'Peri',
};
// Akvaryumun dibi: kabuk, mercan ve kale kumun üstünde durur
const AQUA_FLOOR = [[50, 88], [20, 86], [80, 87], [35, 90], [65, 90], [8, 88], [92, 88], [28, 84], [72, 84]];
let gardenRaf = 0, gardenEnts = [];
const gardenData = () => (Store.d.garden = Store.d.garden || { last: null, streak: 0 });
const daysSince = k => k ? Math.round((fromKey(dayKey()) - fromKey(k)) / 864e5) : Infinity;
let gardenView = null;   // görüntülenen dünya
function renderGarden(view) {
  const stars = Store.d.stars, ws = worldState(stars), fresh = Store.d.seen, gd = gardenData();
  const total = ws.counts.reduce((a, b) => a + b, 0), wSeen = Store.d.worldSeen || 1;
  const nf = total > fresh ? friendAt(total - 1) : null, newWorld = ws.open > wSeen ? ws.open - 1 : -1;
  // Açılış: yeni arkadaşın ya da yeni dünyanın olduğu yer, yoksa en son bakılan, o da yoksa en son açılan dünya
  if (view == null) view = newWorld >= 0 ? newWorld : nf ? nf.wi : gardenView != null && gardenView < ws.open ? gardenView : ws.open - 1;
  gardenView = view;
  const W = WORLDS[view], offset = WORLDS.slice(0, view).reduce((a, w) => a + w.friends.length, 0);
  $('gardenScene').className = 'garden-scene w-' + W.key;
  $('gardenTitle').textContent = W.title;
  const thirsty = view === 0 && daysSince(gd.last) >= 2;
  $('gardenStars').textContent = stars;
  const g = $('gardenGrid'); g.innerHTML = ''; gardenEnts = [];
  let plant = 0, sky = 0;
  W.friends.slice(0, ws.counts[view]).forEach((f, i) => {
    const kind = (W.kinds ? W.kinds[f] || (view === 1 ? 'swim' : 'plant') : G_KIND[f] || 'plant'), isNew = offset + i >= fresh;
    const big = (W.big || BIG).includes(f);
    const b = el('button', 'friend ' + kind + (big ? ' big' : '') + (kind === 'plant' && thirsty ? ' thirsty' : ''), f);
    b.setAttribute('aria-label', G_NAME[f] || 'Arkadaş');
    const e = { el: b, f, kind, ph: rand(0, 6), x: 50, y: 70, vx: 0, flip: 1 };
    if (kind === 'plant' || kind === 'house') { [e.x, e.y] = (view === 1 ? AQUA_FLOOR : GROUND_SLOTS)[plant++ % (view === 1 ? AQUA_FLOOR : GROUND_SLOTS).length]; }
    else if (kind === 'fly' || kind === 'float') { [e.x, e.y] = SKY_SLOTS[sky++ % SKY_SLOTS.length]; e.cx = e.x; e.cy = e.y; }
    else if (kind === 'bob') { [e.x, e.y] = [[22, 34], [74, 28], [48, 46], [88, 50]][sky++ % 4]; }
    else if (kind === 'sky') { e.x = 80; e.y = 30; }
    else if (kind === 'pond') { e.x = 18; e.y = 86; e.vx = 4; }
    else if (kind === 'swim') { e.x = rand(12, 88); e.y = [22, 34, 46, 58, 68][i % 5]; e.vx = rand(3, 8) * (Math.random() < .5 ? -1 : 1); }
    else if (kind === 'crawl') { e.x = rand(12, 88); e.y = [86, 90][i % 2]; e.vx = 3 * (Math.random() < .5 ? -1 : 1); }
    else { e.x = rand(12, 88); e.y = [64, 72, 80, 88][i % 4]; e.vx = (kind === 'slow' ? 2.2 : kind === 'hop' ? 7 : 5) * (Math.random() < .5 ? -1 : 1); }
    // yeni gelen arkadaş kenardan içeri girer
    if (isNew && e.vx) { e.x = e.vx > 0 ? -6 : 106; }
    if (isNew) b.classList.add('fresh');
    b.onclick = () => {
      Sound.play('tap'); b.classList.remove('jump', 'fresh'); void b.offsetWidth; b.classList.add('jump');
      const bub = el('div', 'g-bubble', G_NAME[f] || ''); bub.style.left = e.x + '%'; bub.style.top = (e.y - 12) + '%';
      $('gardenGrid').append(bub); setTimeout(() => bub.remove(), 1400);
    };
    g.append(b); gardenEnts.push(e);
  });
  // dünyalar arası sekmeler: açık olanlar gezilir, sıradaki kilitli görünür (hedef)
  const tabs = $('gardenTabs'); tabs.innerHTML = '';
  WORLDS.forEach((w, i) => {
    if (i > ws.open) return;
    const locked = i >= ws.open, t = el('button', 'g-tab' + (i === view ? ' on' : '') + (locked ? ' locked' : ''), locked ? '🔒' : w.ico);
    t.setAttribute('aria-label', w.name);
    t.onclick = () => {
      Sound.play('tap');
      if (!locked) { renderGarden(i); return; }
      const bub = el('div', 'g-bubble', `${WORLDS[i - 1].name} dolunca açılır`); bub.style.left = '50%'; bub.style.top = '24%';
      $('gardenGrid').append(bub); setTimeout(() => bub.remove(), 1800);
    };
    tabs.append(t);
  });
  // duyuru: yeni dünya ya da yeni arkadaş
  const ban = $('gardenBanner');
  if (newWorld === view) {
    ban.hidden = false; ban.textContent = `${W.ico} ${W.name} açıldı!`;
    Sound.play('win'); confetti(30); Voice.say([W.opened], .3); setTimeout(() => { ban.hidden = true; }, 3200);
  } else if (nf && nf.wi === view) {
    ban.hidden = false; ban.textContent = `Yeni arkadaş: ${nf.f} ${G_NAME[nf.f] || ''}!`;
    Sound.play('win'); setTimeout(() => { ban.hidden = true; }, 3200);
  } else ban.hidden = true;
  const nx = $('gardenNext'); nx.innerHTML = '';
  if (view !== ws.frontier) nx.append(el('span', '', 'Hepsi senin! 🎉'));
  else {
    const have = ws.have, bar = el('span', 'bar'), fill = el('i'), next = el('span', 'shadow', W.friends[ws.counts[view]]);
    fill.style.width = (have / W.cost * 100) + '%'; bar.append(fill);
    nx.append(el('span', 'star', '★'), bar, el('span', '', `${have}/${W.cost}`), next);   // sıradaki arkadaşın gölgesi
  }
  renderWater();
  Store.d.seen = Math.max(fresh, total); Store.d.worldSeen = Math.max(wSeen, ws.open); Store.save();
  cancelAnimationFrame(gardenRaf);
  let last = performance.now();
  const loop = now => {
    if (screen !== 'garden') return;
    const dt = Math.min(.05, (now - last) / 1000), t = now / 1000; last = now;
    for (const e of gardenEnts) gardenStep(e, dt, t);
    gardenRaf = requestAnimationFrame(loop);
  };
  gardenRaf = requestAnimationFrame(loop);
}
function gardenStep(e, dt, t) {
  let tx = 0, ty = 0, rot = 0, sx = 1;
  const k = e.kind;
  if (k === 'swim') {
    e.x += e.vx * dt;
    if (e.x < 6 && e.vx < 0 || e.x > 94 && e.vx > 0) e.vx = -e.vx;
    if (Math.random() < dt * .1) e.vx = -e.vx;
    sx = e.vx > 0 ? -1 : 1; ty = Math.sin(t * 1.6 + e.ph) * 7; rot = Math.sin(t * 3 + e.ph) * 4;
  } else if (k === 'bob') { ty = Math.sin(t * 1.1 + e.ph) * 14; rot = Math.sin(t * 1.7 + e.ph) * 5; }
  else if (k === 'walk' || k === 'slow' || k === 'hop' || k === 'crawl') {
    e.x += e.vx * dt;
    if (e.x < 6 && e.vx < 0 || e.x > 94 && e.vx > 0) e.vx = -e.vx;
    if (Math.random() < dt * .15) e.vx = -e.vx;   // ara ara fikrini değiştirir
    sx = e.vx > 0 ? -1 : 1;
    ty = k === 'hop' ? -Math.abs(Math.sin(t * 4 + e.ph)) * 16 : -Math.abs(Math.sin(t * (k === 'slow' || k === 'crawl' ? 3 : 9) + e.ph)) * 3;
  } else if (k === 'fly') {
    const px = e.x; e.x = e.cx + Math.sin(t * .5 + e.ph) * 20; e.y = e.cy + Math.sin(t * 1.4 + e.ph) * 6;
    sx = e.x > px ? -1 : 1; rot = Math.sin(t * 12 + e.ph) * 6;
  } else if (k === 'float') { ty = Math.sin(t * 1.2 + e.ph) * 6; rot = Math.sin(t * .9 + e.ph) * 6; }
  else if (k === 'pond') { e.x += e.vx * dt; if (e.x < 10 || e.x > 26) e.vx = -e.vx; sx = e.vx > 0 ? -1 : 1; ty = Math.sin(t * 3) * 2; }
  else if (k === 'plant') rot = Math.sin(t * 1.6 + e.ph) * 5;
  e.el.style.left = e.x + '%'; e.el.style.top = e.y + '%'; e.el.style.zIndex = Math.round(e.y);
  e.el.style.setProperty('--tx', tx + 'px'); e.el.style.setProperty('--ty', ty + 'px');
  e.el.style.setProperty('--rot', rot + 'deg'); e.el.style.setProperty('--sx', sx);
}
// Günlük sulama: yağmur yağar, çiçekler canlanır, +1 altın (her 5 günde +2 daha)
function renderWater() {
  const gd = gardenData(), done = gd.last === dayKey(), btn = $('waterBtn');
  btn.disabled = done; btn.classList.toggle('done', done);
  const aqua = gardenView === 1;
  btn.firstChild.textContent = aqua ? '🍤' : '💧';
  btn.setAttribute('aria-label', aqua ? 'Balıkları besle' : 'Bahçeyi sula');
  btn.querySelector('b').textContent = done ? 'Yarın' : aqua ? 'Yemle' : 'Sula';
  const live = gd.last === dayKey() || gd.last === addDays(dayKey(), -1);
  $('gardenStreak').textContent = live && gd.streak > 1 ? `🔥 ${gd.streak} gün` : '';
}
function waterGarden() {
  const gd = gardenData(), today = dayKey();
  if (gd.last === today) return;
  gd.streak = gd.last === addDays(today, -1) ? gd.streak + 1 : 1; gd.last = today;
  const bonus = gd.streak % 5 === 0 ? 2 : 0;
  Store.d.coins += 1 + bonus; Store.save();
  Sound.play('right');
  const rain = $('gardenRain');
  rain.classList.toggle('food', gardenView === 1);   // akvaryumda yağmur yerine yem taneleri
  for (let i = 0; i < 46; i++) {
    const d = el('i'); d.style.left = rand(0, 100) + '%'; d.style.animationDelay = rand(0, 1.1) + 's'; d.style.animationDuration = rand(.6, 1) + 's';
    rain.append(d); setTimeout(() => d.remove(), 2400);
  }
  setTimeout(() => {
    for (const e of gardenEnts) if (e.kind === 'plant' || (gardenView === 1 && e.kind === 'swim')) { e.el.classList.remove('thirsty'); e.el.classList.remove('grow'); void e.el.offsetWidth; e.el.classList.add('grow'); }
    Sound.play('win'); cheer(`+${1 + bonus} 🪙`); confetti(16);
  }, 1300);
  renderWater();
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
for (const b of document.querySelectorAll('.level')) b.onclick = () => { Sound.play('tap'); Store.d.level = +b.dataset.level; Store.save(); renderCat(); };
$('playBtn').onclick = () => { Sound.play('tap'); startRound(nextMode()); };
$('warBtn').onclick = () => { Sound.play('tap'); goWar(); };
$('raceBtn').onclick = () => { Sound.play('tap'); if (Store.d.tickets > 0 && !Store.d.raceSeen) { Store.d.raceSeen = true; Store.save(); } goWar('yaris/'); };
$('race3dBtn').onclick = () => { Sound.play('tap'); if (Store.d.tickets > 0 && !Store.d.race3dSeen) { Store.d.race3dSeen = true; Store.save(); } goWar('yaris3d/'); };
$('tGo').onclick = () => { Sound.play('tap'); startRound(nextMode()); };
// Oyundan geri tuşuyla dönülürse sayfa bellekten gelir; oyunda kazanılan altın ve harcanan bilet kaybolmasın
addEventListener('pageshow', e => { if (e.persisted) { Store.load(); renderHome(); if (screen === 'games') renderGames(); } });
const openTab = {
  home: () => goHome(),
  games: () => { show('games'); renderGames(); },
  garden: () => { show('garden'); renderGarden(); },
  shop: () => { show('shop'); renderShop(); },
};
for (const t of document.querySelectorAll('.tab')) t.onclick = () => { if (screen === t.dataset.tab) return; Sound.play('tap'); openTab[t.dataset.tab](); };
for (const b of document.querySelectorAll('.shop-tab')) b.onclick = () => { if (shopTab === b.dataset.st) return; Sound.play('tap'); shopTab = b.dataset.st; renderShop(); $('shopGrid').scrollTop = 0; };
$('tasksBtn').onclick = () => { Sound.play('tap'); show('tasks'); renderTasks(); };
$('settingsBtn').onclick = () => { Sound.play('tap'); openSettings(); };
for (const c of document.querySelectorAll('.prac')) c.onclick = () => { Sound.play('tap'); catGroup = c.dataset.g; show('cat'); renderCat(); };
const goHome = () => { clearTimeout(nextTimer); Voice.stop(); show('home'); renderHome(); setTimeout(celebrateNext, 400); };
$('homeBtn').onclick = goHome;
$('gardenHomeBtn').onclick = goHome;
$('waterBtn').onclick = waterGarden;
for (const b of document.querySelectorAll('.back')) b.onclick = goHome;
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

// Yarıştaki "Dükkândan yarış eşyası al" bağlantısı ../#shop ile gelir
if (location.hash === '#shop' || location.hash === '#shop-race') { shopTab = location.hash === '#shop-race' ? 'race' : 'war'; history.replaceState(null, '', location.pathname + location.search); openTab.shop(); }
else {
  show('home');
  renderHome();
  setTimeout(celebrateNext, 600);
}

// Test ve hata ayıklama için küçük bir kapı (oyunu etkilemez)
window.__mg = { get screen() { return screen; }, get cur() { return cur; }, get round() { return round; }, startRound, GEN, build, options, numSay, worldState, friendAt, renderGarden, Store, approveTask, taskCount, taskState, dayKey, addDays, backupCode, restoreBackup, hashPin };
})();
