# Firmware ESP32 — NO BANJIR!

Panduan ini untuk **ESP32-WROOM-32 development board 30 pin Type-C**, JSN-SR04T
beserta probe/modul, dan rain sensor beserta pelat/modul. Upload utama memakai
**Arduino IDE**. Belum ada backend yang disediakan pada tahap ini; sensor bisa
langsung diuji melalui Serial Monitor tanpa Wi-Fi atau token.

Firmware membaca jarak permukaan air dan kondisi hujan. Tinggi air dan tingkat
Normal/Waspada/Siaga/Bahaya akan dihitung oleh backend sesuai kalibrasi lokasi.
Tidak ada angka ambang keselamatan yang ditanam di firmware.

## 1. Komponen dan sambungan

Siapkan board, sensor, kabel USB **data**, kabel jumper, breadboard/terminal, dan
**lima resistor 1 kΩ ¼ W** untuk pembagi tegangan Echo. Jika yang tersedia baru
satu resistor, tambahkan empat resistor dengan nilai yang sama sebelum merangkai
Echo. Multimeter diperlukan untuk memeriksa tegangan jalur dan keluaran modul.

Jumlah pin dan konektor Type-C tidak menentukan urutan header. Gunakan **label
GPIO pada PCB**, bukan menghitung posisi pin. Foto/pinout vendor board yang tepat
tetap menjadi acuan untuk menemukan pin 5V/VIN, 3V3, dan GND.

Matikan daya ketika memasang atau memindah kabel. Sediakan ground bersama antara
ESP32 dan kedua modul. ESP32 memakai logika 3,3 V; jangan memasukkan sinyal 5 V
langsung ke GPIO.

| Komponen | Pin modul | Sambungan |
| --- | --- | --- |
| JSN-SR04T | VCC | 5 V teratur, dari pin 5V/VIN **yang sudah diverifikasi** |
| JSN-SR04T | GND | GND ESP32 |
| JSN-SR04T | TRIG / RX | GPIO18, untuk mode trigger/echo yang sesuai modul |
| JSN-SR04T | ECHO / TX | Titik tengah pembagi tegangan → GPIO19 |
   | Rain module | VCC | 3V3, **jika varian modul mendukung suplai 3,3 V** |
   | Rain module | GND | GND ESP32 |
   | Rain module | DO / D0 | GPIO27 setelah memastikan level keluarannya aman |
   | Rain module | AO / A0 | Tidak disambungkan |
   | Rain plate | Dua terminal pelat | Dua terminal pelat pada rain module |
| JSN probe | Konektor probe | Konektor probe pada JSN module |

**Pembagi tegangan Echo dengan lima resistor 1 kΩ:**

```text
JSN ECHO ----[1k]----[1k]----+---------- GPIO19 ESP32
                            |
                           [1k]
                            |
                           [1k]
                            |
                           [1k]
                            |
                           GND -------- GND ESP32 / GND JSN
```

Dua resistor di atas titik GPIO membentuk 2 kΩ; tiga resistor ke ground
membentuk 3 kΩ. Untuk Echo HIGH 5 V, nilai nominal di GPIO adalah
`5 × 3 / (2 + 3) = 3 V`. **Satu resistor seri saja tidak membentuk pembagi
tegangan.** Jangan menukar kelompok atas dan bawah. Periksa nilai resistor,
kontinuitas, dan tegangan sinyal sebelum menyambungkannya ke ESP32. Multimeter
biasa bisa menampilkan rata-rata pulsa Echo, sehingga angka rendah pada meter
tidak membuktikan amplitudo puncak sinyal sudah aman; gunakan alat ukur yang
sesuai untuk memeriksa pulsa bila dibutuhkan.

Varian JSN-SR04T berbeda dapat memiliki tegangan kerja, mode, blind zone, dan
ambang TRIG berbeda. Firmware ini memerlukan **mode trigger/echo**, bukan mode
UART otomatis. Jika TRIG 3,3 V tidak memenuhi spesifikasi modul, gunakan level
shifter yang sesuai untuk arah ESP32 → TRIG. Pembagi resistor di atas hanya untuk
arah ECHO → ESP32.

