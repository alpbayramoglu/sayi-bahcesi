# Sayı Bahçesi

6 yaş için matematik oyunu. Sayılar: toplama, çıkarma, sayı dizisi, boşluk doldurma ve karışık mod. Şekiller: örüntü, ayna (simetri), farklı olan ve şekil sudoku. Kolay, Orta ve Zor seviyeleri var. Soru 🔈'e dokununca Türkçe okunur; yanlış yapılan sorular aralıklı olarak tekrar gelir.

Kazanılan her 3 yıldızda **Bahçem**'e yeni bir arkadaş gelir (🌻 düğmesi; yeni arkadaş varken üstünde kırmızı nokta yanar). Üst üste 3, 6, 9 soruyu ilk seferde bilince 🔥 seri kutlaması çıkar.

Ses, macOS'taki Yelda sesiyle önceden üretilmiş parçalardan (`audio/`) çalınır; tarayıcının sesli okuması kullanılmaz. Yeni bir cümle eklersen `tools/make-audio.sh` içindeki listeye ekleyip betiği yeniden çalıştır.

Derleme adımı yok. Yerelde denemek için: `python3 -m http.server 8000`

Her yayında iki yerde sürümü artır, ikisi aynı olmalı: `sw.js` içindeki `CACHE` (`sayi-bahcesi-v4` gibi) ve `app.js` içindeki `VERSION` (sağ alt köşede görünen numara). `CACHE` artmazsa telefon eski sürümde kalır.

Yazı tipi: Baloo 2 (SIL OFL 1.1, `fonts/OFL-baloo2.txt`).
