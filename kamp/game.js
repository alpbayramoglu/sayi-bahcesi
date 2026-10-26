/* Kar Kampı — 20 bölüm (kış başı, kış ortası, kış sonu, bahar), tek seviye
   Çocuk sönük kampın ocağını yakar, ormandan odun keser, misafirleri doyurur.
   Zorluk miktardan değil karardan gelir:
   - Gece ihtiyacı hava durumundan okunur: her kar tanesi 2 odun.
   - Büyük balık iki tabağı, küçük balık bir tabağı doldurur; büyük balık daha ucuz ama tüccarda az.
   - Öğleden sonra tüccar fiyatı artırır: erken takas etmek kazançlı.
   - Bölüm 3'te iskele kurup balığı kendin tutabilirsin; zaman mı, odun mu harcayacağına sen karar verirsin.
   Three.js r128 (../yaris3d/three.min.js); bütün modeller ve dokular kodla üretilir, dış görsel yok, çevrimdışı çalışır.
   Ses: kamp/audio/*.mp3 (kamp/tools/make-audio.sh, Yelda). Kayıt: localStorage 'kamp.v1'. */
'use strict';
(() => {

const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;
const V3 = THREE.Vector3, V2 = THREE.Vector2;
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };

/* ================= Ayarlar ================= */
const CFG = {
  light: 6, perFlake: 2, strictFrom: 4, dropOcak: .5, dropKiler: .5, cap: 5, perTree: 2, hits: 4, day: 360, fishTime: 3.2, pier: 8, bigEvery: 3, boatTime: 2.2, growTime: 45, bakeTime: 4,
  prices: { wood: 1, fish: 3, big: 5, smoked: 6, wheat: 2, bread: 6, stone: 2, plank: 2 },          // pazarda müşteriye satış fiyatı (altın)
  ch: {
    1: { flakes: 2, people: 0 },
    2: { flakes: 2, people: 4, stock: { fish: 6, big: 1 }, price: { fish: 2, big: 3 }, untimed: true },
    3: { flakes: 3, people: 5, stock: { fish: 6, big: 2 }, price: { fish: 2, big: 3 }, untimed: true, pier: true },
    4: { day: 420, flakes: 2, people: 5, stock: { fish: 8, big: 3 }, price: { fish: 2, big: 3 }, rise: true, pierBuilt: true, market: true, coins: 0, house: { id: 'ev', cost: 12 }, ups: ['axe', 'frame'] },
    5: { day: 420, days: [{ flakes: 2 }, { flakes: 4, storm: true }], people: 5, stock: { fish: 8, big: 2 }, price: { fish: 2, big: 3 }, pierBuilt: true, depot: 16, built: ['ev'] },
    6: { day: 420, flakes: 3, people: 5, stock: { fish: 8, big: 2 }, price: { fish: 2, big: 3 }, pierBuilt: true, depot: 16, helper: ['orman', 'ocak', 'depo', 'tekrar', 'tekrar2', 'tekrar3'], helperGoal: 6, built: ['ev'] },
    7: { day: 420, flakes: 3, people: 5, stock: { fish: 8, big: 2 }, price: { fish: 2, big: 3 }, pierBuilt: true, depot: 20, depotGoal: 12, helper: ['orman', 'bant', 'ocak', 'depo', 'tekrar', 'tekrar2', 'tekrar3'], belt: { cost: 6, to: 'depo' }, market: true, coins: 4, ups: ['belt', 'frame'], built: ['ev'] },
    8: { day: 420, flakes: 3, people: 5, stock: { fish: 8, big: 2 }, price: { fish: 2, big: 3 }, pierBuilt: true, helper: ['orman', 'bant', 'ocak', 'tekrar', 'tekrar2', 'tekrar3'], belt: { built: true, to: 'saw' }, saw: true, market: true, coins: 6, ups: ['saw', 'axe'], house: { id: 'ev2', planks: 10 }, built: ['ev'] },
    9: { flakes: 3, people: 5, stock: { fish: 10, big: 2 }, price: { fish: 2, big: 3 }, pierBuilt: true, depot: 16, helper: ['orman', 'ocak', 'depo', 'tekrar', 'tekrar2', 'tekrar3'], smoke: true, market: true, orders: ['wood', 'fish', 'fish', 'smoked', 'smoked', 'big'], coins: 0, coinGoal: 15, built: ['ev', 'ev2'] },
    10: { flakes: 3, people: 5, stock: { fish: 8, big: 2 }, price: { fish: 2, big: 3 }, pierBuilt: true, depot: 16, helper: ['orman', 'ocak', 'depo', 'tekrar', 'tekrar2', 'tekrar3'], frost: { radius: 3.5, cost: { wood: 4 } }, built: ['ev', 'ev2'] },
    11: { flakes: 3, people: 6, stock: { fish: 8, big: 2 }, price: { fish: 2, big: 3 }, pierBuilt: true, depot: 16, helper: ['orman', 'ocak', 'depo', 'tekrar', 'tekrar2', 'tekrar3'], lost: true, smoke: true, built: ['ev', 'ev2'] },
    12: { flakes: 3, people: 6, stock: { fish: 8, big: 2 }, price: { fish: 2, big: 3 }, pierBuilt: true, helper: ['orman', 'bant', 'ocak', 'tekrar', 'tekrar2', 'tekrar3'], belt: { built: true, to: 'saw' }, saw: true, bridge: { plank: 12 }, quarry: true, stoneGoal: 4, built: ['ev', 'ev2'] },
    13: { flakes: 4, people: 6, stock: { fish: 8, big: 2 }, price: { fish: 2, big: 3 }, pierBuilt: true, depot: 16, helper: ['orman', 'ocak', 'depo', 'tekrar', 'tekrar2', 'tekrar3'], quarry: true, stoneStore: true, frost: { radius: 3.2, cost: { stone: 2, wood: 2 } }, built: ['ev', 'ev2', 'kopru'] },
    15: { season: 'spring', flakes: 1, pierBuilt: true, stock: { fish: 8, big: 2 }, price: { fish: 2, big: 3 }, people: 6, boat: true, depot: 16, helper: ['orman', 'ocak', 'depo', 'tekrar', 'tekrar2', 'tekrar3'], smoke: true, built: ['ev', 'ev2', 'kopru'] },
    16: { season: 'spring', flakes: 1, pierBuilt: true, stock: { fish: 8, big: 2 }, price: { fish: 2, big: 3 }, people: 6, boat: true, farm: true, coins: 6, wheatGoal: 6, built: ['ev', 'ev2', 'kopru'] },
    17: { season: 'spring', flakes: 1, pierBuilt: true, stock: { fish: 8, big: 2 }, price: { fish: 2, big: 3 }, people: 8, noTrader: true, boat: true, farm: true, coins: 6, bakery: true, smoke: true, depot: 16, built: ['ev', 'ev2', 'kopru'] },
    18: { season: 'spring', flakes: 1, pierBuilt: true, stock: { fish: 8, big: 2 }, price: { fish: 2, big: 3 }, people: 8, boat: true, farm: true, coins: 4, bakery: true, smoke: true, market: true, orders: ['wheat', 'bread', 'bread', 'smoked', 'big', 'fish'], coinGoal: 25, built: ['ev', 'ev2', 'kopru'] },
    19: { season: 'spring', flakes: 1, pierBuilt: true, stock: { fish: 8, big: 2 }, price: { fish: 2, big: 3 }, people: 8, belt: { built: true, to: 'saw' }, saw: true, quarry: true, stoneStore: true, helper: ['orman', 'bant', 'ocak', 'tekrar', 'tekrar2', 'tekrar3'], builds: { ev3: { plank: 8, stone: 4 }, kule: { plank: 6, stone: 2 } }, built: ['ev', 'ev2', 'kopru'] },
    20: { season: 'spring', flakes: 1, pierBuilt: true, stock: { fish: 8, big: 2 }, price: { fish: 2, big: 3 }, people: 8, boat: true, farm: true, coins: 6, bakery: true, smoke: true, depot: 16, builds: { sofra: { bread: 2, smoked: 2, big: 1 } }, final: true, built: ['ev', 'ev2', 'kopru', 'ev3', 'kule'] },
    14: { days: [{ flakes: 3 }, { flakes: 4, storm: true }, { flakes: 5, frost: true }], people: 6, stock: { fish: 9, big: 2 }, price: { fish: 2, big: 3 }, pierBuilt: true, depot: 24, helper: ['orman', 'bant', 'ocak', 'depo', 'tekrar', 'tekrar2', 'tekrar3'], belt: { built: true, to: 'depo' }, smoke: true, quarry: true, stoneStore: true, frost: { radius: 3.2, cost: { stone: 2, wood: 2 } }, built: ['ev', 'ev2', 'kopru'] },
  },
};
const CC = () => CFG.ch[G.ch];
const dayLen = () => CC().day || CFG.day;
const dayCfg = () => { const c = CC(); return c.days ? c.days[Math.min(G.dayIdx, c.days.length - 1)] : { flakes: c.flakes }; };
const CHAPTERS = [
  { title: 'Varış', sub: 'Ocağı yak, soğuğu oku', text: 'Kış erken geldi. Vadinin ortasındaki eski kampın ocağı yıllardır sönük. Ocağı yak, sonra geceye hazırlan: gökyüzündeki her kar tanesi için ocakta iki odun olmalı.' },
  { title: 'İlk Komşu', sub: 'Büyük balık, küçük balık', text: 'Yolda kalan dört kişilik bir aile kampa sığındı. Herkesin tabağına balık lazım. Büyük balık iki tabağı doldurur, küçük balık bir tabağı. Tüccarın büyük balığı az, iyi düşün. Acele yok, hazır olunca uyursun.' },
  { title: 'Buz Gölü', sub: 'Takas mı, iskele mi?', text: 'Bir misafir daha geldi ve bu gece daha soğuk. Gölde balık var ama önce iskele kurmak gerek. Odununu takasa mı harcarsın, iskeleye mi? Balığı kendin tutmak zaman alır. Karar senin.' },
  { title: 'Pazar', sub: 'Para ve para üstü', text: 'Kampın kendi pazar tezgâhı açıldı. Müşteriler odun ve balık istiyor: istediklerini ver, toplamı hesapla, para üstünü doğru ver. Kazandığın altınla yeni bir ev kurabilir ya da aletlerini geliştirebilirsin. İkisine birden yetmeyebilir.' },
  { title: 'Fırtına', sub: 'İki günlük plan', text: 'Baykuş yarın fırtına olacağını söylüyor. Fırtınada kapılar karla kapanır, ormana ve göle çıkılamaz. Bugünü geçirirken yarın için de odun biriktirmelisin. Odunluğun bir sınırı var.' },
  { title: 'Yardımcı', sub: 'Kartlarla sıra ver', text: 'Kampa bir yardımcı katıldı. Ona kartlarla ne yapacağını sırayla söylersin: ormana git, ocağa götür, tekrarla. Yanlış sıra verirsen yanlış yere gider. Bugün yardımcı en az 6 odun taşımalı.' },
  { title: 'Bant', sub: 'Darboğazı bul', text: 'Ormandan odunluğa bir taşıma bandı kur. Odunu banta koyunca kendi gider, ama bant yavaşsa odun başında birikir. Akşama kadar odunlukta 12 odun olsun.' },
  { title: 'Testere', sub: 'Üretim zinciri', text: 'Bant artık testereye gidiyor. Testere her kütükten iki tahta çıkarır. Yeni gelecek aile için on tahtalık bir ev kur. Testere ya da bant yavaş kalırsa bütün zincir yavaşlar.' },
  { title: 'Tütsühane', sub: 'Balığı mı yedireyim, satayım mı?', text: 'Tütsühanede balık tütsülenir ve müşteriler tütsülü balığa altı altın verir. Ama tabaklar da balık bekliyor. Akşama kadar 15 altın biriktir, kimseyi de aç bırakma.' },
  { title: 'Soğuk Dalgası', sub: 'Sobaları yerleştir', text: 'Bu gece soğuk dalgası geliyor. Her ev bir sobanın sıcak halkasının içinde kalmalı. Soba yerlerinin etrafındaki halkalara bak: hangi yer birden çok evi ısıtır? En az odunla bütün evleri ısıt.' },
  { title: 'Kayıp Yolcu', sub: 'İzleri takip et', text: 'Bir yolcu ormanda kaybolmuş. Kardaki ayak izlerini takip et, gerekirse ağaçları kesip yol aç. Bulunca yolcu seni izler, onu kampa getir. Bu gece onun da tabağı dolmalı.' },
  { title: 'Köprü', sub: 'Uçurumun karşısı', text: 'Ormanın kuzeyinde bir uçurum var, karşısında taş dolu kayalar. Testereden çıkan 12 tahtayla bir köprü kur, karşıya geç, kayaları kır ve kamptaki taşlığa 4 taş getir.' },
  { title: 'Taş Soba', sub: 'İki kaynaklı plan', text: 'Bu gece hava daha da soğuk ve sıcak halkalar küçüldü. Taş sobalar 2 taş ve 2 odun ister. Taşı uçurumun karşısından getirmen gerekiyor. Önce hangi sobaların gerektiğini düşün, sonra taşları topla.' },
  { title: 'Büyük Soğuk', sub: 'Üç günlük plan', text: 'Kışın son ve en zor üç günü. İkinci gün fırtına var, kapılar kapanacak. Üçüncü gece soğuk dalgası geliyor. Odunluğu doldur, sobaların taşını önceden getir. Her şeyi bildiklerinle planla.' },
  { title: 'Buzlar Eriyor', sub: 'Kayıkla balık', text: 'Bahar geldi, göl eridi. İskelenin ucundaki kayığa bin: göl ortasında balık daha hızlı çıkar ve her ikinci balık büyüktür. Kayık sırtın dolunca kendiliğinden döner.' },
  { title: 'Tarla', sub: 'Ekim zamanı', text: 'Doğu kapısının dışında üç tarla var. Her tohum 2 altın. Ekilen buğday bir süre büyür, olgunlaşınca hasat edilir. Erken ekersen akşama yetişir. Ambara 6 buğday koy.' },
  { title: 'Fırın', sub: 'Ekmek iki tabak', text: 'Tüccar bahar yolculuğuna çıktı, takas yok. Sekiz tabak var. Fırın 2 buğday ve 1 odunla bir ekmek yapar, ekmek iki tabağı doldurur. Balık, tütsü ve ekmeği birlikte planla.' },
  { title: 'Hasat Pazarı', sub: 'En kârlı ürün', text: 'Hasat pazarı kuruldu. Buğday 2, ekmek ve tütsülü balık 6 altın ediyor. Hangisini yapmak daha kârlı? Akşama kadar 25 altın biriktir, tabakları da unutma.' },
  { title: 'Kasaba', sub: 'İki kaynak, iki yapı', text: 'Kamp büyüyor. Yeni bir ev için 8 tahta ve 4 taş, gözetleme kulesi için 6 tahta ve 2 taş gerekiyor. Testereyi, bandı ve taş ocağını birlikte çalıştır.' },
  { title: 'Bahar Şenliği', sub: 'Final', text: 'Kışı birlikte atlattık. Şenlik sofrasına 2 ekmek, 2 tütsülü balık ve 1 büyük balık koy, herkesin tabağını doldur, ocağı yak. Kamp artık bir köy.' },
];
const COATS = [{ coat: '#c4473d', hat: '#27324a' }, { coat: '#d6992c', hat: '#3a2d28' }, { coat: '#2e7a60', hat: '#ece6d6' }];
const LINES = {
  k1_ocak: 'Ocak sönmüş. Ormandan odun getir, ocağı yakalım.',
  k1_yandi: 'Ocak yandı! Şimdi gece için odun lazım.',
  k_hava: 'Bu geceki soğuğa bak. Her kar tanesi için iki odun lazım.',
  k_hazir: 'Her şey hazır. Ay düğmesine dokun, uyuyalım.',
  k_karar: 'Kar tanelerini bir daha say. Ocakta yeterince odun var mı? Karar senin.',
  k_aksam_say: 'Akşam oluyor. Kar tanelerini bir daha say.',
  k_gunaydin: 'Günaydın! Gece herkes sıcacık uyudu.',
  k_usuduk: 'Dün gece üşüdük. Bir daha deneyelim. Bu sefer önce plan yapalım.',
  k2_misafir: 'Misafirlerimiz geldi. Herkesin tabağına balık lazım.',
  k2_balik: 'Büyük balık iki tabağı doldurur, küçük balık bir tabağı.',
  k2_tuccar: 'Tüccarın büyük balığı az. Odununu dikkatli harca.',
  k_fiyat: 'Öğleden sonra oldu. Tüccar fiyatları artırdı.',
  k_stok: 'Tüccarın o balığı bitti.',
  k_yeni: 'Bir misafir daha geldi. Hava da daha soğuk.',
  k3_gol: 'Gölde balık var. İskele kurarsak balığı kendimiz tutarız.',
  k3_iskele: 'İskele hazır! Deliğin başında dur, balık tut.',
  k3_secim: 'Odununu takasa mı harcarsın, iskeleye mi? Sen karar ver.',
  k_aksam: 'Akşam oluyor. Gece için her şey hazır mı?',
  k_dolu: 'Sırtın doldu. Önce bunları bırak.',
  k_ipucu_ocak: 'Ocağa bak. Kar tanelerini say.',
  k_ipucu_kiler: 'Kilere bak. Kimin tabağı boş?',
  k_bolum: 'Harika! Bölümü bitirdin.',
  k4_pazar: 'Pazar tezgâhımız açıldı. Müşterinin istediğini ver, parasını al.',
  k4_ev: 'Yeni bir ev için on iki altın biriktir.',
  k4_dukkan: 'Keskin balta işini hızlandırır, büyük çerçeve daha çok taşır. Ama altının ev için de lazım.',
  k4_ustu: 'Para üstünü ver.',
  k4_toplam: 'Toplam kaç altın ediyor?',
  k4_dogru: 'Doğru! Müşteri bahşiş verdi.',
  k_up: 'Aletin gelişti!',
  k_ev_bitti: 'Ev hazır! Yeni bir aile gelebilir.',
  k5_firtina: 'Yarın fırtına var. Ormana çıkamayacağız. Bugünden odun biriktir.',
  k5_depo: 'Fazla odunu odunluğa koy. Yarın oradan alırsın.',
  k5_firtina_geldi: 'Fırtına başladı. Kapılar karla kapandı.',
  k6_yardimci: 'Bir yardımcımız var. Ona kartlarla ne yapacağını söyle.',
  k6_tekrar: 'Tekrarla kartı olmazsa yardımcı bir kez yapıp durur.',
  k6_bos: 'Yardımcının elinde odun yok. Sırayı kontrol et.',
  k7_bant: 'Ormandan odunluğa bir bant kuralım. Odunu banta koy, kendi gitsin.',
  k7_tikandi: 'Bant yetişemiyor, odun birikiyor. Bandı hızlandırabilirsin.',
  k8_testere: 'Testere her kütükten iki tahta çıkarır. Yeni ev için on tahta lazım.',
  k8_dolu: 'Tahta yığını doldu. Tahtaları eve taşı.',
  k9_tutsu: 'Tütsühaneye balık koy, tütsülü balık çıkar. Müşteriler tütsüye altı altın veriyor.',
  k9_hedef: 'Akşama kadar on beş altın biriktir.',
  k10_soguk: 'Soğuk dalgası geliyor. Her ev bir sobanın sıcak halkasında kalmalı.',
  k10_soba: 'Sobayı nereye koyarsan en çok evi ısıtır? Halkalara bak.',
  k11_kayip: 'Bir yolcu ormanda kaybolmuş. Ayak izlerini takip et.',
  k11_kuzey: 'Yolcu kuzeyde, yukarı doğru.',
  k11_guney: 'Yolcu güneyde, aşağı doğru.',
  k11_bati: 'Yolcu batıda, sola doğru.',
  k11_dogu: 'Yolcu doğuda, sağa doğru.',
  k11_yakin: 'Çok yaklaştın!',
  k11_bulundu: 'Buldun! Yolcuyu kampa götür.',
  k11_kampta: 'Yolcu kampta. Ona da bir tabak lazım.',
  k12_kopru: 'Uçurumun karşısında taş var. On iki tahtayla bir köprü kur.',
  k12_tas: 'Kayaları kır, taşları kamptaki taşlığa getir.',
  k13_tassoba: 'Taş sobalar iki taş ve iki odun ister. Halkalar küçüldü, iyi düşün.',
  k14_buyuk: 'Büyük soğuk geliyor. Üç gün dayanmamız lazım.',
  k14_dalga: 'Bu gece soğuk dalgası var. Evler sıcak kalmalı.',
  k15_bahar: 'Bahar geldi! Göl eridi. Kayığa bin, gölün ortasında balık tut.',
  k15_kayik: 'Kayıkla açılınca her ikinci balık büyük çıkıyor.',
  k16_tarla: 'Tarlaya tohum ek. Büyümesi zaman alır, erken ekersen akşama hasat edersin.',
  k16_ambar: 'Buğdayları ambara koy.',
  k16_hasat: 'Buğday olgunlaştı, hasat zamanı!',
  k17_firin: 'Fırın iki buğday ve bir odunla ekmek yapar. Ekmek iki tabağı doldurur.',
  k17_tuccar: 'Tüccar bahar yolculuğuna çıktı. Yemeği kendimiz bulacağız.',
  k18_pazar: 'Hasat pazarı kuruldu. Ekmek ve tütsü çok para eder.',
  k19_kasaba: 'Kamp büyüyor. Yeni bir ev ve gözetleme kulesi kuralım.',
  k20_senlik: 'Bahar şenliği! Sofraya ekmek, tütsülü balık ve büyük balık koy.',
  k20_son: 'Kamp artık bir köy. Kışı birlikte atlattık. Aferin!',
  // cümle parçaları: eksikler ve hava durumu sayıyla birlikte okunur
  e_ocaga: 'Ocağa', e_odun_eksik: 'odun eksik kaldı.', e_tabak: 'tabak boş kaldı.', e_ev: 'Ev bitmedi.',
  e_yardimci: 'Yardımcı', e_odun_daha: 'odun daha taşımalıydı.', e_odunluk: 'Odunlukta', e_odun_eksikti: 'odun eksikti.',
  e_altin: 'altın eksik kaldı.', e_soguk_ev: 'ev sıcak halkanın dışında kaldı.', e_yolcu: 'Yolcu kampa gelmedi.', e_kopru: 'Köprü bitmedi.',
  e_taslik: 'Taşlıkta', e_tas: 'taş eksik kaldı.', e_ambar: 'Ambarda', e_bugday: 'buğday eksik kaldı.',
  e_kule: 'Kule bitmedi.', e_sofra: 'Şenlik sofrası kurulmadı.', e_yeni_ev: 'Yeni ev bitmedi.', e_bu_gece: 'Bu gece', e_kar: 'kar tanesi var.',
  // yardımcı kartları
  c_orman: 'Ormana git, odun kes.', c_ocak: 'Ocağa götür.', c_depo: 'Odunluğa götür.', c_bant: 'Banta koy.', c_tekrar: 'Baştan tekrarla.',
};

/* ================= Kayıt ================= */
const Save = {
  key: 'kamp.v1',
  d: { color: 0, done: {}, sound: true },
  load() {
    try { const v = JSON.parse(localStorage.getItem(this.key)); if (v && typeof v === 'object') Object.assign(this.d, v); } catch (e) {}
    if (!this.d.done || typeof this.d.done !== 'object') this.d.done = {};
    if (!COATS[this.d.color]) this.d.color = 0;
  },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.d)); } catch (e) {} },
};
Save.load();

/* ================= Ses ================= */
const Snd = {
  ctx: null, buf: new Map(), playing: [], gen: 0, noise: null,
  unlock() {
    try {
      if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback';
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state !== 'running') this.ctx.resume();
    } catch (e) {}
  },
  load(name) {
    if (!this.buf.has(name)) {
      this.buf.set(name, fetch(/^n\d+$/.test(name) ? `../audio/${name}.mp3` : `audio/${name}.mp3`).then(r => r.arrayBuffer())
        .then(b => new Promise((ok, no) => this.ctx.decodeAudioData(b, ok, no)))
        .catch(() => { this.buf.delete(name); return null; }));
    }
    return this.buf.get(name);
  },
  // Tek kuyruk: yeni bir cümle başlayınca öncekisi susar.
  // Bir öğe ya tek bir cümle ('k_hava') ya da parçalardan kurulan cümle (['e_ocaga', 'n2', 'e_odun_eksik']).
  // Cümleler arasında kısa bir duraklama, parçalar arasında neredeyse hiç yok. Sayılar Sayı Bahçesi'nin n0–n100 kayıtları.
  last: null,
  async say(items) {
    this.stopVoice(); this.last = items;
    if (!Save.d.sound || !this.ctx) return;
    const gen = this.gen, groups = items.map(x => Array.isArray(x) ? x : [x]);
    const bufs = await Promise.all(groups.map(g => Promise.all(g.map(n => this.load(n)))));
    if (gen !== this.gen) return;
    let t = this.ctx.currentTime + .05;
    for (const g of bufs) {
      for (const b of g) { if (!b) continue; const s = this.ctx.createBufferSource(); s.buffer = b; s.connect(this.ctx.destination); s.start(t); this.playing.push(s); t += b.duration + .04; }
      t += .35;
    }
  },
  replay() { if (this.last) this.say(this.last); },
  stopVoice() { this.gen++; for (const s of this.playing) try { s.stop(); } catch (e) {} this.playing = []; },
  tone(f, dur, { type = 'sine', gain = .12, delay = 0, to = 0 } = {}) {
    const a = this.ctx; if (!a || !Save.d.sound) return;
    const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + .05);
  },
  hiss(dur, { freq = 1200, q = 1, gain = .12, type = 'bandpass', delay = 0 } = {}) {
    const a = this.ctx; if (!a || !Save.d.sound) return;
    if (!this.noise) { const b = a.createBuffer(1, a.sampleRate, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; this.noise = b; }
    const t = a.currentTime + delay, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    s.buffer = this.noise; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(a.destination); s.start(t); s.stop(t + dur + .05);
  },
  fx(name) {
    try {
      if (name === 'chop') { this.hiss(.09, { freq: 900, q: 2, gain: .2 }); this.tone(140, .12, { type: 'triangle', gain: .18, to: 80 }); }
      else if (name === 'fall') { this.tone(200, .4, { type: 'triangle', gain: .12, to: 60 }); this.hiss(.35, { freq: 400, gain: .08, type: 'lowpass', delay: .25 }); }
      else if (name === 'pick') this.tone(620, .07, { gain: .06, to: 900 });
      else if (name === 'drop') this.tone(420, .08, { type: 'triangle', gain: .08, to: 300 });
      else if (name === 'trade') [660, 880].forEach((f, i) => this.tone(f, .12, { type: 'triangle', gain: .08, delay: i * .07 }));
      else if (name === 'splash') { this.hiss(.28, { freq: 2400, q: .7, gain: .12, type: 'highpass' }); this.tone(900, .08, { gain: .05, delay: .05 }); }
      else if (name === 'ignite') { this.hiss(.8, { freq: 500, q: .5, gain: .2, type: 'lowpass' }); this.tone(110, .7, { type: 'sine', gain: .12, to: 220 }); }
      else if (name === 'build') [392, 523, 659].forEach((f, i) => this.tone(f, .16, { type: 'triangle', gain: .1, delay: i * .1 }));
      else if (name === 'done') [523, 659, 784, 1047].forEach((f, i) => this.tone(f, .22, { type: 'triangle', gain: .1, delay: i * .11 }));
      else if (name === 'warn') this.tone(330, .2, { type: 'triangle', gain: .08, to: 260 });
      else if (name === 'tap') this.tone(880, .05, { gain: .04 });
    } catch (e) {}
  },
};

