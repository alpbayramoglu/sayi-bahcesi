# Kar Kampı

Sönük bir kampı yakıp misafirleri doyurma, sonra kampı bir üretim düzenine dönüştürme oyunu. Tek seviye var. Zorluk miktardan değil karardan gelir.

Henüz Sayı Bahçesi'nin menüsüne ve `sw.js` önbelleğine bağlı değil. Bölümler sırayla açılır; hepsini açmak için adrese `?hepsi` ekle. Yerelde denemek için:

```
cd ~/sayi-bahcesi && python3 -m http.server 8000
# tarayıcıda: http://localhost:8000/kamp/
```

## Ocak kuralı
Bölüm 1–3 öğrenme aşamasıdır: ocak karesinde her kar tanesinin altında iki odun yuvası var, ocak gerektiği kadar odun alır, dolunca tik çıkar.
Bölüm 4'ten itibaren ocak cevabı söylemez. Karede yalnız kar taneleri ve ocaktaki odun sayısı durur, tik çıkmaz. Ocak fazla odunu da alır, fazlası duman olup boşa yanar. Ateş gereken odun kadar büyür. Baykuş ve akşam uyarısı ocağın yeterli olup olmadığını söylemez. Uyu düğmesi yalnız öğleden sonra görünür ve ocağa bakmaz. Sabah ekranında boşa yanan odun ve yarısı boşa giden yemek bilgi olarak yazılır ve okunur; yıldızı etkilemez. Odun ve balık 0,5 saniyede bir bırakılır.
Ocağın sağ önündeki odun yığını, ocağa konan odunla büyür; boş yer ya da çerçeve çizilmez, fazla odun yığına değil ateşe gider. Her misafirin önünde bir tabak durur, konan yemek tabakta görünür (büyük balık ve ekmek iki tabağa yarım yarım bölünür).
Kilerin rafı odunluk gibi çalışır: tabaklar dolunca fazla yemek rafa konur (en fazla 8), sırtta yemek yokken kilere gelince raftan alınır. Raf gün boyunca durur, yeni bölümde boşalır. Katı bölümlerde güneş çubuğunun ortasındaki ay, Uyu düğmesinin ne zaman açılacağını gösterir.
Yardımcı da fazla odunu ocağa koyar. Ne kadar taşıyacağını "2 kez" ve "3 kez" kartları belirler: kartın önündeki sıra toplam o kadar çalışır.

## Bölümler

1. **Varış:** Ocağı 6 odunla yak. Gece ihtiyacı hava durumundan okunur: her kar tanesi 2 odun.
2. **İlk Komşu:** Süre yok, hazır olunca uyunur. 4 tabak. Küçük balık bir tabağı (2 odun), büyük balık iki tabağı (3 odun) doldurur. Büyük balık az. Tek tabak kalmışken büyük balık verilirse yarısı boşa gider. Gün süresi Bölüm 4–8'de 7 dakika, sonrasında 6 dakika; süreli günlerde öğleden sonra fiyatlar 1 odun artar.
3. **Buz Gölü:** Süre yok. 5 tabak, 3 kar tanesi. İskele (8 odun) kurulursa buz deliğinden balık tutulur, her üçüncü balık büyük çıkar. Takas da açık.
4. **Pazar:** Müşteriler sipariş verir (odun 1, küçük balık 3, büyük balık 5 altın). Sipariş verilince oyun durur, çocuk toplamı ya da para üstünü seçer. İlk denemede doğruysa 1 altın bahşiş. Altınla ev (12), keskin balta (6, ağaç 2 vuruşta düşer) ya da büyük çerçeve (8, sırtta 7 eşya) alınır. Hepsine birden yetmez. Hedef: ev.
5. **Fırtına:** İki gün. Gün 1 normal, ekranda yarının havası görünür. Gün 2 fırtına: kapılar karla kapanır, gece 4 kar tanesi (8 odun). Odunluk 16 odun alır. Elde odunla girilirse odun bırakılır, boş elle girilirse odun alınır.
6. **Yardımcı:** Yardımcıya kartlarla sıra verilir (ormana git, ocağa götür, odunluğa götür, tekrarla). Tekrarla kartı yoksa bir tur yapıp durur. Hedef: yardımcı 6 odun taşısın.
7. **Bant:** 6 odunla ormandan odunluğa bant kurulur. Bandın başına en fazla 8 odun yığılır. Bant yavaşsa yığın büyür ve baykuş darboğazı söyler. Bant hızlandırma 8 altın. Hedef: akşama odunlukta 12 odun.
8. **Testere:** Bant testereye gider, testere her kütükten 2 tahta çıkarır (2,6 saniye, hızlı testereyle 1,2). Tahta yığını 10'da dolar, dolunca bant da durur. Hedef: 10 tahtalık ev.

