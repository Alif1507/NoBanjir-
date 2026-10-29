# Firmware ESP32 — NO BANJIR!

Panduan ini untuk **ESP32-WROOM-32 development board 30 pin Type-C**, HC-SR04
5 V, dan rain sensor beserta pelat/modul. Upload utama memakai
**Arduino IDE**. Sensor bisa langsung diuji melalui Serial Monitor tanpa Wi-Fi
atau token. Integrasi backend dijelaskan di [panduan telemetri](../../docs/telemetry-setup.md).

Firmware membaca jarak permukaan air dan kondisi hujan. Serial Monitor juga
menampilkan tinggi air dan level **preview prototipe lokal** untuk kontainer
20 cm. Angka ini adalah ambang demonstrasi; tingkat peringatan untuk data web
tetap dihitung backend dari kalibrasi perangkat yang terdaftar.

## Konfigurasi prototipe saat ini

- Sensor ultrasonik **HC-SR04**, menggantikan JSN-SR04T.
- Muka sensor **20 cm dari dasar kontainer**; tinggi air terpantau **0–18 cm**.
- Ambang tinggi air: **Normal 0–<5**, **Waspada 5–<10**, **Siaga 10–<15**,
  dan **Bahaya 15–18 cm**.
- Rain sensor memakai **DO → GPIO27**; float switch tidak dipasang.
- Perangkat cloud: `ESP32-NB-001`. Jangan provision ulang perangkat ini.
- Endpoint: `https://nobanjirtandaseru.vercel.app/api/iot/readings`.
- Dashboard: <https://nobanjirtandaseru.vercel.app/dashboard> tanpa `?demo=1`.
- HTTPS memakai **GTS Root R1** untuk rantai Google Trust Services WR1 yang
  dikonfirmasi pada sertifikat deployment saat penyiapan.

Untuk perangkat yang sudah dikonfigurasi, buka `NoBanjir/NoBanjir.ino`, upload
ulang melalui Arduino IDE, lalu buka Serial Monitor **115200 baud**. Pertahankan
`secrets.h` yang sudah diisi; jangan menimpanya dengan file contoh. Target log
upload adalah `[https] result=201`.

## 1. Komponen dan sambungan

Siapkan board, sensor, kabel USB **data**, kabel jumper, breadboard/terminal, dan
**tiga resistor 1 kΩ ¼ W** untuk pembagi tegangan Echo. Jika yang tersedia baru
satu resistor, tambahkan dua resistor dengan nilai yang sama sebelum merangkai
Echo. Multimeter diperlukan untuk memeriksa tegangan jalur dan keluaran modul.

Jumlah pin dan konektor Type-C tidak menentukan urutan header. Gunakan **label
GPIO pada PCB**, bukan menghitung posisi pin. Foto/pinout vendor board yang tepat
tetap menjadi acuan untuk menemukan pin 5V/VIN, 3V3, dan GND.

Matikan daya ketika memasang atau memindah kabel. Sediakan ground bersama antara
ESP32 dan kedua modul. ESP32 memakai logika 3,3 V; jangan memasukkan sinyal 5 V
langsung ke GPIO.

| Komponen | Pin modul | Sambungan |
| --- | --- | --- |
| HC-SR04 | VCC | 5 V teratur, dari pin 5V/VIN **yang sudah diverifikasi** |
| HC-SR04 | GND | GND ESP32 |
| HC-SR04 | TRIG | GPIO18 |
| HC-SR04 | ECHO | Titik tengah pembagi tegangan → GPIO19 |
| Rain module | VCC | 3V3, **jika varian modul mendukung suplai 3,3 V** |
| Rain module | GND | GND ESP32 |
| Rain module | DO / D0 | GPIO27 setelah memastikan level keluarannya aman |
| Rain module | AO / A0 | Tidak disambungkan |
| Rain plate | Dua terminal pelat | Dua terminal pelat pada rain module |
| Float switch | Tidak dipasang | GPIO26 dibiarkan kosong |