/* ================= Simgeler (tuval) ================= */
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function drawFish(c, body, belly, tail) {
  c.fillStyle = tail; c.beginPath(); c.moveTo(-28, 0); c.lineTo(-48, -19); c.lineTo(-42, 0); c.lineTo(-48, 19); c.closePath(); c.fill();
  c.fillStyle = body; c.beginPath(); c.ellipse(4, 0, 38, 20, 0, 0, TAU); c.fill();
  c.fillStyle = belly; c.beginPath(); c.ellipse(8, 8, 26, 8, 0, 0, TAU); c.fill();
  c.fillStyle = '#1d2a36'; c.beginPath(); c.arc(26, -5, 4.5, 0, TAU); c.fill();
}
function drawIcon(c, name, x, y, s, opt = {}) {
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100); c.lineJoin = c.lineCap = 'round';
  if (opt.alpha !== undefined) c.globalAlpha = opt.alpha;
  if (name === 'log') {
    c.rotate(-.32);
    c.fillStyle = '#9b5f3a'; rr(c, -42, -17, 74, 34, 17); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-28, -6); c.lineTo(8, -6); c.moveTo(-20, 7); c.lineTo(14, 7); c.stroke();
    c.fillStyle = '#ecc590'; c.beginPath(); c.ellipse(32, 0, 11, 17, 0, 0, TAU); c.fill();
    c.strokeStyle = '#c18e5c'; c.lineWidth = 3; c.beginPath(); c.ellipse(32, 0, 5, 9, 0, 0, TAU); c.stroke();
  } else if (name === 'fish') drawFish(c, '#80b4d3', '#c2e0f0', '#5a8fb1');
  else if (name === 'big') { c.scale(1.18, 1.18); drawFish(c, '#f29a6e', '#fbd2b8', '#d8714a'); }
  else if (name === 'fire') {
    c.fillStyle = '#ff7b1f'; c.beginPath(); c.moveTo(0, -46); c.bezierCurveTo(34, -10, 36, 22, 0, 42); c.bezierCurveTo(-36, 22, -30, -6, -10, -24); c.bezierCurveTo(-8, -8, 4, -10, 0, -46); c.fill();
    c.fillStyle = '#ffd25a'; c.beginPath(); c.moveTo(0, -6); c.bezierCurveTo(18, 10, 18, 28, 0, 38); c.bezierCurveTo(-18, 28, -16, 12, 0, -6); c.fill();
  } else if (name === 'flake') {
    c.strokeStyle = opt.c || '#cfe8ff'; c.lineWidth = 9;
    for (let i = 0; i < 6; i++) { c.save(); c.rotate(i * Math.PI / 3); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -40); c.moveTo(0, -24); c.lineTo(-12, -34); c.moveTo(0, -24); c.lineTo(12, -34); c.stroke(); c.restore(); }
  } else if (name === 'person') {
    c.fillStyle = opt.c || '#e9edf3'; rr(c, -24, -4, 48, 46, 20); c.fill();
    c.fillStyle = '#f0c6a0'; c.beginPath(); c.arc(0, -22, 17, 0, TAU); c.fill();
    c.fillStyle = opt.h || '#3a4660'; c.beginPath(); c.arc(0, -25, 17.5, Math.PI, TAU); c.fill();
  } else if (name === 'check') {
    c.fillStyle = '#3fbf7a'; c.beginPath(); c.arc(0, 0, 44, 0, TAU); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 12; c.beginPath(); c.moveTo(-20, 2); c.lineTo(-6, 17); c.lineTo(22, -14); c.stroke();
  } else if (name === 'moon') {
    c.fillStyle = '#ffe39a'; c.beginPath(); c.arc(0, 0, 40, 0, TAU); c.fill();
    c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(20, -14, 33, 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over';
  } else if (name === 'owl') {
    c.fillStyle = '#7d5b3e'; c.beginPath(); c.moveTo(-30, -30); c.lineTo(-20, -48); c.lineTo(-8, -34); c.lineTo(8, -34); c.lineTo(20, -48); c.lineTo(30, -30); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(0, 6, 38, 42, 0, 0, TAU); c.fill();
    c.fillStyle = '#d9c3a0'; c.beginPath(); c.ellipse(0, 20, 24, 24, 0, 0, TAU); c.fill();
    for (const sx of [-1, 1]) { c.fillStyle = '#fff'; c.beginPath(); c.arc(sx * 15, -10, 14, 0, TAU); c.fill(); c.fillStyle = '#1f2630'; c.beginPath(); c.arc(sx * 15, -9, 6.5, 0, TAU); c.fill(); }
    c.fillStyle = '#f0a33a'; c.beginPath(); c.moveTo(-6, 2); c.lineTo(6, 2); c.lineTo(0, 12); c.closePath(); c.fill();
  } else if (name === 'pier') {
    c.fillStyle = '#b07a4c'; for (let i = 0; i < 4; i++) { rr(c, -44 + i * 23, -24, 19, 48, 4); c.fill(); }
    c.fillStyle = '#6e4a30'; rr(c, -46, -4, 92, 8, 3); c.fill();
  } else if (name === 'coin') {
    c.fillStyle = '#d99a1e'; c.beginPath(); c.arc(0, 5, 40, 0, TAU); c.fill();
    c.fillStyle = '#ffcf4a'; c.beginPath(); c.arc(0, 0, 40, 0, TAU); c.fill();
    c.strokeStyle = '#e0a526'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, 27, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(-14, -17, 10, 6, -.6, 0, TAU); c.fill();
  } else if (name === 'plank') {
    c.rotate(-.25); c.fillStyle = '#c99358'; rr(c, -40, -32, 92, 22, 5); c.fill();
    c.fillStyle = '#e2b47e'; rr(c, -46, -10, 92, 24, 5); c.fill();
    c.strokeStyle = 'rgba(140,90,40,.45)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-38, -1); c.lineTo(36, -2); c.moveTo(-30, 7); c.lineTo(40, 7); c.stroke();
  } else if (name === 'house') {
    c.fillStyle = '#b37a4e'; rr(c, -34, -6, 68, 46, 6); c.fill();
    c.fillStyle = '#7a4e30'; c.beginPath(); c.moveTo(-46, -2); c.lineTo(0, -40); c.lineTo(46, -2); c.closePath(); c.fill();
    c.fillStyle = '#f6f9fd'; c.beginPath(); c.moveTo(-40, -6); c.lineTo(0, -38); c.lineTo(40, -6); c.lineTo(30, -6); c.lineTo(0, -28); c.lineTo(-30, -6); c.closePath(); c.fill();
    c.fillStyle = '#5a3a26'; rr(c, -10, 12, 20, 28, 3); c.fill(); c.fillStyle = '#ffd27a'; rr(c, 14, 4, 14, 12, 2); c.fill();
  } else if (name === 'saw') {
    c.fillStyle = '#c9d0d8'; c.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r = i % 2 ? 33 : 44; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill();
    c.fillStyle = '#7d838c'; c.beginPath(); c.arc(0, 0, 11, 0, TAU); c.fill();
  } else if (name === 'belt') {
    c.fillStyle = '#3a3f47'; rr(c, -46, -10, 92, 32, 16); c.fill();
    c.fillStyle = '#9aa2ad'; for (const x of [-30, 0, 30]) { c.beginPath(); c.arc(x, 6, 8, 0, TAU); c.fill(); }
    c.fillStyle = '#ffc94a'; c.fillRect(-30, -31, 46, 8); c.beginPath(); c.moveTo(14, -40); c.lineTo(38, -27); c.lineTo(14, -14); c.closePath(); c.fill();
  } else if (name === 'axe') {
    c.rotate(.5); c.fillStyle = '#9a6a44'; rr(c, -6, -44, 12, 88, 6); c.fill();
    c.fillStyle = '#b8c0cb'; c.beginPath(); c.moveTo(4, -40); c.quadraticCurveTo(46, -30, 40, 6); c.lineTo(4, -8); c.closePath(); c.fill();
    c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.beginPath(); c.moveTo(38, -24); c.lineTo(40, 2); c.stroke();
  } else if (name === 'frame') {
    c.strokeStyle = '#8a5a38'; c.lineWidth = 8; rr(c, -26, -42, 52, 84, 8); c.stroke();
    c.fillStyle = '#9b5f3a'; for (const y of [-30, -8, 14]) { rr(c, -36, y, 72, 17, 8); c.fill(); }
  } else if (name === 'tree') {
    c.fillStyle = '#7a2c37'; c.fillRect(-6, 26, 12, 18);
    for (const [y, w] of [[34, 44], [10, 34], [-14, 24]]) { c.fillStyle = '#5a8ad4'; c.beginPath(); c.moveTo(-w, y); c.lineTo(0, y - 34); c.lineTo(w, y); c.closePath(); c.fill(); c.fillStyle = '#eef5fd'; c.beginPath(); c.moveTo(-w * .36, y - 22); c.lineTo(0, y - 34); c.lineTo(w * .36, y - 22); c.closePath(); c.fill(); }
  } else if (name === 'loop2' || name === 'loop3') {
    c.strokeStyle = '#8fdcff'; c.lineWidth = 9; c.beginPath(); c.arc(0, 2, 34, -.2, Math.PI * 1.6); c.stroke();
    c.fillStyle = '#8fdcff'; c.beginPath(); c.moveTo(34, -26); c.lineTo(50, 6); c.lineTo(18, 4); c.closePath(); c.fill();
    c.fillStyle = '#ffffff'; c.font = '800 46px "Baloo 2", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name === 'loop2' ? '2' : '3', 0, 6);
  } else if (name === 'loop') {
    c.strokeStyle = '#8fdcff'; c.lineWidth = 11; c.beginPath(); c.arc(0, 2, 30, -.2, Math.PI * 1.6); c.stroke();
    c.fillStyle = '#8fdcff'; c.beginPath(); c.moveTo(30, -24); c.lineTo(46, 6); c.lineTo(14, 4); c.closePath(); c.fill();
  } else if (name === 'depot') {
    for (const [x, y] of [[-21, 18], [21, 18], [0, -16]]) { c.fillStyle = '#9b5f3a'; c.beginPath(); c.arc(x, y, 21, 0, TAU); c.fill(); c.fillStyle = '#ecc590'; c.beginPath(); c.arc(x, y, 15, 0, TAU); c.fill(); c.strokeStyle = '#c18e5c'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 7, 0, TAU); c.stroke(); }
  } else if (name === 'storm') {
    c.fillStyle = '#9aa7b8'; for (const [x, y, r] of [[-18, -6, 20], [6, -14, 24], [26, -2, 17], [0, 2, 22]]) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
    c.strokeStyle = '#dfefff'; c.lineWidth = 5; for (const x of [-20, 0, 20]) { c.beginPath(); c.moveTo(x, 26); c.lineTo(x - 8, 42); c.stroke(); }
  } else if (name === 'smoked') { drawFish(c, '#b9773d', '#e3b47a', '#8f5428'); c.strokeStyle = 'rgba(80,40,10,.45)'; c.lineWidth = 4; for (const x of [-8, 6, 20]) { c.beginPath(); c.moveTo(x, -16); c.lineTo(x - 6, 16); c.stroke(); } }
  else if (name === 'stone') { c.fillStyle = '#8a929e'; c.beginPath(); c.moveTo(-38, 18); c.lineTo(-30, -14); c.lineTo(-6, -32); c.lineTo(26, -24); c.lineTo(40, 6); c.lineTo(24, 30); c.lineTo(-20, 32); c.closePath(); c.fill(); c.fillStyle = '#b5bcc6'; c.beginPath(); c.moveTo(-26, -10); c.lineTo(-6, -26); c.lineTo(20, -20); c.lineTo(4, -4); c.closePath(); c.fill(); }
  else if (name === 'bridge') { c.fillStyle = '#b07a4c'; for (let i = 0; i < 5; i++) { rr(c, -46 + i * 19, -6, 16, 26, 3); c.fill(); } c.strokeStyle = '#7a5132'; c.lineWidth = 5; c.beginPath(); c.moveTo(-46, -26); c.quadraticCurveTo(0, -4, 46, -26); c.stroke(); for (const x of [-44, 44]) { c.fillStyle = '#7a5132'; c.fillRect(x - 4, -34, 8, 54); } }
  else if (name === 'stove') { c.fillStyle = '#3b3f46'; rr(c, -30, -16, 60, 54, 10); c.fill(); c.fillRect(8, -46, 14, 32); c.fillStyle = '#ff9a3c'; rr(c, -18, 2, 36, 24, 6); c.fill(); c.fillStyle = '#ffe08a'; rr(c, -10, 8, 20, 12, 4); c.fill(); }
  else if (name === 'heat') { c.strokeStyle = '#ff9a3c'; c.lineWidth = 8; c.setLineDash([12, 9]); c.beginPath(); c.arc(0, 0, 38, 0, TAU); c.stroke(); c.setLineDash([]); c.fillStyle = '#ff9a3c'; c.beginPath(); c.arc(0, 0, 12, 0, TAU); c.fill(); }
  else if (name === 'wheat') { c.strokeStyle = '#a8862a'; c.lineWidth = 5; for (const a of [-.3, 0, .3]) { c.save(); c.rotate(a); c.beginPath(); c.moveTo(0, 44); c.lineTo(0, -10); c.stroke(); c.fillStyle = '#e6b83a'; for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(-6, -12 - k * 10, 5, 8, -.5, 0, TAU); c.fill(); c.beginPath(); c.ellipse(6, -12 - k * 10, 5, 8, .5, 0, TAU); c.fill(); } c.restore(); } c.fillStyle = '#c4473d'; c.fillRect(-12, 18, 24, 7); }
  else if (name === 'bread') { c.fillStyle = '#b8742f'; c.beginPath(); c.ellipse(0, 6, 44, 28, 0, 0, TAU); c.fill(); c.fillStyle = '#d99a4e'; c.beginPath(); c.ellipse(0, 0, 40, 24, 0, 0, TAU); c.fill(); c.strokeStyle = '#f2c98a'; c.lineWidth = 5; for (const x of [-18, 0, 18]) { c.beginPath(); c.moveTo(x - 8, -12); c.lineTo(x + 6, 10); c.stroke(); } }
  else if (name === 'boat') { c.fillStyle = '#a8714a'; c.beginPath(); c.moveTo(-46, -4); c.lineTo(46, -4); c.lineTo(30, 22); c.lineTo(-30, 22); c.closePath(); c.fill(); c.fillStyle = '#7a4e30'; c.fillRect(-40, -10, 80, 8); c.strokeStyle = '#7fb3d2'; c.lineWidth = 5; c.beginPath(); c.moveTo(-46, 32); c.quadraticCurveTo(-23, 24, 0, 32); c.quadraticCurveTo(23, 40, 46, 32); c.stroke(); }
  else if (name === 'sprout') { c.fillStyle = '#7a5132'; rr(c, -40, 20, 80, 22, 8); c.fill(); c.strokeStyle = '#4f9a3c'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 22); c.lineTo(0, -16); c.stroke(); c.fillStyle = '#6cc04a'; c.beginPath(); c.ellipse(-14, -14, 14, 7, -.6, 0, TAU); c.fill(); c.beginPath(); c.ellipse(14, -22, 14, 7, .6, 0, TAU); c.fill(); }
  else if (name === 'tower') { c.fillStyle = '#9b6a42'; c.beginPath(); c.moveTo(-22, 44); c.lineTo(-12, -16); c.lineTo(12, -16); c.lineTo(22, 44); c.closePath(); c.fill(); c.fillStyle = '#7a4e30'; rr(c, -26, -30, 52, 16, 3); c.fill(); c.fillStyle = '#c4473d'; c.beginPath(); c.moveTo(-30, -30); c.lineTo(0, -50); c.lineTo(30, -30); c.closePath(); c.fill(); c.fillStyle = '#ffd27a'; c.fillRect(-6, -27, 12, 10); }
  else if (name === 'feast') { c.fillStyle = '#a8714a'; rr(c, -46, 4, 92, 14, 4); c.fill(); c.fillRect(-40, 18, 8, 24); c.fillRect(32, 18, 8, 24); c.fillStyle = '#f4f1ea'; for (const x of [-26, 0, 26]) { c.beginPath(); c.ellipse(x, 2, 12, 5, 0, 0, TAU); c.fill(); } c.fillStyle = '#d99a4e'; c.beginPath(); c.ellipse(-26, -4, 9, 6, 0, 0, TAU); c.fill(); c.fillStyle = '#b9773d'; c.beginPath(); c.ellipse(0, -4, 10, 5, 0, 0, TAU); c.fill(); c.fillStyle = '#f0956a'; c.beginPath(); c.ellipse(26, -4, 10, 5, 0, 0, TAU); c.fill(); }
  else if (name === 'arrow') {
    c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.moveTo(-10, -30); c.lineTo(10, -30); c.lineTo(10, 4); c.lineTo(24, 4); c.lineTo(0, 30); c.lineTo(-24, 4); c.lineTo(-10, 4); c.closePath(); c.fill();
  }
  c.restore();
}
function iconURL(name, size = 96, opt) { const cv = document.createElement('canvas'); cv.width = cv.height = size; drawIcon(cv.getContext('2d'), name, size / 2, size / 2, size * .92, opt); return cv.toDataURL(); }
const ICON = {}; for (const n of ['log', 'fish', 'big', 'fire', 'moon', 'owl', 'check', 'coin', 'plank', 'house', 'saw', 'belt', 'axe', 'frame', 'tree', 'loop', 'loop2', 'loop3', 'depot', 'storm', 'smoked', 'stone', 'bridge', 'stove', 'heat', 'wheat', 'bread', 'boat', 'sprout', 'tower', 'feast']) ICON[n] = iconURL(n);
ICON.helper = iconURL('person', 96, { c: '#3f6fb5', h: '#e9e3d3' });
ICON.flake = iconURL('flake', 96, { c: '#8fc4f2' });

/* ================= Sahne ================= */
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const ANISO = renderer.capabilities.getMaxAnisotropy();
const col = h => new THREE.Color(h).convertSRGBToLinear();
const mix = (a, b, t) => col(a).lerp(col(b), clamp(t, 0, 1));
const scene = new THREE.Scene();
scene.background = col('#dfeaf6');
scene.fog = new THREE.Fog(col('#dfeaf6'), 40, 75);
const camera = new THREE.PerspectiveCamera(38, 1, .5, 200);
const hemi = new THREE.HemisphereLight(col('#e3eeff'), col('#b9a894'), .72);
const sun = new THREE.DirectionalLight(col('#fff0dc'), .95);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -19, right: 19, top: 19, bottom: -19, near: 1, far: 80 });
sun.shadow.bias = -.0006; sun.shadow.normalBias = .03;
scene.add(hemi, sun, sun.target);

/* ----- Dokular (tuvalde üretilir, döşenebilir) ----- */
function canvasTex(size, draw, rep = 1) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size; draw(cv.getContext('2d'), size);
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = ANISO; return t;
}
// Kenardan taşan lekeyi karşı kenara da çizer: doku dikişsiz döşenir.
function blobWrap(c, S, x, y, r, rgba) {
  for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
    const X = x + dx, Y = y + dy; if (X + r < 0 || X - r > S || Y + r < 0 || Y - r > S) continue;
    const g = c.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, rgba); g.addColorStop(1, rgba.replace(/[\d.]+\)$/, '0)'));
    c.fillStyle = g; c.fillRect(X - r, Y - r, 2 * r, 2 * r);
  }
}
const snowTex = canvasTex(512, (c, S) => {
  c.fillStyle = '#f2f7fd'; c.fillRect(0, 0, S, S);
  for (let i = 0; i < 160; i++) blobWrap(c, S, rand(0, S), rand(0, S), rand(30, 90), 'rgba(160,190,230,.10)');
  for (let i = 0; i < 90; i++) blobWrap(c, S, rand(0, S), rand(0, S), rand(20, 60), 'rgba(255,255,255,.55)');
  for (let i = 0; i < 700; i++) { c.fillStyle = `rgba(255,255,255,${rand(.6, 1)})`; c.fillRect(rand(0, S), rand(0, S), 1.6, 1.6); }
  for (let i = 0; i < 260; i++) { c.fillStyle = 'rgba(150,180,220,.25)'; c.fillRect(rand(0, S), rand(0, S), 1.4, 1.4); }
}, 22);
const dirtTex = canvasTex(512, (c, S) => {
  c.fillStyle = '#b8895b'; c.fillRect(0, 0, S, S);
  for (let i = 0; i < 120; i++) blobWrap(c, S, rand(0, S), rand(0, S), rand(25, 80), 'rgba(120,80,45,.13)');
  for (let i = 0; i < 80; i++) blobWrap(c, S, rand(0, S), rand(0, S), rand(20, 60), 'rgba(222,178,128,.16)');
  for (let i = 0; i < 26; i++) blobWrap(c, S, rand(0, S), rand(0, S), rand(8, 18), 'rgba(255,255,255,.12)');   // kar serpintisi
  for (let i = 0; i < 260; i++) {
    const x = rand(0, S), y = rand(0, S), r = rand(1.5, 4.5);
    c.fillStyle = `rgba(${rand(90, 140) | 0},${rand(75, 105) | 0},${rand(60, 80) | 0},.55)`; c.beginPath(); c.ellipse(x, y, r, r * .75, rand(0, 3), 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,240,220,.25)'; c.beginPath(); c.ellipse(x - r * .3, y - r * .3, r * .4, r * .3, 0, 0, TAU); c.fill();
  }
  c.strokeStyle = 'rgba(230,200,140,.35)'; c.lineWidth = 1.2;
  for (let i = 0; i < 70; i++) { const x = rand(0, S), y = rand(0, S), a = rand(0, TAU), l = rand(6, 14); c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
}, 2.4);
// Ahşap: dikey damarlar (silindirde boy boyunca, kutuda yüz boyunca)
const woodTex = canvasTex(256, (c, S) => {
  c.fillStyle = '#d7a170'; c.fillRect(0, 0, S, S);
  for (let i = 0; i < 46; i++) {
    const x0 = rand(0, S), w = rand(.6, 2.2), dark = Math.random() < .7;
    c.strokeStyle = dark ? `rgba(110,60,25,${rand(.12, .32)})` : `rgba(255,225,180,${rand(.1, .25)})`; c.lineWidth = w;
    for (const dx of [-S, 0, S]) { c.beginPath(); for (let y = 0; y <= S; y += 8) { const x = x0 + dx + Math.sin(y * .04 + x0) * 3; y ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  }
  for (let i = 0; i < 4; i++) { const x = rand(20, S - 20), y = rand(20, S - 20); c.strokeStyle = 'rgba(100,55,25,.35)'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, 5, 9, 0, 0, TAU); c.stroke(); c.fillStyle = 'rgba(90,50,20,.4)'; c.beginPath(); c.ellipse(x, y, 2, 4, 0, 0, TAU); c.fill(); }
});
const iceTex = canvasTex(512, (c, S) => {
  const g = c.createRadialGradient(S / 2, S / 2, S * .1, S / 2, S / 2, S * .5); g.addColorStop(0, '#9fd0ee'); g.addColorStop(.8, '#c3e3f6'); g.addColorStop(1, '#e8f4fc');
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  for (let i = 0; i < 40; i++) blobWrap(c, S, rand(60, S - 60), rand(60, S - 60), rand(30, 80), 'rgba(255,255,255,.22)');
  c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.6;
  for (let k = 0; k < 14; k++) {
    let x = rand(S * .25, S * .75), y = rand(S * .25, S * .75), a = rand(0, TAU); c.beginPath(); c.moveTo(x, y);
    for (let j = 0; j < 7; j++) { a += rand(-.8, .8); x += Math.cos(a) * rand(14, 32); y += Math.sin(a) * rand(14, 32); c.lineTo(x, y); }
    c.stroke();
  }
});
function softTex(rgbInner, rgbOuter = rgbInner) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, rgbInner); g.addColorStop(1, rgbOuter);
  c.fillStyle = g; c.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t;
}
const glowTex = softTex('rgba(255,170,80,.8)', 'rgba(255,170,80,0)');
const blobTex = softTex('rgba(30,40,60,.42)', 'rgba(30,40,60,0)');
const smokeTex = softTex('rgba(235,238,242,.75)', 'rgba(235,238,242,0)');
const stepTex = softTex('rgba(120,150,195,.55)', 'rgba(120,150,195,0)');

/* ----- Malzemeler ve geometri yardımcıları ----- */
const MATS = new Map();
function mat(hex, opt) {
  const k = hex + (opt ? JSON.stringify(opt, (key, v) => v && v.isTexture ? v.uuid : v) : '');
  if (!MATS.has(k)) MATS.set(k, new THREE.MeshStandardMaterial(Object.assign({ color: col(hex), roughness: .88, metalness: 0 }, opt || {})));
  return MATS.get(k);
}
const wood = (hex = '#ffffff', extra) => mat(hex, Object.assign({ map: woodTex, roughness: .82 }, extra || {}));
function mesh(geo, m, x = 0, y = 0, z = 0, parent = scene) {
  const o = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m);
  o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
}
// Aynı ölçüdeki geometri bir kez üretilir; sık üretilen kişi, balık, buğday modelleri bellekte birikmez.
const GEO = new Map();
const geo = (k, f) => { if (!GEO.has(k)) GEO.set(k, f()); return GEO.get(k); };
const lathe = (pts, seg = 12) => new THREE.LatheGeometry(pts.map(([r, y]) => new V2(r, y)), seg);
// Kapsül: üstü y=0'da, aşağı doğru len boyunca (kol ve bacak için).
function capsule(r, len, seg = 12) {
  const pts = [];
  for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i / 5 * Math.PI / 2; pts.push([Math.cos(a) * r, -len + r + Math.sin(a) * r]); }
  for (let i = 1; i <= 5; i++) { const a = i / 5 * Math.PI / 2; pts.push([Math.cos(a) * r, -r + Math.sin(a) * r]); }
  return lathe(pts, seg);
}
// Yuvarlak, hafif yamru taş ve tümsek; aynı noktadaki köşeler aynı oynar, dikiş açılmaz.
function lump(r, detail = 1, amt = .14) {
  const g = new THREE.IcosahedronGeometry(r, detail), p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), h = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453, k = 1 + ((h - Math.floor(h)) - .5) * 2 * amt;
    p.setXYZ(i, x * k, y * k, z * k); const l = Math.hypot(x, y, z) || 1; n.setXYZ(i, x / l, y / l, z / l);
  }
  return g;
}
// Parçaları köşe renkli tek geometride birleştirir; renk sabit, fonksiyon ya da geometrinin kendi rengi olabilir.
function mergeColored(parts) {
  const pos = [], nor = [], cl = [];
  for (const [g0, hex] of parts) {
    const g = g0.index ? g0.toNonIndexed() : g0, p = g.attributes.position.array, n = g.attributes.normal.array, gc = g.attributes.color && g.attributes.color.array;
    const fixed = typeof hex === 'string' ? col(hex) : null;
    for (let i = 0; i < p.length; i += 3) {
      pos.push(p[i], p[i + 1], p[i + 2]); nor.push(n[i], n[i + 1], n[i + 2]);
      if (hex === null) cl.push(gc[i], gc[i + 1], gc[i + 2]); else { const c = fixed || hex(p[i], p[i + 1], p[i + 2]); cl.push(c.r, c.g, c.b); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
  return g;
}
const vcMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9, metalness: 0 });
const vcFlat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .92, metalness: 0, flatShading: true });
const O = new THREE.Object3D();
function instanced(geo, material, list, cast = true) {
  const im = new THREE.InstancedMesh(geo, material, Math.max(1, list.length));
  list.forEach((it, i) => {
    O.position.set(it.x, it.y || 0, it.z); O.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
    O.scale.set(it.sx || it.s || 1, it.sy || it.s || 1, it.sz || it.s || 1); O.updateMatrix(); im.setMatrixAt(i, O.matrix);
  });
  im.count = list.length; im.castShadow = cast; im.receiveShadow = true; scene.add(im); return im;
}
function flatDecal(tex, w, d, opacity = 1) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = 2; return m;
}

/* ----- Zemin ----- */
const CAMP = 9;
const LAKE = { x: 22, z: 0, r: 8.6, block: 8.3 };
const SEASON = { now: 'winter', ground: null, ice: null };
{
  const g = new THREE.PlaneGeometry(200, 200, 150, 150); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const dCamp = Math.max(Math.abs(x), Math.abs(z)) - 10.5, dLake = Math.hypot(x - LAKE.x, z) - 9.4;
    const flat = Math.min(dCamp, dLake, x > 8 && x < 15 ? Math.abs(z) - 3.2 : 99, Math.abs(x) < 3.5 && z < -8 && z > -17 ? 0 : 99);
    const m = clamp(flat / 3, 0, 1);
    p.setY(i, (Math.sin(x * .31) * Math.cos(z * .27) + Math.sin(x * .12 + z * .17) * .8 + Math.sin(z * .55 - x * .2) * .3) * .16 * m - .02);
    uv.setXY(i, x / 200 + .5, z / 200 + .5);
  }
  g.computeVertexNormals();
  const ground = new THREE.Mesh(g, mat('#ffffff', { map: snowTex, roughness: .8 })); ground.receiveShadow = true; scene.add(ground); SEASON.ground = ground;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18.4, 18.4), mat('#ffffff', { map: dirtTex, roughness: .95 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = .015; floor.receiveShadow = true; scene.add(floor);
}

/* ----- Çit, kapılar, fenerler ----- */
{
  const list = [], drifts = [];
  const add = (x, z) => list.push({ x, z, ry: rand(0, TAU), sy: rand(.9, 1.12), s: 1 });
  for (let t = -CAMP; t <= CAMP + .01; t += .46) {
    if (Math.abs(t) > 2.2) add(t, -CAMP);
    add(t, CAMP); add(-CAMP, t);
    if (Math.abs(t) > 2.2) add(CAMP, t);
  }
  const post = new THREE.CylinderGeometry(.2, .22, 1.5, 9).translate(0, .75, 0);
  const tip = new THREE.ConeGeometry(.2, .42, 9).translate(0, 1.71, 0);
  const posts = instanced(post, wood('#e2b386'), list), tips = instanced(tip, wood('#c99464'), list);
  const caps = instanced(new THREE.SphereGeometry(.17, 10, 6).scale(1, .5, 1).translate(0, 1.82, 0), mat('#f7fafd'), list, false);
  void posts; void tips; void caps;
  // içeride ve dışarıda çit dibine yığılmış kar
  for (let t = -CAMP + .6; t <= CAMP - .6; t += 1.1) for (const [x, z, ok] of [[t, -CAMP - .7, Math.abs(t) > 3.2], [t, CAMP + .7, true], [-CAMP - .7, t, true], [CAMP + .7, t, Math.abs(t) > 3.2], [t, CAMP - .55, Math.abs(t + 5.6) > 2.6]])
    if (ok) drifts.push({ x: x + rand(-.2, .2), z: z + rand(-.2, .2), y: -.05, sx: rand(.7, 1.2), sy: rand(.22, .38), sz: rand(.5, .8), ry: rand(0, TAU) });
  instanced(lump(1, 2, .1), mat('#f6f9fd'), drifts, false);
  // kapı kanatları (boyalı tahta)
  for (const s of [-1, 1]) {
    const d1 = mesh(new THREE.BoxGeometry(.14, 1.45, 2), wood('#c4574a'), s * 2.3, .75, -CAMP - 1.05); d1.rotation.y = s * .12;
    const d2 = mesh(new THREE.BoxGeometry(2, 1.45, .14), wood('#c4574a'), CAMP + 1.05, .75, s * 2.3); d2.rotation.y = -s * .12;
  }
}
const lanterns = [];
function lantern(x, z, h = 2.3) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  mesh(new THREE.CylinderGeometry(.07, .09, h, 8), wood('#8a5a38'), 0, h / 2, 0, g);
  mesh(new THREE.BoxGeometry(.5, .06, .08), wood('#8a5a38'), .2, h - .05, 0, g);
  mesh(new THREE.BoxGeometry(.24, .3, .24), mat('#2c2c30', { roughness: .5, metalness: .4 }), .4, h - .3, 0, g);
  const glass = mesh(new THREE.BoxGeometry(.18, .22, .18), new THREE.MeshBasicMaterial({ color: col('#ffd27a') }), .4, h - .3, 0, g); glass.castShadow = false;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .55 }));
  s.scale.set(1.7, 1.7, 1); s.position.set(.4, h - .3, 0); g.add(s); lanterns.push(s);
}
lantern(-2.9, -CAMP + .6); lantern(2.9, -CAMP + .6); lantern(CAMP - .6, 2.9); lantern(7.5, -3.6, 2.1);

