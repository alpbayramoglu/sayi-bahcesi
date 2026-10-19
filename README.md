# Sayı Bahçesi

6 yaş için matematik oyunu. Sayılar: toplama, çıkarma, sayı dizisi, boşluk doldurma ve karışık mod. Şekiller: örüntü, ayna (simetri), farklı olan ve şekil sudoku. Kolay, Orta ve Zor seviyeleri var. Soru 🔈'e dokununca Türkçe okunur; yanlış yapılan sorular aralıklı olarak tekrar gelir.

Kazanılan her 3 yıldızda **Bahçem**'e yeni bir arkadaş gelir (🌻 düğmesi; yeni arkadaş varken üstünde kırmızı nokta yanar). Üst üste 3, 6, 9 soruyu ilk seferde bilince 🔥 seri kutlaması çıkar.

Ses, macOS'taki Yelda sesiyle önceden üretilmiş parçalardan (`audio/`) çalınır; tarayıcının sesli okuması kullanılmaz. Yeni bir cümle eklersen `tools/make-audio.sh` içindeki listeye ekleyip betiği yeniden çalıştır.

Derleme adımı yok. Yerelde denemek için: `python3 -m http.server 8000`

Her yayında iki yerde sürümü artır, ikisi aynı olmalı: `sw.js` içindeki `CACHE` (`sayi-bahcesi-v4` gibi) ve `app.js` içindeki `VERSION` (sağ alt köşede görünen numara). `CACHE` artmazsa telefon eski sürümde kalır.

Yazı tipi: Baloo 2 (SIL OFL 1.1, `fonts/OFL-baloo2.txt`).

## Ana sayfa (v22)

