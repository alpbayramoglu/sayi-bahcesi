# Sayı Bahçesi

6 yaş için matematik oyunu. Sayılar: toplama, çıkarma, sayı dizisi, boşluk doldurma ve karışık mod. Şekiller: örüntü, ayna (simetri), farklı olan ve şekil sudoku. Kolay, Orta ve Zor seviyeleri var. Soru 🔈'e dokununca Türkçe okunur; yanlış yapılan sorular aralıklı olarak tekrar gelir.

Kazanılan her 3 yıldızda **Bahçem**'e yeni bir arkadaş gelir (🌻 düğmesi; yeni arkadaş varken üstünde kırmızı nokta yanar). Üst üste 3, 6, 9 soruyu ilk seferde bilince 🔥 seri kutlaması çıkar.

Ses, macOS'taki Yelda sesiyle önceden üretilmiş parçalardan (`audio/`) çalınır; tarayıcının sesli okuması kullanılmaz. Yeni bir cümle eklersen `tools/make-audio.sh` içindeki listeye ekleyip betiği yeniden çalıştır.

Derleme adımı yok. Yerelde denemek için: `python3 -m http.server 8000`

Her yayında iki yerde sürümü artır, ikisi aynı olmalı: `sw.js` içindeki `CACHE` (`sayi-bahcesi-v4` gibi) ve `app.js` içindeki `VERSION` (sağ alt köşede görünen numara). `CACHE` artmazsa telefon eski sürümde kalır.

Yazı tipi: Baloo 2 (SIL OFL 1.1, `fonts/OFL-baloo2.txt`).

## Oyun, dükkân ve görevler

- **Kartopu Savaşı** (`savas/`): War of Blocks bu uygulamanın içinde. Her maç bir 🎟️ bilet harcar.
- **Bilet:** Her matematik turu 1 bilet verir, en fazla 3 birikir. Ebeveyn görevleri bu sınıra takılmadan bilet verebilir.
- **Altın 🪙:** Tur başına yıldız kadar; Zor seviyede +1, yeni rekorda +1. Dükkânda su balonu (2), boya küpü (3), balık (4) alınır. Alınan eşyalar savaşta penguenin çantasına gelir; önce bölümün bedava verdikleri, sonra çantadakiler harcanır.
- **Yıldız ★:** Hiç harcanmaz, Bahçem'i büyütür.
- **Ebeveyn paneli (⚙️):** 4 haneli PIN ile açılır (unutulursa yetişkin sorusuyla sıfırlanır). Görev türleri: bir kez, N gün üst üste, haftada N kez. Çocuk "Yaptım!" der, ebeveyn onaylar; hedef dolunca ödül verilir ve çocuk ana sayfaya dönünce kutlama görür. Panelde yedek kodu alma / geri yükleme var; Safari verileri silinirse ilerleme buradan geri gelir.
- Her şey cihazın kendi kaydında (localStorage) durur; sunucu yok. PIN bir çocuk kilidi, şifreleme değil.

## Kartopu Savaşı

- **Bölümler:** 12 bölüm, 4 ada. Çimen ve Kar adaları tek ekran; Kale Adası (72 sütun, taş kaleler) ve Korsan Koyu (90 sütun, gemiler) ekrandan geniştir. Kamera sırası gelen karakteri ve mermiyi izler; kenardaki oklarla kaydırılır, üstteki mini haritaya dokununca oraya gider. 9. bölüm 2'ye 2, 11. bölüm 2'ye 2, 12. bölüm 3'e 3.
- **2 oyuncu:** Çimen, Kar, Kale, Korsan ve Sürpriz haritaları; takım başına 1, 2 ya da 3 karakter.
- **Eşyalar (23):** Atılanlar (kartopu, su balonu, boya küpü, balık, dev kartopu, zıp zıp top, karpuz, bumerang, pasta, gıdıklama tüyü, hapşırık biberi, çalar saat), sayılılar (zıp zıp kurbağa, koşan tavuk, böcek uçağı, meteor yağmuru, ışınlanma, uçan balon, kardan duvar, sayı köprüsü), savunma (şemsiye, kalp iksiri, paraşüt). 🎒 çantadan seçilir.
- **Sayı cetveli:** Haritanın altında her 3 blok bir sayı. Sayılı eşyalarda çocuk bir sayı seçer: böcek uçağı ve uçan balonda rüzgâr da sayıdır (rüzgâr +2 ise böcekler seçilen sayının 2 sağına düşer), kurbağada kaç zıplama, duvarda kaç blok gibi.
- **Bilgisayar:** Ulaşamadığı rakibe yürür; elinde böcek uçağı varsa onu kullanır. İlk atışlarda ve çocuğun tek kalbi kaldığında daha çok ıskalar.