/* ----- Ocak ----- */
const fire = new THREE.Group(); fire.position.set(0, 0, -1); scene.add(fire);
for (let i = 0; i < 12; i++) {
  const a = i / 12 * TAU, s = mesh(lump(.34, 1, .2), i % 3 ? '#9aa2ad' : '#7f8792', Math.cos(a) * 1.02, .18, Math.sin(a) * 1.02, fire);
  s.rotation.set(rand(0, 3), rand(0, 3), 0); s.scale.set(1.1, .72, .95);
}
mesh(new THREE.CylinderGeometry(.86, .9, .06, 24), '#2e2a28', 0, .04, 0, fire);
for (let i = 0; i < 6; i++) { const e = mesh(new THREE.SphereGeometry(.09, 8, 6), new THREE.MeshBasicMaterial({ color: col('#ff6a2a') }), rand(-.4, .4), .08, rand(-.4, .4), fire); e.castShadow = false; }
const fireLogs = new THREE.Group(); fire.add(fireLogs);
for (let i = 0; i < 3; i++) { const l = mesh(new THREE.CylinderGeometry(.13, .14, 1.3, 10), wood('#8b5a3a'), 0, .2, 0, fireLogs); l.rotation.z = Math.PI / 2; l.rotation.y = i * Math.PI / 3; }
const flames = new THREE.Group(); fire.add(flames);
const flameParts = [['#ff6418', .52, 1.55, 0, 0, .85], ['#ff9a26', .4, 1.2, .12, .08, .9], ['#ffd25a', .25, .85, -.08, -.04, .95], ['#fff2c0', .13, .5, 0, 0, 1]].map(([c, r, h, x, z, o]) => {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 14, 1, true), new THREE.MeshBasicMaterial({ color: col(c), transparent: true, opacity: o, side: THREE.DoubleSide, depthWrite: false }));
  m.position.set(x, .18 + h / 2, z); flames.add(m); return m;
});
const fireLight = new THREE.PointLight(col('#ff9a4a'), 0, 16, 1.5); fireLight.position.set(0, 1.8, 0); fire.add(fireLight);
const glow = flatDecal(glowTex, 7.5, 7.5, 0); glow.material.blending = THREE.AdditiveBlending; glow.position.y = .03; fire.add(glow);
const fireHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
fireHalo.scale.set(3.4, 3.4, 1); fireHalo.position.set(0, 1.1, 0); fire.add(fireHalo);
const smoke = Array.from({ length: 10 }, (_, i) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0 }));
  s.userData.t = i / 10; fire.add(s); return s;
});
const embers = Array.from({ length: 16 }, (_, i) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col('#ffb060'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  s.userData = { t: Math.random(), x: rand(-.3, .3), z: rand(-.3, .3), sp: rand(.6, 1.1) }; s.scale.set(.12, .12, 1); fire.add(s); return s;
});
for (const s of [-1, 1]) { const b = mesh(new THREE.CylinderGeometry(.28, .3, 1.7, 14), wood('#a8714a'), s * 2.7, .28, -1); b.rotation.x = Math.PI / 2; }
const PILE = { x: 1.55, z: .15, logs: [], fly: 0, g: null };
function buildPile() {
  const g = PILE.g = new THREE.Group(); g.position.set(PILE.x, 0, PILE.z); g.rotation.y = -.35; scene.add(g);
  // alttan üste 5, 4, 3 kütük; kütükler ocağa doğru uzanır
  [5, 4, 3].forEach((n, L) => { for (let j = 0; j < n; j++) { const m = new THREE.Mesh(logGeo, logMats); m.castShadow = m.receiveShadow = true;
    m.rotation.y = Math.PI / 2 + rand(-.06, .06); m.position.set((j - (n - 1) / 2) * .31, .15 + L * .26, rand(-.05, .05)); m.visible = false; g.add(m); PILE.logs.push(m); } });
}
// Yığında görünen odun: ocağa konmuş ve yerine varmış odun (fazlası yığına değil ateşe gider ve duman olur).
function updatePile() { if (!PILE.g) buildPile(); updatePlates3(); const z = Z.ocak, n = Math.max(0, Math.min(z.have, z.need || z.have) - PILE.fly); PILE.logs.forEach((m, i) => { m.visible = i < n; }); }
let fireOn = false, fireBoost = 0, fireLvl = 1;
function setFire(on) { fireOn = on; flames.visible = on; }

/* ----- Kiler (balık deposu), odun yığını, fıçılar ----- */
const shed = new THREE.Group(); shed.position.set(-5.5, 0, -6.1); scene.add(shed);
mesh(new THREE.BoxGeometry(2.8, 1.7, 2), wood('#b9805a'), 0, .85, 0, shed);
for (const x of [-1.42, 1.42]) for (const z of [-1.02, 1.02]) mesh(new THREE.BoxGeometry(.16, 1.75, .16), wood('#7a4e30'), x, .87, z, shed);
for (const s of [-1, 1]) {
  const r = mesh(new THREE.BoxGeometry(3.25, .14, 1.4), wood('#8a5a38'), 0, 2.0, s * .52, shed); r.rotation.x = s * .62;
  const sn = mesh(lump(1, 2, .06), '#f6f9fd', 0, 2.1, s * .55, shed); sn.scale.set(1.72, .16, .78); sn.rotation.x = s * .62;
}
for (let i = 0; i < 9; i++) { const ic = mesh(new THREE.ConeGeometry(.05, rand(.18, .4), 6), mat('#e8f4ff', { roughness: .2, metalness: .1 }), -1.45 + i * .36, 1.47, 1.17, shed); ic.rotation.x = Math.PI; ic.castShadow = false; }
mesh(new THREE.BoxGeometry(.9, 1.25, .08), wood('#6a4228'), 0, .63, 1.02, shed);
mesh(new THREE.SphereGeometry(.05, 8, 6), mat('#c9a14a', { metalness: .6, roughness: .3 }), .3, .65, 1.08, shed);
const rack = new THREE.Group(); rack.position.set(-3.6, 0, -6.1); scene.add(rack);
for (const z of [-.7, .7]) mesh(new THREE.CylinderGeometry(.07, .08, 1.7, 8), wood('#8a5a38'), 0, .85, z, rack);
{ const bar = mesh(new THREE.CylinderGeometry(.05, .05, 1.6, 8), wood('#8a5a38'), 0, 1.62, 0, rack); bar.rotation.x = Math.PI / 2; }
const rackFish = [];
function barrel(x, z, parent = scene) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  mesh(lathe([[0, 0], [.32, 0], [.38, .35], [.32, .72], [0, .72]], 14), wood('#c48a5a'), 0, 0, 0, g);
  for (const y of [.12, .6]) mesh(new THREE.TorusGeometry(.35, .025, 6, 18).rotateX(Math.PI / 2), mat('#3d3a38', { metalness: .5, roughness: .45 }), 0, y, 0, g);
  mesh(new THREE.CircleGeometry(.3, 16).rotateX(-Math.PI / 2), '#f6f9fd', 0, .73, 0, g);
  return g;
}
barrel(-7.6, -4.6); barrel(-7.0, -4.2);
{ // duvara dayalı odun yığını
  const logs = [];
  for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - r; i++) logs.push({ x: -7.55, y: .2 + r * .34, z: -7.6 + (i + r * .5) * .36, rz: Math.PI / 2, ry: rand(-.05, .05) });
  instanced(new THREE.CylinderGeometry(.17, .17, 1.1, 10), wood('#9b6a42'), logs);
}

/* ----- Tezgâh ----- */
const stall = new THREE.Group(); stall.position.set(5.5, 0, -5); scene.add(stall);
mesh(new THREE.BoxGeometry(3, .92, 1), wood('#c08758'), 0, .46, 0, stall);
mesh(new THREE.BoxGeometry(3.25, .1, 1.18), wood('#d8a274'), 0, .97, 0, stall);
mesh(new THREE.BoxGeometry(.06, .5, .02), mat('#efe9dc'), 0, .55, .51, stall);
for (const x of [-1.55, 1.55]) for (const z of [.45, -1.45]) mesh(new THREE.CylinderGeometry(.07, .08, 2.5, 8), wood('#8a5a38'), x, 1.25, z, stall);
for (let i = 0; i < 6; i++) mesh(new THREE.BoxGeometry(.56, .08, 2.3), mat(i % 2 ? '#f1ebdf' : '#c4473d'), -1.4 + i * .56, 2.52, -.5, stall);
for (let i = 0; i < 6; i++) { const f = mesh(new THREE.ConeGeometry(.28, .3, 3), mat(i % 2 ? '#f1ebdf' : '#c4473d'), -1.4 + i * .56, 2.33, .67, stall); f.rotation.x = Math.PI; f.rotation.y = Math.PI / 6; f.scale.z = .2; }
{ const sn = mesh(lump(1, 2, .05), '#f6f9fd', 0, 2.58, -.6, stall); sn.scale.set(1.5, .07, .9); }
const stallCrates = [];
for (const [x, z] of [[1.1, -1.25], [-1.1, -1.3]]) {
  mesh(new THREE.BoxGeometry(.9, .55, .7), wood('#a86f43'), x, .28, z, stall);
  stallCrates.push([x, z]);   // balıklar balık modeli tanımlandıktan sonra konur
}
const pendingFish = [];

/* ----- Çadır ve kızak ----- */
const tent = new THREE.Group(); tent.position.set(-5.6, 0, 5.8); scene.add(tent);
{
  const t = mesh(new THREE.ConeGeometry(2.1, 2.8, 4), mat('#d8c39d', { flatShading: true }), 0, 1.4, 0, tent); t.rotation.y = Math.PI / 4;
  const d = mesh(new THREE.BoxGeometry(.8, 1.3, .06), '#4a3b2c', 0, .62, 1.2, tent); d.rotation.x = -.49;
  mesh(new THREE.CylinderGeometry(.05, .05, .7, 6), wood('#7a4e30'), 0, 3.0, 0, tent);
  const sn = mesh(new THREE.ConeGeometry(.75, .55, 4), mat('#f6f9fd', { flatShading: true }), 0, 2.55, 0, tent); sn.rotation.y = Math.PI / 4;
}
{
  const sled = new THREE.Group(); sled.position.set(-8.0, 0, 7.6); sled.rotation.y = .5; scene.add(sled);
  for (const x of [-.32, .32]) { const r = mesh(new THREE.TorusGeometry(.5, .04, 6, 16, Math.PI * .6), mat('#5a5f66', { metalness: .5, roughness: .4 }), x, .5, .2, sled); r.rotation.y = Math.PI / 2; r.rotation.z = Math.PI * .7; }
  mesh(new THREE.BoxGeometry(.8, .08, 1.3), wood('#c48a5a'), 0, .3, 0, sled);
  for (const z of [-.45, .45]) for (const x of [-.32, .32]) mesh(new THREE.BoxGeometry(.06, .22, .06), wood('#8a5a38'), x, .17, z, sled);
}

/* ----- Göl ve iskele ----- */
{
  const ice = new THREE.Mesh(new THREE.CircleGeometry(LAKE.r, 64), mat('#ffffff', { map: iceTex, roughness: .22, metalness: .08 }));
  ice.rotation.x = -Math.PI / 2; ice.position.set(LAKE.x, .025, 0); ice.receiveShadow = true; scene.add(ice); SEASON.ice = ice;
}
const hole = new THREE.Group(); hole.position.set(20.35, 0, 0); scene.add(hole);
{ const h = new THREE.Mesh(new THREE.CircleGeometry(.55, 24), mat('#1f4d68', { roughness: .1, metalness: .2 })); h.rotation.x = -Math.PI / 2; h.position.y = .04; hole.add(h);
  const rim = mesh(new THREE.TorusGeometry(.62, .14, 8, 24).rotateX(Math.PI / 2).scale(1, .5, 1), '#eef6fc', 0, .05, 0, hole); rim.castShadow = false; }
const ripple = new THREE.Mesh(new THREE.RingGeometry(.3, .38, 24), new THREE.MeshBasicMaterial({ color: col('#bfe6ff'), transparent: true, opacity: 0, depthWrite: false }));
ripple.rotation.x = -Math.PI / 2; ripple.position.y = .06; hole.add(ripple);
hole.visible = false;
const pier = new THREE.Group(); pier.position.set(12.6, 0, 0); scene.add(pier);
for (let i = 0; i < 9; i++) { const b = mesh(new THREE.BoxGeometry(.74, .12, 1.8), wood(i % 2 ? '#c08758' : '#d29b6a'), .4 + i * .8, .1, rand(-.04, .04), pier); b.rotation.y = rand(-.03, .03); }
for (let i = 0; i < 4; i++) for (const z of [-.95, .95]) { mesh(new THREE.CylinderGeometry(.09, .1, .7, 10), wood('#8a5a38'), .4 + i * 2.2, .2, z, pier); mesh(new THREE.SphereGeometry(.1, 8, 5).scale(1, .5, 1), '#f6f9fd', .4 + i * 2.2, .56, z, pier); }
let pierBuilt = false, pierAnim = 1;
function setPier(on, animate) { pierBuilt = on; pier.visible = on; hole.visible = on; pierAnim = on && animate ? 0 : 1; pier.scale.x = on && animate ? .001 : 1; }


/* ----- Bölüm 4–8 yapıları: pazar, odunluk, bant, testere, evler, fırtına ----- */
function iconTex(name) { const cv = document.createElement('canvas'); cv.width = cv.height = 128; drawIcon(cv.getContext('2d'), name, 64, 64, 112); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t; }
const market = new THREE.Group(); market.position.set(6.4, 0, 6.0); scene.add(market);
mesh(new THREE.BoxGeometry(2.4, .9, .9), wood('#c99a6a'), 0, .45, 0, market);
mesh(new THREE.BoxGeometry(2.6, .1, 1.05), wood('#e0ad7c'), 0, .95, 0, market);
for (const x of [-1.2, 1.2]) for (const z of [-.45, .45]) mesh(new THREE.CylinderGeometry(.06, .07, 2.2, 8), wood('#8a5a38'), x, 1.1, z, market);
for (let i = 0; i < 5; i++) mesh(new THREE.BoxGeometry(.54, .07, 1.3), mat(i % 2 ? '#f1ebdf' : '#3f7fc4'), -1.08 + i * .54, 2.22, 0, market);
{ const sn = mesh(lump(1, 2, .05), '#f6f9fd', 0, 2.28, -.05, market); sn.scale.set(1.3, .06, .62);
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(.55, .55), new THREE.MeshBasicMaterial({ map: iconTex('coin'), transparent: true })); sg.position.set(0, .55, .47); market.add(sg);
  for (const [x, t] of [[-.7, 'wood'], [.1, 'fish'], [.75, 'big']]) { const it = t === 'wood' ? new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .7, 10).rotateZ(Math.PI / 2), wood('#a86c42')) : null; if (it) { it.position.set(x, 1.13, 0); market.add(it); } }
}
const depotG = new THREE.Group(); depotG.position.set(-2.95, 0, -4.3); scene.add(depotG);
mesh(new THREE.BoxGeometry(1.15, .1, 1.5), wood('#9b6a42'), 0, .05, 0, depotG);
for (const x of [-.55, .55]) for (const z of [-.7, .7]) mesh(new THREE.BoxGeometry(.1, 1.9, .1), wood('#7a4e30'), x, .95, z, depotG);
{ const r = mesh(new THREE.BoxGeometry(1.4, .1, 1.8), wood('#8a5a38'), 0, 1.95, 0, depotG); r.rotation.z = .12;
  const sn = mesh(lump(1, 2, .05), '#f6f9fd', 0, 2.02, 0, depotG); sn.scale.set(.75, .07, .95); sn.rotation.z = .12; }
const depotLogs = [];
function updateDepotLogs() {
  for (const m of depotLogs) depotG.remove(m); depotLogs.length = 0;
  for (let i = 0; i < Math.min(Z.depo.have, 20); i++) { const m = makeLog(); m.scale.set(1.1, 1, 1); m.position.set(0, .26 + Math.floor(i / 4) * .32, -.48 + (i % 4) * .32); depotG.add(m); depotLogs.push(m); }
}
const BELT = { x: -1.6, z0: -12.4, z1: -5.3, items: [], buffer: 0, max: 8, built: false, base: .55, gap: .8, to: 'depo', anim: 1, warnAt: -99, jamT: 0 };
BELT.len = BELT.z1 - BELT.z0;
const beltTex = canvasTex(64, (c, S) => { c.fillStyle = '#373c44'; c.fillRect(0, 0, S, S); c.fillStyle = '#4c535d'; for (let y = 0; y < S; y += 16) c.fillRect(0, y, S, 5); });
beltTex.repeat.set(1, 9);
const beltG = new THREE.Group(); beltG.position.set(BELT.x, 0, BELT.z0); scene.add(beltG);
{ const L = BELT.len;
  mesh(new THREE.BoxGeometry(.72, .1, L), mat('#ffffff', { map: beltTex, roughness: .7 }), 0, .4, L / 2, beltG);
  for (const x of [-.41, .41]) mesh(new THREE.BoxGeometry(.08, .18, L), mat('#8f98a3', { metalness: .5, roughness: .4 }), x, .45, L / 2, beltG);
  for (let z = .3; z < L; z += 1.4) for (const x of [-.32, .32]) mesh(new THREE.BoxGeometry(.08, .38, .08), mat('#5d636b', { metalness: .4 }), x, .19, z, beltG);
  mesh(new THREE.BoxGeometry(1.0, .55, .7), wood('#9b6a42'), 0, .28, -.3, beltG);
}
const beltBuffer = [];
function updateBeltBuffer() {
  for (const m of beltBuffer) scene.remove(m); beltBuffer.length = 0;
  for (let i = 0; i < BELT.buffer; i++) { const m = makeLog(); m.rotation.y = Math.PI / 2 + rand(-.2, .2); m.position.set(BELT.x - .9 - (i % 2) * .34, .16 + Math.floor(i / 2) * .3, BELT.z0 - .5); scene.add(m); beltBuffer.push(m); }
}
const sawG = new THREE.Group(); sawG.position.set(-1.6, 0, -4.7); scene.add(sawG);
mesh(new THREE.BoxGeometry(1.4, .8, 1.0), wood('#b07a4c'), 0, .4, 0, sawG);
mesh(new THREE.BoxGeometry(1.5, .08, 1.1), mat('#8f98a3', { metalness: .5, roughness: .35 }), 0, .84, 0, sawG);
const blade = mesh(new THREE.CylinderGeometry(.42, .42, .04, 28), mat('#d5dbe2', { metalness: .8, roughness: .25 }), 0, .9, 0, sawG); blade.rotation.z = Math.PI / 2;
mesh(new THREE.BoxGeometry(.5, .5, .5), mat('#c4473d', { roughness: .5 }), .55, .55, .42, sawG);
const SAW = { busy: false, t: 0, out: 0, max: 10, warnAt: -99 };
const plankGeo = new THREE.BoxGeometry(.95, .07, .26);
const makePlank = () => { const m = new THREE.Mesh(plankGeo, wood('#e7bb86')); m.castShadow = true; return m; };
const plankPile = [];
function updatePlankPile() {
  for (const m of plankPile) scene.remove(m); plankPile.length = 0;
  for (let i = 0; i < SAW.out; i++) { const m = makePlank(); m.position.set(-3.1 + (i % 2) * .3 - .15, .06 + Math.floor(i / 2) * .085, -4.75); m.rotation.y = Math.PI / 2; scene.add(m); plankPile.push(m); }
}
function makeHouse(x, z, roof = '#8a5a38') {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  mesh(new THREE.BoxGeometry(2.1, 1.4, 1.7), wood('#c48a5a'), 0, .7, 0, g);
  for (const sx of [-1.06, 1.06]) for (const sz of [-.86, .86]) mesh(new THREE.BoxGeometry(.14, 1.45, .14), wood('#7a4e30'), sx, .72, sz, g);
  for (const sd of [-1, 1]) { const r = mesh(new THREE.BoxGeometry(2.45, .12, 1.25), wood(roof), 0, 1.75, sd * .48, g); r.rotation.x = sd * .62;
    const sn = mesh(lump(1, 2, .05), '#f6f9fd', 0, 1.84, sd * .5, g); sn.scale.set(1.3, .1, .7); sn.rotation.x = sd * .62; }
  mesh(new THREE.BoxGeometry(.55, .95, .06), wood('#6a4228'), -.4, .48, .87, g);
  const w = mesh(new THREE.BoxGeometry(.42, .36, .05), new THREE.MeshBasicMaterial({ color: col('#ffd27a') }), .5, .85, .87, g); w.castShadow = false;
  mesh(new THREE.BoxGeometry(.3, .7, .3), mat('#8e96a2'), .6, 2.0, -.3, g);
  g.visible = false; return g;
}
const houses = { ev: makeHouse(-.6, 7.0), ev2: makeHouse(-7.6, -1.5, '#6e4a30') };
const houseAnim = { ev: 1, ev2: 1 };
const stormWalls = new THREE.Group(); scene.add(stormWalls);
for (const [x, z, rx] of [[0, -9.2, 0], [9.2, 0, 1]]) for (let k = -1.6; k <= 1.6; k += .8) {
  const m = mesh(lump(1, 2, .1), '#f6f9fd', rx ? x : x + k, .1, rx ? z + k : z, stormWalls); m.scale.set(rand(.6, .9), rand(.55, .9), rand(.6, .9));
}
stormWalls.visible = false;

/* ----- Perde 3 yapıları: tütsühane, uçurum ve köprü, kayalar, taşlık, sobalar, yolcu ----- */
const smokeHouse = new THREE.Group(); smokeHouse.position.set(6.6, 0, .2); scene.add(smokeHouse);
mesh(new THREE.BoxGeometry(1.6, 1.4, 1.4), wood('#7a5136'), 0, .7, 0, smokeHouse);
for (const sd of [-1, 1]) { const r = mesh(new THREE.BoxGeometry(1.9, .1, 1.0), wood('#5e3d28'), 0, 1.62, sd * .38, smokeHouse); r.rotation.x = sd * .62; }
mesh(new THREE.BoxGeometry(.3, .9, .3), mat('#6f7782'), .45, 1.9, 0, smokeHouse);
mesh(new THREE.BoxGeometry(.6, .8, .05), wood('#4a2e1c'), -.3, .4, -.72, smokeHouse);
const smokeHouseSmoke = Array.from({ length: 5 }, (_, i) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0 })); sp.userData.t = i / 5; smokeHouse.add(sp); return sp; });
const ravineTex = canvasTex(256, (c, S) => { const g = c.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#dfe9f5'); g.addColorStop(.18, '#5d7aa3'); g.addColorStop(.5, '#16223a'); g.addColorStop(.82, '#5d7aa3'); g.addColorStop(1, '#dfe9f5'); c.fillStyle = g; c.fillRect(0, 0, S, S); });
ravineTex.wrapS = THREE.RepeatWrapping; ravineTex.repeat.set(1, 1);
{ const rv = new THREE.Mesh(new THREE.PlaneGeometry(90, 4.2), new THREE.MeshBasicMaterial({ map: ravineTex })); rv.rotation.x = -Math.PI / 2; rv.position.set(0, .012, -20.5); scene.add(rv);
  const edge = []; for (let x = -44; x <= 44; x += 1.1) for (const z of [-18.4, -22.6]) if (Math.abs(x) > 1.4) edge.push({ x: x + rand(-.3, .3), z: z + rand(-.15, .15), y: -.05, sx: rand(.7, 1.1), sy: rand(.25, .4), sz: rand(.4, .6), ry: rand(0, TAU) });
  instanced(lump(1, 2, .1), mat('#f6f9fd'), edge, false); }
const bridge = new THREE.Group(); bridge.position.set(0, 0, -18.3); scene.add(bridge);
for (let i = 0; i < 9; i++) { const b = mesh(new THREE.BoxGeometry(2.0, .1, .42), wood(i % 2 ? '#c08758' : '#d29b6a'), rand(-.04, .04), .14, -.25 - i * .48, bridge); b.rotation.y = rand(-.04, .04); }
for (const x of [-1.05, 1.05]) { for (const z of [0, -4.4]) mesh(new THREE.CylinderGeometry(.08, .1, 1.1, 8), wood('#7a5132'), x, .55, z, bridge);
  const rope = mesh(new THREE.CylinderGeometry(.035, .035, 4.4, 6), wood('#9a7a52'), x, .85, -2.2, bridge); rope.rotation.x = Math.PI / 2; }
let bridgeAnim = 1;
function setBridge(on, animate) { G.built.kopru = on; bridge.visible = on; bridgeAnim = on && animate ? 0 : 1; bridge.scale.z = on && animate ? .001 : 1; }
const ROCKS = [[-2.2, -24.9], [1.9, -25.3], [-.4, -27.5], [3.0, -27.2], [-3.2, -27.8], [.8, -29.3]].map(([x, z]) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const r = mesh(mergeColored([[lump(.9, 1, .24), (px, py) => py > .68 ? col('#f3f7fc') : mix('#5d6570', '#959daa', (py + .9) / 1.8)]]), vcFlat, 0, .5, 0, g); r.scale.set(1, .85, 1);
  return { g, x, z, hp: 5, alive: true, shake: 0 };
});
function resetRocks(on) { for (const k of ROCKS) { k.hp = 5; k.alive = true; k.g.visible = on; k.g.scale.setScalar(1); } }
const stonePile = [], stoneGeo = lump(.18, 1, .25);
const makeStone = () => { const m = new THREE.Mesh(stoneGeo, mat('#959ca7')); m.castShadow = true; return m; };
function updateStonePile() { for (const m of stonePile) scene.remove(m); stonePile.length = 0; for (let i = 0; i < Math.min(Z.taslik.have, 12); i++) { const m = makeStone(); m.position.set(3.55 + (i % 3) * .3, .16 + Math.floor(i / 3) * .24, -4.6 + (Math.floor(i / 3) % 2) * .12); scene.add(m); stonePile.push(m); } }
function makeStove() {
  const g = new THREE.Group(); scene.add(g);
  mesh(new THREE.CylinderGeometry(.42, .48, .9, 14), mat('#3a3e45', { metalness: .4, roughness: .5 }), 0, .45, 0, g);
  mesh(new THREE.CylinderGeometry(.09, .09, 1.2, 8), mat('#3a3e45', { metalness: .4, roughness: .5 }), .18, 1.4, 0, g);
  const f = mesh(new THREE.BoxGeometry(.36, .26, .05), new THREE.MeshBasicMaterial({ color: col('#ff9a3c') }), 0, .42, .45, g); f.castShadow = false;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .6 })); s.scale.set(1.6, 1.6, 1); s.position.set(0, .6, .3); g.add(s);
  return g;
}
const SOBA = [[-3.1, 5.9], [-1.9, 3.8], [-7.0, .7]].map(([x, z], i) => {
  const st = makeStove(); st.position.set(x, 0, z + .9); st.visible = false;
  const ring = new THREE.Mesh(new THREE.RingGeometry(.96, 1, 64), new THREE.MeshBasicMaterial({ color: col('#ffffff'), transparent: true, opacity: .35, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(x, .05, z); ring.renderOrder = 2; scene.add(ring); ring.visible = false;
  return { x, z, st, ring, built: false, id: 'soba' + i };
});
const HOUSES = [['tent', -5.6, 5.8], ['ev', -.6, 7.0], ['ev2', -7.6, -1.5]];
const houseMark = {};
for (const [id, x, z] of HOUSES) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTex('flake'), transparent: true, depthTest: false })); sp.scale.set(.9, .9, 1); sp.position.set(x, 3.3, z); sp.renderOrder = 9; sp.visible = false; scene.add(sp); houseMark[id] = sp; }
const markTex = { cold: iconTex('flake'), warm: iconTex('fire') };
const LOST = { npc: null, x: 0, z: 0, found: false, rescued: false, trail: [], followT: 0 };
const trailDecals = Array.from({ length: 46 }, () => { const m = flatDecal(stepTex, .22, .34, 0); m.position.y = .036; scene.add(m); return m; });

/* ----- Perde 4: bahar, kayık, tarla, ambar, fırın, yeni yapılar ----- */
const grassTex = canvasTex(512, (c, S) => {
  c.fillStyle = '#86b95a'; c.fillRect(0, 0, S, S);
  for (let i = 0; i < 160; i++) blobWrap(c, S, rand(0, S), rand(0, S), rand(30, 90), 'rgba(60,110,40,.14)');
  for (let i = 0; i < 90; i++) blobWrap(c, S, rand(0, S), rand(0, S), rand(20, 60), 'rgba(180,220,120,.18)');
  for (let i = 0; i < 1400; i++) { c.strokeStyle = `rgba(${rand(40, 90) | 0},${rand(110, 160) | 0},${rand(40, 70) | 0},.5)`; c.lineWidth = 1.2; const x = rand(0, S), y = rand(0, S); c.beginPath(); c.moveTo(x, y); c.lineTo(x + rand(-2, 2), y - rand(3, 7)); c.stroke(); }
  for (let i = 0; i < 60; i++) { c.fillStyle = ['#ffe36b', '#ffffff', '#f49ac1', '#b9a3ff'][i % 4]; c.beginPath(); c.arc(rand(0, S), rand(0, S), 2.2, 0, TAU); c.fill(); }
}, 22);
const waterTex = canvasTex(512, (c, S) => {
  const g = c.createRadialGradient(S / 2, S / 2, S * .05, S / 2, S / 2, S * .5); g.addColorStop(0, '#2f7fb8'); g.addColorStop(.85, '#4fa2d4'); g.addColorStop(1, '#a9d8ef');
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2;
  for (let i = 0; i < 70; i++) { const x = rand(40, S - 40), y = rand(40, S - 40), w = rand(10, 30); c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x, y - 5, x + w, y); c.stroke(); }
});
const iceMat = mat('#ffffff', { map: iceTex, roughness: .22, metalness: .08 }), waterMat = mat('#ffffff', { map: waterTex, roughness: .1, metalness: .15 });
function setSeason(sp) {
  const want = sp ? 'spring' : 'winter'; if (SEASON.now === want) return; SEASON.now = want;
  SEASON.ground.material = mat('#ffffff', { map: sp ? grassTex : snowTex, roughness: sp ? .95 : .8 });
  treeMesh.geometry = sp ? treeGeoSpring : treeGeo;
  for (const [k, m] of MATS) if (/^#(f6f9fd|f7fafd|eef6fc)/.test(k)) m.visible = !sp;
  flakes.visible = !sp; SEASON.ice.material = sp ? waterMat : iceMat;
  scene.background = col(sp ? '#d9ecf5' : '#dfeaf6'); scene.fog.color = col(sp ? '#d9ecf5' : '#dfeaf6');
  hemi.groundColor = col(sp ? '#8a9a5a' : '#b9a894');
}
const boat = new THREE.Group(); scene.add(boat);
{ const hull = mesh(lathe([[0, 0], [.42, .02], [.55, .3], [.58, .42], [0, .42]], 14), wood('#a8714a'), 0, 0, 0, boat); hull.scale.set(1, 1, 2.1);
  mesh(new THREE.BoxGeometry(.9, .06, .3), wood('#7a4e30'), 0, .36, .3, boat);
  for (const sd of [-1, 1]) { const o = mesh(new THREE.CylinderGeometry(.03, .03, 1.6, 6), wood('#9a7a52'), sd * .7, .4, 0, boat); o.rotation.z = sd * 1.1; } }
boat.visible = false;
const BOAT = { state: 'dock', t: 0, catches: 0, home: new V3(20.7, .05, 0), spot: new V3(24.2, .05, 0) };
const PLOTS = [[11.0, 4.6], [12.8, 4.6], [11.9, 6.7]].map(([x, z], i) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const soil = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), mat('#ffffff', { map: dirtTex, roughness: 1 })); soil.rotation.x = -Math.PI / 2; soil.position.y = .02; soil.receiveShadow = true; g.add(soil);
  const crop = new THREE.Group(); g.add(crop);
  for (let k = 0; k < 9; k++) { const st = mesh(new THREE.CylinderGeometry(.03, .04, .8, 5), mat('#7fb84a'), -.45 + (k % 3) * .45, .4, -.45 + Math.floor(k / 3) * .45, crop); st.userData.head = mesh(new THREE.SphereGeometry(.09, 8, 6).scale(1, 2, 1), mat('#9ccf5a'), -.45 + (k % 3) * .45, .86, -.45 + Math.floor(k / 3) * .45, crop); }
  g.visible = false;
  return { g, crop, x, z, id: 'tarla' + i, state: 'empty', t: 0, given: 0 };
});
const oven = new THREE.Group(); oven.position.set(7.6, 0, 2.2); scene.add(oven);
mesh(new THREE.SphereGeometry(.85, 18, 12, 0, TAU, 0, Math.PI / 2), mat('#a78c78'), 0, 0, 0, oven);
mesh(new THREE.CylinderGeometry(.9, .95, .2, 18), mat('#8e96a2'), 0, .05, 0, oven);
{ const m = mesh(new THREE.CircleGeometry(.3, 14, 0, Math.PI), new THREE.MeshBasicMaterial({ color: col('#ff8a3a'), side: THREE.DoubleSide }), 0, .15, .82, oven); m.castShadow = false; }
mesh(new THREE.CylinderGeometry(.1, .12, .7, 8), mat('#6f7782'), .3, .9, -.3, oven);
const BAKE = { wheat: 0, wood: 0, busy: false, t: 0, outN: 0 };
houses.ev3 = makeHouse(2.9, 7.0, '#4f6f8f'); houseAnim.ev3 = 1;
const tower = new THREE.Group(); tower.position.set(7.9, 0, -7.9); scene.add(tower);
for (const x of [-.45, .45]) for (const z of [-.45, .45]) { const l = mesh(new THREE.CylinderGeometry(.07, .09, 3.2, 8), wood('#8a5a38'), x * .8, 1.6, z * .8, tower); l.rotation.z = -x * .12; l.rotation.x = z * .12; }
mesh(new THREE.BoxGeometry(1.4, .12, 1.4), wood('#a8714a'), 0, 3.2, 0, tower);
mesh(new THREE.ConeGeometry(1.1, .8, 4).rotateY(Math.PI / 4), wood('#c4473d'), 0, 3.9, 0, tower);
{ const lg = mesh(new THREE.BoxGeometry(.3, .3, .3), new THREE.MeshBasicMaterial({ color: col('#ffd27a') }), 0, 3.45, 0, tower); lg.castShadow = false; }
houses.kule = tower; houseAnim.kule = 1; tower.visible = false;
const feastTable = new THREE.Group(); feastTable.position.set(2.8, 0, 1.9); scene.add(feastTable);
mesh(new THREE.BoxGeometry(1.8, .1, .9), wood('#c48a5a'), 0, .75, 0, feastTable);
for (const x of [-.8, .8]) for (const z of [-.35, .35]) mesh(new THREE.BoxGeometry(.1, .75, .1), wood('#8a5a38'), x, .37, z, feastTable);
mesh(new THREE.BoxGeometry(1.7, .02, .8), mat('#e9e1cf'), 0, .81, 0, feastTable);
houses.sofra = feastTable; houseAnim.sofra = 1; feastTable.visible = false;
const makeWheat = () => { const g = new THREE.Group(); mesh(geo('new THREE.CylinderGeometry(.12, .1, .7, 8).rotateZ(Math.PI / 2)', () => new THREE.CylinderGeometry(.12, .1, .7, 8).rotateZ(Math.PI / 2)), mat('#e3b84a'), 0, 0, 0, g); mesh(geo('new THREE.TorusGeometry(.12, .025, 6, 12).rotateY(Math.PI / 2)', () => new THREE.TorusGeometry(.12, .025, 6, 12).rotateY(Math.PI / 2)), mat('#c4473d'), 0, 0, 0, g); return g; };
const makeBread = () => { const m = new THREE.Mesh(geo('bread', () => new THREE.SphereGeometry(.24, 14, 10).scale(1.5, .7, 1)), mat('#c9853e', { roughness: .8 })); m.castShadow = true; return m; };