Altta dört sekme var (yatay ekranda solda): **Öğren**, **Oyunlar**, **Bahçem**, **Dükkân**. Üstteki cüzdan bilet (en fazla 3), altın ve yıldızı hep gösterir.
- **Öğren:** Oyna kartı (sıradaki tur), Sayılar ve Şekiller alıştırmaları, Görevlerim kartı.
- **Oyunlar:** 3 yuvalı bilet göstergesi ve iki oyun kartı (Kartopu Savaşı'nda sıradaki bölüm yazar). Bilet yoksa "Tur oyna" düğmesi çıkar. Sekme düğmesinde bilet sayısı görünür.
- Sekme çubuğu alıştırma, tur, sonuç, görevler ve ebeveyn ekranlarında gizlenir.

## Oyun, dükkân ve görevler

- **Kartopu Savaşı** (`savas/`): War of Blocks bu uygulamanın içinde. Her maç bir 🎟️ bilet harcar.
- **Blok Rallisi** (`yaris/`): Araba yarışı. Her yarış bir 🎟️ bilet harcar (Sırayla modunda iki tur tek bilet).
- **Blok Rallisi 3D** (`yaris3d/`): Arkadan kameralı, gerçekçi görünümlü 3D yarış. Her yarış bir 🎟️ bilet harcar.
- **Bilet:** Her matematik turu 1 bilet verir, en fazla 3 birikir. Ebeveyn görevleri bu sınıra takılmadan bilet verebilir.
- **Altın 🪙:** Matematik turunda yıldız başına 2; Zor seviyede +2, yeni rekorda +1. Kartopu Savaşı'nı kazanınca 3 + yıldız, kaybedince 1, 2 oyunculu maçta 2. Dükkânda su balonu (1), boya küpü (2), balık (3) gibi eşyalar alınır. Alınan eşyalar savaşta penguenin çantasına gelir; önce bölümün bedava verdikleri, sonra çantadakiler harcanır.
- **Yıldız ★:** Hiç harcanmaz, Bahçem'i büyütür.
- **Ebeveyn paneli (⚙️):** 4 haneli PIN ile açılır (unutulursa yetişkin sorusuyla sıfırlanır). Görev türleri: bir kez, N gün üst üste, haftada N kez. Çocuk "Yaptım!" der, ebeveyn onaylar; hedef dolunca ödül verilir ve çocuk ana sayfaya dönünce kutlama görür. Panelde yedek kodu alma / geri yükleme var; Safari verileri silinirse ilerleme buradan geri gelir.
- Her şey cihazın kendi kaydında (localStorage) durur; sunucu yok. PIN bir çocuk kilidi, şifreleme değil.

## Blok Rallisi

- **Oynanış:** Yandan görünüm, 3 şerit; araba kendi gider. Yukarı / aşağı ile şerit değişir, büyük düğme eşyayı kullanır. Aynı şeritte öndekine çarpan arkasında kalır.
- **Modlar:** Tek kişi (3 bilgisayar rakip), İki kişi (aynı anda, aynı ekran: sol kenar Penguen, sağ kenar Kedi; 2 bilgisayar rakip), Sırayla (önce biri sürer, sonra öteki onun saydam "hayalet" arabasına karşı sürer, kısa süre kazanır).
- **İki kişide kamera:** İki arabanın ortasını izler, aralarındaki mesafe açıldıkça uzaklaşır. Geride kalan ekrandan düşecek olursa öndekinin yanına ışınlanır ("YETİŞ!") ve kısa bir süre yavaş gider.
- **Sayı kapısı:** Her yarışta 4 kez yolun üstünde soru çıkar. Soru kapıya varmadan yaklaşık 11 saniye önce ekrana gelir; kapıdan önceki bölgede herkes yavaşlar. O bölgede her şerit kendi rengine boyanır ve sayısı asfalta yazılır, sağdaki tabelalar hangi şeritte hangi sayının olduğunu gösterir (toplama ya da çıkarma, zorluk Sayı Bahçesi'ndeki seviyeyi izler: Kolay 0–5, Orta 0–10, Zor 0–20). Doğru sayının şeridinden geçen turbo alır; yanlış şeritte ceza yok, doğru cevap ekranda gösterilir.
- **Eşyalar (? kutusundan):** ⚪ Kartopu (en yakın öndekine gider, kaydırıp yavaşlatır), 💧 Su balonu (arkaya birikinti bırakır), 🚀 Roket (2 saniye turbo), ☂️ Şemsiye (bir eşyayı ya da birikintiyi savuşturur). Geride kalan daha çok roket bulur. Pistte ayrıca rampa, hız oku ve su birikintisi var.
- **Pistler:** Çiçek Vadisi, Buz Tepesi, Kale Yolu (gün batımı, havai fişek), Korsan Koyu (tahta iskele, uzakta top atan gemi).
- **Altın:** Tek kişide sıraya göre 5 / 4 / 3 / 2; İki kişi ve Sırayla'da 5.
- **Garaj:** Penguenin ve kedinin arabası için boya (5–10 altın) ve tekerlek (Alev 7 altın). Yalnızca görünüş, hızı değiştirmez. Seçimler kayıtta `race` altında durur.
- **Klavye:** Tek kişi ve Sırayla'da ↑ ↓ ve boşluk. İki kişide 1P W S D, 2P ↑ ↓ ←.

## Blok Rallisi 3D (v23)

- **Oynanış:** Arabanın arkasından kamera; 6 araba, 4 şerit, 2 tur (yaklaşık 2 dakika). Ekranın sol / sağ yarısına basılı tutmak direksiyon; klavyede ← →, boşluk kutu eşyası, 1 2 3 çanta eşyaları. Oyuncu en arkadan başlar. Rakipler oyuncunun yakınında kalır (öndeyse biraz yavaşlar, gerideyse hızlanır), yarış hep çekişmeli.
- **Sayı köprüsü:** Turda 4 kafes çelik köprü; her şeridin üstünde LED tabelada bir sayı, köprüden önceki 110 metrede şeritler renkli ve sayılar asfalta yazılı. Soru köprüye 190 metre kala ekrana gelir ve bölgede herkes yavaşlar (toplam yaklaşık 7 saniye düşünme süresi). Doğru şerit turbo verir. Zorluk Sayı Bahçesi'ndeki seviyeyi izler.
- **Pist:** 4 rampa (uç!), koni grupları (yavaşlatır), çamur (yavaşlatır), yağ (döndürür). Yolda iki sıra ? kutusu var (eski 3D denemesinin yarısı); kutudan turbo, füze, yağ, kalkan, kartopu ya da koni çıkar. Geride kalan daha çok turbo ve füze bulur.
- **Çanta ve dükkân:** Dükkânın "Yarış" bölümünden altınla alınan eşyalar (kayıtta `inv.r_*`). Yarıştan önce çantaya en fazla 3 tane konur; yalnızca kullanılan eşya harcanır, kullanılmayan stokta kalır. Son çanta seçimi `race3dBag` altında hatırlanır.
  - 🚀 Hedef Füzesi (4): Önündeki arabalardan birini sıra numarasıyla seçersin ("3. sıradakini vur"); seçerken oyun durur.
  - 🛢️ Yağ Birikintisi (2), 🚧 Koni Seti (2): Arkana bırakılır.
  - ⚪ Kartopu (3): Aynı şeritteki öndekine düz gider. ⚡ Yıldırım (7): Öndeki bütün arabalar yavaşlar.
  - 🛡️ Kalkan (3): İlk saldırıyı yutar (20 saniye). 🛞 Kaymaz Lastik (3): Bir tur boyunca yağ ve çamur işlemez. 🔥 Turbo (3): 3 saniye.
  - 🚦 Süper Start (2): Çantada olması yeter; yeşil ışıkta kendiliğinden turbo.
- **Rakipler:** Kutu eşyalarını ve başta rastgele verilen birer çanta eşyasını kullanırlar (öndeki varsa füze, arkadaki varsa yağ / koni).
- **Altın:** Sıraya göre 5 / 4 / 3 / 2 / 1 / 1.
- **Görüntü:** Three.js r128 (`yaris3d/three.min.js`, MIT) yerel kopyadan, çevrimdışı çalışır. Fiziksel tabanlı malzemeler (vernikli boya, metal jant), gökyüzü yansıması, güneş gölgesi, sis, ACES ton eşleme; asfalt, çim, çakıl dokuları kodla üretilir. Araba parçaları malzemeye göre birleştirilir (çizim çağrısı az). Telefon yavaş kalırsa önce çözünürlük, sonra gölge kalitesi kendiliğinden düşer. Yazı tipi Exo 2 (SIL OFL, `fonts/OFL-exo2.txt`), Türkçe harfli küçük alt küme.

## Kartopu Savaşı

- **Bölümler:** 12 bölüm, 4 ada. Çimen ve Kar adaları tek ekran; Kale Adası (72 sütun, taş kaleler) ve Korsan Koyu (90 sütun, gemiler) ekrandan geniştir. Kamera sırası gelen karakteri ve mermiyi izler; kenardaki oklarla kaydırılır, üstteki mini haritaya dokununca oraya gider. 9. bölüm 2'ye 2, 11. bölüm 2'ye 2, 12. bölüm 3'e 3.
- **2 oyuncu:** Çimen, Kar, Kale, Korsan ve Sürpriz haritaları; takım başına 1, 2 ya da 3 karakter.
- **Eşyalar (23):** Atılanlar (kartopu, su balonu, boya küpü, balık, dev kartopu, zıp zıp top, karpuz, bumerang, pasta, gıdıklama tüyü, hapşırık biberi, çalar saat), sayılılar (zıp zıp kurbağa, koşan tavuk, böcek uçağı, meteor yağmuru, ışınlanma, uçan balon, kardan duvar, sayı köprüsü), savunma (şemsiye, güç iksiri, paraşüt). 🎒 çantadan seçilir.
- **Güç çubuğu:** Her karakterin 100 gücü var. Hasar eşyaya göre değişir (kartopu 30, dev kartopu 45, çalar saat 38...) ve patlamanın merkezine yakınlığa göre azalır: kenarda en az %40, doğrudan çarpmada %115. Karpuz dilimleri, böcekler ve meteorlar ayrı ayrı vurur. Suya düşmek 20, yüksekten düşmek 30'a kadar götürür. Güç iksiri +35, sürpriz kutudaki kalp +30.
- **Canlı karakterler:** Penguen ve kedi parça parça çizilir; her parça hedef pozuna yay gibi gider. Nefes alırlar, rakibe dönerler, nişan alırken eşyayı elde tutup kolu gücü kadar geri çekerler, atarken öne savrulurlar. Vurulunca yassılıp geri esner, düşerken kollarını kaldırır, yere basılarak inerler. Kedinin kuyruğu ve kulakları da hareket eder.
- **Kamera:** Sağdaki büyüteçlerle yakınlaş / uzaklaş; en uzakta bütün harita görünür. Patlamalarda yalnızca hafif bir titreme olur.
- **Yeni eşyalar:** 🚀 Hedef füzesi (sayı seç, tam oraya gider, 15), ⛈️ Yıldırım bulutu (sayının üstünde bulut ve yıldırım, 25), 🌪️ Hortum (kaç adım, su ve duvar durdurmaz, 20), 🔄 Yer değiştirme, 🦨 Kokarca (3 tur kalan koku bulutu, 10 + turda 8), 🐝 Arı kovanı (4 arı kovalar, 4 × 6). Kurbağa suya denk gelince nilüfer yaprağına basıp devam eder. Dükkânda her eşyanın kaç güç götürdüğü yazar.
- **v17:** 🧨 Havai fişek (havada patlar, 6 yıldız yağar), 🌋 Yanardağ (5 lav taşı fışkırtır, ilk üçü rakibe doğru), 🐉 Ejderha (sayı seç, ateş püskürür, 30). Boya Küpü, Zıp Zıp Top ve Pasta kalktı; eldekilerin altını geri verilir. Dev Kartopu ve Karpuz 6 altın. 🪂 Paraşüt suya düşeni karaya indirir (su hasarı yok), yalnızca zarar verecek düşüşte açılır. Korsan Koyu simetrik: penguenler sol gemi ve kıyıda, kediler sağda. 2 oyunculu maçta kedi, penguenin çantasının aynısını bedava alır. Farklı Olan: Kolay 6 kart, Orta ve Zor 3×3; önemsiz özellikler de değişir, Zor'da benzer renk ve şekiller.
- **v18:** 🔊 Sayıyı Dinle: hoparlöre basınca sayı okunur, şıklardan rakamla yazılışı seçilir (Kolay 1–2 basamak, Orta 3, Zor 4–5; binlik nokta: 12.345). Çeldiriciler ters basamak (23/32), kayan basamak (23/13), sıfır karışıklığı (502/52, 501/5001). İpucu: kaç basamaklı olduğu ve sayının parça parça okunuşu. Ses: Yelda ile t1–t99 ("… bin") ve h1–h9 ("… yüz") parçaları.
- **v19:** Dünyalar: Bahçe (30 arkadaş, 3 yıldızda bir) dolunca 🐠 Akvaryum (20 arkadaş, 5 yıldız), o da dolunca 🌲 Orman (20 arkadaş, 8 yıldız) açılır. Başlıkta dünya sekmeleri; sıradaki kilitli görünür. Akvaryumda balıklar yüzer, yengeçler kumda yürür, sulama yerine yem verilir.
- **Sürpriz kutu:** Uçaktan düşen kutudan güç, eşya ya da 🎯 +1 atış çıkar. +1 atışta aynı karakter sıra karşıya geçmeden bir kez daha atar.
- **Harita ayrıntıları:** Arkada kameradan yavaş kayan dağlar, tepeler, kaleler ve gemiler; zeminde ağaç, çam, palmiye, çalı, çiçek, kaya, kardan adam. Patlamada ağaç devrilir, kardan adam dağılır. Kırmızı işaretli fıçı vurulunca zincirleme patlar ve iki takıma da hasar verir. Suda balıklar sıçrar, gökte kuşlar geçer.
- **Sayı cetveli:** Haritanın altında her 3 blok bir sayı. Sayılı eşyalarda çocuk bir sayı seçer: böcek uçağı ve uçan balonda rüzgâr da sayıdır (rüzgâr +2 ise böcekler seçilen sayının 2 sağına düşer), kurbağada kaç zıplama, duvarda kaç blok gibi.
- **Bilgisayar:** Ulaşamadığı rakibe yürür; elinde böcek uçağı varsa onu kullanır. İlk atışlarda ve rakibin gücü azaldığında daha çok ıskalar.