Suplai rain module dengan 3,3 V hanya setelah memeriksa spesifikasi variannya.
Kalau modul wajib 5 V, gunakan konversi level yang sesuai pada DO; jangan
menyambungkan DO 5 V langsung ke GPIO27. LED modul menyala tidak membuktikan
tegangan keluarannya aman. AO tidak dipakai sehingga aplikasi tidak mengklaim
curah hujan atau intensitas dalam mm/jam.

Pada beberapa board, VIN adalah input daya dan belum tentu menyediakan 5 V USB.
Periksa pinout dan tegangan board Anda. Hindari memasukkan dua sumber daya
bersamaan melalui USB dan header tanpa memastikan rancangan power board.
Gunakan catu stabil yang memadai untuk board, Wi-Fi, dan sensor.

## 2. Buka dan upload di Arduino IDE

1. Instal Arduino IDE 2.x. Di **File → Preferences → Additional boards manager
   URLs**, tambahkan URL paket Espressif berikut jika belum tersedia:

   ```text
   https://espressif.github.io/arduino-esp32/package_esp32_index.json
   ```

2. Di **Boards Manager**, instal **esp32 by Espressif Systems**. Pemeriksaan
   kompilasi lokal proyek ini memakai core **3.3.11** yang tersedia di komputer.
3. Buka **`NoBanjir/NoBanjir.ino`**. Pertahankan seluruh `.cpp` dan `.h` dalam
   folder `NoBanjir`. Arduino IDE otomatis mengompilasi `firmware.cpp`; jangan
   hanya menyalin isi `.ino` ke sketch kosong.
4. Pilih **Tools → Board → esp32 → ESP32 Dev Module**, kemudian pilih port COM
   board. Board ini ESP32 klasik, bukan ESP32-S3/C3.
5. Mulai dengan **Upload Speed: 115200** dan pengaturan flash yang sesuai varian
   board. Profil umum menggunakan flash 4 MB; verifikasi kapasitas board Anda.
   Firmware tidak memerlukan PSRAM. Tidak perlu menginstal library sensor/JSON
   tambahan; WiFi, HTTPClient, dan WiFiClientSecure disediakan core ESP32.
6. Klik **Verify**, lalu **Upload**. Jika berhenti pada `Connecting...`, tahan
   **BOOT**, mulai upload, lalu lepaskan saat proses penulisan dimulai. Tekan EN
   setelah upload jika board belum menjalankan sketch. Gunakan kabel USB data.
7. Buka **Serial Monitor**, pilih **115200 baud**. Tanpa `secrets.h`, akan tampil
   mode lokal dan pembacaan sensor pertama setelah kira-kira 5–6 detik.

Contoh output **ilustrasi**, bukan pengukuran alat Anda:

```text
[https] disabled or incomplete config; Serial-only bench mode
[sensor] {"device_code":"ESP32-NB-001","distance_cm":38.0,"is_raining":false,"float_switch_critical":null}
```

`[sensor]` berarti pembacaan lokal, bukan bukti data diterima server. Tanpa jam
UTC tersinkron, `measured_at` tidak ditambahkan. Serial Monitor tidak menampilkan
token, password, atau isi respons backend.

## 3. Kalibrasi sensor

Pengaturan ada di **`NoBanjir/device_config.h`**.

| Pengaturan | Nilai awal | Fungsi |
| --- | --- | --- |
| `kTrigPin` / `kEchoPin` | 18 / 19 | Jalur ultrasonic |
| `kRainPin` | 27 | Masukan digital rain module |
| `kRainActiveLow` | `true` | LOW dianggap hujan; verifikasi modul |
| `kMinDistanceCm` / `kMaxDistanceCm` | 25 / 450 cm | Batas penerimaan awal, sesuaikan varian |
| `kSampleIntervalMs` | 5000 | Mulai satu siklus pengukuran setiap sekitar 5 detik |
| `kPingSpacingMs` | 75 | Jarak waktu antar pemicu ping |
| `kEchoTimeoutUs` | 30000 | Batas waktu menunggu satu Echo |
| `kUploadIntervalMs` | 15000 | Interval normal setelah upload berhasil |
| `kRainDebounceMs` | 150 | Stabilitas sinyal hujan sebelum diterima |