/* ----- Tümsekler ve kayalar ----- */
{
  const mounds = [], rocks = [];
  const okSpot = (x, z) => !(Math.abs(x) < CAMP + 1 && Math.abs(z) < CAMP + 1) && Math.hypot(x - LAKE.x, z) > LAKE.r + .6 &&
    !(x > CAMP && x < 15 && Math.abs(z) < 3) && !(Math.abs(x) < 3 && z < -CAMP && z > -16);
  for (let i = 0; i < 60; i++) { const x = rand(-30, 30), z = rand(-30, 30); if (okSpot(x, z)) mounds.push({ x, z, ry: rand(0, TAU), sx: rand(.8, 2.2), sy: rand(.22, .42), sz: rand(.8, 1.8) }); }
  for (let i = 0; i < 30; i++) { const a = rand(0, TAU), r = LAKE.r + rand(.3, 1.2); const x = LAKE.x + Math.cos(a) * r, z = Math.sin(a) * r; if (!(x < 15 && Math.abs(z) < 3)) mounds.push({ x, z, ry: rand(0, TAU), sx: rand(.8, 1.6), sy: rand(.18, .34), sz: rand(.8, 1.4) }); }
  for (let i = 0; i < 34; i++) { const x = rand(-30, 30), z = rand(-30, 30); if (okSpot(x, z)) rocks.push({ x, z, y: .15, ry: rand(0, TAU), sx: rand(.4, .9), sy: rand(.3, .6), sz: rand(.4, .8) }); }
  instanced(lump(1, 2, .08), mat('#f6f9fd'), mounds);
  const rockGeo = mergeColored([[lump(1, 1, .2), (x, y) => y > .45 ? col('#f3f7fc') : mix('#6f7884', '#a3abb6', (y + 1) / 2)]]);
  instanced(rockGeo, vcFlat, rocks);
}

/* ----- Ağaçlar ----- */
const T = (() => {
  const xs = [], zs = [];
  const free = (x, z) =>
    (Math.abs(x) < CAMP + 1.6 && Math.abs(z) < CAMP + 1.6) ||
    Math.hypot(x - LAKE.x, z) < LAKE.r + 1.2 ||
    (x > CAMP && x < LAKE.x - LAKE.r + 1 && Math.abs(z) < 3.2) ||
    (Math.abs(x) < 2.6 && z < -CAMP && z > -15.5) || Math.hypot(x, z + 14) < 3.4 ||
    (z < -18.2 && z > -22.8) || Math.hypot(x, z + 26.6) < 5.4 || (Math.abs(x) < 1.6 && z < -15 && z > -19) ||
    (x > 9.4 && x < 14.4 && z > 3.2 && z < 8.6);
  for (let gx = -32; gx <= 32; gx += 2.2) for (let gz = -32; gz <= 32; gz += 2.2) {
    const x = gx + rand(-.6, .6), z = gz + rand(-.6, .6);
    if (!free(x, z)) { xs.push(x); zs.push(z); }
  }
  const n = xs.length;
  return { n, x: Float32Array.from(xs), z: Float32Array.from(zs), s: Float32Array.from({ length: n }, () => rand(.78, 1.05)), ry: Float32Array.from({ length: n }, () => rand(0, TAU)),
    hp: new Uint8Array(n), st: new Uint8Array(n), t: new Float32Array(n), shake: new Float32Array(n), fd: new Float32Array(n), anim: new Set(), grid: new Map() };
})();
// Bir kat: yıldız gibi tırtıklı etek (uçlar sarkık), tepesinde kar örtüsü, uç dallarda kar, altı koyu.
const PAL_W = { snow: '#f2f7fd', tip: '#dde9f7', under: '#476fae', lo: '#5287d2', hi: '#8fb9ec', band: '#9cc3ef' };
const PAL_S = { snow: '#9ad06e', tip: '#7fbf5a', under: '#2f5e2c', lo: '#3d7a3a', hi: '#78b858', band: '#6aaa4e' };
function treeTiers(tiers, n = 7, pal = PAL_W) {
  const P = [], C = [], N = [];
  const tri = (a, b, c, ca, cb, cc, up) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if ((ny >= 0) !== up) { [b, c] = [c, b]; [cb, cc] = [cc, cb]; nx = -nx; ny = -ny; nz = -nz; }
    const l = Math.hypot(nx, ny, nz) || 1;
    P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); for (const q of [ca, cb, cc]) C.push(q.r, q.g, q.b); for (let k = 0; k < 3; k++) N.push(nx / l, ny / l, nz / l);
  };
  const snow = col(pal.snow), snowTip = col(pal.tip), under = col(pal.under);
  for (const [R, H, y0, rot] of tiers) {
    const rim = [], ring = [], apex = [0, y0 + H, 0], inner = [0, y0 + .14, 0];
    for (let i = 0; i < n * 2; i++) {
      const a = rot + i / (n * 2) * TAU, out = i % 2 === 0, r = out ? R : R * .74, y = y0 + (out ? -.1 : .05);
      rim.push([Math.cos(a) * r, y, Math.sin(a) * r, out]);
      const k = out ? .3 : .26; ring.push([Math.cos(a) * r * k, y0 + H - (H - (y - y0)) * (out ? .3 : .26), Math.sin(a) * r * k]);
    }
    const blue = (y, out) => out ? snowTip : mix(pal.lo, pal.hi, (y - y0) / H);
    for (let i = 0; i < rim.length; i++) {
      const j = (i + 1) % rim.length, a = rim[i], b = rim[j], ra = ring[i], rb = ring[j];
      tri(apex, ra, rb, snow, snow, snow, true);                                         // kar örtüsü
      const ca = col(pal.band), cb = col(pal.band);
      tri(ra, rb, a, ca, cb, blue(a[1], a[3]), true); tri(rb, b, a, cb, blue(b[1], b[3]), blue(a[1], a[3]), true);
      tri(inner, a, b, under, under, under, false);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  return g;
}
const TIERS = [[1.25, 1.0, .52, 0], [1.02, .92, 1.0, .35], [.78, .84, 1.46, .8], [.5, .78, 1.9, .2]];
const trunkGeo = () => [new THREE.CylinderGeometry(.15, .22, .8, 8).translate(0, .4, 0), (x, y) => mix('#4f1b23', '#80303b', y / .8)];
const treeGeo = mergeColored([trunkGeo(), [treeTiers(TIERS), null]]);
const treeGeoSpring = mergeColored([trunkGeo(), [treeTiers(TIERS, 7, PAL_S), null]]);
const stumpGeo = mergeColored([
  [new THREE.CylinderGeometry(.24, .29, .34, 12, 1, true).translate(0, .17, 0), '#7a2c37'],
  [new THREE.CircleGeometry(.24, 12).rotateX(-Math.PI / 2).translate(0, .34, 0), (x, y, z) => mix('#f0d3a6', '#c99a66', Math.hypot(x, z) / .24)],
]);
const treeMesh = new THREE.InstancedMesh(treeGeo, vcFlat, T.n), stumpMesh = new THREE.InstancedMesh(stumpGeo, vcMat, T.n);
treeMesh.castShadow = true; treeMesh.receiveShadow = true; stumpMesh.receiveShadow = true;
treeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); stumpMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
scene.add(treeMesh, stumpMesh);
{ const c = new THREE.Color(); for (let i = 0; i < T.n; i++) { const k = rand(.9, 1.05); c.setRGB(k, k, k * rand(.98, 1.03)); treeMesh.setColorAt(i, c); }
  for (let i = 0; i < T.n; i++) { const k = Math.floor((T.x[i] + 60) / 3) * 1000 + Math.floor((T.z[i] + 60) / 3); if (!T.grid.has(k)) T.grid.set(k, []); T.grid.get(k).push(i); } }
const UP = new V3(0, 1, 0), QA = new THREE.Quaternion(), QB = new THREE.Quaternion(), AX = new V3();
function treeMatrix(i) {
  const st = T.st[i]; let sc = T.s[i];
  O.position.set(T.x[i], 0, T.z[i]);
  QB.setFromAxisAngle(UP, T.ry[i]);
  if (st === 0 && T.shake[i] > 0) { const k = Math.sin(T.shake[i] * 45) * T.shake[i] * .35; AX.set(Math.cos(T.fd[i]), 0, -Math.sin(T.fd[i])); QA.setFromAxisAngle(AX, k); O.quaternion.copy(QA).multiply(QB); }
  else if (st === 1) {
    const p = clamp(T.t[i] / .55, 0, 1); AX.set(Math.cos(T.fd[i]), 0, -Math.sin(T.fd[i])); QA.setFromAxisAngle(AX, p * p * 1.45); O.quaternion.copy(QA).multiply(QB);
    if (T.t[i] > .55) sc *= Math.max(.001, 1 - (T.t[i] - .55) / .35);
  } else if (st === 2) sc = .001;
  else if (st === 3) { O.quaternion.copy(QB); sc *= Math.max(.001, clamp(T.t[i] / .8, 0, 1)); }
  else O.quaternion.copy(QB);
  O.scale.setScalar(sc); O.updateMatrix(); treeMesh.setMatrixAt(i, O.matrix);
  O.quaternion.copy(QB); O.scale.setScalar(st === 1 || st === 2 ? T.s[i] : .001); O.updateMatrix(); stumpMesh.setMatrixAt(i, O.matrix);
}
function resetTrees() {
  T.anim.clear();
  for (let i = 0; i < T.n; i++) { T.st[i] = 0; T.hp[i] = 0; T.shake[i] = 0; T.t[i] = 0; treeMatrix(i); }
  treeMesh.instanceMatrix.needsUpdate = stumpMesh.instanceMatrix.needsUpdate = true;
}
function treesNear(x, z, fn) {
  const cx = Math.floor((x + 60) / 3), cz = Math.floor((z + 60) / 3);
  for (let a = cx - 1; a <= cx + 1; a++) for (let b = cz - 1; b <= cz + 1; b++) { const l = T.grid.get(a * 1000 + b); if (l) for (const i of l) fn(i); }
}
function nearestTree(x, z, maxD) {
  let best = -1, bd = maxD;
  treesNear(x, z, i => { if (T.st[i] !== 0) return; const d = Math.hypot(T.x[i] - x, T.z[i] - z); if (d < bd) { bd = d; best = i; } });
  return best;
}

/* ----- Kar taneleri ----- */
const flakes = (() => {
  const n = 600, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = rand(-22, 22); pos[i * 3 + 1] = rand(0, 18); pos[i * 3 + 2] = rand(-22, 22); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: col('#ffffff'), size: .13, map: smokeTex, transparent: true, opacity: .95, depthWrite: false }));
  scene.add(p); return p;
})();

/* ================= Odun, balık, insanlar ================= */
const logGeo = new THREE.CylinderGeometry(.15, .15, .95, 12).rotateZ(Math.PI / 2);
const logMats = [wood('#a86c42'), mat('#ecc796'), mat('#ecc796')];
const makeLog = () => { const m = new THREE.Mesh(logGeo, logMats); m.castShadow = true; return m; };
const fishBody = new THREE.SphereGeometry(.2, 16, 10).scale(1.9, .62, .85);
const fishTail = new THREE.ConeGeometry(.15, .26, 8).rotateZ(Math.PI / 2).scale(1, 1, .35).translate(-.47, 0, 0);
const fishFin = new THREE.ConeGeometry(.08, .16, 6).scale(1, 1, .3).translate(0, .14, 0);
function makeFish(type = 'fish') {
  const g = new THREE.Group(), big = type === 'big', sm = type === 'smoked';
  mesh(fishBody, mat(big ? '#f0956a' : sm ? '#b9773d' : '#8cbad6', { roughness: sm ? .8 : .45 }), 0, 0, 0, g);
  mesh(fishTail, mat(big ? '#d36e48' : sm ? '#8f5428' : '#6698b8', { roughness: .5 }), 0, 0, 0, g);
  mesh(fishFin, mat(big ? '#d36e48' : sm ? '#8f5428' : '#6698b8'), .05, 0, 0, g);
  for (const s of [-1, 1]) mesh(geo('new THREE.SphereGeometry(.03, 6, 4)', () => new THREE.SphereGeometry(.03, 6, 4)), '#1d2a36', .26, .03, s * .14, g);
  if (big) g.scale.setScalar(1.35);
  return g;
}
for (const [x, z] of stallCrates) for (let k = 0; k < 3; k++) { const f = makeFish(x < 0 ? 'big' : 'fish'); f.position.set(x - .25 + k * .25, .62, z); f.rotation.y = 1.4; stall.add(f); }
const makeItem = t => t === 'wood' ? makeLog() : t === 'plank' ? makePlank() : t === 'stone' ? makeStone() : t === 'wheat' ? makeWheat() : t === 'bread' ? makeBread() : makeFish(t);
const blobGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const blobMat = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false });

function makePerson({ coat = '#c4473d', hat = '#27324a', skin = '#f0c6a0', pants = '#394150', scale = 1, hair = null, apron = false, axe = false, pack = false } = {}) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const shadow = new THREE.Mesh(blobGeo, blobMat); shadow.scale.set(1.3, 1, 1.3); shadow.position.y = .03; shadow.renderOrder = 1; g.add(shadow);
  const legL = new THREE.Group(), legR = new THREE.Group(), armL = new THREE.Group(), armR = new THREE.Group();
  legL.position.set(-.17, .56, 0); legR.position.set(.17, .56, 0); armL.position.set(-.47, 1.28, 0); armR.position.set(.47, 1.28, 0);
  body.add(legL, legR, armL, armR);
  const coatM = mat(coat, { roughness: .75 }), hatM = mat(hat, { roughness: .95 });
  for (const leg of [legL, legR]) { mesh(geo('capsule(.13, .58)', () => capsule(.13, .58)), pants, 0, 0, 0, leg); mesh(geo('new THREE.SphereGeometry(.16, 14, 10).scale(1, .62, 1.35)', () => new THREE.SphereGeometry(.16, 14, 10).scale(1, .62, 1.35)), '#3a2a22', 0, -.5, .07, leg); }
  mesh(geo('lathe([[0, .5], [.45, .5], [.5, .58], [.48, .72], [.44, 1.0], [.38, 1.28], [.28, 1.42], [0, 1.45]], 20)', () => lathe([[0, .5], [.45, .5], [.5, .58], [.48, .72], [.44, 1.0], [.38, 1.28], [.28, 1.42], [0, 1.45]], 20)), coatM, 0, 0, 0, body);
  mesh(geo('new THREE.TorusGeometry(.47, .07, 8, 22).rotateX(Math.PI / 2)', () => new THREE.TorusGeometry(.47, .07, 8, 22).rotateX(Math.PI / 2)), mat('#f3efe6', { roughness: 1 }), 0, .56, 0, body);      // kürk etek
  mesh(geo('new THREE.BoxGeometry(.05, .7, .03)', () => new THREE.BoxGeometry(.05, .7, .03)), mat('#2b2b30'), 0, .93, .47, body);                                                  // fermuar
  mesh(geo('new THREE.TorusGeometry(.27, .1, 10, 22).rotateX(Math.PI / 2)', () => new THREE.TorusGeometry(.27, .1, 10, 22).rotateX(Math.PI / 2)), hatM, 0, 1.45, 0, body);                                   // atkı
  { const tail = mesh(geo('new THREE.BoxGeometry(.16, .42, .06)', () => new THREE.BoxGeometry(.16, .42, .06)), hatM, .2, 1.22, .33, body); tail.rotation.z = .2; }
  if (apron) mesh(geo('new THREE.BoxGeometry(.52, .62, .06)', () => new THREE.BoxGeometry(.52, .62, .06)), '#efe9dc', 0, .9, .46, body);
  mesh(geo('new THREE.SphereGeometry(.34, 22, 18)', () => new THREE.SphereGeometry(.34, 22, 18)), skin, 0, 1.78, 0, body);
  for (const s of [-1, 1]) mesh(geo('new THREE.SphereGeometry(.045, 10, 8)', () => new THREE.SphereGeometry(.045, 10, 8)), '#1f2430', s * .12, 1.8, .31, body);
  for (const s of [-1, 1]) mesh(geo('new THREE.SphereGeometry(.06, 10, 8)', () => new THREE.SphereGeometry(.06, 10, 8)), mat('#f4a596', { roughness: 1 }), s * .2, 1.7, .27, body);
  mesh(geo('new THREE.SphereGeometry(.05, 8, 6)', () => new THREE.SphereGeometry(.05, 8, 6)), '#e9a98c', 0, 1.75, .34, body);
  if (hair) mesh(geo('new THREE.SphereGeometry(.17, 12, 10)', () => new THREE.SphereGeometry(.17, 12, 10)), hair, 0, 1.9, -.27, body);
  mesh(geo('new THREE.SphereGeometry(.36, 22, 12, 0, TAU, 0, Math.PI / 2)', () => new THREE.SphereGeometry(.36, 22, 12, 0, TAU, 0, Math.PI / 2)), hatM, 0, 1.84, 0, body);
  mesh(geo('new THREE.TorusGeometry(.34, .075, 8, 24).rotateX(Math.PI / 2)', () => new THREE.TorusGeometry(.34, .075, 8, 24).rotateX(Math.PI / 2)), hatM, 0, 1.86, 0, body);
  mesh(geo('new THREE.SphereGeometry(.1, 12, 10)', () => new THREE.SphereGeometry(.1, 12, 10)), '#f4f1ea', 0, 2.2, 0, body);
  for (const arm of [armL, armR]) { mesh(geo('capsule(.115, .64)', () => capsule(.115, .64)), coatM, 0, .02, 0, arm); mesh(geo('new THREE.SphereGeometry(.125, 12, 10)', () => new THREE.SphereGeometry(.125, 12, 10)), '#3a3a40', 0, -.6, 0, arm); }
  if (pack) { // sırt çerçevesi: yük bunun üstüne yığılır
    mesh(geo('new THREE.BoxGeometry(.56, .62, .22)', () => new THREE.BoxGeometry(.56, .62, .22)), wood('#8a5a38'), 0, 1.02, -.42, body);
    for (const x of [-.24, .24]) mesh(geo('new THREE.CylinderGeometry(.03, .03, 1.0, 6)', () => new THREE.CylinderGeometry(.03, .03, 1.0, 6)), wood('#6e4a30'), x, 1.15, -.55, body);
  }
  let tool = null, rod = null;
  if (axe) {
    tool = new THREE.Group(); tool.position.set(0, -.62, 0); armR.add(tool);
    const h = mesh(geo('new THREE.CylinderGeometry(.045, .05, .95, 8)', () => new THREE.CylinderGeometry(.045, .05, .95, 8)), wood('#9a6a44'), 0, 0, .38, tool); h.rotation.x = Math.PI / 2;
    mesh(geo('new THREE.BoxGeometry(.08, .34, .3)', () => new THREE.BoxGeometry(.08, .34, .3)), mat('#b8c0cb', { metalness: .7, roughness: .3 }), 0, .14, .78, tool);
    rod = new THREE.Group(); rod.position.set(0, -.62, 0); armR.add(rod); rod.visible = false;
    const r = mesh(geo('new THREE.CylinderGeometry(.025, .035, 1.8, 6)', () => new THREE.CylinderGeometry(.025, .035, 1.8, 6)), wood('#7a5132'), 0, .4, .75, rod); r.rotation.x = 1.1;
  }
  g.scale.setScalar(scale);
  return { g, body, legL, legR, armL, armR, tool, rod, walk: Math.random() * 10 };
}
function animPerson(p, dt, speed, opts = {}) {
  p.walk += dt * (speed > .1 ? 9 : 2);
  const w = speed > .1 ? Math.sin(p.walk) * .7 : 0;
  p.legL.rotation.x = w; p.legR.rotation.x = -w;
  if (!opts.busyR) p.armR.rotation.x = opts.restR !== undefined ? opts.restR : -w * .8;
  p.armL.rotation.x = speed > .1 ? w * .8 : Math.sin(p.walk) * .05;
  p.body.position.y = speed > .1 ? Math.abs(Math.sin(p.walk)) * .06 : Math.sin(p.walk * .8) * .015;
}

/* ----- Oyuncu ----- */
const P = { x: 0, z: 4.6, face: 0, speed: 0, stack: [], incoming: 0, chopCd: 0, swing: 1, fishProg: 0, model: null, anchor: null, warnAt: -99, stepT: 0, stepSide: 1 };
function buildPlayer() {
  if (P.model) scene.remove(P.model.g);
  const c = COATS[Save.d.color];
  P.model = makePerson({ coat: c.coat, hat: c.hat, axe: true, pack: true });
  P.anchor = new THREE.Group(); P.model.g.add(P.anchor);
  scene.add(P.model.g); rebuildStack();
}
const capNow = () => CFG.cap + (G.upg.frame ? 2 : 0);
const hitsNow = () => G.upg.axe ? 2 : CFG.hits;
const room = () => capNow() - P.stack.length - P.incoming;
const has = type => P.stack.includes(type);
const count = type => P.stack.filter(t => t === type).length;
// Sırt: ilk sütunda kütükler (üstlerinde tahtalar), ikinci sütunda balıklar (önce küçükler, üstte büyükler).
const COL_A = [['wood', .31], ['plank', .1], ['stone', .26], ['wheat', .22]], COL_B = [['fish', .25], ['smoked', .25], ['big', .32], ['bread', .26]];
function stackSlot(type, i) {
  const inA = COL_A.some(([t]) => t === type), col = inA ? COL_A : COL_B;
  let y = inA ? 1.0 : .95;
  for (const [t, h] of col) { if (t === type) { y += i * h; break; } y += count(t) * h; }
  const aUsed = COL_A.some(([t]) => count(t) > 0);
  return new V3(0, y, inA || !aUsed ? -.68 : -1.12);
}
function rebuildStack() {
  if (!P.anchor) return;
  P.anchor.clear();
  const n = {};
  for (const t of P.stack) { n[t] = n[t] || 0; const m = makeItem(t); m.position.copy(stackSlot(t, n[t]++)); P.anchor.add(m); }
}
const stackWorld = (type, i) => P.model.g.localToWorld(stackSlot(type, i));
function take(type) {
  const i = P.stack.lastIndexOf(type); if (i < 0) return null;
  const from = stackWorld(type, count(type) - 1);
  P.stack.splice(i, 1); rebuildStack(); return from;
}
// Yığına doğru uçan parça; varınca yığına eklenir (yer önceden ayrılır, taşma olmaz).
function giveToPlayer(type, from, delay = 0) {
  P.incoming++;
  fly(makeItem(type), from, () => stackWorld(type, count(type)), .42, () => { P.incoming--; P.stack.push(type); rebuildStack(); Snd.fx('pick'); }, 1.4, delay);
}

/* ----- Diğer insanlar ----- */
const npcs = [];
const FAMILY = [
  { coat: '#6f557f', hat: '#d9d2c3', hair: '#cfcac2', scale: .95 },   // nine
  { coat: '#56677a', hat: '#7a3b2e', scale: 1.02 },                  // dede
  { coat: '#d9a93a', hat: '#2f4a6a', scale: .66 },                   // torun
  { coat: '#4f8fcf', hat: '#b8423a', scale: .7 },                    // torun
  { coat: '#5f8a4c', hat: '#3a2d28', scale: 1 },                     // yeni gelen
  { coat: '#9a6a3a', hat: '#2f4a6a', scale: .98, speed: 3.6 },      // kayıp yolcu
  { coat: '#c4865a', hat: '#e9e3d3', scale: .7 },                    // bahar ailesi
  { coat: '#5a7fa8', hat: '#d9a93a', scale: 1 },
];
const SLOTS = [[-7.6, 2.4], [-6.1, 2.0], [-4.7, 2.3], [-3.4, 3.1], [-8.2, 3.9], [-5.0, .6], [-3.0, 1.4], [-8.2, .5]];
let trader = null;
function dropBubble(n) { if (n.bubble) { n.bubble.material.map.dispose(); n.bubble.material.dispose(); n.bubble = null; } }
function clearNpcs() { for (const n of npcs) { dropBubble(n); scene.remove(n.p.g); } npcs.length = 0; trader = null; }
function addNpc(spec, x, z, path) {
  const p = makePerson(spec); p.g.position.set(x, 0, z); scene.add(p.g);
  const n = { p, path: path || [], speed: spec.speed || 2.3 }; npcs.push(n); return n;
}
function addGuest(k, walkIn) {
  const [sx, sz] = SLOTS[k];
  if (walkIn) return addNpc(FAMILY[k], rand(-.6, .6), -15 - k * 1.3, [[0, -7], [sx, sz]]);
  return addNpc(FAMILY[k], sx, sz);
}

/* ----- Tavşanlar: ormanın kenarında dolaşır, yaklaşınca kaçar ----- */
const rabbits = Array.from({ length: 4 }, () => {
  const g = new THREE.Group(); scene.add(g);
  const b = new THREE.Group(); g.add(b);
  const fur = mat('#f4f0e8', { roughness: 1 });
  mesh(geo('new THREE.SphereGeometry(.24, 14, 10).scale(1, .85, 1.25)', () => new THREE.SphereGeometry(.24, 14, 10).scale(1, .85, 1.25)), fur, 0, .25, 0, b);
  mesh(geo('new THREE.SphereGeometry(.16, 14, 10)', () => new THREE.SphereGeometry(.16, 14, 10)), fur, 0, .44, .24, b);
  for (const s of [-1, 1]) { const e = mesh(geo('capsule(.045, .3, 8)', () => capsule(.045, .3, 8)), fur, s * .06, .72, .2, b); e.rotation.z = s * .15; mesh(geo('new THREE.SphereGeometry(.025, 6, 4)', () => new THREE.SphereGeometry(.025, 6, 4)), '#2a2226', s * .08, .48, .37, b); }
  mesh(geo('new THREE.SphereGeometry(.07, 8, 6)', () => new THREE.SphereGeometry(.07, 8, 6)), '#ffffff', 0, .3, -.3, b);
  const sh = new THREE.Mesh(blobGeo, blobMat); sh.scale.setScalar(.6); sh.position.y = .03; g.add(sh);
  const a = rand(0, TAU), r = rand(12, 16);
  const R = { g, b, x: Math.cos(a) * r, z: Math.sin(a) * r, tx: 0, tz: 0, wait: rand(0, 3), hop: 0 };
  R.tx = R.x; R.tz = R.z; g.position.set(R.x, 0, R.z); return R;
});
function okRabbit(x, z) { return !(Math.abs(x) < CAMP + 1 && Math.abs(z) < CAMP + 1) && Math.hypot(x - LAKE.x, z) > LAKE.r + .5 && Math.hypot(x, z) < 24; }
function updateRabbits(dt) {
  for (const R of rabbits) {
    const dp = Math.hypot(R.x - P.x, R.z - P.z);
    if (dp < 3.2 && R.wait > -1) { const a = Math.atan2(R.x - P.x, R.z - P.z) + rand(-.5, .5); const tx = R.x + Math.sin(a) * 5, tz = R.z + Math.cos(a) * 5; if (okRabbit(tx, tz)) { R.tx = tx; R.tz = tz; R.wait = -1; } }
    const dx = R.tx - R.x, dz = R.tz - R.z, d = Math.hypot(dx, dz);
    if (d > .1) {
      const sp = R.wait === -1 ? 4.2 : 1.8, s = Math.min(d, sp * dt);
      R.x += dx / d * s; R.z += dz / d * s; R.hop += dt * (R.wait === -1 ? 14 : 9);
      R.g.rotation.y = Math.atan2(dx, dz); R.b.position.y = Math.abs(Math.sin(R.hop)) * .28;
    } else {
      R.b.position.y = 0; if (R.wait === -1) R.wait = rand(1, 3);
      R.wait -= dt;
      if (R.wait <= 0) { for (let k = 0; k < 6; k++) { const tx = R.x + rand(-4, 4), tz = R.z + rand(-4, 4); if (okRabbit(tx, tz)) { R.tx = tx; R.tz = tz; break; } } R.wait = rand(1.5, 4); }
    }
    R.g.position.set(R.x, 0, R.z);
  }
}

