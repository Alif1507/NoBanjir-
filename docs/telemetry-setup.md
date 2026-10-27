# Hubungkan ESP32 → Next.js → Supabase

Status: proyek Supabase `cdjwcogjstcqaltfhhle` sudah menerima dua migrasi
telemetri pada 26 Oktober 2026. Empat tabel dibuat dengan RLS;
`sensor_readings` masuk publikasi Realtime. Uji SQL rollback lulus tanpa
meninggalkan data perangkat. Aplikasi web penuh sudah ditulis secara lokal;
migrasi Auth/laporan `20261026220904_web_app` sudah diterapkan dan uji SQL
rollback lulus.
Paket npm sudah terpasang. Typecheck, tes lokal, build produksi, dan pemeriksaan
render desktop/mobile telah lulus. Akses langsung dari runtime lokal ke Supabase
masih ditolak lingkungan ini dengan `EACCES`, sehingga alur live perlu diuji
setelah deployment.

## 1. Status migrasi Supabase

Migrasi [`20261026125743_iot_telemetry.sql`](../supabase/migrations/20261026125743_iot_telemetry.sql)
dan [`20261026125830_alert_event_reading_index.sql`](../supabase/migrations/20261026125830_alert_event_reading_index.sql)
sudah diterapkan melalui Supabase MCP. Migrasi web
[`20261026220904_web_app.sql`](../supabase/migrations/20261026220904_web_app.sql)
juga sudah diterapkan. Nama file lokal sesuai versi migrasi cloud.
Jangan jalankan ulang SQL ini langsung pada proyek yang sama.

Jika memakai Codex CLI sendiri, Supabase mendokumentasikan MCP HTTP. Contoh
konfigurasi yang dibatasi pada proyek ini:

```powershell
codex mcp add supabase --url "https://mcp.supabase.com/mcp?project_ref=cdjwcogjstcqaltfhhle"
codex mcp login supabase
```