Satu siklus mengambil lima ping. Minimal tiga ping harus masuk rentang valid;
hasilnya median ping valid. Bila jumlah valid genap, gunakan rata-rata dua nilai
tengah. Timeout dan nilai di luar rentang diabaikan; jika validitas tidak cukup,
`distance_cm` menjadi `null`. Pembacaan gagal tidak diganti 0 atau jarak lama.

Median membantu mengurangi pantulan sesaat yang menyimpang; median tidak dapat
membuktikan seluruh pantulan benar. Bandingkan jarak dengan penggaris pada
beberapa titik, termasuk saat air bergelombang. Konversi jarak memakai perkiraan
kecepatan suara 343 m/s, tanpa kompensasi suhu; jangan menganggap hasil satu
desimal sebagai jaminan akurasi fisik.

Pasang probe menghadap permukaan air, jauh dari dinding/penghalang pantulan.
Pastikan permukaan air tertinggi tetap di luar blind zone modul yang sebenarnya.
Nilai 25 cm adalah batas awal konservatif, bukan hasil pengujian modul Anda.
Titik yang berada dalam blind zone tidak bisa dipantau dengan andal oleh sensor
ini. Bagian probe mungkin tahan air; PCB, konektor, rain module, dan ESP32 perlu
pelindung sesuai pemasangan. Pelat rain sensor tetap perlu terkena hujan.

Uji pelat rain dalam keadaan kering dan dibasahi. Atur potensiometer modul sampai
DO membedakan kedua kondisi dengan stabil. Jika hasilnya terbalik, ubah
`kRainActiveLow` menjadi `false`, lalu upload ulang. GPIO rain memakai pull-up;
**kabel DO terlepas dapat terlihat sebagai kondisi kering** pada konfigurasi
active-low. Sistem ini belum bisa mendeteksi kerusakan kabel rain secara mandiri.

Backend nantinya menghitung `water_height_cm = sensor_to_zero_cm - distance_cm`.
Ukur tinggi pemasangan terhadap titik nol lokasi dan simpan kalibrasinya di
backend. Jangan menyalin contoh ambang demo sebagai ambang keselamatan lapangan.

## 4. Float switch opsional

Komponen ini belum ada pada daftar Anda, sehingga **dinonaktifkan secara
default** dan JSON berisi `float_switch_critical: null`.

Untuk float switch berupa **kontak kering dua kabel**, sambungkan satu kabel ke
GPIO26 dan satu kabel ke GND, lalu set `kFloatEnabled = true`. Firmware memakai
`INPUT_PULLUP`. Uji posisi kontak saat air kritis dan sesuaikan
`kFloatActiveLow`; orientasi float dapat membalik posisi kontak. Modul float
dengan keluaran bertegangan membutuhkan pemeriksaan level tersendiri.

Transisi kritis yang stabil 100 ms membuat observasi segera tersedia untuk
upload, dengan `distance_cm: null` agar jarak lama tidak dianggap pengukuran baru.
Pembacaan tidak menunggu median. Upload dipercepat jika jaringan siap; ketika
request sedang berjalan atau gagal, timeout/backoff tetap berlaku. Keputusan
Bahaya harus tetap dilakukan server berdasarkan input kritis yang valid.

## 5. Aktifkan HTTPS saat backend siap

1. Salin **`NoBanjir/secrets.example.h`** menjadi **`NoBanjir/secrets.h`**.
   Ini file lokal yang dikecualikan oleh `.gitignore`. Jangan membagikannya.
2. Isi SSID/password Wi-Fi **2,4 GHz**, `kDeviceCode`, URL lengkap
   `https://HOST/api/iot/readings`, dan token khusus perangkat tersebut.
3. Isi `kRootCa` dengan sertifikat **root CA PEM** yang dipercaya untuk host Anda,
   dari penerbit sertifikat yang tepercaya. Jangan mengambil sertifikat melalui
   koneksi yang tidak diverifikasi. Saat CA host berubah, konfigurasi firmware
   mungkin perlu diperbarui.
4. Set `kUploadEnabled = true`, Verify, dan upload ulang. Template dengan CA
   placeholder atau data yang belum lengkap tetap memakai mode lokal.

**Jangan memasukkan Supabase service role key atau key publik Supabase sebagai
token perangkat.** Endpoint server akan memeriksa token khusus yang terikat pada
`device_code`. Firmware tidak mengakses database Supabase langsung.