/* ----- Ayak izleri: karda yürürken arkada kalır, yavaşça silinir ----- */
const steps = Array.from({ length: 70 }, () => { const m = flatDecal(stepTex, .22, .34, 0); m.position.y = .035; scene.add(m); return { m, t: 99 }; });
let stepI = 0;
function leaveStep() {
  const onSnow = !(Math.abs(P.x) < CAMP && Math.abs(P.z) < CAMP) && !(pierBuilt && P.x > 12.4 && Math.abs(P.z) < 1.2);
  if (!onSnow) return;
  const s = steps[stepI++ % steps.length], side = (P.stepSide = -P.stepSide) * .14;
  s.m.position.set(P.x + Math.cos(P.face) * side, .035, P.z - Math.sin(P.face) * side); s.m.rotation.z = P.face; s.t = 0;
}
function updateSteps(dt) { for (const s of steps) if (s.t < 30) { s.t += dt; s.m.material.opacity = Math.max(0, .7 * (1 - s.t / 30)); } }

/* ================= Uçan parçalar ve kıvılcımlar ================= */
const flyers = [];
function fly(obj, from, toFn, dur, onDone, arc = 1.2, delay = 0) {
  obj.position.copy(from); obj.visible = delay <= 0; scene.add(obj);
  flyers.push({ obj, from: from.clone(), toFn, dur, t: -delay, onDone, arc });
}
function clearFlyers() { for (const f of flyers) scene.remove(f.obj); flyers.length = 0; }
const chipGeo = new THREE.BoxGeometry(.08, .08, .08);
function burst(pos, hex, n = 6, up = 3) {
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(chipGeo, mat(hex)); const to = pos.clone().add(new V3(rand(-1, 1), 0, rand(-1, 1)));
    to.y = .05; fly(m, pos, () => to, rand(.35, .6), null, rand(.4, up * .3));
  }
}

/* ================= Bölgeler (yerdeki kareler) ================= */
function makeTile(size) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const tex = new THREE.CanvasTexture(cv); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = ANISO;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = 3; scene.add(m);
  return { ctx: cv.getContext('2d'), tex, m, key: '' };
}
const Z = {};
function zone(id, x, z, h, accepts, opt) {
  const t = makeTile(h * 2); t.m.position.set(x, opt.y || .045, z);
  return (Z[id] = Object.assign({ id, x, z, h, accepts, need: 0, have: 0, active: false, timer: 0, tile: t, onFull: null }, opt));
}
const COUNTER = new V3(5.5, 1.2, -5);
zone('ocak', 0, 1.75, 1.25, 'wood', { near: [0, -1, 2.4], to: () => new V3(rand(-.2, .2), .5, -1 + rand(-.2, .2)),
  spec: z => z.lighting ? { type: 'light', n: z.need - z.have } : strict() ? { type: 'nightS', flakes: dayCfg().flakes, have: z.have } : { type: 'night', flakes: dayCfg().flakes, per: CFG.perFlake, have: z.have, ok: z.have >= z.need } });
zone('kiler', -5.5, -3.4, 1.25, 'fish', { near: [-3.6, -6.1, 1.95], to: () => new V3(-3.6, 1.4, -6.1),
  spec: z => ({ type: 'plates', plates: G.plates.slice(), ok: z.have >= z.need }) });
zone('tezK', 4.6, -3.25, .9, 'wood', { trade: 'fish', to: () => new V3(4.8, 1.1, -5),
  spec: () => ({ type: 'trade', kind: 'fish', price: priceOf('fish'), prog: G.prog.fish, stock: G.stock.fish, up: G.priceAdd > 0 }) });
zone('tezB', 6.4, -3.25, .9, 'wood', { trade: 'big', to: () => new V3(6.2, 1.1, -5),
  spec: () => ({ type: 'trade', kind: 'big', price: priceOf('big'), prog: G.prog.big, stock: G.stock.big, up: G.priceAdd > 0 }) });
zone('iskele', 11.6, 0, 1.2, 'wood', { to: () => new V3(13.4, .3, rand(-.5, .5)),
  spec: z => ({ type: 'count', top: 'pier', icon: 'log', n: z.need - z.have, ok: z.have >= z.need, brackets: true }) });
zone('olta', 19.0, 0, .85, null, { fishing: true, y: .19, spec: () => ({ type: 'fishing', p: Math.round(P.fishProg * 20) / 20 }) });
zone('pazar', 6.4, 7.6, .85, null, { market: true, spec: () => { const c = customers.find(x => x.cust.state === 'wait'); return { type: 'market', need: c ? needOf(c) : null }; } });
zone('depo', -1.6, -4.3, .85, 'wood', { depot: true, to: () => new V3(-2.95, 1, -4.3), spec: z => ({ type: 'depot', have: z.have, cap: z.need, goal: CC().depotGoal || 0 }) });
zone('bant', BELT.x, BELT.z0 - .9, .8, 'wood', { belt: true, to: () => new V3(BELT.x - .9, .3, BELT.z0 - .5),
  spec: z => BELT.built ? { type: 'beltin', buf: BELT.buffer, max: BELT.max } : { type: 'count', top: 'belt', icon: 'log', n: z.need - z.have, ok: false, brackets: true } });
zone('tahta', -3.1, -3.6, .75, null, { planks: true, spec: () => ({ type: 'planks', n: SAW.out, max: SAW.max }) });
zone('up0', 2.0, 7.6, .8, null, { coin: true, spec: z => ({ type: 'coinbuy', icon: z.up, n: z.need - z.have, ok: z.have >= z.need }) });
zone('up1', 3.9, 7.6, .8, null, { coin: true, spec: z => ({ type: 'coinbuy', icon: z.up, n: z.need - z.have, ok: z.have >= z.need }) });
zone('ev', -.6, 6.8, 1.1, null, { coin: true, spec: z => ({ type: 'coinbuy', icon: 'house', n: z.need - z.have, ok: z.have >= z.need }) });
zone('ev2', -7.6, -1.5, 1.1, 'plank', { to: () => new V3(-7.6, .6, -1.5), spec: z => ({ type: 'count', top: 'house', icon: 'plank', n: z.need - z.have, ok: z.have >= z.need, brackets: true }) });
zone('tutsu', 4.7, .3, .8, null, { mach: 'smoke', spec: () => ({ type: 'mach', inIcon: 'fish', inN: MACH.smoke.inb, outIcon: 'smoked', outN: MACH.smoke.outN, busy: MACH.smoke.busy }) });
zone('taslik', 2.6, -4.6, .7, 'stone', { store: 'stone', to: () => new V3(3.8, .5, -4.55), spec: z => ({ type: 'store', icon: 'stone', have: z.have, cap: z.need, goal: CC().stoneGoal || 0 }) });
zone('kopru', 0, -17.4, .9, null, { build: true, spec: z => ({ type: 'build', top: 'bridge', req: z.req, got: z.got, ok: !!G.built.kopru }) });
zone('kayik', 19.0, 0, .85, null, { boat: true, y: .19, spec: () => ({ type: 'boat', state: BOAT.state }) });
PLOTS.forEach(pl => zone(pl.id, pl.x, pl.z, .78, null, { plot: pl, spec: () => ({ type: 'plot', state: pl.state, p: Math.round(clamp(pl.t / CFG.growTime, 0, 1) * 20) / 20 }) }));
zone('ambar', 4.4, 2.4, .7, 'wheat', { store: 'wheat', to: () => new V3(4.4, .4, 2.4), spec: z => ({ type: 'store', icon: 'wheat', have: z.have, cap: z.need, goal: CC().wheatGoal || 0 }) });
zone('firin', 6.1, 2.2, .7, null, { bake: true, spec: () => ({ type: 'bake', wheat: BAKE.wheat, wood: BAKE.wood, out: BAKE.outN, busy: BAKE.busy }) });
for (const [id, x, z, top] of [['ev3', 2.9, 6.8, 'house'], ['kule', 7.9, -6.4, 'tower'], ['sofra', 2.8, 3.3, 'feast']])
  zone('b_' + id, x, z, .9, null, { build: true, target: id, spec: zz => ({ type: 'build', top, req: zz.req, got: zz.got, ok: !!G.built[id] }) });
SOBA.forEach((sb, i) => zone(sb.id, sb.x, sb.z, .7, null, { build: true, soba: i, spec: z => ({ type: 'build', top: 'stove', req: z.req, got: z.got, ok: sb.built }) }));
const MACH = { smoke: { input: 'fish', outType: 'smoked', time: 3, inb: 0, max: 4, busy: false, t: 0, outN: 0, outMax: 6 } };
const UP_COST = { axe: 6, frame: 8, belt: 8, saw: 8 };
const priceOf = k => (CC().price ? CC().price[k] : 0) + G.priceAdd;

function paintTile(z) {
  const sp = z.spec(z), key = JSON.stringify(sp);
  if (key === z.tile.key) return;
  z.tile.key = key;
  const c = z.tile.ctx; c.clearRect(0, 0, 256, 256);
  const off = sp.type === 'trade' && sp.stock <= 0;
  c.fillStyle = sp.ok ? 'rgba(38,124,84,.9)' : off ? 'rgba(70,58,50,.55)' : '#6b4429'; rr(c, 8, 8, 240, 240, 36); c.fill();
  if (!sp.ok && !off) { c.save(); rr(c, 8, 8, 240, 240, 36); c.clip(); c.strokeStyle = 'rgba(30,14,4,.35)'; c.lineWidth = 3;
    for (const y of [68, 128, 188]) { c.beginPath(); c.moveTo(8, y); c.lineTo(248, y); c.stroke(); }
    c.strokeStyle = 'rgba(255,220,170,.10)'; c.lineWidth = 2; for (const [y, a] of [[40, 30], [98, 160], [152, 70], [214, 190]]) { c.beginPath(); c.moveTo(20, y); c.bezierCurveTo(a, y - 6, a + 60, y + 6, 236, y); c.stroke(); } c.restore(); }
  c.strokeStyle = sp.ok ? 'rgba(255,255,255,.18)' : 'rgba(255,225,180,.22)'; c.lineWidth = 4; rr(c, 14, 14, 228, 228, 31); c.stroke();
  if (sp.brackets && !sp.ok) {
    c.strokeStyle = 'rgba(255,255,255,.92)'; c.lineWidth = 9; c.lineCap = 'round';
    for (const [x, y, sx, sy] of [[22, 22, 1, 1], [234, 22, -1, 1], [22, 234, 1, -1], [234, 234, -1, -1]]) { c.beginPath(); c.moveTo(x, y + sy * 46); c.lineTo(x, y); c.lineTo(x + sx * 46, y); c.stroke(); }
  }
  c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const num = (t, x, y, size, color = '#fff') => { c.fillStyle = color; c.font = `800 ${size}px "Baloo 2", system-ui, sans-serif`; c.fillText(String(t), x, y + size * .06); };
  if (sp.type === 'count' || sp.type === 'light') {
    if (sp.ok) drawIcon(c, 'check', 128, 128, 120);
    else { drawIcon(c, sp.type === 'light' ? 'fire' : sp.top, 128, 66, 76); drawIcon(c, sp.icon || 'log', 92, 166, 84); num(sp.n, 176, 168, 96); }
  } else if (sp.type === 'night') {
    // Her kar tanesinin altında 'per' odun yuvası; çocuk taneleri sayar, yuvaları doldurur.
    const n = sp.flakes, w = Math.min(80, 220 / n), x0 = 128 - (n - 1) * w / 2;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * w; drawIcon(c, 'flake', x, 70, w * .78, { c: '#cfe8ff' });
      for (let k = 0; k < sp.per; k++) { const filled = i * sp.per + k < sp.have; drawIcon(c, 'log', x, 140 + k * 48, w * .7, { alpha: filled ? 1 : .28 }); }
    }
    if (sp.ok) drawIcon(c, 'check', 214, 42, 54);
  } else if (sp.type === 'nightS') {
    // Kaç odun gerektiğini çocuk hesaplar: karede yalnız soru (kar taneleri) ve ocaktaki odun sayısı var.
    const n = sp.flakes, w = Math.min(70, 220 / n), x0 = 128 - (n - 1) * w / 2;
    for (let i = 0; i < n; i++) drawIcon(c, 'flake', x0 + i * w, 72, w * .8, { c: '#cfe8ff' });
    drawIcon(c, 'log', 96, 172, 92); num(sp.have, 172, 174, 88);
  } else if (sp.type === 'plates') {
    // Her misafirin bir tabağı: küçük balık bir tabağı, büyük balık iki tabağı doldurur.
    const n = sp.plates.length, w = Math.min(54, 224 / n), x0 = 128 - (n - 1) * w / 2;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * w, f = FAMILY[i];
      drawIcon(c, 'person', x, 92, w * 1.05, { c: f.coat, h: f.hat });
      c.fillStyle = '#f4f1ea'; c.beginPath(); c.ellipse(x, 176, w * .42, 12, 0, 0, TAU); c.fill();
      const s = sp.plates[i];
      if (s === 1) drawIcon(c, 'fish', x, 168, w * .78);
      else if (s === 5) drawIcon(c, 'smoked', x, 168, w * .78);
      else if (s === 4) drawIcon(c, 'big', x, 166, w * .7);
      else if (s === 7) drawIcon(c, 'bread', x, 166, w * .7);
    }
    for (let i = 0; i < n - 1; i++) if (sp.plates[i] === 2 || sp.plates[i] === 6) { const x = x0 + (i + .5) * w; drawIcon(c, sp.plates[i] === 6 ? 'bread' : 'big', x, 164, w * 1.1); }
    if (sp.ok) drawIcon(c, 'check', 214, 42, 54);
  } else if (sp.type === 'trade') {
    const n = sp.price, w = Math.min(56, 210 / n), x0 = 128 - (n - 1) * w / 2;
    for (let i = 0; i < n; i++) drawIcon(c, 'log', x0 + i * w, 62, w * .95, { alpha: off ? .25 : i < sp.prog ? 1 : .38 });
    if (sp.up && !off) { c.fillStyle = '#ff7a6b'; c.beginPath(); c.moveTo(226, 40); c.lineTo(242, 64); c.lineTo(210, 64); c.closePath(); c.fill(); }
    drawIcon(c, 'arrow', 128, 118, 36, { alpha: off ? .3 : 1 });
    drawIcon(c, sp.kind, 112, 180, sp.kind === 'big' ? 88 : 74, { alpha: off ? .3 : 1 });
    c.fillStyle = off ? 'rgba(255,255,255,.25)' : '#ffc94a'; c.beginPath(); c.arc(196, 196, 30, 0, TAU); c.fill();
    num(sp.stock, 196, 196, 42, off ? 'rgba(255,255,255,.7)' : '#3b2a12');
  } else if (sp.type === 'coinbuy') {
    if (sp.ok) drawIcon(c, 'check', 128, 128, 120);
    else { drawIcon(c, sp.icon, 128, 70, 86); drawIcon(c, 'coin', 90, 172, 66); num(sp.n, 172, 172, 88); }
    if (!sp.ok) { c.strokeStyle = 'rgba(255,255,255,.92)'; c.lineWidth = 8; c.lineCap = 'round'; for (const [x, y, sx, sy] of [[24, 24, 1, 1], [232, 24, -1, 1], [24, 232, 1, -1], [232, 232, -1, -1]]) { c.beginPath(); c.moveTo(x, y + sy * 40); c.lineTo(x, y); c.lineTo(x + sx * 40, y); c.stroke(); } }
  } else if (sp.type === 'market') {
    if (!sp.need) { drawIcon(c, 'coin', 128, 108, 110); num('', 128, 200, 40); }
    else {
      const items = Object.entries(sp.need).filter(([, v]) => v > 0), n = items.length, w = Math.min(84, 220 / Math.max(1, n)), x0 = 128 - (n - 1) * w / 2;
      items.forEach(([t, v], i) => { const x = x0 + i * w; drawIcon(c, t === 'wood' ? 'log' : t, x, 100, w * .9); num(v, x, 188, 70, '#ffc94a'); });
    }
  } else if (sp.type === 'depot') {
    drawIcon(c, 'depot', 128, 74, 92);
    num(`${sp.have}/${sp.cap}`, 128, 178, 66);
    if (sp.goal) { c.fillStyle = sp.have >= sp.goal ? '#3fbf7a' : 'rgba(255,255,255,.25)'; rr(c, 72, 214, 112, 26, 13); c.fill(); num(`hedef ${sp.goal}`, 128, 226, 22); }
  } else if (sp.type === 'beltin') {
    drawIcon(c, 'belt', 128, 72, 100);
    const w = 24, x0 = 128 - (sp.max - 1) * w / 2;
    for (let i = 0; i < sp.max; i++) { c.fillStyle = i < sp.buf ? (sp.buf >= sp.max - 1 ? '#ff7a6b' : '#ffc94a') : 'rgba(255,255,255,.22)'; c.beginPath(); c.arc(x0 + i * w, 170, 9, 0, TAU); c.fill(); }
    drawIcon(c, 'log', 128, 214, 50);
  } else if (sp.type === 'planks') {
    drawIcon(c, 'saw', 128, 66, 70); drawIcon(c, 'plank', 96, 170, 82); num(sp.n, 178, 172, 80, sp.n >= sp.max ? '#ff7a6b' : '#fff');
  } else if (sp.type === 'mach') {
    drawIcon(c, sp.inIcon, 66, 92, 74); num(sp.inN, 66, 168, 52, '#ffc94a');
    drawIcon(c, 'arrow', 128, 100, 34, { alpha: sp.busy ? 1 : .4 });
    drawIcon(c, sp.outIcon, 190, 92, 74); num(sp.outN, 190, 168, 52, '#ffc94a');
    c.fillStyle = sp.busy ? '#ffc94a' : 'rgba(255,255,255,.2)'; c.beginPath(); c.arc(128, 214, 10, 0, TAU); c.fill();
  } else if (sp.type === 'store') {
    drawIcon(c, sp.icon, 128, 74, 92); num(`${sp.have}/${sp.cap}`, 128, 176, 62);
    if (sp.goal) { c.fillStyle = sp.have >= sp.goal ? '#3fbf7a' : 'rgba(255,255,255,.25)'; rr(c, 72, 214, 112, 26, 13); c.fill(); num(`hedef ${sp.goal}`, 128, 226, 22); }
  } else if (sp.type === 'build') {
    if (sp.ok) drawIcon(c, 'check', 128, 128, 120);
    else {
      drawIcon(c, sp.top, 128, 64, 78);
      const items = Object.entries(sp.req), w = 230 / Math.max(1, items.length), x0 = 128 - (items.length - 1) * w / 2;
      items.forEach(([t, n], i) => { const x = x0 + i * w; drawIcon(c, t === 'wood' ? 'log' : t === 'coin' ? 'coin' : t, x - 26, 172, 58); num(n - (sp.got[t] || 0), x + 30, 174, 70); });
      c.strokeStyle = 'rgba(255,255,255,.92)'; c.lineWidth = 8; c.lineCap = 'round'; for (const [x, y, sx, sy] of [[24, 24, 1, 1], [232, 24, -1, 1], [24, 232, 1, -1], [232, 232, -1, -1]]) { c.beginPath(); c.moveTo(x, y + sy * 40); c.lineTo(x, y); c.lineTo(x + sx * 40, y); c.stroke(); }
    }
  } else if (sp.type === 'boat') {
    drawIcon(c, 'boat', 128, 96, 120); if (sp.state !== 'dock') { c.fillStyle = '#ffc94a'; c.beginPath(); c.arc(128, 196, 14, 0, TAU); c.fill(); } else drawIcon(c, 'fish', 128, 196, 56);
  } else if (sp.type === 'plot') {
    if (sp.state === 'empty') { drawIcon(c, 'sprout', 128, 78, 96); drawIcon(c, 'coin', 96, 182, 60); num(2, 168, 184, 76); }
    else if (sp.state === 'grow') { drawIcon(c, 'sprout', 128, 118, 92); c.lineWidth = 14; c.strokeStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.arc(128, 128, 94, 0, TAU); c.stroke(); c.strokeStyle = '#9ccf5a'; c.beginPath(); c.arc(128, 128, 94, -Math.PI / 2, -Math.PI / 2 + sp.p * TAU); c.stroke(); }
    else { drawIcon(c, 'wheat', 128, 118, 120); }
  } else if (sp.type === 'bake') {
    drawIcon(c, 'wheat', 52, 84, 60); num(sp.wheat, 52, 150, 42, '#ffc94a'); drawIcon(c, 'log', 116, 84, 56); num(sp.wood, 116, 150, 42, '#ffc94a');
    drawIcon(c, 'arrow', 158, 92, 28, { alpha: sp.busy ? 1 : .4 }); drawIcon(c, 'bread', 206, 84, 64); num(sp.out, 206, 150, 42, '#ffc94a');
    c.fillStyle = 'rgba(255,255,255,.7)'; c.font = '800 26px "Baloo 2", system-ui, sans-serif'; c.fillText('2 + 1', 84, 204);
  } else if (sp.type === 'fishing') {
    drawIcon(c, 'fish', 128, 128, 100);
    c.lineWidth = 16; c.strokeStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.arc(128, 128, 94, 0, TAU); c.stroke();
    if (sp.p > 0) { c.strokeStyle = '#8fdcff'; c.beginPath(); c.arc(128, 128, 94, -Math.PI / 2, -Math.PI / 2 + sp.p * TAU); c.stroke(); }
  }
  z.tile.tex.needsUpdate = true;
}
// Kare ya da (varsa) yapının çevresi: ocağa hangi yandan gelinirse gelinsin odun bırakılabilir.
const inZone = z => (Math.abs(P.x - z.x) < z.h && Math.abs(P.z - z.z) < z.h) || (z.near && Math.hypot(P.x - z.near[0], P.z - z.near[1]) < z.near[2]);

/* ================= Oyun durumu ================= */
const G = { mode: 'menu', ch: 1, clock: 0, jobs: [], timed: false, dayLeft: 0, day: 1, fails: 0, prog: { fish: 0, big: 0 }, stock: { fish: 0, big: 0 }, priceAdd: 0,
  pending: [], plates: [], catches: 0, flags: {}, auto: null, manual: false, orbit: 0, stats: {},
  dayIdx: 0, coins: 0, upg: {}, built: {}, storm: false };
const after = (s, fn) => G.jobs.push({ at: G.clock + s, fn });

// 4. bölümden sonra ocak 'tamam' demez: fazla odunu da alır, tik çıkmaz, baykuş söylemez. 1–3 öğrenme aşaması.
const strict = () => G.ch >= CFG.strictFrom;
function needsMet(ignoreFire) {
  if (Z.ocak.lighting) return false;
  if (!ignoreFire && Z.ocak.have < Z.ocak.need) return false;
  if (Z.kiler.active && Z.kiler.have < Z.kiler.need) return false;
  const c = CC();
  if (c.house && !G.built[c.house.id]) return false;
  if (c.helperGoal && H.delivered < c.helperGoal) return false;
  if (c.depotGoal && Z.depo.have < c.depotGoal) return false;
  if (act3Missing().length) return false;
  if (act4Missing().length) return false;
  return true;
}
// Uyu düğmesi: katı bölümlerde ocağa bakmaz, yalnız öğleden sonra görünür (sabah yanlışlıkla basılmasın).
function sleepOK() {
  if (G.mode !== 'play') return false;
  if (!strict()) return needsMet();
  return needsMet(true) && (!G.timed || G.dayLeft < dayLen() * .5);
}
const pileTop = () => new V3(PILE.x, .55, PILE.z);
function smokePuff() { burst(new V3(rand(-.2, .2), 1.1, -1), '#55504c', 9, 2.2); Snd.fx('drop'); }
function updatePending() {
  for (const m of pendingFish) stall.remove(m); pendingFish.length = 0;
  G.pending.slice(0, 6).forEach((t, i) => { const f = makeFish(t); f.position.set(-1.1 + i * .44, 1.12, .12); f.rotation.y = .3; stall.add(f); pendingFish.push(f); });
}
const PLATES3 = [];
function plateSpot(i) { const [sx, sz] = SLOTS[i], dx = 0 - sx, dz = -1 - sz, d = Math.hypot(dx, dz) || 1; return [sx + dx / d * .62, sz + dz / d * .62]; }
function updatePlates3() {
  const n = Z.kiler.active ? G.plates.length : 0;
  while (PLATES3.length > n) scene.remove(PLATES3.pop().g);
  while (PLATES3.length < n) {
    const i = PLATES3.length, [x, z] = plateSpot(i), g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(1.35); scene.add(g);
    mesh(geo('stump', () => new THREE.CylinderGeometry(.19, .22, .34, 12)), wood('#a8714a'), 0, .17, 0, g);
    mesh(geo('plate', () => new THREE.CylinderGeometry(.24, .18, .04, 18)), mat('#f4f1ea', { roughness: .5 }), 0, .36, 0, g);
    const food = new THREE.Group(); food.position.y = .42; g.add(food); PLATES3.push({ g, food, st: -1 });
  }
  PLATES3.forEach((P3, i) => {
    const st = G.plates[i] || 0; if (st === P3.st) return; P3.st = st; P3.food.clear();
    // 2+3 ve 6+3: büyük balık ya da ekmek iki tabağa bölünür, iki tabakta da yarım parça; 4 ve 7: tek tabakta bütün (yarısı boşa)
    const pair = st === 3 ? (G.plates[i - 1] === 6 ? 'bread' : 'big') : null;
    const t = { 1: 'fish', 5: 'smoked', 2: 'big', 4: 'big', 6: 'bread', 7: 'bread' }[st] || pair; if (!t) return;
    const m = makeItem(t), half = st === 2 || st === 3 || st === 6; m.scale.setScalar(t === 'bread' ? (half ? .55 : .85) : half ? .5 : t === 'big' ? .78 : .62); m.rotation.y = rand(0, TAU);
    P3.food.add(m);
  });
}
function updateRack() {
  updatePlates3();
  for (const m of rackFish) rack.remove(m); rackFish.length = 0;
  let i = 0;
  for (const s of G.plates) { if (s === 1 || s === 2 || s === 4 || s === 5) { const f = makeFish(s === 1 ? 'fish' : s === 5 ? 'smoked' : 'big'); f.position.set(0, 1.25, -.66 + i * .26); f.rotation.set(0, Math.PI / 2, Math.PI / 2); rack.add(f); rackFish.push(f); i++; } }
}

/* ----- Baykuş ----- */
let bubbleT = 0;
function say(key) {
  const b = $('bubble'); b.textContent = LINES[key]; b.hidden = false; bubbleT = 6;
  const o = $('owlBtn'); o.classList.remove('talk'); void o.offsetWidth; o.classList.add('talk');
  Snd.say([key]);
}
function hint() {
  if (G.mode !== 'play') return;
  const c = CC();
  if (Z.ocak.lighting) return say('k1_ocak');
  if (c.helper && !H.running) return say('k6_yardimci');
  if (c.belt && !BELT.built) return say('k7_bant');
  if (strict() ? Z.ocak.have === 0 : Z.ocak.have < Z.ocak.need) return say('k_ipucu_ocak');
  if (Z.kiler.active && Z.kiler.have < Z.kiler.need) return say(G.ch === 3 && !pierBuilt ? 'k3_secim' : G.ch === 2 && !G.flags.bigHint ? (G.flags.bigHint = true, 'k2_balik') : 'k_ipucu_kiler');
  if (c.house && !G.built[c.house.id]) return say(c.house.planks ? 'k8_testere' : 'k4_ev');
  if (c.depotGoal && Z.depo.have < c.depotGoal) return say('k5_depo');
  if (c.lost && lostHint()) return;
  if (c.coinGoal && G.coins < c.coinGoal) return say('k9_hedef');
  if (c.frost && coldHouses().length) return say('k10_soba');
  if (c.bridge && !G.built.kopru) return say('k12_kopru');
  if (c.stoneGoal && Z.taslik.have < c.stoneGoal) return say('k12_tas');
  if (c.wheatGoal && Z.ambar.have < c.wheatGoal) return say(PLOTS.some(p => p.state === 'ripe') ? 'k16_hasat' : 'k16_ambar');
  if (c.bakery && Z.kiler.have < Z.kiler.need) return say('k17_firin');
  if (c.builds && c.builds.sofra && !G.built.sofra) return say('k20_senlik');
  if (c.builds && act4Missing().length) return say('k19_kasaba');
  if (c.days && G.dayIdx < c.days.length - 1) return say('k5_firtina');
  return say(strict() ? 'k_karar' : 'k_hazir');
}