**Pembagi tegangan Echo dengan tiga resistor 1 kΩ:**

```text
HC-SR04 ECHO ----[1k]----+---------- GPIO19 ESP32
                       |
                      [1k]
                       |
                      [1k]
                       |
                      GND -------- GND ESP32 / GND HC-SR04 / GND rain module
```

Satu resistor dari ECHO ke titik GPIO membentuk 1 kΩ; dua resistor **seri** dari
titik GPIO ke ground membentuk 2 kΩ. Untuk Echo HIGH 5 V, nilai nominal di GPIO
adalah `5 × 2 / (1 + 2) ≈ 3,33 V`. **Satu resistor seri saja tidak membentuk pembagi
tegangan.** Jangan menukar kelompok atas dan bawah. Periksa nilai resistor,
kontinuitas, dan tegangan sinyal sebelum menyambungkannya ke ESP32. Multimeter
biasa bisa menampilkan rata-rata pulsa Echo, sehingga angka rendah pada meter
tidak membuktikan amplitudo puncak sinyal sudah aman; gunakan alat ukur yang
sesuai untuk memeriksa pulsa bila dibutuhkan.

HC-SR04 menggunakan suplai 5 V dan pulsa TRIG 10 us. Firmware memberi jeda
75 ms antar ping. Jaga sensor tetap kering dan menghadap tegak lurus ke air.

Alternatif dengan lima resistor 1 kΩ: **dua seri** dari ECHO ke titik GPIO19,
lalu **tiga seri** dari titik GPIO19 ke GND, menghasilkan nominal 3 V.
Jangan memakai satu resistor di atas dan empat seri di bawah (hasilnya 4 V),
atau empat paralel di bawah (hasilnya 1 V). Pin 5V/VIN memberi daya sensor;
pin GPIO ESP32 tetap memakai logika 3,3 V dan tidak menerima ECHO 5 V langsung.

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
[sensor] {"device_code":"ESP32-NB-001","distance_cm":10.0,"is_raining":false,"float_switch_critical":null}
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
| `kMinDistanceCm` / `kMaxDistanceCm` | 2 / 400 cm | Batas penerimaan awal, sesuaikan varian |
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
HC-SR04 memiliki rentang nominal 2-400 cm; verifikasi dengan penggaris.
Titik yang berada dalam blind zone tidak bisa dipantau dengan andal oleh sensor
ini. HC-SR04 tidak tahan air; sensor, rain module, dan ESP32 perlu
pelindung sesuai pemasangan. Pelat rain sensor tetap perlu terkena hujan.

Uji pelat rain dalam keadaan kering dan dibasahi. Atur potensiometer modul sampai
DO membedakan kedua kondisi dengan stabil. Jika hasilnya terbalik, ubah
`kRainActiveLow` menjadi `false`, lalu upload ulang. GPIO rain memakai pull-up;
**kabel DO terlepas dapat terlihat sebagai kondisi kering** pada konfigurasi
active-low. Sistem ini belum bisa mendeteksi kerusakan kabel rain secara mandiri.

Jika pelat basah tetapi `is_raining` tetap `false`, aktifkan
`kRainDebugEnabled = true` (sudah aktif), upload ulang, lalu amati baris `[rain]`
di Serial Monitor 115200. Baris ini muncul bersama pembacaan sensor sekitar
setiap 5 detik. Uji pelat kering, kemudian teteskan air sampai menjembatani
beberapa jalur logam pada pelat; basahi pelatnya saja.

Contoh yang sesuai konfigurasi `kRainActiveLow = true`:

```text
[rain] gpio=27 raw=HIGH active_low=true debounced=DRY
[rain] gpio=27 raw=LOW active_low=true debounced=WET
```