Wi-Fi harus bisa mengakses NTP dan HTTPS. Firmware menunggu jam UTC sebelum
memulai HTTPS dan memverifikasi sertifikat. Tidak ada opsi `setInsecure()`.
Timestamp disimpan dalam UTC; web nanti menampilkan WIB. Jika pembacaan dibuat
sebelum sinkronisasi, timestamp perangkat dihilangkan dan server harus memakai
`received_at`.

Header request:

```http
Content-Type: application/json
Authorization: Bearer <TOKEN_KHUSUS_PERANGKAT>
```

Contoh payload **ilustrasi**:

```json
{
  "device_code": "ESP32-NB-001",
  "distance_cm": 38.0,
  "is_raining": false,
  "float_switch_critical": null,
  "measured_at": "2026-10-26T03:00:00Z"
}
```

Kontrak untuk implementasi backend berikutnya: terima `distance_cm: null` sebagai
error ultrasonic, bukan kondisi Normal; tetap proses rain/float yang valid.
`is_raining` juga dapat `null` sebelum input stabil. `float_switch_critical: null`
berarti tidak tersedia/belum diketahui. `measured_at` opsional. Server menghitung
kalibrasi dan tingkat peringatan, menyimpan waktu penerimaan, dan menentukan
kesegaran data. Token tidak pernah berada di payload.

Task jaringan terpisah dari task sensor. Wi-Fi dicoba ulang dengan backoff
1/2/4/.../60 detik. Koneksi Wi-Fi menunggu maksimal 10 detik per percobaan;
timeout koneksi dan pembacaan HTTP masing-masing 4 detik, handshake TLS 5 detik.
Operasi jaringan terdiri atas beberapa fase sehingga ini bukan batas total
durasi satu request. Sensor terus dibaca selama fase tersebut.

Respons 2xx menandakan pengiriman diterima di tingkat HTTP. Kegagalan upload
memakai backoff sampai 60 detik; respons 429 dengan `Retry-After` numerik dapat
menunda sampai 300 detik. Respons 401/403 menghentikan task jaringan sampai token
atau pengaturan diperbaiki dan perangkat di-restart. Redirect tidak diikuti
agar Authorization tidak diteruskan ke alamat lain.

Observasi biasa memakai data terbaru. Satu observasi transisi float kritis
ditahan sementara di RAM sampai diterima server atau kedaluwarsa, agar tidak
tertimpa sampel biasa ketika request sebelumnya sedang berjalan. Transisi kritis
baru menggantikan yang lama; waktu aslinya tetap dipertahankan. Snapshot yang
sudah berumur lebih dari 10 detik tidak dipilih untuk memulai request baru.
Koneksi/TLS dapat menambah usia snapshot selama request berlangsung. Tidak ada
antrean persisten untuk mengejar data lama setelah offline. Dashboard harus
memeriksa timestamp, menandai data lama/offline, dan tidak menafsirkannya sebagai
kondisi aman.

## 6. Pengujian sebelum dipasang

- [ ] Periksa suplai dan level sinyal sesuai varian board/modul; Echo melewati divider.
- [ ] Upload di Arduino IDE tanpa kredensial, buka Serial Monitor 115200.
- [ ] Bandingkan jarak terhadap penggaris di beberapa jarak di luar blind zone.
- [ ] Ubah target jarak dan pastikan hasil terbaru ikut berubah.
- [ ] Matikan daya, lepas jalur Echo, hidupkan lagi: `distance_cm` harus `null`.
- [ ] Basahi/keringkan rain plate, atur potensiometer dan polaritas dengan benar.
- [ ] Jika float dipasang, uji posisi kritis/nonkritis dan log observasi kritis.
- [ ] Saat backend tersedia, uji token benar/salah dan CA benar/salah.
- [ ] Putuskan Wi-Fi: log sensor tetap berjalan, tidak ada status aman buatan.
- [ ] Sambungkan lagi: kirim observasi terbaru; jangan mengirim backlog seolah baru.
- [ ] Periksa casing, kelembapan, pantulan, catu daya, dan kestabilan pemasangan.

## 7. Pemecahan masalah