/* ================= Pazar: müşteriler ve para üstü ================= */
const customers = [];
const QUEUE = [[6.4, 4.75], [7.75, 4.15], [5.0, 4.5]];
const CUST_LOOK = [['#a35d8f', '#e9e3d3'], ['#4c7d9e', '#c4473d'], ['#8a7a3a', '#2f4a6a'], ['#6a8f5a', '#e9e3d3'], ['#9e5a4c', '#27324a'], ['#5a6fa8', '#d9a93a']];
const orderTotal = o => Object.entries(o).reduce((a, [t, n]) => a + n * (CFG.prices[t] || 0), 0);
const needOf = n => { const o = n.cust.order, g = n.cust.got, r = {}; for (const t in o) r[t] = o[t] - (g[t] || 0); return r; };
const ORDER_T = ['wood', 'fish', 'big', 'smoked', 'wheat', 'bread'];
function makeOrder() {
  const pool = CC().orders || ['wood', 'wood', 'fish', 'fish', 'fish', 'big'];
  for (;;) {
    const o = {}; for (const t of ORDER_T) o[t] = 0;
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) o[pool[Math.floor(Math.random() * pool.length)]]++;
    const t = orderTotal(o); if (t >= 2 && t <= 14) return o;
  }
}
function bubbleSprite() {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
  const tex = new THREE.CanvasTexture(cv); tex.encoding = THREE.sRGBEncoding;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sp.scale.set(1.9, .95, 1); sp.position.y = 3.0; sp.renderOrder = 10; sp.userData = { cv, tex, key: '' }; return sp;
}
function paintBubble(n) {
  const sp = n.bubble, need = needOf(n), key = JSON.stringify(need) + n.cust.state;
  if (sp.userData.key === key) return; sp.userData.key = key;
  const c = sp.userData.cv.getContext('2d'); c.clearRect(0, 0, 256, 128);
  c.fillStyle = 'rgba(255,255,255,.96)'; rr(c, 6, 6, 244, 100, 30); c.fill();
  c.beginPath(); c.moveTo(112, 104); c.lineTo(128, 124); c.lineTo(144, 104); c.fill();
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '800 44px "Baloo 2", system-ui, sans-serif';
  if (n.cust.state === 'paid') { drawIcon(c, 'check', 128, 56, 76); }
  else if (!Object.values(need).some(v => v > 0)) { drawIcon(c, 'coin', 128, 56, 72); }
  else {
    const items = Object.entries(need).filter(([, v]) => v > 0), w = 230 / Math.max(1, items.length), x0 = 128 - (items.length - 1) * w / 2;
    items.forEach(([t, v], i) => { const x = x0 + i * w; drawIcon(c, t === 'wood' ? 'log' : t, x - 18, 56, 58); c.fillStyle = '#24324a'; c.fillText(String(v), x + 30, 60); });
  }
  sp.userData.tex.needsUpdate = true;
}
function spawnCustomer() {
  const [coat, hat] = CUST_LOOK[Math.floor(Math.random() * CUST_LOOK.length)];
  const n = addNpc({ coat, hat, scale: rand(.88, 1.02) }, rand(-.4, .4), -14);
  n.cust = { order: makeOrder(), got: {}, state: 'walk', tries: 0 };
  n.bubble = bubbleSprite(); n.p.g.add(n.bubble); n.bubble.visible = false;
  customers.push(n); queueCustomers();
}
function queueCustomers() {
  let k = 0;
  for (const n of customers) {
    if (n.cust.state === 'leave') continue;
    const [x, z] = QUEUE[Math.min(k++, QUEUE.length - 1)];
    if (n.cust.slot !== k - 1) {
      n.cust.slot = k - 1;
      const p = n.p.g.position, inCamp = Math.abs(p.x) < CAMP && Math.abs(p.z) < CAMP;
      n.path = inCamp ? [[x, z]] : [[0, -7.4], [3.4, -2.6], [3.4, 1.6], [x, z]];
    }
  }
}
function updateCustomers(dt) {
  const c = CC();
  if (!c.market) return;
  if (G.mode === 'play') {
    G.custT -= dt;
    const waiting = customers.filter(n => n.cust.state !== 'leave').length;
    if (G.custT <= 0 && waiting < 3 && G.dayLeft > dayLen() * .15) { spawnCustomer(); G.custT = rand(18, 26); }
  }
  for (let i = customers.length - 1; i >= 0; i--) {
    const n = customers[i], cu = n.cust;
    if (cu.state === 'walk' && !n.path.length) { cu.state = cu.slot === 0 ? 'wait' : 'queue'; }
    if (cu.state === 'queue' && cu.slot === 0 && !n.path.length) cu.state = 'wait';
    n.faceTo = cu.state === 'leave' ? null : [6.4, 7.6];
    if (!n.bubble) continue;
    n.bubble.visible = cu.state === 'wait' || cu.state === 'queue' || cu.state === 'pay' || cu.state === 'paid';
    if (n.bubble.visible) paintBubble(n);
    if (cu.state === 'leave' && !n.path.length) { dropBubble(n); scene.remove(n.p.g); npcs.splice(npcs.indexOf(n), 1); customers.splice(i, 1); }
  }
}
// Müşterinin istediği her şey verildiyse ödeme sorusu açılır (oyun durur).
function serveCustomer(z) {
  const n = customers.find(x => x.cust.state === 'wait'); if (!n) return false;
  const need = needOf(n);
  for (const t of ['bread', 'smoked', 'big', 'fish', 'wheat', 'wood']) {
    if (need[t] > 0 && has(t)) {
      const from = take(t), to = n.p.g.position.clone().add(new V3(0, 1.3, 0));
      fly(makeItem(t), from, () => to, .35, null, 1); n.cust.got[t] = (n.cust.got[t] || 0) + 1; Snd.fx('drop');
      if (!Object.values(needOf(n)).some(v => v > 0)) { n.cust.state = 'pay'; after(.4, () => askPayment(n)); }
      return true;
    }
  }
  return false;
}
function askPayment(n) {
  if (!customers.includes(n) || n.cust.state !== 'pay') return;
  if (G.mode !== 'play') { if (['pause', 'prog', 'ask'].includes(G.mode)) after(.5, () => askPayment(n)); return; }
  const o = n.cust.order, total = orderTotal(o), bill = total <= 5 ? 5 : total <= 10 ? 10 : 20, change = bill - total;
  G.mode = 'ask';
  const finish = first => {
    closeModal(); G.mode = 'play';
    const gain = total + (first ? 1 : 0); G.coins += gain; Snd.fx('trade');
    for (let k = 0; k < Math.min(gain, 8); k++) fly(coinMesh(), n.p.g.position.clone().add(new V3(0, 1.4, 0)), () => P.model.g.position.clone().add(new V3(0, 1.6, 0)), .45, null, 1.2, k * .06);
    if (first) say('k4_dogru');
    n.cust.state = 'paid'; after(1.2, () => { n.cust.state = 'leave'; n.path = [[3.4, 1.6], [3.4, -2.6], [0, -7.4], [0, -15]]; queueCustomers(); });
  };
  modal(cd => {
    cd.append(el('div', 'kicker', 'Müşteri'), el('h2', '', change ? 'Para üstü kaç?' : 'Toplam kaç altın?'));
    const row = el('div', 'order');
    for (const t of ORDER_T) for (let k = 0; k < (o[t] || 0); k++) {
      const it = el('div', 'oitem'), im = el('img'); im.src = ICON[t === 'wood' ? 'log' : t];
      const pr = el('span', 'price'); const ci = el('img'); ci.src = ICON.coin; pr.append(ci, el('b', '', String(CFG.prices[t])));
      it.append(im, pr); row.append(it);
    }
    cd.append(row);
    if (change) { const b = el('div', 'bill'), ci = el('img'); ci.src = ICON.coin; b.append(el('span', '', 'Verdiği:'), ci, el('b', '', String(bill))); cd.append(b); }
    const ans = change || total, opts = new Set([ans]);
    for (const d of [1, -1, 2, -2, 3]) if (opts.size < 3 && ans + d >= 0) opts.add(ans + d);
    const box = el('div', 'answers'), list = [...opts].sort(() => Math.random() - .5);
    let tries = 0;
    for (const v of list) {
      const b = el('button', 'abtn'), ci = el('img'); ci.src = ICON.coin; b.append(el('b', '', String(v)), ci);
      b.onclick = () => {
        if (v === ans) { b.classList.add('ok'); setTimeout(() => finish(tries === 0), 350); return; }
        tries++; b.classList.add('no'); b.disabled = true; Snd.fx('warn');
        if (tries >= 2) for (const x of box.children) if (+x.firstChild.textContent === ans) x.classList.add('hint');
      };
      box.append(b);
    }
    cd.append(box);
  });
  Snd.say([change ? 'k4_ustu' : 'k4_toplam']);
}
const coinGeo = new THREE.CylinderGeometry(.16, .16, .05, 16).rotateX(Math.PI / 2);
const coinMesh = () => new THREE.Mesh(coinGeo, mat('#ffc94a', { metalness: .6, roughness: .3 }));

/* ================= Yardımcı: kartlarla verilen sıra ================= */
const CARD_VOICE = { orman: 'c_orman', ocak: 'c_ocak', depo: 'c_depo', bant: 'c_bant', tekrar: 'c_tekrar', tekrar2: 'c_tekrar2', tekrar3: 'c_tekrar3' };
const CARDS = { orman: ['tree', 'Ormana git, kes'], ocak: ['fire', 'Ocağa götür'], depo: ['depot', 'Odunluğa götür'], bant: ['belt', 'Banta koy'], tekrar: ['loop', 'Baştan tekrarla'], tekrar2: ['loop2', 'Hepsini 2 kez yap'], tekrar3: ['loop3', 'Hepsini 3 kez yap'] };
const REPS = { tekrar2: 2, tekrar3: 3 };
const H = { npc: null, anchor: null, prog: [], pc: -1, running: false, stack: [], state: 'idle', wait: 0, tree: -1, cd: 0, delivered: 0, cap: 3, noteAt: -99, reps: {} };
const SPOTS = { orman: [0.6, -13.6], ocak: [0, 2.0], depo: [-1.6, -4.0], bant: [BELT.x + .2, BELT.z0 - 1.1] };
function buildHelper() {
  if (H.npc) { scene.remove(H.npc.p.g); npcs.splice(npcs.indexOf(H.npc), 1); }
  H.npc = addNpc({ coat: '#3f6fb5', hat: '#e9e3d3', axe: true, pack: true, speed: 3.4 }, 2.2, 3.6); H.npc.swing = 1;
  H.anchor = new THREE.Group(); H.npc.p.g.add(H.anchor);
  Object.assign(H, { prog: [], pc: -1, running: false, stack: [], state: 'idle', wait: 0, tree: -1, cd: 0, delivered: 0 });
  helperStack();
}
function helperStack() { H.anchor.clear(); H.stack.forEach((t, i) => { const m = makeLog(); m.position.set(0, 1.0 + i * .31, -.68); H.anchor.add(m); }); }
// Kampın içinden geçerken ocağın etrafından dolaşır; kamp ile orman arasında kuzey kapısını kullanır.
function navTo(from, to) {
  const inside = q => Math.abs(q[0]) < CAMP && Math.abs(q[1]) < CAMP;
  const pts = [], a = [from[0], from[1]], gateIn = [0, -7.4], gateOut = [0, -10.8];
  const viaFire = (p0, p1) => { const dx = p1[0] - p0[0], dz = p1[1] - p0[1], L = dx * dx + dz * dz || 1, t = clamp(((0 - p0[0]) * dx + (-1 - p0[1]) * dz) / L, 0, 1);
    if (Math.hypot(p0[0] + dx * t, p0[1] + dz * t + 1) < 1.9) pts.push([(p0[0] + p1[0]) / 2 < 0 ? -2.0 : 2.0, -1]); };
  if (inside(a) && !inside(to)) { viaFire(a, gateIn); pts.push(gateIn, gateOut); }
  else if (!inside(a) && inside(to)) { pts.push(gateOut, gateIn); viaFire(gateIn, to); }
  else if (inside(a)) viaFire(a, to);
  pts.push(to); return pts;
}
function helperGo(card) { const p = H.npc.p.g.position; H.npc.path = navTo([p.x, p.z], SPOTS[card]); H.state = 'walk'; }
function helperNote(key) { if (G.clock - H.noteAt > 15) { H.noteAt = G.clock; say(key); } }
function nextCard() {
  H.pc++;
  if (H.pc >= H.prog.length) { H.running = false; H.state = 'idle'; H.pc = -1; if (!H.prog.some(k => k.startsWith('tekrar'))) helperNote('k6_tekrar'); return; }
  const card = H.prog[H.pc];
  if (card === 'tekrar') { H.pc = -1; return nextCard(); }
  // "N kez": baştan bu karta kadar olan sıra toplam N kez çalışır, sonra devam eder.
  if (REPS[card]) { H.reps[H.pc] = (H.reps[H.pc] || 0) + 1; if (H.reps[H.pc] < REPS[card]) { for (const k of Object.keys(H.reps)) if (+k < H.pc) delete H.reps[k]; H.pc = -1; } return nextCard(); }
  helperGo(card);
}
function updateHelper(dt) {
  if (!H.npc || !H.running || G.mode !== 'play') return;
  const card = H.prog[H.pc], g = H.npc.p.g, pos = g.position;
  H.cd -= dt;
  if (H.state === 'walk') { if (!H.npc.path.length) H.state = 'work'; return; }
  if (H.state !== 'work') return;
  if (card === 'orman') {
    if (H.stack.length >= H.cap) return nextCard();
    if (H.tree < 0 || T.st[H.tree] !== 0) {
      let b = -1, bd = 9; treesNear(pos.x, pos.z, i => { if (T.st[i]) return; const d = Math.hypot(T.x[i] - pos.x, T.z[i] - pos.z); if (d < bd) { bd = d; b = i; } });
      if (b < 0) { for (let i = 0; i < T.n; i++) if (!T.st[i]) { const d = Math.hypot(T.x[i] - pos.x, T.z[i] - pos.z); if (d < bd + 20) { bd = d; b = i; } } }
      H.tree = b; if (b < 0) return nextCard();
    }
    const i = H.tree, dx = T.x[i] - pos.x, dz = T.z[i] - pos.z, d = Math.hypot(dx, dz);
    g.rotation.y = Math.atan2(dx, dz);
    if (d > 1.5) { H.npc.path = [[T.x[i] - dx / d * 1.3, T.z[i] - dz / d * 1.3]]; return; }
    if (H.cd <= 0) {
      H.cd = .62; H.npc.swing = 0;
      if (!T.hp[i]) T.hp[i] = hitsNow() + 1;
      T.hp[i]--; T.shake[i] = .28; T.fd[i] = Math.atan2(dx, dz); T.anim.add(i); Snd.fx('chop'); burst(new V3(T.x[i], .9, T.z[i]), '#d8a878', 3, 3);
      if (T.hp[i] <= 0) {
        T.st[i] = 1; T.t[i] = 0; Snd.fx('fall');
        const n = Math.min(CFG.perTree, H.cap - H.stack.length);
        for (let k = 0; k < n; k++) H.stack.push('wood');
        after(.4, helperStack); H.tree = -1;
      }
    }
    return;
  }
  if (H.cd > 0) return;
  const dropTo = (ok, apply, to, cd = .3) => { if (!H.stack.length) { helperNote('k6_bos'); return nextCard(); } if (!ok()) return nextCard();
    H.stack.pop(); helperStack(); const done = apply(), dest = typeof to === 'function' ? to() : to; H.delivered++; fly(makeLog(), pos.clone().add(new V3(0, 1.6, 0)), () => dest, .35, done || null, 1); H.cd = cd; Snd.fx('drop'); };
  // Katı bölümde yardımcı da fazla odunu ocağa koyar: ne kadar taşıyacağını kartlardaki tekrar sayısı belirler.
  if (card === 'ocak') return dropTo(() => !Z.ocak.lighting && (strict() || Z.ocak.have < Z.ocak.need), () => { Z.ocak.have++; if (Z.ocak.have > Z.ocak.need) return smokePuff; PILE.fly++; return () => { PILE.fly--; }; },
    () => Z.ocak.have > Z.ocak.need ? new V3(0, .5, -1) : pileTop(), CFG.dropOcak);
  if (card === 'depo') return dropTo(() => Z.depo.active && Z.depo.have < Z.depo.need, () => { Z.depo.have++; updateDepotLogs(); }, new V3(-2.95, 1, -4.3));
  if (card === 'bant') {
    if (!H.stack.length) { helperNote('k6_bos'); return nextCard(); }
    if (!BELT.built) return nextCard();
    if (BELT.buffer >= BELT.max) { H.wait += dt; if (H.wait > 25) { H.wait = 0; nextCard(); } return; }   // bant yetişemiyor: bekler
    H.wait = 0; return dropTo(() => true, () => { BELT.buffer++; updateBeltBuffer(); }, new V3(BELT.x - .9, .3, BELT.z0 - .5));
  }
}
function openProgram() {
  if (!H.npc || G.mode !== 'play') return;
  G.mode = 'prog'; const draft = H.prog.slice();
  const paint = () => {
    const c = $('progCard'); c.innerHTML = '';
    c.append(el('div', 'kicker', 'Yardımcı'), el('h2', '', 'Sırayı kartlarla ver'));
    const slots = el('div', 'slots');
    for (let i = 0; i < 6; i++) { const sl = el('div', 'slot' + (draft[i] ? ' on' : '')); if (draft[i]) { const im = el('img'); im.src = ICON[CARDS[draft[i]][0]]; sl.append(im); } slots.append(sl); }
    c.append(slots);
    const pal = el('div', 'palette');
    for (const k of CC().helper) {
      const b = el('button', 'pcard'), im = el('img'); im.src = ICON[CARDS[k][0]]; b.append(im); b.setAttribute('aria-label', CARDS[k][1]);
      b.onclick = () => { if (draft.length < 6) { draft.push(k); Snd.fx('tap'); Snd.say([CARD_VOICE[k]]); paint(); } }; pal.append(b);
    }
    c.append(pal);
    const row = el('div', 'row');
    const del = el('button', 'btn alt', '⌫ Sil'); del.onclick = () => { draft.pop(); Snd.fx('tap'); paint(); };
    const go = el('button', 'btn', '▶ Başlat'); go.disabled = !draft.length;
    go.onclick = () => { H.prog = draft.slice(); H.pc = -1; H.reps = {}; H.running = true; $('progPanel').hidden = true; G.mode = 'play'; Snd.fx('build'); nextCard(); renderStrip(); };
    const cl = el('button', 'btn alt', '✕'); cl.onclick = () => { $('progPanel').hidden = true; G.mode = 'play'; };
    row.append(del, cl, go); c.append(row);
  };
  paint(); $('progPanel').hidden = false;
}
let stripKey = '';
function renderStrip() {
  const st = $('progStrip'), key = H.prog.join() + '|' + H.pc + '|' + H.running;
  st.hidden = !H.npc || !H.prog.length; if (key === stripKey) return; stripKey = key;
  st.innerHTML = '';
  H.prog.forEach((k, i) => { const im = el('img', i === H.pc && H.running ? 'cur' : ''); im.src = ICON[CARDS[k][0]]; st.append(im); });
}

/* ================= Bant ve testere ================= */
const beltSpeed = () => BELT.base * (G.upg.belt ? 2.2 : 1);
function setBelt(on, animate) { BELT.built = on; beltG.visible = on; BELT.anim = on && animate ? 0 : 1; beltG.scale.z = on && animate ? .001 : 1; }
function clearBelt() { for (const it of BELT.items) scene.remove(it.m); BELT.items = []; BELT.buffer = 0; updateBeltBuffer(); }
function updateBelt(dt) {
  if (!BELT.built) return;
  if (BELT.anim < 1) { BELT.anim = Math.min(1, BELT.anim + dt / 1.4); beltG.scale.z = Math.max(.001, 1 - Math.pow(1 - BELT.anim, 3)); return; }
  const v = beltSpeed(); beltTex.offset.y -= v * dt * 9 / BELT.len;
  const its = BELT.items;
  for (let i = its.length - 1; i >= 0; i--) {
    const it = its[i], lim = i === its.length - 1 ? BELT.len : its[i + 1].s - BELT.gap;
    it.s = Math.min(it.s + v * dt, Math.max(it.s, lim));
    it.m.position.set(BELT.x, .58, BELT.z0 + it.s);
  }
  const front = its[its.length - 1];
  if (front && front.s >= BELT.len - .01) {
    if (BELT.to === 'depo' && Z.depo.have < Z.depo.need) { its.pop(); scene.remove(front.m); fly(makeLog(), front.m.position.clone(), () => new V3(-2.95, 1, -4.3), .35, () => { Z.depo.have++; updateDepotLogs(); }, .8); }
    else if (BELT.to === 'saw' && !SAW.busy && SAW.out <= SAW.max - 2) { its.pop(); scene.remove(front.m); SAW.busy = true; SAW.t = 0; }
  }
  if (BELT.buffer > 0 && (!its.length || its[0].s >= BELT.gap)) { BELT.buffer--; updateBeltBuffer(); const m = makeLog(); scene.add(m); its.unshift({ s: 0, m }); }
  // Darboğaz: başta odun birikiyorsa baykuş söyler
  if (BELT.buffer >= BELT.max - 1) { BELT.jamT += dt; if (BELT.jamT > 4 && G.clock - BELT.warnAt > 30) { BELT.warnAt = G.clock; say('k7_tikandi'); } } else BELT.jamT = 0;
}
function updateSaw(dt) {
  if (!sawG.visible) return;
  if (SAW.busy) {
    blade.rotation.y += dt * 30; SAW.t += dt;
    if (Math.random() < dt * 8) burst(new V3(-1.6, 1, -4.7), '#f0d3a6', 1, 2);
    if (SAW.t >= (G.upg.saw ? 1.2 : 2.6)) { SAW.busy = false; SAW.out = Math.min(SAW.max, SAW.out + 2); updatePlankPile(); Snd.fx('pick'); if (SAW.out >= SAW.max && G.clock - SAW.warnAt > 30) { SAW.warnAt = G.clock; say('k8_dolu'); } }
  }
}


/* ================= Perde 3: tütsühane, soğuk dalgası, kayıp yolcu, köprü ================= */
const frostOn = () => { const c = CC(); return !!c.frost && (!c.days || !!dayCfg().frost); };
const housesNow = () => HOUSES.filter(([id]) => id === 'tent' || G.built[id]);
function coldHouses() {
  const r = CC().frost ? CC().frost.radius : 0;
  return housesNow().filter(([, x, z]) => !SOBA.some(sb => sb.built && Math.hypot(x - sb.x, z - sb.z) <= r));
}
function act3Missing() {
  const c = CC(), m = [];
  if (c.coinGoal && G.coins < c.coinGoal) m.push(['coin', `${c.coinGoal - G.coins} altın eksik kaldı`, ['n' + (c.coinGoal - G.coins), 'e_altin']]);
  if (frostOn()) { const n = coldHouses().length; if (n) m.push(['house', `${n} ev sıcak halkanın dışında kaldı`, ['n' + n, 'e_soguk_ev']]); }
  if (c.lost && !LOST.rescued) m.push(['helper', 'Yolcu kampa gelmedi', ['e_yolcu']]);
  if (c.bridge && !G.built.kopru) m.push(['bridge', 'Köprü bitmedi', ['e_kopru']]);
  if (c.stoneGoal && Z.taslik.have < c.stoneGoal) m.push(['stone', `Taşlıkta ${c.stoneGoal - Z.taslik.have} taş eksik kaldı`, ['e_taslik', 'n' + (c.stoneGoal - Z.taslik.have), 'e_tas']]);
  return m;
}
function setupAct3(c) {
  smokeHouse.visible = !!c.smoke; Object.assign(MACH.smoke, { inb: 0, busy: false, t: 0, outN: 0 });
  if (c.smoke) Z.tutsu.active = true;
  setBridge((c.built || []).includes('kopru'));
  resetRocks(!!c.quarry);
  if (c.stoneGoal || c.stoneStore) { Z.taslik.active = true; Z.taslik.need = 12; }
  updateStonePile();
  if (c.bridge) { const z = Z.kopru; z.active = true; z.req = Object.assign({}, c.bridge); z.got = {}; z.done = false; z.onFull = () => { z.active = false; setBridge(true, true); Snd.fx('build'); burst(new V3(0, .5, -20.5), '#f4f8fc', 10, 4); }; }
  SOBA.forEach((sb, i) => {
    sb.built = false; sb.st.visible = false; sb.ring.visible = !!c.frost;
    if (c.frost) {
      sb.ring.scale.setScalar(c.frost.radius); sb.ring.material.color.copy(col('#ffffff')); sb.ring.material.opacity = .3;
      const z = Z[sb.id]; z.active = true; z.req = Object.assign({}, c.frost.cost); z.got = {}; z.done = false;
      z.onFull = () => { z.active = false; sb.built = true; sb.st.visible = true; sb.ring.material.color.copy(col('#ff9a3c')); sb.ring.material.opacity = .55; Snd.fx('ignite'); };
    }
  });
  for (const [id] of HOUSES) houseMark[id].visible = false;
  // kayıp yolcu
  if (LOST.npc) { scene.remove(LOST.npc.p.g); const i = npcs.indexOf(LOST.npc); if (i >= 0) npcs.splice(i, 1); LOST.npc = null; }
  for (const d of trailDecals) d.material.opacity = 0;
  LOST.found = LOST.rescued = false;
  if (c.lost) {
    const sd = Math.random() < .5 ? -1 : 1; LOST.x = sd * rand(9, 13); LOST.z = rand(-16.8, -14.6);
    LOST.npc = addNpc(Object.assign({}, FAMILY[5]), LOST.x, LOST.z); LOST.npc.lost = true;
    // ayak izleri: kapının önünden yolcuya kıvrılarak gider, arada boşluklar var
    const x0 = sd * 1.2, z0 = -13.4, n = trailDecals.length;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), px = lerp(x0, LOST.x, t) + Math.sin(t * 7) * .9, pz = lerp(z0, LOST.z, t) + Math.cos(t * 5) * .6;
      const d = trailDecals[i], side = i % 2 ? .13 : -.13, ang = Math.atan2(LOST.x - x0, LOST.z - z0);
      d.position.set(px + Math.cos(ang) * side, .036, pz - Math.sin(ang) * side); d.rotation.z = ang;
      d.material.opacity = i % 9 === 5 || i % 9 === 6 ? 0 : .55;
    }
  }
}
function lostHint() {
  if (!LOST.npc || LOST.rescued) return false;
  if (LOST.found) { say('k11_bulundu'); return true; }
  const dx = LOST.x - P.x, dz = LOST.z - P.z;
  if (Math.hypot(dx, dz) < 4.5) say('k11_yakin');
  else say(Math.abs(dz) > Math.abs(dx) ? (dz < 0 ? 'k11_kuzey' : 'k11_guney') : (dx < 0 ? 'k11_bati' : 'k11_dogu'));
  return true;
}
function updateAct3(dt) {
  const c = CC();
  // tütsühane
  const M = MACH.smoke;
  if (smokeHouse.visible) {
    if (!M.busy && M.inb > 0 && M.outN < M.outMax) { M.inb--; M.busy = true; M.t = 0; }
    if (M.busy) { M.t += dt; if (M.t >= M.time) { M.busy = false; M.outN++; Snd.fx('pick'); } }
    for (const sp of smokeHouseSmoke) { sp.userData.t = (sp.userData.t + dt * .25) % 1; const q = sp.userData.t; sp.position.set(.45 + Math.sin(q * 6) * .15, 2.4 + q * 2, 0); sp.scale.setScalar(.4 + q); sp.material.opacity = M.busy ? Math.sin(q * Math.PI) * .5 : 0; }
  }
  // köprü kurulumu, kayaların sarsılması
  if (bridgeAnim < 1) { bridgeAnim = Math.min(1, bridgeAnim + dt / 1.3); bridge.scale.z = Math.max(.001, 1 - Math.pow(1 - bridgeAnim, 3)); }
  for (const k of ROCKS) {
    if (!k.g.visible) continue;
    if (!k.alive) { const sc = Math.max(0, k.g.scale.x - dt * 3); k.g.scale.setScalar(sc); if (sc <= 0) k.g.visible = false; continue; }
    if (k.shake > 0) { k.shake = Math.max(0, k.shake - dt); k.g.rotation.z = Math.sin(k.shake * 50) * k.shake * .3; }
  }
  // sıcak halkalar ve evlerin üstündeki işaretler
  if (c.frost) {
    const cold = new Set(coldHouses().map(h => h[0]));
    for (const [id] of HOUSES) { const mk = houseMark[id], on = id === 'tent' || G.built[id]; mk.visible = on && G.mode !== 'menu'; if (on) { const tex = cold.has(id) ? markTex.cold : markTex.warm; if (mk.material.map !== tex) { mk.material.map = tex; mk.material.needsUpdate = true; } } }
    const pulse = .3 + Math.sin(G.clock * 3) * .08; for (const sb of SOBA) if (!sb.built) sb.ring.material.opacity = frostOn() ? pulse + .1 : pulse * .6;
  }
  // kayıp yolcu: bulununca oyuncuyu izler, kampa girince yerine geçer
  if (LOST.npc && !LOST.rescued && G.mode === 'play') {
    const g = LOST.npc.p.g.position, d = Math.hypot(g.x - P.x, g.z - P.z);
    if (!LOST.found && d < 2.3) { LOST.found = true; say('k11_bulundu'); Snd.fx('done'); }
    if (LOST.found) {
      LOST.followT -= dt;
      if (LOST.followT <= 0) { LOST.followT = .3; if (d > 1.7) { const k = 1.3 / d; LOST.npc.path = [[P.x + (g.x - P.x) * k, P.z + (g.z - P.z) * k]]; } else LOST.npc.path = []; }
      if (Math.abs(g.x) < CAMP - .6 && Math.abs(g.z) < CAMP - .6) { LOST.rescued = true; LOST.npc.path = [[SLOTS[5][0], SLOTS[5][1]]]; say('k11_kampta'); }
    } else LOST.npc.faceTo = [P.x, P.z];
  }
}