| Hasil saat kering dan basah | Langkah berikutnya |
| --- | --- |
| `HIGH` saat kering, `LOW` saat basah | Polaritas sudah sesuai. Setelah sinyal stabil 150 ms, pembacaan berikutnya harus `is_raining=true`. |
| `LOW` saat kering, `HIGH` saat basah | Ubah `kRainActiveLow = false`, lalu upload ulang. |
| Selalu `HIGH` | Periksa kabel **DO/D0 ke GPIO27**, GND bersama, konektor pelat, dan setelan potensiometer. AO/A0 tidak digunakan. |
| Selalu `LOW` | Periksa apakah pelat masih basah atau ambang potensiometer terlalu sensitif. |
| Nilai sering berubah saat kondisi tetap | Atur potensiometer agar keluaran DO stabil, lalu periksa sambungan dan catu modul. |

Jika modul memiliki LED indikator keluaran DO, bandingkan perubahannya saat
kering/basah; LED daya saja tidak menunjukkan pendeteksian hujan. Putar
potensiometer sedikit demi sedikit sampai keluaran DO membedakan pelat kering
dan basah, lalu ulangi kedua kondisi. Setelah selesai diagnosis,
`kRainDebugEnabled` boleh diubah ke `false` untuk menyembunyikan log tambahan.

Backend menghitung `water_height_cm = sensor_to_zero_cm - distance_cm`.
Ukur tinggi pemasangan terhadap titik nol lokasi dan simpan kalibrasinya di
backend. Jangan menyalin contoh ambang demo sebagai ambang keselamatan lapangan.

### Prototipe HC-SR04: muka sensor 20 cm dari dasar

Kalibrasi terbaru: `kPrototypeSensorToZeroCm = 20.0` dan
`kPrototypeMaxWaterHeightCm = 18.0`. Tinggi air = 20 - jarak sensor.
Batas air 18 cm menjaga jarak minimal sensor 2 cm; jangan isi sampai muka sensor.

| Jarak sensor ke air | Tinggi air | Level preview |
| --- | --- | --- |
| 20 cm | 0 cm | NORMAL |
| 15 cm | 5 cm | WASPADA |
| 10 cm | 10 cm | SIAGA |
| 5 cm | 15 cm | BAHAYA |
| 2 cm | 18 cm | BAHAYA |

Upload ulang lalu buka Serial Monitor 115200. Contoh:

```text
[prototype] source=LOCAL_PREVIEW distance_cm=10.0 water_height_cm=10.0 level=SIAGA
```

Jika kontainer kosong konsisten terbaca lebih dari 20 cm, ukur ulang muka sensor
ke dasar dan sesuaikan kalibrasi firmware serta cloud dengan hasil sebenarnya.
Pembacaan di luar kalibrasi tetap UNKNOWN; jangan memaksa nilainya menjadi nol.

Tidak perlu `secrets.h` untuk preview lokal. Kalibrasi cloud perangkat yang sudah
terdaftar diubah melalui `/admin/perangkat`; samakan dengan firmware:

| Pengaturan cloud | Nilai |
| --- | --- |
| `sensor_to_zero_cm` | 20 |
| `min_distance_cm` / `max_distance_cm` | 2 / 400 |
| `max_water_height_cm` | 18 |
| `waspada_min_cm` / `siaga_min_cm` / `bahaya_min_cm` | 5 / 10 / 15 |

**Hanya untuk perangkat baru**, gunakan preset
[`device-config.prototype.json`](../../scripts/device-config.prototype.json)
setelah menyesuaikan hasil pengukuran sebenarnya. Dari root proyek:

```powershell
npm.cmd run device -- provision --config scripts/device-config.prototype.json
```

Perintah tersebut mendaftarkan perangkat dan menyimpan token di folder lokal
`provisioned-devices/`. Jalankan hanya sekali untuk kode perangkat yang sama.
Setelah itu isi `secrets.h` sesuai bagian berikut dan gunakan URL HTTPS aplikasi.