| Gejala | Periksa |
| --- | --- |
| Port COM tidak muncul | Kabel data, konektor, driver USB-UART yang sesuai chip board |
| Upload berhenti di Connecting | Board ESP32 Dev Module, port, tombol BOOT, speed 115200 |
| Serial acak/tidak terbaca | Baud Serial Monitor 115200, tekan EN |
| Jarak selalu null | GND, TRIG/ECHO, pembagi tegangan, mode modul, blind zone, arah probe |
| Hujan terbalik | `kRainActiveLow`, potensiometer, DO bukan AO |
| Mode lokal setelah konfigurasi | Nama `secrets.h`, folder yang benar, flag enabled, token/CA/URL |
| Wi-Fi tidak tersambung | Jaringan 2,4 GHz, kredensial, jangkauan, catu daya |
| Waiting for UTC | Akses NTP dan DNS, captive portal/firewall |
| Hasil HTTPS negatif | DNS, host HTTPS, root CA, koneksi internet, waktu perangkat |
| Hasil 400 | Validasi API dan dukungan field nullable; jangan mengganti error dengan nol |
| Hasil 401/403 | Token terikat device_code, perangkat aktif, restart sesudah perbaikan |
| Hasil 404 | URL endpoint backend belum benar atau endpoint belum dibuat |

## 8. Pemeriksaan kode untuk developer

Di root proyek jalankan:

```powershell
python firmware/esp32/tools/test_core.py
python firmware/esp32/tools/check_arduino_compile.py
python firmware/esp32/tools/check_arduino_compile.py --link
```

Perintah pertama mengevaluasi static assertions C++ untuk median, payload JSON,
nilai invalid, debounce, dan rollover/backoff. Mendukung compiler host g++/clang++
atau cross compiler ESP32 lokal; gunakan environment `CXX` untuk menunjuk compiler.
Pemeriksaan kedua memakai SDK Arduino ESP32 3.x lokal dan mengompilasi sketch
serta adapter menjadi object files. Pemeriksaan ini **tidak melakukan link image,
upload, atau pengujian hardware**. Opsi `--link` juga mengompilasi core Arduino
dan library jaringan serta melakukan link ELF memakai SDK lokal, tanpa membuat
paket upload. Gunakan Verify/Upload di Arduino IDE untuk board sebenarnya.

Untuk memastikan jalur jaringan juga ikut dalam link tanpa kredensial asli,
gunakan `python firmware/esp32/tools/check_arduino_compile.py --link --network-config-check`.
Opsi ini memakai data dummy publik di direktori build, menolak berjalan jika
`NoBanjir/secrets.h` pribadi sudah ada, dan tidak membuat koneksi jaringan.
Hasil check dengan data dummy bukan konfigurasi yang bisa dipakai di perangkat.

PlatformIO opsional memakai `platformio.ini` dan wrapper `src/main.cpp` atas
sumber sketch yang sama. Dari `firmware/esp32`, jalankan `pio run`,
`pio run --target upload`, lalu `pio device monitor`. Jalur ini memerlukan paket
PlatformIO dan akses unduhan toolchain; Anda dapat memakai Arduino IDE sepenuhnya.

## Referensi

Status verifikasi kode pada 26 Oktober 2026: **21 static assertions lulus**;
sketch/adapter dan firmware ELF berhasil dikompilasi serta di-link dengan SDK
Arduino ESP32 **3.3.11**, baik mode lokal maupun konfigurasi jaringan dummy.
Belum dilakukan Verify melalui UI Arduino IDE, upload board, pengujian sensor
fisik, atau integrasi endpoint sebenarnya. Build opsional PlatformIO belum
dijalankan karena unduhan paket dibatasi lingkungan.

- [Spesifikasi proyek](../../context/NO_BANJIR_WEB_APP_SPEC.md), bagian 8 dan 11.
- [Instalasi Arduino ESP32 resmi](https://docs.espressif.com/projects/arduino-esp32/en/latest/installing.html).
- [Datasheet ESP32-WROOM-32: batas listrik GPIO](https://documentation.espressif.com/esp32-wroom-32_datasheet_en.html).
- [Profil PlatformIO ESP32 Dev Module](https://docs.platformio.org/en/stable/boards/espressif32/esp32dev.html).

Datasheet varian JSN-SR04T, rain module, dan pinout vendor board Anda tetap perlu
dicocokkan dengan marking komponen yang sebenarnya.
