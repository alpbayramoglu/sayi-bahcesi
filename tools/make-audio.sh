#!/usr/bin/env bash
# Oyundaki ses parçalarını macOS'taki Yelda sesiyle üretir.
# Çıktı: audio/<ad>.mp3 ve service worker'ın önbelleğe alacağı audio/clips.js listesi.
# Kullanım: ./tools/make-audio.sh   (macOS, `say` ve `ffmpeg` gerekir)
set -euo pipefail
cd "$(dirname "$0")/.."

VOICE="Yelda"
RATE=165   # dakikada kelime; varsayılandan biraz yavaş, çocuk için
OUT="audio"
mkdir -p "$OUT"
rm -f "$OUT"/*.mp3

# ad|okunacak metin
CLIPS=(
  "arti|artı" "eksi|eksi" "kac|kaç" "kac_eder|kaç eder?" "eder|eder." "bos|boş"
  "aferin|Aferin!" "harika|Harika!" "supersin|Süpersin!" "cok_guzel|Çok güzel!" "bravo|Bravo!"
  "mukemmel|Mükemmel!" "cok_iyi|Çok iyi!" "guzel_calistin|Güzel çalıştın!"
  # şekil oyunları: soru ve ipucu
  "bosluga|Boşluğa hangisi gelir?" "ayna|Aynadaki hâli hangisi?" "farkli|Hangisi farklı?"
  "tekrar|Tekrar eden parçaya bak." "ayna_cizgi|Ortadaki çizgi bir ayna." "yan_alt|Yan yana ve alt alta bak."
  "sekline_bak|Şekline bak." "rengine_bak|Rengine bak." "boyuna_bak|Büyüklüğüne bak."
  "satir_sutun|Satırlara ve sütunlara bak." "desen_bak|Desenin geri kalanına bak." "golge|Gölgesi hangisi?"
  "dis_cizgi|Parçaların yerine bak." "onden|Önden bakınca nasıl görünür?" "sagdan|Sağdan bakınca nasıl görünür?"
  "ustten|Üstten bakınca nasıl görünür?" "kule_bak|Her sıradaki en uzun kuleye bak." "ustten_ipucu|Küplerin tepelerine bak."
  "ayna_yakin|Aynaya yakın olan, yansımada da aynaya yakın olur." "iliski|Birinciye ne olduysa, üçüncüye de o olur. Soru işaretine hangisi gelir?"
  "ne_degisti|İlk ikisinde ne değişti?"
  # bahçe
  "yeni_arkadas|Bahçene yeni bir arkadaş geldi!"
  "yeni_akvaryum|Akvaryumuna yeni bir arkadaş geldi!" "yeni_orman|Ormanına yeni bir arkadaş geldi!"
  "acildi_akvaryum|Yaşasın! Akvaryum açıldı!" "acildi_orman|Yaşasın! Orman açıldı!"
)
for n in $(seq 0 100); do CLIPS+=("n$n|$n"); done
# Sayıyı Dinle: binler (t23 → "yirmi üç bin") ve yüzler (h4 → "dört yüz"); rakamla verilince Yelda doğal okur
for n in $(seq 1 99); do CLIPS+=("t$n|${n}000"); done
for n in $(seq 1 9); do CLIPS+=("h$n|${n}00"); done

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
# Baştaki ve sondaki sessizliği kırp ki parçalar art arda doğal aksın.
TRIM="silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"

names=()
for c in "${CLIPS[@]}"; do
  name="${c%%|*}"; text="${c#*|}"
  say -v "$VOICE" -r "$RATE" -o "$tmp/$name.aiff" "$text"
  ffmpeg -loglevel error -y -i "$tmp/$name.aiff" -af "$TRIM" -ac 1 -ar 22050 -codec:a libmp3lame -b:a 48k "$OUT/$name.mp3"
  names+=("\"$name\"")
done

printf '// tools/make-audio.sh tarafından üretilir, elle düzenleme.\nself.CLIPS = [%s];\n' "$(IFS=,; echo "${names[*]}")" > "$OUT/clips.js"
echo "${#names[@]} parça üretildi → $OUT/"