/* ================= Perde 4: kayık, tarla, fırın, şenlik ================= */
function act4Missing() {
  const c = CC(), m = [];
  if (c.wheatGoal && Z.ambar.have < c.wheatGoal) m.push(['wheat', `Ambarda ${c.wheatGoal - Z.ambar.have} buğday eksik kaldı`, ['e_ambar', 'n' + (c.wheatGoal - Z.ambar.have), 'e_bugday']]);
  for (const id of Object.keys(c.builds || {})) if (!G.built[id]) m.push([id === 'kule' ? 'tower' : id === 'sofra' ? 'feast' : 'house', id === 'kule' ? 'Kule bitmedi' : id === 'sofra' ? 'Şenlik sofrası kurulmadı' : 'Yeni ev bitmedi', [id === 'kule' ? 'e_kule' : id === 'sofra' ? 'e_sofra' : 'e_yeni_ev']]);
  return m;
}
function setupAct4(c) {
  setSeason(c.season === 'spring');
  boat.visible = !!c.boat; boat.position.copy(BOAT.home); boat.rotation.y = Math.PI / 2; BOAT.state = 'dock'; BOAT.catches = 0; P.locked = false;
  if (c.boat) { Z.kayik.active = true; Z.olta.active = false; hole.visible = false; }
  for (const pl of PLOTS) { pl.g.visible = !!c.farm; pl.state = 'empty'; pl.t = 0; pl.crop.visible = false; Z[pl.id].active = !!c.farm; }
  if (c.farm || c.wheatGoal) { Z.ambar.active = true; Z.ambar.need = 12; }
  oven.visible = !!c.bakery; Object.assign(BAKE, { wheat: 0, wood: 0, busy: false, t: 0, outN: 0 }); if (c.bakery) Z.firin.active = true;
  for (const id of ['ev3', 'kule', 'sofra']) setHouse(id, (c.built || []).includes(id));
  for (const [id, req] of Object.entries(c.builds || {})) {
    const z = Z['b_' + id]; z.active = true; z.req = Object.assign({}, req); z.got = {}; z.done = false;
    z.onFull = () => { z.active = false; setHouse(id, true, true); burst(houses[id].position.clone().add(new V3(0, 1, 0)), '#ffd27a', 12, 4); Snd.fx('build'); if (id !== 'sofra') say('k_ev_bitti'); };
  }
  if (c.noTrader) { Z.tezK.active = Z.tezB.active = false; if (trader) { scene.remove(trader.p.g); npcs.splice(npcs.indexOf(trader), 1); trader = null; } }
}
function updateAct4(dt) {
  // kayık: iskeleden açılır, sırt dolana kadar balık tutar, döner
  if (boat.visible) {
    boat.position.y = .05 + Math.sin(G.clock * 2) * .03; boat.rotation.z = Math.sin(G.clock * 1.6) * .04;
    if (BOAT.state === 'dock' && G.mode === 'play' && inZone(Z.kayik) && room() > 0) { BOAT.state = 'out'; BOAT.t = 0; P.locked = true; if (!G.flags.boatHint) { G.flags.boatHint = true; say('k15_kayik'); } }
    if (BOAT.state === 'out' || BOAT.state === 'back') {
      BOAT.t += dt / 2.4; const k = clamp(BOAT.t, 0, 1), e = k * k * (3 - 2 * k);
      boat.position.x = BOAT.state === 'out' ? lerp(BOAT.home.x, BOAT.spot.x, e) : lerp(BOAT.spot.x, BOAT.home.x, e);
      if (k >= 1) { if (BOAT.state === 'out') { BOAT.state = 'fish'; BOAT.t = 0; } else { BOAT.state = 'dock'; P.locked = false; P.x = 17.9; P.z = 0; } }
    } else if (BOAT.state === 'fish' && G.mode === 'play') {
      BOAT.t += dt;
      if (BOAT.t >= CFG.boatTime && room() > 0) { BOAT.t = 0; BOAT.catches++; const t = BOAT.catches % 2 === 0 ? 'big' : 'fish'; G.stats.caught[t]++; Snd.fx('splash'); burst(boat.position.clone().add(new V3(.8, .3, 0)), '#e6f4fc', 6, 3); giveToPlayer(t, boat.position.clone().add(new V3(.9, .3, 0))); }
      if (room() <= 0 && P.incoming === 0) { BOAT.state = 'back'; BOAT.t = 0; }
    }
    if (P.locked) { P.x = boat.position.x; P.z = boat.position.z; P.face = BOAT.state === 'back' ? -Math.PI / 2 : Math.PI / 2; }
  }
  // tarla
  for (const pl of PLOTS) {
    if (!pl.g.visible) continue;
    if (pl.state === 'grow' && G.mode === 'play') {
      pl.t += dt; const k = clamp(pl.t / CFG.growTime, 0, 1); pl.crop.scale.set(1, .15 + k * .85, 1);
      if (k >= 1) { pl.state = 'ripe'; pl.given = 0; for (const st of pl.crop.children) if (st.userData.head) { st.material = mat('#d9b04a'); st.userData.head.material = mat('#e6b83a'); } if (!G.flags.ripe) { G.flags.ripe = true; say('k16_hasat'); } }
    }
  }
  // fırın
  if (oven.visible && G.mode === 'play') {
    if (!BAKE.busy && BAKE.wheat >= 2 && BAKE.wood >= 1 && BAKE.outN < 6) { BAKE.wheat -= 2; BAKE.wood -= 1; BAKE.busy = true; BAKE.t = 0; }
    if (BAKE.busy) { BAKE.t += dt; if (Math.random() < dt * 3) burst(new V3(7.9, 1.6, 1.9), '#eeeeee', 1, 2); if (BAKE.t >= CFG.bakeTime) { BAKE.busy = false; BAKE.outN++; Snd.fx('pick'); } }
  }
  for (const id of ['ev3', 'kule', 'sofra']) if (houseAnim[id] < 1) { houseAnim[id] = Math.min(1, houseAnim[id] + dt / 1.2); houses[id].scale.y = Math.max(.001, 1 - Math.pow(1 - houseAnim[id], 3)); }
}
function zoneAct4(z) {
  if (z.boat) return true;
  if (z.plot) {
    const pl = z.plot;
    if (pl.state === 'empty' && G.coins >= 2) { G.coins -= 2; pl.state = 'grow'; pl.t = 0; pl.crop.visible = true; pl.crop.scale.set(1, .15, 1); for (const st of pl.crop.children) if (st.userData.head) { st.material = mat('#7fb84a'); st.userData.head.material = mat('#9ccf5a'); } Snd.fx('build'); z.timer = .6; for (let k = 0; k < 2; k++) fly(coinMesh(), P.model.g.position.clone().add(new V3(0, 1.5, 0)), () => new V3(pl.x, .3, pl.z), .3, null, .8, k * .08); }
    else if (pl.state === 'ripe' && room() > 0) { pl.given++; giveToPlayer('wheat', new V3(pl.x, .6, pl.z)); z.timer = .25; if (pl.given >= 3) { pl.state = 'empty'; pl.crop.visible = false; } }
    return true;
  }
  if (z.bake) {
    if (!z.dir) z.dir = (has('wheat') && BAKE.wheat < 6) || (has('wood') && BAKE.wood < 3) ? 'in' : 'out';
    if (z.dir === 'in') {
      const t = has('wheat') && BAKE.wheat < 6 ? 'wheat' : has('wood') && BAKE.wood < 3 ? 'wood' : null;
      if (t) { const from = take(t); fly(makeItem(t), from, () => new V3(7.4, .6, 2.6), .35, null, .9); BAKE[t]++; z.timer = .25; Snd.fx('drop'); }
    } else if (BAKE.outN > 0 && room() > 0) { BAKE.outN--; giveToPlayer('bread', new V3(7.2, .6, 2.8)); z.timer = .25; }
    return true;
  }
  return false;
}
function finale() {
  const cols = ['#ffd27a', '#ff7a6b', '#8fdcff', '#9ccf5a', '#f49ac1'];
  for (let k = 0; k < 6; k++) after(k * .5, () => { const c0 = new V3(rand(-6, 6), rand(4, 7), rand(-6, 4)); for (let i = 0; i < 18; i++) { const m = new THREE.Mesh(chipGeo, new THREE.MeshBasicMaterial({ color: col(cols[(i + k) % cols.length]) })); m.scale.setScalar(1.6); const to = c0.clone().add(new V3(rand(-3, 3), rand(-3, 1), rand(-3, 3))); fly(m, c0, () => to, rand(.7, 1.1), null, .4); } Snd.fx('trade'); });
}

/* ----- Yapıları bölüme göre aç/kapat ----- */
function setHouse(id, on, animate) {
  G.built[id] = on; const h = houses[id]; h.visible = on; houseAnim[id] = on && animate ? 0 : 1; h.scale.y = on && animate ? .001 : 1;
}
function applyUpgrade(k) { G.upg[k] = true; Snd.fx('build'); say('k_up'); if (k === 'frame') rebuildStack(); }
function setStorm(on) { G.storm = on; stormWalls.visible = on; }
function dynBoxes() {
  const b = [];
  if (market.visible) b.push([5.15, 7.65, 5.5, 6.5]);
  if (depotG.visible) b.push([-3.55, -2.35, -5.1, -3.5]);
  if (sawG.visible) b.push([-2.35, -.85, -5.25, -4.15]);
  if (G.built.ev) b.push([-1.75, .55, 6.1, 7.9]);
  if (G.built.ev2) b.push([-8.75, -6.45, -2.4, -.6]);
  if (G.built.ev3) b.push([1.75, 4.05, 6.1, 7.9]);
  if (G.built.kule) b.push([7.2, 8.6, -8.6, -7.2]);
  if (G.built.sofra) b.push([1.8, 3.8, 1.4, 2.4]);
  if (oven.visible) b.push([6.75, 8.45, 1.35, 3.05]);
  if (G.storm) b.push([-2.4, 2.4, -9.5, -8.5], [8.5, 9.5, -2.4, 2.4]);
  if (smokeHouse.visible) b.push([5.75, 7.45, -.55, .95]);
  for (const sb of SOBA) if (sb.built) b.push([sb.x - .5, sb.x + .5, sb.z + .4, sb.z + 1.4]);
  return b;
}

/* ----- Bölüm akışı ----- */
function startChapter(n) {
  Snd.stopVoice(); closeModal(); $('progPanel').hidden = true;
  G.ch = n; G.clock = 0; G.jobs = []; G.flags = {}; G.fails = 0; G.day = 1; G.dayIdx = 0; G.auto = null; G.priceAdd = 0; G.catches = 0; G.pending = []; G.waste = null;
  G.prog = { fish: 0, big: 0 }; G.stats = { tradedWood: 0, trade: { fish: 0, big: 0 }, caught: { fish: 0, big: 0 } };
  const c = CC();
  G.coins = c.coins || 0; G.upg = {}; G.custT = 4;
  G.stock = c.stock ? Object.assign({}, c.stock) : { fish: 0, big: 0 };
  G.plates = Array(c.people).fill(0);
  resetTrees(); clearFlyers(); clearNpcs(); customers.length = 0; H.npc = null; stripKey = '';
  for (const st of steps) { st.t = 99; st.m.material.opacity = 0; }
  P.x = 0; P.z = 4.6; P.face = Math.PI; P.stack = []; P.incoming = 0; P.fishProg = 0; P.swing = 1; buildPlayer();
  setFire(n >= 2); setPier(!!c.pierBuilt); setStorm(!!dayCfg().storm);
  for (const id of ['ev', 'ev2']) setHouse(id, (c.built || []).includes(id));
  market.visible = !!c.market; depotG.visible = !!c.depot; sawG.visible = !!c.saw;
  clearBelt(); setBelt(!!(c.belt && c.belt.built)); BELT.to = c.belt ? c.belt.to : 'depo';
  SAW.out = 0; SAW.busy = false; updatePlankPile();
  for (const z of Object.values(Z)) { z.active = false; z.have = 0; z.need = 0; z.onFull = null; z.lighting = false; z.tile.key = ''; }
  Z.ocak.active = true;
  if (n === 1) { Z.ocak.lighting = true; Z.ocak.need = CFG.light; Z.ocak.onFull = lightFire; G.timed = false; }
  else {
    Z.ocak.need = dayCfg().flakes * CFG.perFlake; Z.kiler.active = true; Z.kiler.need = c.people; Z.tezK.active = Z.tezB.active = true;
    G.timed = !c.untimed; G.dayLeft = dayLen();
    if (!c.noTrader) trader = addNpc({ coat: '#8a5a3a', hat: '#e9e3d3', apron: true }, 5.5, -6.35);
    const before = n === 2 ? 0 : Math.min(CFG.ch[2].people, c.people);
    for (let k = 0; k < before; k++) addGuest(k, false);
    for (let k = before; k < c.people; k++) if (!(c.lost && k === 5)) addGuest(k, true);
    if (c.pier) { Z.iskele.active = true; Z.iskele.need = CFG.pier; Z.iskele.onFull = buildPier; }
    if (c.pierBuilt) Z.olta.active = true;
  }
  if (c.market) Z.pazar.active = true;
  if (c.depot) { Z.depo.active = true; Z.depo.need = c.depot; }
  updateDepotLogs();
  if (c.belt) { Z.bant.active = true; if (!c.belt.built) { Z.bant.need = c.belt.cost; Z.bant.onFull = () => { setBelt(true, true); Snd.fx('build'); Z.bant.have = 0; Z.bant.need = 0; }; } }
  if (c.saw) Z.tahta.active = true;
  (c.ups || []).forEach((k, i) => { const z = Z['up' + i]; z.active = true; z.up = k; z.need = UP_COST[k]; z.onFull = () => { z.active = false; applyUpgrade(k); }; });
  if (c.house) {
    const z = Z[c.house.id]; z.active = true; z.need = c.house.cost || c.house.planks;
    z.onFull = () => { z.active = false; setHouse(c.house.id, true, true); burst(new V3(houses[c.house.id].position.x, 1, houses[c.house.id].position.z), '#f4f8fc', 12, 4); say('k_ev_bitti'); };
  }
  setupAct3(c); setupAct4(c);
  if (c.helper) buildHelper();
  updatePending(); updateRack();
  $('menu').hidden = true; $('hud').hidden = false; $('bubble').hidden = true; hudKey = '';
  G.mode = 'intro';
  const ch = CHAPTERS[n - 1];
  modal(cd => {
    const head = el('div', 'headrow'), sp = el('button', 'speak', '🔈'); sp.setAttribute('aria-label', 'Yeniden dinle');
    sp.onclick = () => { Snd.unlock(); Snd.say(['ch' + n]); };
    head.append(el('div', 'kicker', `Bölüm ${n}`), sp);
    cd.append(head, el('h2', '', ch.title), el('p', '', ch.text));
    const b = el('button', 'btn', 'Başla'); b.onclick = () => { Snd.unlock(); Snd.fx('tap'); closeModal(); begin(); }; cd.append(b);
  });
  Snd.unlock(); Snd.say(['ch' + n]);
}
function begin() {
  G.mode = 'play';
  const L = (k, t) => after(t, () => say(k));
  if (G.ch === 1) say('k1_ocak');
  if (G.ch === 2) { L('k2_misafir', 2.5); L('k2_balik', 9); L('k2_tuccar', 16); L('k_hava', 23); }
  if (G.ch === 3) { L('k_yeni', 1); L('k_hava', 7.5); L('k3_gol', 14); L('k3_secim', 21); }
  if (G.ch === 4) { L('k4_pazar', 1.5); L('k4_ev', 8); L('k4_dukkan', 15); L('k_hava', 23); }
  if (G.ch === 5) { L('k5_firtina', 1.5); L('k5_depo', 8.5); L('k_hava', 16); }
  if (G.ch === 6) { L('k6_yardimci', 1.5); after(5, () => { if (!H.running && G.mode === 'play') openProgram(); }); }
  if (G.ch === 7) { L('k7_bant', 1.5); L('k_hava', 9); }
  if (G.ch === 8) { L('k8_testere', 1.5); L('k_hava', 9); }
  if (G.ch === 9) { L('k9_tutsu', 1.5); L('k9_hedef', 8.5); L('k_hava', 15); }
  if (G.ch === 10) { L('k10_soguk', 1.5); L('k10_soba', 8.5); L('k_hava', 15); }
  if (G.ch === 11) { L('k11_kayip', 1.5); L('k_hava', 9); }
  if (G.ch === 12) { L('k12_kopru', 1.5); L('k12_tas', 9); L('k_hava', 16); }
  if (G.ch === 13) { L('k13_tassoba', 1.5); L('k_hava', 9); }
  if (G.ch === 14) { L('k14_buyuk', 1.5); L('k5_depo', 8.5); L('k_hava', 15); }
  if (G.ch === 15) { L('k15_bahar', 1.5); L('k_hava', 9); }
  if (G.ch === 16) { L('k16_tarla', 1.5); L('k16_ambar', 9); }
  if (G.ch === 17) { L('k17_tuccar', 1.5); L('k17_firin', 8.5); L('k_hava', 15); }
  if (G.ch === 18) { L('k18_pazar', 1.5); L('k9_hedef', 8.5); }
  if (G.ch === 19) { L('k19_kasaba', 1.5); L('k_hava', 9); }
  if (G.ch === 20) { L('k20_senlik', 1.5); L('k_hava', 9); }
}
function lightFire() {
  // Yakmak için verilen odun yandı; gece için ayrı bir ihtiyaç başlar.
  Z.ocak.lighting = false; Z.ocak.have = 0; Z.ocak.need = dayCfg().flakes * CFG.perFlake;
  setFire(true); fireBoost = 1.2; Snd.fx('ignite');
  burst(new V3(0, 1, -1), '#ffb22e', 12, 5);
  after(.5, () => say('k1_yandi')); after(6.5, () => { if (!needsMet()) say('k_hava'); });
}
function buildPier() {
  Z.iskele.active = false; setPier(true, true); Snd.fx('build'); burst(new V3(13.5, .5, 0), '#f4f8fc', 10, 4);
  after(1.3, () => { Z.olta.active = true; say('k3_iskele'); });
}
function startNight() {
  if (G.mode !== 'play') return;
  G.mode = 'night'; Snd.stopVoice(); $('bubble').hidden = true;
  $('night').classList.add('on'); fireBoost = .6;
  after(2.8, resolveNight);
}
function resetDayNeeds() {
  const c = CC();
  G.flags.eve = false; G.flags.rise = false; G.priceAdd = 0; G.dayLeft = dayLen(); G.custT = 4;
  Z.ocak.have = 0; Z.ocak.need = dayCfg().flakes * CFG.perFlake; Z.kiler.have = 0; G.plates = G.plates.map(() => 0); updateRack();
  setStorm(!!dayCfg().storm);
  for (const n of customers) { dropBubble(n); scene.remove(n.p.g); npcs.splice(npcs.indexOf(n), 1); } customers.length = 0;
  return c;
}
// Gece yanan fazla odun ve yarısı boşa giden büyük yemek; sabah ekranında bilgi olarak gösterilir.
function wasteNow() { if (!strict()) return { w: 0, f: 0 }; return { w: Math.max(0, Z.ocak.have - Z.ocak.need), f: Z.kiler.active ? G.plates.filter(x => x === 4 || x === 7).length : 0 }; }
function wasteRows(cd, voice) {
  const W = G.waste || {};
  const row = (icon, txt, v) => { const r = el('button', 'miss waste'); const i = el('img'); i.src = ICON[icon]; r.append(i, el('span', '', txt)); r.onclick = () => Snd.say([v]); cd.append(r); voice.push(v); };
  if (W.w) row('log', `${W.w} odun boşa yandı`, ['n' + W.w, 'e_odun_bosa']);
  if (W.f) row('big', `${W.f} tabaklık yemek boşa gitti`, ['n' + W.f, 'e_yemek_bosa']);
}
function resolveNight() {
  $('night').classList.remove('on'); G.waste = wasteNow();
  const c = CC(), missW = Math.max(0, Z.ocak.need - Z.ocak.have), missF = Z.kiler.active ? Math.max(0, Z.kiler.need - Z.kiler.have) : 0;
  const missH = c.house && !G.built[c.house.id], missY = c.helperGoal ? Math.max(0, c.helperGoal - H.delivered) : 0, missD = c.depotGoal ? Math.max(0, c.depotGoal - Z.depo.have) : 0;
  const miss3 = act3Missing().concat(act4Missing());
  if (!missW && !missF && !missH && !missY && !missD && !miss3.length) {
    if (c.days && G.dayIdx < c.days.length - 1) return nextDay();
    return chapterDone();
  }
  // Ceza yok, sonuç var: aynı gün yeniden. Kurulanlar, odunluk, sırttakiler ve altın kalır; tüccar biraz balık getirir.
  G.fails++; G.day++; resetDayNeeds();
  if (c.stock) for (const k of ['fish', 'big']) G.stock[k] = Math.max(G.stock[k], Math.ceil(c.stock[k] / 2));
  G.mode = 'result';
  modal(cd => {
    cd.append(el('div', 'kicker', `Gün ${G.day}`), el('h2', '', 'Dün gece üşüdük'));
    // Her eksik satırı sesle de söylenir; satıra dokununca yeniden okunur.
    const voice = ['k_usuduk'];
    const row = (icon, txt, v) => { const r = el('button', 'miss'); const i = el('img'); i.src = ICON[icon]; r.append(i, el('span', '', txt)); r.onclick = () => Snd.say([v]); cd.append(r); voice.push(v); };
    if (missW) row('fire', `Ocağa ${missW} odun eksik kaldı`, ['e_ocaga', 'n' + missW, 'e_odun_eksik']);
    if (missF) row('fish', `${missF} tabak boş kaldı`, ['n' + missF, 'e_tabak']);
    if (missH) row('house', 'Ev bitmedi', ['e_ev']);
    if (missY) row('helper', `Yardımcı ${missY} odun daha taşımalıydı`, ['e_yardimci', 'n' + missY, 'e_odun_daha']);
    if (missD) row('depot', `Odunlukta ${missD} odun eksikti`, ['e_odunluk', 'n' + missD, 'e_odun_eksikti']);
    for (const [ic, tx, v] of miss3) row(ic, tx, v);
    wasteRows(cd, voice);
    G.flags.failVoice = voice;
    cd.append(el('p', '', 'Gece ocak ve kiler boşaldı, aynı günü yeniden deneyelim. Kurduklarımız ve odunluktaki odun duruyor. Önce neyin ne kadar gerektiğine bak, sonra işe başla.'));
    const b = el('button', 'btn', 'Yeni gün'); b.onclick = () => { Snd.fx('tap'); closeModal(); G.mode = 'play'; }; cd.append(b);
  });
  Snd.say(G.flags.failVoice || ['k_usuduk']);
}
function nextDay() {
  G.dayIdx++; G.day++; const c = resetDayNeeds();
  if (c.stock) G.stock = Object.assign({}, c.stock);
  G.mode = 'result'; Snd.fx('done');
  const storm = !!dayCfg().storm, wv = [];
  modal(cd => {
    cd.append(el('div', 'kicker', `Gün ${G.day}`), el('h2', '', storm ? 'Fırtına başladı' : 'Günaydın!'));
    if (storm) { const r = el('div', 'miss'), i = el('img'); i.src = ICON.storm; r.append(i, el('span', '', 'Kapılar karla kapandı: orman ve göl yok')); cd.append(r); }
    const r2 = el('div', 'miss'), i2 = el('img'); i2.src = ICON.flake; r2.append(i2, el('span', '', `Bu gece ${dayCfg().flakes} kar tanesi`)); cd.append(r2);
    cd.append(el('p', '', storm ? 'Bugün yalnız odunluktaki odunla idare edeceğiz. Tüccar kampta, takas açık.' : 'Yeni bir gün.'));
    if (frostOn()) { const r3 = el('div', 'miss'), i3 = el('img'); i3.src = ICON.house; r3.append(i3, el('span', '', 'Bu gece soğuk dalgası: evler sıcak halkada olmalı')); cd.append(r3); }
    wasteRows(cd, wv);
    const b = el('button', 'btn', 'Başla'); b.onclick = () => { Snd.fx('tap'); closeModal(); G.mode = 'play'; }; cd.append(b);
  });
  Snd.say(['k_gunaydin'].concat(storm ? ['k5_firtina_geldi'] : [], frostOn() ? ['k14_dalga'] : [], [['e_bu_gece', 'n' + dayCfg().flakes, 'e_kar']], wv));
}
function chapterDone() {
  const stars = Math.max(1, 3 - G.fails), n = G.ch, last = n === CHAPTERS.length;
  Save.d.done[n] = Math.max(Save.d.done[n] || 0, stars); Save.save();
  G.mode = 'result'; Snd.fx('done'); const wv = [];
  modal(cd => {
    const st = el('div', 'bigstars'); for (let i = 0; i < 3; i++) st.append(el('span', i < stars ? 'on' : '', '★'));
    cd.append(st, el('h2', '', 'Günaydın!'));
    cd.append(el('p', '', (G.fails ? `${G.fails} gece üşüdük ama kamp ayakta. ` : 'Kimse üşümedi, kimse aç kalmadı. ') +
      (last ? 'Kar Kampı burada bitiyor: sönük bir ocaktan bütün bir köy kurdun. İstediğin bölümü yeniden oynayıp daha az odunla, daha az günde bitirmeyi deneyebilirsin.' : 'Kamp büyümeye hazır.')));
    wasteRows(cd, wv);
    if (!last) { const b = el('button', 'btn', 'Sonraki bölüm'); b.onclick = () => { Snd.fx('tap'); startChapter(n + 1); }; cd.append(b); }
    const m = el('button', last ? 'btn' : 'btn alt', 'Menü'); m.onclick = () => { Snd.fx('tap'); toMenu(); }; cd.append(m);
  });
  if (last) finale();
  Snd.say(['k_gunaydin', last ? 'k20_son' : 'k_bolum'].concat(wv));
}

/* ================= Pencereler ve menü ================= */
function modal(build) { const c = $('modalCard'); c.innerHTML = ''; build(c); $('modal').hidden = false; }
function closeModal() { $('modal').hidden = true; }
function toMenu() {
  Snd.stopVoice(); closeModal(); $('progPanel').hidden = true; $('night').classList.remove('on');
  G.mode = 'menu'; $('hud').hidden = true; $('joy').hidden = true; renderMenu(); $('menu').hidden = false;
}
const UNLOCK_ALL = /[?&](hepsi|all)\b/.test(location.search);
const isOpen = n => n === 1 || UNLOCK_ALL || !!Save.d.done[n - 1];
function renderMenu() {
  const c = $('menuCard'); c.innerHTML = '';
  c.append(el('div', 'kicker', '20 bölüm'), el('h1', '', 'Kar Kampı'), el('p', '', 'Sönük ocağı yak, misafirleri doyur, kampı büyüt. Kar tanelerini oku, tabakları say, odununu akıllıca harca.'));
  c.append(el('div', 'lbl', 'Mont'));
  const sw = el('div', 'row');
  COATS.forEach((co, i) => { const b = el('button', 'sw' + (Save.d.color === i ? ' on' : '')); b.style.background = co.coat; b.setAttribute('aria-label', 'Mont rengi'); b.onclick = () => { Snd.fx('tap'); Save.d.color = i; Save.save(); buildPlayer(); renderMenu(); }; sw.append(b); });
  c.append(sw, el('div', 'lbl', 'Bölümler'));
  const chs = el('div', 'chs');
  CHAPTERS.forEach((ch, i) => {
    const n = i + 1, b = el('button', 'ch'), s = el('span', '', ch.title), st = el('span', 'stars');
    s.append(el('small', '', ch.sub));
    for (let k = 0; k < 3; k++) { const x = el('i', k < (Save.d.done[n] || 0) ? 'on' : '', '★'); x.style.fontStyle = 'normal'; st.append(x); }
    st.style.flex = '0 0 auto';
    b.append(el('b', '', String(n)), s, st);
    if (!isOpen(n)) { b.disabled = true; b.classList.add('locked'); b.querySelector('b').textContent = '🔒'; }
    b.onclick = () => { if (!isOpen(n)) return; Snd.unlock(); Snd.fx('tap'); startChapter(n); };
    chs.append(b);
  });
  c.append(chs);
  const back = el('a', 'back', '← Sayı Bahçesi'); back.href = '../'; c.append(back);
}
function pauseMenu() {
  if (G.mode !== 'play') return;
  G.mode = 'pause';
  modal(c => {
    c.append(el('h2', '', 'Mola'));
    const b1 = el('button', 'btn', '▶  Devam'); b1.onclick = () => { closeModal(); G.mode = 'play'; };
    const b2 = el('button', 'btn alt', '↺  Bölümü baştan başlat'); b2.onclick = () => startChapter(G.ch);
    const b3 = el('button', 'btn alt', Save.d.sound ? '🔇  Sesi kapat' : '🔊  Sesi aç'); b3.onclick = () => { Save.d.sound = !Save.d.sound; Save.save(); if (!Save.d.sound) Snd.stopVoice(); b3.textContent = Save.d.sound ? '🔇  Sesi kapat' : '🔊  Sesi aç'; };
    const b4 = el('button', 'btn alt', '☰  Menü'); b4.onclick = toMenu;
    c.append(b1, b2, b3, b4);
  });
}

/* ================= Girdi ================= */
const joy = { on: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 }, keys = new Set();
canvas.addEventListener('pointerdown', e => {
  Snd.unlock();
  if (G.mode !== 'play' || joy.on) return;
  joy.on = true; joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joy.dx = joy.dy = 0;
  const j = $('joy'); j.style.left = e.clientX + 'px'; j.style.top = e.clientY + 'px'; j.hidden = false; $('joyKnob').style.transform = '';
});
window.addEventListener('pointermove', e => {
  if (!joy.on || e.pointerId !== joy.id) return;
  let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const d = Math.hypot(dx, dy), R = 50;
  if (d > R) { dx *= R / d; dy *= R / d; }
  joy.dx = dx / R; joy.dy = dy / R; $('joyKnob').style.transform = `translate(${dx}px, ${dy}px)`;
});
const endJoy = e => { if (joy.on && e.pointerId === joy.id) { joy.on = false; joy.dx = joy.dy = 0; $('joy').hidden = true; } };
window.addEventListener('pointerup', endJoy); window.addEventListener('pointercancel', endJoy);
window.addEventListener('keydown', e => { keys.add(e.key.toLowerCase()); Snd.unlock(); });
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => { keys.clear(); joy.on = false; $('joy').hidden = true; });
function inputDir() {
  if (G.auto) { const dx = G.auto.x - P.x, dz = G.auto.z - P.z, d = Math.hypot(dx, dz); return d < .15 ? [0, 0] : [dx / d, dz / d]; }
  let x = 0, z = 0;
  if (keys.has('arrowleft') || keys.has('a')) x--; if (keys.has('arrowright') || keys.has('d')) x++;
  if (keys.has('arrowup') || keys.has('w')) z--; if (keys.has('arrowdown') || keys.has('s')) z++;
  if (joy.on) { const m = Math.hypot(joy.dx, joy.dy); if (m > .15) { x = joy.dx; z = joy.dy; } }
  const m = Math.hypot(x, z); return m > 1 ? [x / m, z / m] : [x, z];
}

/* ================= Çarpışma ================= */
const BOXES = [
  [-CAMP - .3, -2.2, -CAMP - .25, -CAMP + .25], [2.2, CAMP + .3, -CAMP - .25, -CAMP + .25],
  [-CAMP - .3, CAMP + .3, CAMP - .25, CAMP + .25], [-CAMP - .25, -CAMP + .25, -CAMP - .3, CAMP + .3],
  [CAMP - .25, CAMP + .25, -CAMP - .3, -2.2], [CAMP - .25, CAMP + .25, 2.2, CAMP + .3],
  [-6.95, -4.05, -7.15, -5.05], [-3.85, -3.35, -6.95, -5.25],                // kiler, kurutma askısı
  [3.9, 7.1, -5.55, -4.45], [3.9, 7.15, -7.1, -5.55],                         // tezgâh, tüccarın yeri
  [-2.98, -2.42, -1.85, -.15], [2.42, 2.98, -1.85, -.15],                     // oturma kütükleri
  [-8.1, -6.9, -8.2, -6.4],                                                   // odun yığını
];
const CIRCLES = [[0, -1, 1.28], [1.55, .15, .7], [-5.6, 5.8, 1.75], [-7.6, -4.6, .4], [-7.0, -4.2, .4], [-8.0, 7.6, .7]];
const PR = .42;
function collide() {
  for (const [x0, x1, z0, z1] of BOXES.concat(dynBoxes())) {
    const cx = clamp(P.x, x0, x1), cz = clamp(P.z, z0, z1), dx = P.x - cx, dz = P.z - cz, d = Math.hypot(dx, dz);
    if (d >= PR) continue;
    if (d > 1e-4) { P.x = cx + dx / d * PR; P.z = cz + dz / d * PR; }
    else { const o = [[P.x - x0 + PR, -1, 0], [x1 - P.x + PR, 1, 0], [P.z - z0 + PR, 0, -1], [z1 - P.z + PR, 0, 1]].sort((a, b) => a[0] - b[0])[0]; P.x += o[1] * o[0]; P.z += o[2] * o[0]; }
  }
  for (const [x, z, r] of CIRCLES) { const dx = P.x - x, dz = P.z - z, d = Math.hypot(dx, dz), m = r + PR; if (d < m && d > 1e-4) { P.x = x + dx / d * m; P.z = z + dz / d * m; } }
  treesNear(P.x, P.z, i => {
    if (T.st[i] !== 0) return;
    const dx = P.x - T.x[i], dz = P.z - T.z[i], d = Math.hypot(dx, dz), m = .76 + PR;   // sabit yarıçap: orman duvar gibi, kesmeden geçilmez
    if (d < m && d > 1e-4) { P.x = T.x[i] + dx / d * m; P.z = T.z[i] + dz / d * m; }
  });
  for (const k of ROCKS) if (k.alive && k.g.visible) { const dx = P.x - k.x, dz = P.z - k.z, d = Math.hypot(dx, dz), m = .85 + PR; if (d < m && d > 1e-4) { P.x = k.x + dx / d * m; P.z = k.z + dz / d * m; } }
  // Uçurum: yalnız köprünün üstünden geçilir
  if (P.z < -18.6 && P.z > -22.4 && !(G.built.kopru && bridgeAnim >= 1 && Math.abs(P.x) < .85)) P.z = P.z > -20.5 ? -18.6 : -22.4;
  if (G.built.kopru && P.z < -18.6 && P.z > -22.4) P.x = clamp(P.x, -.85, .85);
  const dx = P.x - LAKE.x, dz = P.z - LAKE.z, d = Math.hypot(dx, dz);
  if (d < LAKE.block) {
    // İskelenin üstündeyken yalnız iskele genişliğinde ve ucuna kadar yürünür; yandan buza girilmez.
    if (pierBuilt && pierAnim >= 1 && P.x > 12.4 && P.x < 20.3 && Math.abs(P.z) < .9) { P.z = clamp(P.z, -.78, .78); P.x = Math.min(P.x, 19.7); }
    else if (d > 1e-4) { P.x = LAKE.x + dx / d * LAKE.block; P.z = LAKE.z + dz / d * LAKE.block; }
  }
  P.x = clamp(P.x, -31, 31); P.z = clamp(P.z, -31, 31);
}