## 4. Float switch opsional

Komponen ini belum ada pada daftar Anda, sehingga **dinonaktifkan secara
default** dan JSON berisi `float_switch_critical: null`.

Untuk prototipe saat ini, biarkan `kFloatEnabled = false` dan GPIO26 tidak perlu
disambungkan. Level air memakai hasil HC-SR04; ambang demo Bahaya dimulai pada
tinggi air 15 cm. Rain sensor memberi informasi hujan secara terpisah. Nilai
`float_switch_critical: null` berarti komponen tidak tersedia dan merupakan
payload yang valid untuk backend.

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

## 5. Hubungkan ke aplikasi Vercel

1. Jika belum ada, salin **`NoBanjir/secrets.example.h`** menjadi **`NoBanjir/secrets.h`**.
   Ini file lokal yang dikecualikan oleh `.gitignore`. Jangan membagikannya.
2. Buka `secrets.h` di Arduino IDE, lalu isi semua nilai ini:

   | Field | Isi dengan | Sumbernya |
   | --- | --- | --- |
   | `kWifiSsid` | Nama jaringan Wi-Fi **2,4 GHz** | Router/hotspot sekolah |
   | `kWifiPassword` | Kata sandi jaringan tersebut | Pengelola jaringan sekolah |
   | `kDeviceCode` | Kode perangkat yang sudah didaftarkan, misalnya `ESP32-NB-001` | Konfigurasi perangkat saat provisioning; harus sama persis |
   | `kIngestUrl` | URL HTTPS lengkap yang berakhir `/api/iot/readings` | Domain aplikasi Next.js yang sudah di-deploy, bukan URL Supabase atau `localhost` |
   | `kDeviceToken` | Token khusus untuk kode perangkat tersebut | File rahasia yang dibuat skrip provisioning `npm run device -- provision --config device-config.json` |
   | `kRootCa` | Sertifikat root CA lengkap dalam format PEM | Penerbit sertifikat resmi yang menandatangani HTTPS domain aplikasi |

3. Pada `kRootCa`, pertahankan baris `BEGIN CERTIFICATE` dan `END CERTIFICATE`,
   lalu ganti teks placeholder dengan isi PEM lengkap. Jangan menyalin sertifikat
   acak, private key, atau mematikan verifikasi TLS. Jika penyedia hosting
   mengganti rantai sertifikat ke root CA lain, perbarui nilai ini.
4. Pastikan `kDeviceCode` cocok dengan konfigurasi hasil provisioning dan token
   berasal dari perangkat yang sama. Jangan gunakan Supabase publishable key,
   service role key, database password, atau kata sandi Wi-Fi sebagai token.
5. Setelah semua nilai benar, set `kUploadEnabled = true`, klik **Verify**, lalu
   **Upload** ulang. Bila ada field kosong atau CA masih placeholder, firmware
   tetap di mode lokal dan tidak mengirim telemetri.

Untuk deployment saat ini, isi `kIngestUrl` dengan
`https://nobanjirtandaseru.vercel.app/api/iot/readings`. Setelah `secrets.h` ada,
jalankan dari root proyek untuk mengisi CA yang sesuai:

```powershell
node firmware/esp32/tools/configure_vercel_ca.mjs
```

