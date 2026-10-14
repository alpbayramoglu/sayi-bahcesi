# Sayı Bahçesi

6 yaş için matematik oyunu: toplama, çıkarma, sayı dizisi, boşluk doldurma ve karışık mod. Kolay (0–5), Orta (0–10), Zor (0–20) seviyeleri var. Soru 🔈'e dokununca Türkçe okunur; yanlış yapılan sorular aralıklı olarak tekrar gelir.

Ses, macOS'taki Yelda sesiyle önceden üretilmiş parçalardan (`audio/`) çalınır; tarayıcının sesli okuması kullanılmaz. Yeni bir cümle eklersen `tools/make-audio.sh` içindeki listeye ekleyip betiği yeniden çalıştır.

Derleme adımı yok. Yerelde denemek için: `python3 -m http.server 8000`

Her yayında `sw.js` içindeki `CACHE` adını artır (`sayi-bahcesi-v2` gibi); artırmazsan telefon eski sürümde kalır.

Yazı tipi: Baloo 2 (SIL OFL 1.1, `fonts/OFL-baloo2.txt`).