Login membuka OAuth di browser. Setelah autentikasi, buka ulang sesi jika tools
belum muncul. [Panduan Supabase MCP](https://supabase.com/docs/guides/ai-tools/mcp)
menjelaskan izin dan kemampuan `list_tables`, `apply_migration`, `execute_sql`,
serta peninjauan keamanan. Jangan menaruh token akses Supabase di chat atau repo.

Migrasi menyediakan `devices`, `device_credentials`, `sensor_readings`,
`alert_events`, RLS, publikasi Realtime, dan RPC server yang menyimpan data secara
atomik. Kredensial perangkat hanya berupa SHA-256 hash. Role publik hanya boleh
melihat perangkat aktif dan pembacaan/alert terkait; hanya server secret yang
dapat memanggil RPC perubahan. Kebijakan dan publikasi sudah diperiksa pada
proyek. Uji SQL [`telemetry.sql`](../supabase/tests/telemetry.sql) memakai
transaksi rollback dan lulus pada proyek ini; gunakan hanya pada proyek
pengembangan yang tepat.

## 2. Siapkan Next.js

Node.js 24 sudah tersedia pada komputer ini. Jalankan dari root proyek:

```powershell
npm install
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm test
npm run typecheck
npm run build
npm run dev
```

Jika `.env.local` sudah ada, **edit file itu tanpa menimpanya**. URL proyek
publik sudah disetel ke `https://cdjwcogjstcqaltfhhle.supabase.co`. Isi
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dengan **publishable** key (atau anon
legacy) dan `SUPABASE_SECRET_KEY` dengan **secret** key (atau service_role legacy)
dari Supabase Dashboard → Settings → API Keys. File `.env.local` diabaikan Git.
Server key tidak pernah memakai prefix `NEXT_PUBLIC_` dan tidak boleh masuk ESP32.
Kode menolak `sb_secret_` atau JWT ber-role `service_role` pada konfigurasi kunci
browser. Setelah `npm install`, commit lockfile yang dihasilkan.

Paket npm dan lockfile sudah tersedia. `npm test`, `npm run typecheck`, dan
`npm run build` lulus. Tes tersebut belum menguji panggilan live dari Next.js ke
Supabase karena koneksi runtime lokal dibatasi lingkungan ini.

## 3. Daftarkan perangkat dan kalibrasi

Salin [`device-config.example.json`](../scripts/device-config.example.json) ke
file konfigurasi lokal. Ganti semua `null` dengan hasil pengukuran saat pemasangan:

- `sensor_to_zero_cm`: jarak probe ke titik nol pemantauan.
- `min_distance_cm` / `max_distance_cm`: rentang valid untuk varian JSN-SR04T.
- `max_water_height_cm`: maksimum air yang masih dapat diukur di luar blind zone.
- `waspada_min_cm` / `siaga_min_cm` / `bahaya_min_cm`: ambang yang ditetapkan
  bersama petugas sekolah dari kalibrasi lokasi, urut menaik.
- `name` / `location_description`: titik pemantauan yang benar.

Contoh `10/20/35 cm` pada PRD hanyalah **nilai demo**, bukan ambang keselamatan.
Skrip menolak konfigurasi dengan kalibrasi kosong, ambang tidak berurutan,
atau zona buta yang membuat batas Bahaya tak terukur.

Setelah migrasi, key, dan kalibrasi siap:

```powershell
npm run device -- provision --config device-config.json
```

Skrip membuat token acak 256-bit. Token hanya disimpan di
`provisioned-devices/` yang diabaikan Git; pada Windows skrip membatasi ACL
file ke SID pengguna saat ini, pada sistem POSIX file dibuat dengan mode 0600.
Token tidak dicetak ke terminal. Jika RPC selesai tetapi responsnya hilang,
file tetap ada untuk pemeriksaan. Jangan ulangi provisioning dengan kode yang
sama sebelum mengecek apakah perangkat sudah ada.

Untuk merotasi/mencabut token, gunakan:

```powershell
npm run device -- rotate --code ESP32-NB-001
npm run device -- revoke --code ESP32-NB-001
```

Rotasi menghasilkan file token baru. Revoke langsung membuat credential tidak
berlaku; ingestion, rotasi, dan revoke memakai lock baris perangkat yang sama.

## 4. Pasang token ke firmware

Ikuti [panduan firmware](../firmware/esp32/README.md), buka
`firmware/esp32/NoBanjir/NoBanjir.ino` di Arduino IDE, lalu salin
`secrets.example.h` menjadi `secrets.h`. Isi:

```cpp
kDeviceCode = "ESP32-NB-001";
kIngestUrl = "https://DOMAIN-HTTPS-APLIKASI/api/iot/readings";
kDeviceToken = "TOKEN_DARI_FILE_PROVISIONED";
kRootCa = "ROOT_CA_PEM_UNTUK_DOMAIN_APLIKASI";
kUploadEnabled = true;
```

Contoh di atas menunjukkan **nilai yang perlu diisi**, bukan potongan header
siap tempel. `kIngestUrl` mengarah ke deployment Next.js, **bukan** URL REST
Supabase. Firmware membutuhkan Wi-Fi 2,4 GHz dan sinkronisasi UTC sebelum HTTPS.
Gunakan HTTPS publik dengan sertifikat yang valid; endpoint HTTP lokal hanya
untuk pengujian server, bukan untuk firmware.

Request pada `POST /api/iot/readings` mengirim `device_code`, `distance_cm`,
`is_raining`, `float_switch_critical`, dan `measured_at` opsional. Jarak gagal
boleh `null`. Server memeriksa token, menolak paket di atas 2 KiB, menghitung
tinggi/level dari kalibrasi server, membatasi interval per perangkat, dan
menyimpan waktu penerimaan UTC. Float switch kritis tetap memicu Bahaya walau
jarak ultrasonic gagal.

## 5. Lihat data

Buka `/dashboard` pada Next.js. Halaman ini menampilkan titik sensor, tinggi
air, status perangkat, hujan, waktu WIB, dan grafik riwayat. `/iot` mengarah ke
`/dashboard`. Realtime Supabase memicu fetch setelah insert; polling 15 detik
dan refetch setelah browser kembali aktif membantu ketika WebSocket putus.
Perangkat tanpa data menampilkan “Belum ada data”. Setelah waktu offline
perangkat terlampaui (default 90 detik), kondisi lama tidak tampil sebagai aman.

Mode simulasi hanya dibuka dengan `/dashboard?demo=1` dan selalu diberi label
`MODE DEMO — DATA SIMULASI`. Data ini tidak tersimpan pada tabel sensor.

API baca publik untuk integrasi frontend berikutnya:

- `GET /api/devices`: daftar perangkat aktif dan pengaturan publik.
- `GET /api/dashboard?device_id=<UUID>`: pembacaan terakhir atau `null`.
- `GET /api/readings?device_id=<UUID>&range=1h|6h|24h|7d`: maksimal 1.000
  pembacaan terbaru dalam rentang, dengan `truncated` bila batas tercapai.

Publikasi Realtime hanya untuk `sensor_readings`; `device_credentials` tidak
pernah menjadi data publik. Seluruh rentang waktu tersimpan dalam UTC. Klien
menampilkan Asia/Jakarta dan menghitung offline/error secara terpisah dari
empat level risiko banjir.

## Pemeriksaan akhir saat backend sudah tersambung

1. Verifikasi tidak ada skema yang bentrok; terapkan migrasi pada proyek benar.
2. Jalankan tes SQL dalam transaksi rollback dan cek advisor keamanan/performa.
3. Buat satu perangkat dengan kalibrasi hasil ukur, tidak memakai ambang demo.
4. Kirim payload dari ESP32 via HTTPS dengan token yang benar; pastikan respons
   201, pembacaan tersimpan dan `/dashboard` diperbarui.
5. Kirim token salah, paket jarak `null`, float kritis, timestamp lama, dan
   request cepat berulang; cek 401, status tidak pasti/Bahaya, 400, dan 429.
6. Putus Wi-Fi; setelah batas waktu dashboard menunjukkan Offline dan tidak
   menyebut kondisi air aman.

Koneksi cloud telemetri dan uji SQL sudah dijalankan. Provisioning perangkat,
pengujian ESP32 fisik, dan deployment HTTPS aplikasi masih menunggu kalibrasi
serta alamat deployment dari lokasi pemasangan.