9. **Tütsühane:** Balık tütsülenir (3 saniye). Tütsülü balık bir tabak doldurur, pazarda 6 altın eder. Hedef: akşama 15 altın ve dolu tabaklar.
10. **Soğuk Dalgası:** Üç soba yeri var, her birinin sıcak halkası (yarıçap 3,5) yerde görünür. Soba 4 odun. Evlerin üstünde kar tanesi (soğuk) ya da alev (sıcak) işareti var. En az sobayla bütün evleri ısıtmak gerekiyor: A yeri çadırı ve evi birlikte ısıtır, D yeri ikinci evi.
11. **Kayıp Yolcu:** Yolcu ormanda rastgele bir yerde. Kardaki ayak izleri (aralarda boşluklarla) ona götürür. Baykuşa dokununca yön söyler. Bulunan yolcu oyuncuyu izler, kampa girince yerine geçer. Tabak sayısı 6.
12. **Köprü:** Kuzeydeki uçurum yalnız köprüden geçilir. Köprü 12 tahta. Karşıdaki 6 kaya balta ile kırılır, her biri 2 taş verir. Hedef: kamptaki taşlıkta 4 taş.
13. **Taş Soba:** Halkalar küçüldü (3,2). Soba 2 taş ve 2 odun ister. B yeri artık evi ısıtmıyor.
14. **Büyük Soğuk:** Üç gün: 3, 4 ve 5 kar tanesi. İkinci gün fırtına, üçüncü gece soğuk dalgası. Odunluk 24.
15. **Buzlar Eriyor:** Bahar: çimen, yeşil ağaçlar, su. İskelenin ucundaki kayık göl ortasına açılır, 2,2 saniyede bir balık tutar, her ikinci balık büyüktür, sırt dolunca döner.
16. **Tarla:** Doğu kapısı dışında üç tarla. Tohum 2 altın, büyüme 45 saniye, hasat 3 buğday. Hedef: ambarda 6 buğday.
17. **Fırın:** Tüccar yok, 8 tabak. Fırın 2 buğday + 1 odunla 4 saniyede ekmek yapar, ekmek iki tabak doldurur.
18. **Hasat Pazarı:** Pazar, tarla, fırın ve tütsühane birlikte. Hedef: 25 altın.
19. **Kasaba:** Yeni ev 8 tahta + 4 taş, gözetleme kulesi 6 tahta + 2 taş.
20. **Bahar Şenliği:** Şenlik sofrası 2 ekmek, 2 tütsülü balık ve 1 büyük balık ister. Bitince havai fişek ve kapanış.

Gün bitince ihtiyaç karşılanmamışsa ceza yok: "Dün gece üşüdük" denir, eksikler gösterilir, aynı gün yeniden oynanır. Kurulanlar, odunluk, altın ve sırttakiler kalır. Yıldız: 3 eksi üşünen gece (en az 1).

Sayılar `game.js`'in başındaki `CFG` tablosunda.

## Dosyalar

- `game.js`: oyun. Bütün modeller ve dokular kodla üretilir (Three.js r128, `../yaris3d/three.min.js`).
- `audio/`: Siri Voice 2 (Kaan) sesiyle sesli yönlendirmeler, her bölümün giriş metni (`ch1`–`ch20`) ve eksik listesinin cümle parçaları (`e_*`). Sayılar aynı sesle `nums/n0–n100` kayıtlarından okunur. `tools/make-audio.sh` ikisini birlikte üretir; Siri sesi adıyla seçilemediği için önce System Settings → Accessibility → Spoken Content → System Voice → Siri Voice 2 seçilir. Betik metinleri `game.js` içindeki `LINES` ve `CHAPTERS` ile aynı tutar; metin değişince yeniden çalıştır.
- Kayıt: `localStorage` `kamp.v1` (mont rengi, bölüm yıldızları, ses).
- Test kapısı: `window.__kamp` (bölüm başlatma, adım adım ilerletme, otomatik yürütme, iç durum).