Script mengambil **GTS Root R1** dari trust store bawaan Node.js, mencocokkan
fingerprint dengan repository resmi Google, dan hanya mengganti `kRootCa`.
Script tidak mencetak password atau token. [Rantai WR1 menuju GTS Root R1](https://pki.goog/updates/march2025-alternate-chains.html)
berbeda dari ISRG Root X1/X2 yang dipakai konfigurasi awal. Upload ulang setelah
mengganti CA. Jika rantai domain berubah, periksa penerbit dan root-nya kembali.

Di Vercel Production, backend memerlukan `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, dan `SUPABASE_SECRET_KEY`.
Redeploy jika mengubah environment. Key Supabase tidak dimasukkan ke ESP32.
Panduan lengkap: [ESP32 ke Vercel](../../docs/esp32-vercel-connection.md).

Contoh bentuk file setelah diisi (nilai di bawah hanya penanda, bukan
kredensial yang dapat dipakai):

```cpp
namespace credentials {
constexpr bool kUploadEnabled = true;
constexpr const char* kWifiSsid = "NAMA_WIFI_2_4_GHZ";
constexpr const char* kWifiPassword = "KATA_SANDI_WIFI";
constexpr const char* kDeviceCode = "ESP32-NB-001";
constexpr const char* kIngestUrl = "https://nobanjirtandaseru.vercel.app/api/iot/readings";
constexpr const char* kDeviceToken = "TOKEN_HASIL_PROVISIONING";
constexpr const char* kRootCa = R"PEM(
-----BEGIN CERTIFICATE-----
ISI_ROOT_CA_PEM_LENGKAP
-----END CERTIFICATE-----
)PEM";
}
```

**Jangan memasukkan Supabase service role key atau key publik Supabase sebagai
token perangkat.** Endpoint server akan memeriksa token khusus yang terikat pada
`device_code`. Firmware tidak mengakses database Supabase langsung.

Wi-Fi harus bisa mengakses NTP dan HTTPS. Firmware menunggu jam UTC sebelum
memulai HTTPS dan memverifikasi sertifikat. Tidak ada opsi `setInsecure()`.
Timestamp disimpan dalam UTC; web menampilkan WIB. Jika pembacaan dibuat
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
  "distance_cm": 10.0,
  "is_raining": false,
  "float_switch_critical": null,
  "measured_at": "2026-10-26T03:00:00Z"
}
```

Backend menerima `distance_cm: null` sebagai
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

Endpoint aplikasi mengembalikan `201` ketika pembacaan berhasil disimpan.
Data invalid juga disimpan dengan alasan validasi; `201` tidak berarti sensor
pasti valid. Dashboard menggunakan pembacaan terbaru, termasuk pembacaan invalid.
Kegagalan upload
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
- [ ] Pastikan `[https] result=201` muncul dan dashboard live ikut berubah.
- [ ] Putuskan Wi-Fi: log sensor tetap berjalan, tidak ada status aman buatan.
- [ ] Sambungkan lagi: kirim observasi terbaru; jangan mengirim backlog seolah baru.
- [ ] Periksa casing, kelembapan, pantulan, catu daya, dan kestabilan pemasangan.

## 7. Pemecahan masalah

| Gejala | Periksa |
| --- | --- |
| Port COM tidak muncul | Kabel data, konektor, driver USB-UART yang sesuai chip board |
| Upload berhenti di Connecting | Board ESP32 Dev Module, port, tombol BOOT, speed 115200 |
| Serial acak/tidak terbaca | Baud Serial Monitor 115200, tekan EN |
| Jarak selalu null | GND, TRIG/ECHO, pembagi tegangan, batas 2–400 cm, arah sensor; minimal tiga dari lima ping harus valid |
| Hujan terbalik | `kRainActiveLow`, potensiometer, DO bukan AO |
| Mode lokal setelah konfigurasi | Nama `secrets.h`, folder yang benar, flag enabled, token/CA/URL |
| Wi-Fi tidak tersambung | Jaringan 2,4 GHz, kredensial, jangkauan, catu daya |
| Waiting for UTC | Akses NTP dan DNS, captive portal/firewall |
| Hasil HTTPS negatif | DNS, host HTTPS, root CA, koneksi internet, waktu perangkat |
| `result=-1`, `tls_code=-9984` | Verifikasi sertifikat gagal. Untuk deployment WR1 saat ini, jalankan `configure_vercel_ca.mjs`, lalu upload ulang; jangan matikan TLS |
| Hasil 400 | Validasi API dan dukungan field nullable; jangan mengganti error dengan nol |
| Hasil 401/403 | Token terikat device_code, perangkat aktif, restart sesudah perbaikan |
| Hasil 404 | URL endpoint backend belum benar atau endpoint belum dibuat |
| Hasil 503 | Environment Supabase dan log backend di Vercel |
| `201`, tetapi Sensor Bermasalah | Periksa `distance_cm`, kalibrasi dan alasan validasi; upload berhasil tetapi pengukuran terbaru invalid |
| `HEIGHT_OUT_OF_RANGE` | Dengan sensor-ke-dasar 20 cm, jarak harus 2–20 cm agar tinggi air berada di rentang 0–18 cm |
| `ULTRASONIC_UNAVAILABLE` | ESP32 mengirim jarak `null`; periksa arah pantulan, koneksi dan catu sensor |
| `DISTANCE_OUT_OF_RANGE` | Samakan batas cloud dan firmware menjadi 2–400 cm untuk HC-SR04 |
| `201`, dashboard belum berubah | Pilih perangkat yang benar, hapus `?demo=1`, tunggu sekitar 15–30 detik dan periksa waktu pembacaan |