/* ================= Güncelleme ================= */
function hitTree(i) {
  if (!T.hp[i]) T.hp[i] = hitsNow();
  T.fd[i] = Math.atan2(T.x[i] - P.x, T.z[i] - P.z);
  T.hp[i]--; T.shake[i] = .28; T.anim.add(i); Snd.fx('chop');
  burst(new V3(T.x[i], .9, T.z[i]), '#d8a878', 4, 3); burst(new V3(T.x[i], 1.8, T.z[i]), '#f4f8fc', 3, 2);
  if (T.hp[i] > 0) return;
  T.st[i] = 1; T.t[i] = 0; Snd.fx('fall');
  const n = Math.min(CFG.perTree, room()), from = new V3(T.x[i], 1, T.z[i]);
  for (let k = 0; k < n; k++) giveToPlayer('wood', from, .25 + k * .14);
}
const rocksOn = () => !!CC().quarry;
function hitRock(k) {
  if (!k.alive) return;
  k.hp--; k.shake = .25; Snd.fx('chop'); Snd.tone(220, .1, { type: 'square', gain: .05, to: 160 });
  burst(new V3(k.x, .8, k.z), '#9ea6b2', 5, 3);
  if (k.hp > 0) return;
  k.alive = false; Snd.fx('fall'); const from = new V3(k.x, .8, k.z), n = Math.min(2, room());
  for (let i = 0; i < n; i++) giveToPlayer('stone', from, .2 + i * .14);
}
function turnTo(tgt, dt, k) { let d = tgt - P.face; d = Math.atan2(Math.sin(d), Math.cos(d)); P.face += d * Math.min(1, dt * k); }
function updatePlayer(dt) {
  const [ix, iz] = G.mode === 'play' && !P.locked ? inputDir() : [0, 0];
  const sp = 5.2, mv = Math.hypot(ix, iz);
  P.x += ix * sp * dt; P.z += iz * sp * dt; if (!P.locked) collide();
  P.speed = mv;
  if (mv > .1) { turnTo(Math.atan2(ix, iz), dt, 12); P.stepT -= dt * mv; if (P.stepT <= 0) { P.stepT = .32; leaveStep(); } }
  // Ağaç kesme: yanında ayakta bir ağaç varsa balta kendiliğinden iner.
  P.chopCd -= dt; P.swing = Math.min(1, P.swing + dt / .42);
  let chopping = false;
  if (G.mode === 'play' && rocksOn()) {
    const rk = ROCKS.find(k => k.alive && Math.hypot(k.x - P.x, k.z - P.z) < 1.9);
    if (rk && nearestTree(P.x, P.z, 1.75) < 0) {
      if (room() > 0) {
        chopping = true; if (mv < .1) turnTo(Math.atan2(rk.x - P.x, rk.z - P.z), dt, 10);
        if (P.chopCd <= 0) { P.chopCd = .45; P.swing = 0; after(.16, () => hitRock(rk)); }
      } else if (P.incoming === 0 && G.clock - P.warnAt > 18) { P.warnAt = G.clock; say('k_dolu'); }
    }
  }
  if (G.mode === 'play' && !chopping) {
    const ti = nearestTree(P.x, P.z, 1.75);
    if (ti >= 0) {
      if (room() > 0) {
        chopping = true;
        if (mv < .1) turnTo(Math.atan2(T.x[ti] - P.x, T.z[ti] - P.z), dt, 10);
        if (P.chopCd <= 0) { P.chopCd = .45; P.swing = 0; after(.16, () => { if (T.st[ti] === 0) hitTree(ti); }); }
      } else if (P.incoming === 0 && G.clock - P.warnAt > 18) { P.warnAt = G.clock; say('k_dolu'); }
    }
  }
  // Balık tutma: her üçüncü balık büyük çıkar
  const fishing = G.mode === 'play' && Z.olta.active && inZone(Z.olta) && room() > 0;
  if (fishing) {
    P.fishProg += dt / CFG.fishTime;
    if (mv < .1) turnTo(Math.PI / 2, dt, 8);
    if (P.fishProg >= 1) {
      P.fishProg = 0; G.catches++; const t = G.catches % CFG.bigEvery === 0 ? 'big' : 'fish'; G.stats.caught[t]++;
      Snd.fx('splash'); burst(new V3(20.35, .2, 0), '#e6f4fc', 7, 4); ripple.userData.t = 0; giveToPlayer(t, new V3(20.35, .3, 0));
    }
  } else P.fishProg = Math.max(0, P.fishProg - dt * .5);
  const m = P.model;
  m.g.position.set(P.x, 0, P.z); m.g.rotation.y = P.face;
  m.tool.visible = !fishing; m.rod.visible = fishing;
  let restR = -.35, busyR = false;
  if (fishing) restR = -.9 + Math.sin(G.clock * 3) * .05;
  if (P.swing < 1) {
    busyR = true; const p = P.swing;
    m.armR.rotation.x = p < .38 ? lerp(-.35, -2.6, p / .38) : p < .62 ? lerp(-2.6, -.25, (p - .38) / .24) : lerp(-.25, -.35, (p - .62) / .38);
  }
  animPerson(m, dt, chopping && mv < .1 ? 0 : mv, { restR, busyR });
}
// Kilere balık: büyük balık iki tabağı, küçük bir tabağı doldurur. Tek tabak kalmışsa büyük balık da tek tabağa gider (israf).
function feedPlate(z) {
  const left = z.need - z.have; if (left <= 0) return false;
  const two = ['big', 'bread'].find(has), one = ['fish', 'smoked'].find(has);
  const t = left >= 2 && two ? two : one || two || null;
  if (!t) return false;
  const from = take(t), to = z.to();
  fly(makeItem(t), from, () => to, .38, updateRack, 1.1);
  if (t === 'fish' || t === 'smoked') G.plates[z.have++] = t === 'smoked' ? 5 : 1;
  else if (left >= 2) { G.plates[z.have] = t === 'bread' ? 6 : 2; G.plates[z.have + 1] = 3; z.have += 2; }
  else G.plates[z.have++] = t === 'bread' ? 7 : 4;
  return true;
}
function updateZones(dt) {
  if (G.mode !== 'play') return;
  for (const z of Object.values(Z)) {
    if (!z.active || z.fishing || !inZone(z)) { z.timer = 0; z.dir = null; continue; }
    z.timer -= dt; if (z.timer > 0) continue;
    if (z.trade) {
      const k = z.trade, price = priceOf(k);
      if (G.pending.length && room() > 0) { const t = G.pending.shift(); updatePending(); giveToPlayer(t, COUNTER.clone()); z.timer = .25; }
      else if (G.stock[k] > 0 && has('wood') && G.pending.length < 6) {
        const from = take('wood'), to = z.to(); fly(makeLog(), from, () => to, .35, null, 1); Snd.fx('drop'); G.prog[k]++; G.stats.tradedWood++; z.timer = .3;
        if (G.prog[k] >= price) {
          G.prog[k] = 0; G.stock[k]--;
          after(.35, () => { Snd.fx('trade'); G.stats.trade[k]++; if (room() > 0) giveToPlayer(k, COUNTER.clone()); else { G.pending.push(k); updatePending(); } });
          if (G.stock[k] === 0) after(.9, () => say('k_stok'));
        }
      }
      continue;
    }
    if (z.id === 'kiler') { if (feedPlate(z)) { z.timer = CFG.dropKiler; Snd.fx('drop'); } continue; }
    if (z.market) { if (serveCustomer(z)) z.timer = .3; continue; }
    if (z.coin) {
      if (z.have < z.need && G.coins > 0) {
        G.coins--; z.have++; z.timer = .14; Snd.fx('pick');
        const to = new V3(z.x, .3, z.z); fly(coinMesh(), P.model.g.position.clone().add(new V3(0, 1.5, 0)), () => to, .3, null, .8);
        if (z.have >= z.need && z.onFull) { const f = z.onFull; z.onFull = null; after(.3, f); }
      }
      continue;
    }
    if (zoneAct4(z)) continue;
    if (z.mach) {
      const M = MACH[z.mach];
      if (!z.dir) z.dir = has(M.input) && M.inb < M.max ? 'in' : 'out';
      if (z.dir === 'in' && has(M.input) && M.inb < M.max) { const from = take(M.input); fly(makeItem(M.input), from, () => new V3(6.0, 1, .2), .35, null, .9); M.inb++; z.timer = .25; Snd.fx('drop'); }
      else if (z.dir === 'out' && M.outN > 0 && room() > 0) { M.outN--; giveToPlayer(M.outType, new V3(5.9, 1, .2)); z.timer = .25; }
      continue;
    }
    if (z.store) {
      const t = z.store;
      if (!z.dir) z.dir = has(t) ? 'in' : 'out';
      if (z.dir === 'in' && has(t) && z.have < z.need) { const from = take(t), to = z.to(); fly(makeItem(t), from, () => to, .35, updateStonePile, 1); z.have++; z.timer = .22; Snd.fx('drop'); }
      else if (z.dir === 'out' && z.have > 0 && room() > 0) { z.have--; updateStonePile(); giveToPlayer(t, z.to()); z.timer = .22; }
      continue;
    }
    if (z.build) {
      if (z.done) continue;
      for (const [t, n] of Object.entries(z.req)) {
        if ((z.got[t] || 0) >= n) continue;
        if (t === 'coin') { if (G.coins > 0) { G.coins--; z.got.coin = (z.got.coin || 0) + 1; fly(coinMesh(), P.model.g.position.clone().add(new V3(0, 1.5, 0)), () => new V3(z.x, .3, z.z), .3, null, .8); z.timer = .14; Snd.fx('pick'); break; } continue; }
        if (has(t)) { const from = take(t); fly(makeItem(t), from, () => new V3(z.x, .3, z.z), .35, null, 1); z.got[t] = (z.got[t] || 0) + 1; z.timer = .2; Snd.fx('drop'); break; }
      }
      if (Object.entries(z.req).every(([t, n]) => (z.got[t] || 0) >= n) && !z.done) { z.done = true; const f = z.onFull; z.onFull = null; if (f) after(.3, f); }
      continue;
    }
    if (z.depot) {
      // Karta girerken yön seçilir: elde odun varsa bırakılır, yoksa alınır; çıkana kadar yön değişmez (gidip gelme olmaz).
      if (!z.dir) z.dir = has('wood') ? 'in' : 'out';
      if (z.dir === 'in' && has('wood') && z.have < z.need) { const from = take('wood'), to = z.to(); fly(makeLog(), from, () => to, .35, updateDepotLogs, 1); z.have++; z.timer = .2; Snd.fx('drop'); }
      else if (z.dir === 'out' && z.have > 0 && room() > 0) { z.have--; updateDepotLogs(); giveToPlayer('wood', z.to()); z.timer = .22; }
      continue;
    }
    if (z.belt && BELT.built) {
      if (has('wood') && BELT.buffer < BELT.max) { const from = take('wood'), to = z.to(); fly(makeLog(), from, () => to, .3, null, .8); BELT.buffer++; updateBeltBuffer(); z.timer = .25; Snd.fx('drop'); }
      continue;
    }
    if (z.planks) { if (SAW.out > 0 && room() > 0) { SAW.out--; updatePlankPile(); giveToPlayer('plank', new V3(-3.1, .4, -4.75)); z.timer = .22; } continue; }
    const over = z.id === 'ocak' && strict() && !z.lighting;
    if ((z.have < z.need || over) && z.accepts && has(z.accepts)) {
      const from = take(z.accepts), to = z.to();
      z.have++; const extra = z.id === 'ocak' && z.have > z.need, toPile = z.id === 'ocak' && !extra && !z.lighting;
      if (toPile) PILE.fly++;
      fly(makeItem(z.accepts), from, () => toPile ? pileTop() : to, .38, extra ? smokePuff : toPile ? () => { PILE.fly--; } : null, 1.1);
      z.timer = z.id === 'ocak' ? CFG.dropOcak : .2; Snd.fx('drop');
      if (z.have >= z.need && z.onFull) { const f = z.onFull; z.onFull = null; after(.3, f); }
    }
  }
}
function updateTrees(dt) {
  if (!T.anim.size) return;
  for (const i of T.anim) {
    if (T.st[i] === 0) { T.shake[i] = Math.max(0, T.shake[i] - dt); if (!T.shake[i]) T.anim.delete(i); }
    else if (T.st[i] === 1) { T.t[i] += dt; if (T.t[i] > .9) { T.st[i] = 2; T.t[i] = 0; } }
    else if (T.st[i] === 2) { T.t[i] += dt; if (T.t[i] > 75 && Math.hypot(T.x[i] - P.x, T.z[i] - P.z) > 4) { T.st[i] = 3; T.t[i] = 0; T.hp[i] = 0; } }
    else if (T.st[i] === 3) { T.t[i] += dt; if (T.t[i] > .8) { T.st[i] = 0; T.anim.delete(i); } }
    treeMatrix(i);
  }
  treeMesh.instanceMatrix.needsUpdate = stumpMesh.instanceMatrix.needsUpdate = true;
}
function updateFlyers(dt) {
  for (let i = flyers.length - 1; i >= 0; i--) {
    const f = flyers[i]; f.t += dt; if (f.t < 0) continue;
    f.obj.visible = true;
    const p = clamp(f.t / f.dur, 0, 1), to = f.toFn();
    f.obj.position.lerpVectors(f.from, to, p); f.obj.position.y += Math.sin(p * Math.PI) * f.arc; f.obj.rotation.y += dt * 7;
    if (p >= 1) { scene.remove(f.obj); flyers.splice(i, 1); if (f.onDone) f.onDone(); }
  }
}
function updateNpcs(dt) {
  for (const n of npcs) {
    let sp = 0;
    if (n.path.length) {
      const [tx, tz] = n.path[0], dx = tx - n.p.g.position.x, dz = tz - n.p.g.position.z, d = Math.hypot(dx, dz);
      if (d < .1) n.path.shift();
      else { const s = Math.min(d, n.speed * dt); n.p.g.position.x += dx / d * s; n.p.g.position.z += dz / d * s; n.p.g.rotation.y = Math.atan2(dx, dz); sp = 1; }
    } else if (n === H.npc) {
      // yardımcı kendi işine bakar
    } else if (n !== trader) {
      const [fx, fz] = n.faceTo || [0, -1], dx = fx - n.p.g.position.x, dz = fz - n.p.g.position.z;
      let d = Math.atan2(dx, dz) - n.p.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); n.p.g.rotation.y += d * Math.min(1, dt * 3);
    } else n.p.g.rotation.y = 0;
    animPerson(n.p, dt, sp, { restR: n === H.npc ? -.35 : 0, busyR: n === H.npc && n.swing < 1 });
  }
}
function updateWorld(dt) {
  const t = G.clock + performance.now() / 1000 * (G.mode === 'menu' ? 1 : 0);
  fireBoost = Math.max(0, fireBoost - dt * .8);
  const lvT = G.mode === 'menu' || Z.ocak.lighting || !Z.ocak.need ? 1 : .45 + .55 * Math.min(1, Z.ocak.have / Z.ocak.need);
  fireLvl += (lvT - fireLvl) * Math.min(1, dt * 1.5); flames.scale.setScalar(fireLvl); updatePile();
  if (fireOn) {
    flameParts.forEach((m, i) => { const k = 1 + Math.sin(t * (9 + i * 3) + i) * .09 + Math.sin(t * 23 + i * 2) * .05 + fireBoost * .5; m.scale.set(1 + fireBoost * .3 + Math.sin(t * 7 + i) * .05, k, 1 + fireBoost * .3); m.rotation.y = t * (1 + i * .7); });
    fireLight.intensity = (.7 + fireLvl * .9) + Math.sin(t * 13) * .15 + Math.sin(t * 7.3) * .1 + fireBoost * 1.5;
    glow.material.opacity = .55 + fireBoost * .3; fireHalo.material.opacity = .45 + Math.sin(t * 11) * .05;
  } else { fireLight.intensity = 0; glow.material.opacity = 0; fireHalo.material.opacity = 0; }
  for (const s of smoke) {
    s.userData.t = (s.userData.t + dt * .16) % 1; const p = s.userData.t;
    s.position.set(Math.sin(p * 5 + s.id) * .35 * p, 1.4 + p * 4.2, Math.cos(p * 4 + s.id) * .25 * p);
    const sc = .6 + p * 1.8; s.scale.set(sc, sc, 1); s.material.opacity = fireOn ? Math.sin(p * Math.PI) * .38 : 0;
  }
  for (const e of embers) {
    const u = e.userData; u.t += dt * u.sp * .5; if (u.t > 1) { u.t = 0; u.x = rand(-.3, .3); u.z = rand(-.3, .3); }
    e.position.set(u.x + Math.sin(u.t * 9 + u.x * 10) * .15, .5 + u.t * 2.6, u.z); e.material.opacity = fireOn ? (1 - u.t) * (.6 + Math.sin(t * 30 + u.x * 50) * .4) : 0;
  }
  for (const s of lanterns) s.material.opacity = .45 + Math.sin(t * 3 + s.id) * .05;
  if (pierAnim < 1) { pierAnim = Math.min(1, pierAnim + dt / 1.1); const e = 1 - Math.pow(1 - pierAnim, 3); pier.scale.x = Math.max(.001, e); }
  if (ripple.userData.t !== undefined && ripple.userData.t < 1) { ripple.userData.t += dt * 1.2; const p = ripple.userData.t; ripple.scale.setScalar(1 + p * 2.2); ripple.material.opacity = (1 - p) * .8; }
  const eve = G.timed && G.mode !== 'menu' ? clamp(1 - G.dayLeft / (dayLen() * .3), 0, 1) : 0;
  const st = G.storm && G.mode !== 'menu' ? 1 : 0;
  sun.color.copy(col('#fff0dc')).lerp(col('#ffa968'), eve * .8); sun.intensity = (.95 - eve * .25) * (1 - st * .45); hemi.intensity = (.72 - eve * .18) * (1 - st * .25);
  flakes.material.size = st ? .2 : .13;
  const pa = flakes.geometry.attributes.position, a = pa.array;
  const fall = st ? 3.2 : 1.1, wind = st ? 3 : .25;
  for (let i = 0; i < a.length; i += 3) { a[i + 1] -= dt * fall; a[i] += (Math.sin(t * .8 + i) * .25 + (st ? 1 : 0)) * dt * wind; if (a[i + 1] < 0) { a[i + 1] += 18; if (st) a[i] = rand(-22, 22); } }
  pa.needsUpdate = true; flakes.position.set(P.x, 0, P.z);
}
function updateBuild(dt) {
  for (const id of ['ev', 'ev2']) if (houseAnim[id] < 1) { houseAnim[id] = Math.min(1, houseAnim[id] + dt / 1.2); houses[id].scale.y = Math.max(.001, 1 - Math.pow(1 - houseAnim[id], 3)); }
  if (H.npc) { const sw = H.npc.swing === undefined ? 1 : (H.npc.swing = Math.min(1, H.npc.swing + dt / .5)); if (sw < 1) H.npc.p.armR.rotation.x = sw < .4 ? lerp(-.3, -2.5, sw / .4) : lerp(-2.5, -.3, (sw - .4) / .6); }
  renderStrip();
}
function updateDay(dt) {
  if (G.mode !== 'play' || !G.timed) return;
  G.dayLeft -= dt;
  if (CC().rise && !G.flags.rise && G.dayLeft < dayLen() * .5) { G.flags.rise = true; G.priceAdd = 1; say('k_fiyat'); }
  if (!G.flags.eve && G.dayLeft < dayLen() * .2) { G.flags.eve = true; if (strict()) say(needsMet(true) ? 'k_aksam_say' : 'k_aksam'); else if (!needsMet()) say('k_aksam'); }
  if (G.dayLeft <= 0) { G.dayLeft = 0; startNight(); }
}
function update(dt) {
  if (G.mode === 'pause') return;
  if (G.mode !== 'menu') G.clock += dt;
  for (let i = G.jobs.length - 1; i >= 0; i--) if (G.jobs[i].at <= G.clock) { const j = G.jobs.splice(i, 1)[0]; j.fn(); }
  if (G.mode !== 'menu') { updatePlayer(dt); updateZones(dt); updateDay(dt); }
  updateTrees(dt); updateFlyers(dt); updateNpcs(dt); updateRabbits(dt); updateSteps(dt); updateWorld(dt);
  updateCustomers(dt); updateHelper(dt); updateBelt(dt); updateSaw(dt); updateBuild(dt); updateAct3(dt); updateAct4(dt);
  for (const z of Object.values(Z)) { z.tile.m.visible = z.active; if (z.active) paintTile(z); }
  if (bubbleT > 0) { bubbleT -= dt; if (bubbleT <= 0) $('bubble').hidden = true; }
  updateCamera(dt); updateHud();
}

/* ================= Kamera ve gösterge ================= */
const camPos = new V3(0, 30, 30), camLook = new V3();
// Dik ekran: tüm kamp genişliği sığsın diye daha geniş açı ve biraz daha yukarıdan bakış.
const CAM_P = { off: new V3(0, 34, 15), follow: .2, cz: 0, fov: 55 };
function updateCamera(dt) {
  const portrait = innerHeight > innerWidth;
  if (G.mode === 'menu') {
    G.orbit += dt * .07;
    const r = portrait ? 30 : 24, tgt = new V3(Math.sin(G.orbit) * r, portrait ? 27 : 19, Math.cos(G.orbit) * r);
    camPos.lerp(tgt, 1 - Math.exp(-dt * 2)); camLook.lerp(new V3(2, 0, 0), 1 - Math.exp(-dt * 2));
  } else {
    // Dik ekranda kamera kampın ortasına yaslanır: kamp içinde oyuncunun ancak bir kısmını izler,
    // böylece çitin iki yanı ve kenardaki tezgâhlar ekranda kalır. Çitin dışına çıkınca oyuncuyu tam izler.
    const off = portrait ? CAM_P.off : new V3(0, 17, 12);
    const s = portrait ? CAM_P.follow : 1, lx = P.x - (1 - s) * clamp(P.x, -CAMP, CAMP), lz = P.z - (1 - s) * clamp(P.z - CAM_P.cz, -CAMP, CAMP);
    camPos.lerp(new V3(lx, 0, lz).add(off), 1 - Math.exp(-dt * 5)); camLook.lerp(new V3(lx, .8, lz), 1 - Math.exp(-dt * 6));
  }
  camera.position.copy(camPos); camera.lookAt(camLook);
  // Sis kameradan uzaklığa göre: yakındaki her şey net, yalnız uzak orman yumuşar.
  const cd = camPos.distanceTo(camLook); scene.fog.near = cd + 8; scene.fog.far = cd + 42;
  const c = G.mode === 'menu' ? new V3(2, 0, 0) : new V3(P.x, 0, P.z);
  sun.position.set(c.x - 10, 26, c.z + 12); sun.target.position.copy(c);
}
let hudKey = '';
function updateHud() {
  if (G.mode === 'menu') return;
  const w = count('wood'), pl = count('plank'), f = count('fish'), b = count('big'), met = needsMet(), c = CC(), dc = dayCfg();
  const key = [w, pl, f, b, P.incoming, capNow(), Z.ocak.have >= Z.ocak.need && !Z.ocak.lighting, Z.ocak.have, sleepOK(), Z.kiler.active, Z.kiler.have >= Z.kiler.need, G.day, G.dayIdx, G.timed,
    met && G.mode === 'play', dc.flakes, G.coins, !!H.npc, H.delivered, Z.depo.have, JSON.stringify(G.built), Z.taslik.have, LOST.rescued, SOBA.map(x => x.built).join(), Z.ambar.have, count('wheat'), count('bread'), count('smoked'), count('stone')].join();
  if (key !== hudKey) {
    hudKey = key;
    const bag = $('bag'); bag.innerHTML = '';
    const it = (icon, n) => { const s = el('span', 'it'), i = el('img'); i.src = ICON[icon]; s.append(i, el('b', '', String(n))); return s; };
    bag.append(it('log', w));
    if (c.saw || pl) bag.append(it('plank', pl));
    if (c.quarry || count('stone')) bag.append(it('stone', count('stone')));
    if (c.farm || count('wheat')) bag.append(it('wheat', count('wheat')));
    if (c.bakery || count('bread')) bag.append(it('bread', count('bread')));
    if (c.smoke || count('smoked')) bag.append(it('smoked', count('smoked')));
    if (G.ch >= 2 || f) bag.append(it('fish', f));
    if (G.ch >= 2 || b) bag.append(it('big', b));
    const cap = el('span', 'cap'); for (let i = 0; i < capNow(); i++) cap.append(el('i', i < P.stack.length + P.incoming ? 'on' : '')); bag.append(cap);
    const coins = $('coins'); coins.hidden = !(c.market || c.coins || G.coins); coins.innerHTML = ''; coins.append(it('coin', G.coins));
    const nd = $('needs'); nd.innerHTML = '';
    const need = (icon, ok, txt) => { const s = el('span', 'it' + (ok ? ' ok' : '')), i = el('img'); i.src = ICON[icon]; s.append(i); if (txt) s.append(el('b', 'small', txt)); s.append(el('span', 'mk')); return s; };
    if (strict()) { const s2 = el('span', 'it'), i2 = el('img'); i2.src = ICON.fire; s2.append(i2, el('b', 'small', String(Z.ocak.have))); nd.append(s2); }
    else nd.append(need('fire', Z.ocak.have >= Z.ocak.need && !Z.ocak.lighting));
    if (Z.kiler.active) nd.append(need('fish', Z.kiler.have >= Z.kiler.need));
    if (c.house) nd.append(need('house', !!G.built[c.house.id]));
    if (c.helperGoal) nd.append(need('helper', H.delivered >= c.helperGoal, `${Math.min(H.delivered, c.helperGoal)}/${c.helperGoal}`));
    if (c.depotGoal) nd.append(need('depot', Z.depo.have >= c.depotGoal, `${Math.min(Z.depo.have, c.depotGoal)}/${c.depotGoal}`));
    if (c.coinGoal) nd.append(need('coin', G.coins >= c.coinGoal, `${Math.min(G.coins, c.coinGoal)}/${c.coinGoal}`));
    if (c.frost) { const hs = housesNow().length, cold = coldHouses().length; nd.append(need('stove', !cold, `${hs - cold}/${hs}`)); }
    if (c.lost) nd.append(need('helper', LOST.rescued));
    if (c.bridge) nd.append(need('bridge', !!G.built.kopru));
    if (c.stoneGoal) nd.append(need('stone', Z.taslik.have >= c.stoneGoal, `${Math.min(Z.taslik.have, c.stoneGoal)}/${c.stoneGoal}`));
    if (c.wheatGoal) nd.append(need('wheat', Z.ambar.have >= c.wheatGoal, `${Math.min(Z.ambar.have, c.wheatGoal)}/${c.wheatGoal}`));
    for (const id of Object.keys(c.builds || {})) nd.append(need(id === 'kule' ? 'tower' : id === 'sofra' ? 'feast' : 'house', !!G.built[id]));
    $('sunbar').hidden = !G.timed; $('dayLbl').textContent = G.timed ? `Gün ${G.day}` : '';
    const wx = $('wx'); wx.innerHTML = ''; wx.append(el('span', '', 'Bu gece'));
    for (let i = 0; i < dc.flakes; i++) { const im = el('img'); im.src = ICON.flake; wx.append(im); }
    if (c.days && G.dayIdx < c.days.length - 1) {
      const nx = c.days[G.dayIdx + 1]; wx.append(el('span', 'sep', 'Yarın'));
      if (nx.storm) { const im = el('img'); im.src = ICON.storm; wx.append(im); }
      for (let i = 0; i < nx.flakes; i++) { const im = el('img'); im.src = ICON.flake; wx.append(im); }
    }
    $('helperBtn').hidden = !H.npc;
    $('sleepBtn').hidden = !sleepOK();
  }
  if (G.timed) {
    const p = clamp(1 - G.dayLeft / dayLen(), 0, 1);
    $('sunFill').style.width = (p * 100) + '%'; $('sunDot').style.left = (p * 100) + '%';
    $('sunbar').classList.toggle('eve', p > .8);
  }
}
/* ================= Döngü ================= */
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.fov = w < h ? CAM_P.fov : 34; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (!document.hidden && !G.manual) { update(dt); renderer.render(scene, camera); }
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) { Snd.stopVoice(); if (G.mode === 'play') pauseMenu(); } });

$('owlImg').src = ICON.owl; $('moonImg').src = ICON.moon; $('nightMoon').src = ICON.moon;
$('owlBtn').onclick = () => { Snd.unlock(); hint(); };
$('bubble').onclick = () => { Snd.unlock(); Snd.replay(); bubbleT = 6; };
$('sleepBtn').onclick = () => { Snd.fx('tap'); if (sleepOK()) startNight(); };
$('menuBtn').onclick = () => { Snd.fx('tap'); pauseMenu(); };
$('helperBtn').onclick = () => { Snd.fx('tap'); openProgram(); };
$('helperImg').src = ICON.helper;
G.ch = 2; resetTrees(); buildPlayer(); setFire(true); renderMenu();
if (document.fonts && document.fonts.load) document.fonts.load('800 60px "Baloo 2"').then(() => { for (const z of Object.values(Z)) z.tile.key = ''; }).catch(() => {});
requestAnimationFrame(frame);

// Test ve hata ayıklama kapısı (oyunu etkilemez)
window.__kamp = {
  G, Z, P, T, CFG, H, BELT, SAW, MACH, ROCKS, SOBA, LOST, BOAT, PLOTS, BAKE, SEASON, coldHouses, customers, startChapter, toMenu, startNight, needsMet, priceOf, nextCard, openProgram,
  begin() { closeModal(); begin(); },
  manual(on) { G.manual = on; },
  step(sec, draw = true) { for (let t = 0; t < sec; t += 1 / 30) update(1 / 30); if (draw) renderer.render(scene, camera); },
  goto(x, z) { G.auto = { x, z }; }, stop() { G.auto = null; },
  nearestTree: (x, z) => { let b = -1, bd = 1e9; for (let i = 0; i < T.n; i++) { if (T.st[i]) continue; const d = Math.hypot(T.x[i] - x, T.z[i] - z); if (d < bd) { bd = d; b = i; } } return b < 0 ? null : { i: b, x: T.x[b], z: T.z[b] }; },
  get pier() { return pierBuilt; }, get fire() { return fireOn; },
  info: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, trees: T.n, geo: renderer.info.memory.geometries, tex: renderer.info.memory.textures }),
  lastVoice: () => Snd.last,
  PILE, PLATES3, CAM_P, resize, strict, sleepOK, wasteNow, get fireLvl() { return fireLvl; },
};
})();