Contoh pengiriman yang berhasil pada kalibrasi saat ini:

```text
[wifi] connected
[sensor] {"device_code":"ESP32-NB-001","distance_cm":10.0,"is_raining":false,"float_switch_critical":null}
[prototype] source=LOCAL_PREVIEW distance_cm=10.0 water_height_cm=10.0 level=SIAGA
[https] result=201
```

Jika koneksi gagal, kirim log `[https] transport_error=... tls_code=... tls_detail=...`
untuk diagnosis. Jangan membagikan `secrets.h`. Pembacaan jarak 20,3 cm pada
kalibrasi dasar 20 cm menghasilkan tinggi negatif dan tetap ditolak. Jika ini
konsisten saat kosong, ukur ulang pemasangan dan sesuaikan kalibrasi dengan
hasil sebenarnya, bukan menutupi error dengan tinggi nol.

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

Status penyiapan sampai 29 Oktober 2026: sketch/adapter HC-SR04 berhasil
dikompilasi dengan Arduino ESP32 **3.3.11**; firmware jaringan dengan GTS Root R1
juga berhasil di-link. Pengguna sudah meng-upload melalui Arduino IDE dan
mengonfirmasi HTTP **201**. Pemeriksaan database setelah kalibrasi 20 cm menerima
jarak **20 cm**, tinggi air **0 cm**, `is_valid=true`, dan level **NORMAL**.
Ini mengonfirmasi jalur ESP32 → Vercel → Supabase untuk prototipe, bukan
pengujian ketahanan pemasangan lapangan. Rain sensor tetap perlu diuji kering
dan basah. Build opsional PlatformIO belum dijalankan.

- [Spesifikasi proyek](../../context/NO_BANJIR_WEB_APP_SPEC.md), bagian 8 dan 11.
- [Instalasi Arduino ESP32 resmi](https://docs.espressif.com/projects/arduino-esp32/en/latest/installing.html).
- [Datasheet ESP32-WROOM-32: batas listrik GPIO](https://documentation.espressif.com/esp32-wroom-32_datasheet_en.html).
- [Profil PlatformIO ESP32 Dev Module](https://docs.platformio.org/en/stable/boards/espressif32/esp32dev.html).

Datasheet varian HC-SR04, rain module, dan pinout vendor board Anda tetap perlu
dicocokkan dengan marking komponen yang sebenarnya.

Referensi HC-SR04: [datasheet](https://cdn.sparkfun.com/datasheets/Sensors/Proximity/HCSR04.pdf).

Jika posisi sensor berubah, sesuaikan kalibrasi di `device_config.h` dan
`/admin/perangkat`, lalu upload ulang firmware. Jangan provision ulang perangkat
yang sama hanya untuk mengubah kalibrasi.
